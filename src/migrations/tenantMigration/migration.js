/**
 * ==========================================================
 * ENTITY + ENTITYTYPE MIGRATION SCRIPT
 * ==========================================================
 */

const { MongoClient } = require('mongodb')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')

require('dotenv').config({
	path: path.join(__dirname, '../../.env'),
})

const input = JSON.parse(fs.readFileSync(path.join(__dirname, 'input.json'), 'utf8'))

const { loginCredentails, tenantMappingConfig } = input
const { currentTenantId, newTenantId, newOrgId } = tenantMappingConfig

const BASE_URL = process.env.INTERFACE_SERVICE_URL
const MONGODB_URL = process.env.MONGODB_URL

const OUTPUT_FILE = path.join(__dirname, 'migration-output.txt')
const BATCH_SIZE = 1000

function log(message) {
	console.log(message)
	fs.appendFileSync(OUTPUT_FILE, message + '\n')
}

function stopWithError(error) {
	log('\n❌ MIGRATION FAILED')
	log('Error: ' + error.message)
	process.exit(1)
}

async function runMigration() {
	let client

	// Counters
	let totalEntityTypesOld = 0
	let totalEntitiesOld = 0

	let insertedEntityTypes = 0
	let insertedEntities = 0

	let skippedEntitiesMissingType = 0
	let skippedTargetMappings = 0
	let skippedGroupMappings = 0

	try {
		fs.writeFileSync(
			OUTPUT_FILE,
			'==============================\n MIGRATION STARTED\n==============================\n\n'
		)

		/**
		 * LOGIN
		 */
		log('🔐 Logging in...')
		// Normalize createrType once (handle Admin, ADMIN, etc.)
		const normalizedCreatorType = (loginCredentails.createrType || '').toLowerCase().trim()

		const loginUrl =
			normalizedCreatorType === 'admin' ? `${BASE_URL}/user/v1/admin/login` : `${BASE_URL}/user/v1/account/login`

		const loginResponse = await axios.post(
			loginUrl,
			{
				identifier: loginCredentails.createrUserName,
				password: loginCredentails.createrPassword,
			},
			{
				headers: {
					origin: loginCredentails.origin,
					'Content-Type': 'application/json',
				},
			}
		)

		const token = loginResponse.data?.result?.access_token
		const userId = loginResponse.data?.result?.user?.id

		if (!token) throw new Error('Login failed.')

		log(`✅ Login successful. userId: ${userId}`)

		/**
		 * CONNECT DB
		 */
		log('🔌 Connecting to MongoDB...')
		client = new MongoClient(MONGODB_URL)
		await client.connect()

		const dbName = MONGODB_URL.split('/').pop()
		const db = client.db(dbName)

		const entityTypeCollection = db.collection('entityTypes')
		const entityCollection = db.collection('entities')

		log(`✅ Connected to DB: ${dbName}\n`)

		/**
		 * OLD COUNTS
		 */
		totalEntityTypesOld = await entityTypeCollection.countDocuments({
			tenantId: currentTenantId,
		})

		totalEntitiesOld = await entityCollection.countDocuments({
			tenantId: currentTenantId,
		})

		log(`📊 Old EntityTypes: ${totalEntityTypesOld}`)
		log(`📊 Old Entities: ${totalEntitiesOld}\n`)

		/**
		 * TARGET CLEAN CHECK
		 */
		const existingTargetData =
			(await entityTypeCollection.countDocuments({
				tenantId: newTenantId,
			})) +
			(await entityCollection.countDocuments({
				tenantId: newTenantId,
			}))

		if (existingTargetData > 0) throw new Error(`Target tenant (${newTenantId}) already has data.`)

		/**
		 * ==========================================================
		 * PHASE 1 - COPY ENTITY TYPES
		 * ==========================================================
		 */

		log('🚀 Phase 1 - Copying EntityTypes...')

		const oldTypes = await entityTypeCollection.find({ tenantId: currentTenantId }).toArray()

		const entityTypeIdMapping = {}

		const newTypes = oldTypes.map((t) => ({
			...t,
			_id: undefined,
			tenantId: newTenantId,
			orgId: newOrgId,
			registryDetails: {
				...(t.registryDetails || {}),
				tenantMigrationReferenceId: t._id.toString(),
			},
		}))

		if (newTypes.length) {
			const result = await entityTypeCollection.insertMany(newTypes)

			insertedEntityTypes = result.insertedCount

			const insertedIds = Object.values(result.insertedIds)

			for (let i = 0; i < oldTypes.length; i++) {
				entityTypeIdMapping[oldTypes[i]._id.toString()] = insertedIds[i]
			}
		}

		log(`✅ Phase 1 Completed (Inserted: ${insertedEntityTypes}/${totalEntityTypesOld})\n`)

		/**
		 * ==========================================================
		 * PHASE 2 - COPY ENTITIES
		 * ==========================================================
		 */

		log('🚀 Phase 2 - Copying Entities...')

		const cursor = entityCollection.find({ tenantId: currentTenantId }).batchSize(BATCH_SIZE)

		let batch = []
		let processed = 0

		while (await cursor.hasNext()) {
			batch.push(await cursor.next())

			if (batch.length === BATCH_SIZE) {
				const result = await processEntityBatch(batch, entityTypeIdMapping, entityCollection, userId)

				insertedEntities += result.inserted
				skippedEntitiesMissingType += result.skippedType
				skippedTargetMappings += result.skippedTarget

				processed += batch.length
				log(`   Processed ${processed}/${totalEntitiesOld}`)

				batch = []
			}
		}

		if (batch.length) {
			const result = await processEntityBatch(batch, entityTypeIdMapping, entityCollection, userId)

			insertedEntities += result.inserted
			skippedEntitiesMissingType += result.skippedType
			skippedTargetMappings += result.skippedTarget
		}

		log(`✅ Phase 2 Completed (Inserted: ${insertedEntities}/${totalEntitiesOld})\n`)

		/**
		 * ==========================================================
		 * PHASE 3 - FIX GROUPS
		 * ==========================================================
		 */

		log('🚀 Phase 4 - Fixing Groups...')

		const idMapping = {}

		const mapCursor = entityCollection
			.find(
				{
					tenantId: newTenantId,
					'metaInformation.tenantMigrationReferenceId': { $exists: true },
				},
				{
					projection: {
						_id: 1,
						'metaInformation.tenantMigrationReferenceId': 1,
					},
				}
			)
			.batchSize(BATCH_SIZE)

		while (await mapCursor.hasNext()) {
			const doc = await mapCursor.next()
			idMapping[doc.metaInformation.tenantMigrationReferenceId] = doc._id
		}

		const groupCursor = entityCollection
			.find({
				tenantId: newTenantId,
				groups: { $exists: true },
			})
			.batchSize(BATCH_SIZE)

		let groupBatch = []

		while (await groupCursor.hasNext()) {
			groupBatch.push(await groupCursor.next())

			if (groupBatch.length === BATCH_SIZE) {
				skippedGroupMappings += await processGroupBatch(groupBatch, idMapping, entityCollection)
				groupBatch = []
			}
		}

		if (groupBatch.length) {
			skippedGroupMappings += await processGroupBatch(groupBatch, idMapping, entityCollection)
		}

		log('✅ Phase 4 Completed\n')

		/**
		 * FINAL COUNTS
		 */
		const totalEntityTypesNew = await entityTypeCollection.countDocuments({
			tenantId: newTenantId,
		})

		const totalEntitiesNew = await entityCollection.countDocuments({
			tenantId: newTenantId,
		})

		log('=================================================')
		log('MIGRATION SUMMARY')
		log('=================================================')
		log(`EntityTypes: ${insertedEntityTypes}/${totalEntityTypesOld}`)
		log(`Entities: ${insertedEntities}/${totalEntitiesOld}`)
		log(`Skipped (Missing Type): ${skippedEntitiesMissingType}`)
		log(`Skipped TargetedEntityType Mappings: ${skippedTargetMappings}`)
		log(`Skipped Group Mappings: ${skippedGroupMappings}`)
		log('=================================================')
		log('🎉 MIGRATION COMPLETED SUCCESSFULLY\n')

		await client.close()
		process.exit(0)
	} catch (error) {
		if (client) await client.close()
		stopWithError(error)
	}
}

async function processEntityBatch(batch, mapping, collection, userId) {
	let inserted = 0
	let skippedType = 0
	let skippedTarget = 0

	const newDocs = []

	for (const oldEntity of batch) {
		const mappedTypeId = mapping[oldEntity.entityTypeId?.toString()]

		if (!mappedTypeId) {
			skippedType++
			continue
		}

		let updatedTargets = []

		if (Array.isArray(oldEntity.metaInformation?.targetedEntityTypes)) {
			for (const target of oldEntity.metaInformation.targetedEntityTypes) {
				const mappedTargetId = mapping[target.entityTypeId?.toString()]

				if (!mappedTargetId) {
					skippedTarget++
					continue
				}

				updatedTargets.push({
					entityType: target.entityType,
					entityTypeId: mappedTargetId,
				})
			}
		}

		newDocs.push({
			...oldEntity,
			_id: undefined,
			tenantId: newTenantId,
			orgId: newOrgId,
			entityTypeId: mappedTypeId,
			metaInformation: {
				...(oldEntity.metaInformation || {}),
				tenantMigrationReferenceId: oldEntity._id.toString(),
				targetedEntityTypes: updatedTargets,
			},
			createdBy: userId,
			updatedBy: userId,
		})
	}

	if (newDocs.length) {
		const result = await collection.insertMany(newDocs)
		inserted = result.insertedCount
	}

	return { inserted, skippedType, skippedTarget }
}

async function processGroupBatch(batch, idMapping, collection) {
	let skipped = 0
	const bulkOps = []

	for (const doc of batch) {
		if (!doc.groups) continue

		const updatedGroups = {}

		for (const key of Object.keys(doc.groups)) {
			updatedGroups[key] = doc.groups[key]
				.map((oldId) => {
					const mapped = idMapping[oldId?.toString()]
					if (!mapped) skipped++
					return mapped
				})
				.filter(Boolean)
		}

		bulkOps.push({
			updateOne: {
				filter: { _id: doc._id },
				update: { $set: { groups: updatedGroups } },
			},
		})
	}

	if (bulkOps.length) await collection.bulkWrite(bulkOps)

	return skipped
}

runMigration()

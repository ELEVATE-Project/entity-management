/**
 * ==========================================================
 * ENTITY + ENTITYTYPE MIGRATION SCRIPT
 * ==========================================================
 */

const { MongoClient, ObjectId } = require('mongodb')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken') // Added for decoding token

require('dotenv').config({
	path: path.join(__dirname, '../../.env'),
})

const input = JSON.parse(fs.readFileSync(path.join(__dirname, 'input.json'), 'utf8'))

const { loginCredentails, tenantMappingConfig } = input
const { currentTenantId, currentOrgId, newTenantId, newOrgId } = tenantMappingConfig

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

	try {
		fs.writeFileSync(
			OUTPUT_FILE,
			'==============================\n MIGRATION STARTED\n==============================\n\n'
		)

		/**
		 * LOGIN
		 */
		log('🔐 Logging in...')

		let loginUrl = ''
		let loginResponse

		// Role based login selection
		if (loginCredentails.createrType === 'admin') {
			loginUrl = `${BASE_URL}/user/v1/admin/login`
		} else {
			loginUrl = `${BASE_URL}/user/v1/account/login`
		}

		loginResponse = await axios.post(
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

		if (!token) {
			throw new Error('Login failed. Token missing.')
		}

		const decodedToken = jwt.decode(token)

		log(`✅ Login successful. userId: ${userId}`)

		/**
		 * ==========================================================
		 * VALIDATIONS (ONLY FOR NON-ADMIN)
		 * ==========================================================
		 */

		if (loginCredentails.createrType !== 'admin') {
			log(' Running Role & Tenant Validations...')

			// Extract roles safely
			const roles = decodedToken?.data?.organizations?.[0]?.roles || []

			// Extract role titles
			const roleTitles = roles.map((r) => r.title)

			// Validation 1: Role check
			if (!roleTitles.includes(loginCredentails.createrType)) {
				throw new Error(
					`Role validation failed. User does not have required role: "${
						loginCredentails.createrType
					}". Available roles: ${roleTitles.join(', ')}`
				)
			}

			log('✅ Role validation passed.')

			// Validation 2: Tenant match check
			const tokenTenantCode = decodedToken?.data?.tenant_code

			if (tokenTenantCode !== newTenantId) {
				throw new Error(
					`Tenant validation failed. Token tenant_code "${tokenTenantCode}" does not match newTenantId "${newTenantId}".`
				)
			}

			log('✅ Tenant validation passed.\n')
		}
		/**
		 * CONNECT DB
		 */
		log('🔌 Connecting to MongoDB...')

		client = new MongoClient(MONGODB_URL)
		await client.connect()

		const dbNameFromUrl = MONGODB_URL.split('/').pop()
		const db = client.db(dbNameFromUrl)

		const entityTypeCollection = db.collection('entityTypes')
		const entityCollection = db.collection('entities')

		log(`✅ Connected to DB: ${dbNameFromUrl}\n`)

		const existingTargetData =
			(await entityTypeCollection.countDocuments({ tenantId: newTenantId })) +
			(await entityCollection.countDocuments({ tenantId: newTenantId }))

		if (existingTargetData > 0) {
			throw new Error(`Target tenant (${newTenantId}) already has data. Migration stopped.`)
		}

		log('✅ Target tenant clean.\n')

		/**
		 * COUNT
		 */
		const currentEntityTypeCount = await entityTypeCollection.countDocuments({
			tenantId: currentTenantId,
		})

		const currentEntityCount = await entityCollection.countDocuments({
			tenantId: currentTenantId,
		})

		log(`📊 EntityTypes: ${currentEntityTypeCount}`)
		log(`📊 Entities: ${currentEntityCount}\n`)

		/**
		 * ==========================================================
		 * PHASE 1 - COPY ENTITY TYPES (BATCH)
		 * ==========================================================
		 */

		log('🚀 Phase 1 - Copying EntityTypes...')

		const oldEntityTypes = await entityTypeCollection.find({ tenantId: currentTenantId }).toArray()

		const newEntityTypes = oldEntityTypes.map((oldType) => {
			const oldId = oldType._id

			return {
				...oldType,
				_id: undefined,
				tenantId: newTenantId,
				orgId: newOrgId,
				createdBy: userId,
				updatedBy: userId,
				registryDetails: {
					...(oldType.registryDetails || {}),
					tenantMigrationReferenceId: oldId.toString(),
				},
			}
		})

		if (newEntityTypes.length) {
			await entityTypeCollection.insertMany(newEntityTypes)
		}

		log('✅ Phase 1 Completed\n')

		/**
		 * ==========================================================
		 * PHASE 2 - COPY ENTITIES
		 * ==========================================================
		 */

		log('🚀 Phase 2 - Copying Entities...')

		const cursor = entityCollection.find({
			tenantId: currentTenantId,
		})

		let batch = []
		let oldEntity

		while ((oldEntity = await cursor.next()) != null) {
			const oldEntityId = oldEntity._id

			const newEntityType = await entityTypeCollection.findOne({
				tenantId: newTenantId,
				'registryDetails.tenantMigrationReferenceId': oldEntity.entityTypeId.toString(),
			})

			if (!newEntityType) {
				throw new Error(`EntityType mapping missing for ${oldEntity.entityTypeId}`)
			}

			const newDoc = {
				...oldEntity,
				_id: undefined,
				tenantId: newTenantId,
				orgId: newOrgId,
				entityTypeId: newEntityType._id,
				entityType: newEntityType.name,
				createdBy: userId,
				updatedBy: userId,
				metaInformation: {
					...(oldEntity.metaInformation || {}),
					tenantMigrationReferenceId: oldEntityId.toString(),
				},
			}

			batch.push(newDoc)

			if (batch.length === BATCH_SIZE) {
				await entityCollection.insertMany(batch)
				batch = []
			}
		}

		if (batch.length) {
			await entityCollection.insertMany(batch)
		}

		log('✅ Phase 2 Completed\n')

		/**
		 * ==========================================================
		 * PHASE 3 - FIX targetedEntityTypes
		 * ==========================================================
		 */

		log('🚀 Phase 3 - Fixing targetedEntityTypes...')

		const newEntitiesWithTargets = entityCollection.find({
			tenantId: newTenantId,
			'metaInformation.targetedEntityTypes': { $exists: true },
		})

		while ((oldEntity = await newEntitiesWithTargets.next()) != null) {
			const targets = oldEntity.metaInformation?.targetedEntityTypes || []

			if (!targets.length) continue

			const updatedTargets = []

			for (let target of targets) {
				const mappedType = await entityTypeCollection.findOne({
					tenantId: newTenantId,
					'registryDetails.tenantMigrationReferenceId': target.entityTypeId.toString(),
				})

				if (!mappedType) {
					throw new Error(`Targeted EntityType mapping missing for ${target.entityTypeId}`)
				}

				updatedTargets.push({
					entityType: mappedType.name,
					entityTypeId: mappedType._id,
				})
			}

			await entityCollection.updateOne(
				{ _id: oldEntity._id },
				{
					$set: {
						'metaInformation.targetedEntityTypes': updatedTargets,
					},
				}
			)
		}

		log('✅ Phase 3 Completed\n')

		/**
		 * ==========================================================
		 * PHASE 4 - FIX GROUP REFERENCES
		 * ==========================================================
		 */

		log('🚀 Phase 4 - Fixing Groups (Bulk Optimized)...')

		/**
		 * STEP 1:
		 * Build oldId -> newId map once
		 */
		log('🔎 Building entityId mapping...')

		const idMapping = {}

		const mappingCursor = entityCollection.find(
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

		let mapDoc

		while ((mapDoc = await mappingCursor.next()) != null) {
			const oldId = mapDoc.metaInformation?.tenantMigrationReferenceId

			if (oldId) {
				idMapping[oldId.toString()] = mapDoc._id
			}
		}

		log(`✅ Mapping dictionary built (${Object.keys(idMapping).length} records)\n`)

		/**
		 * STEP 2:
		 * Process entities with groups using bulkWrite
		 */

		const groupCursor = entityCollection.find({
			tenantId: newTenantId,
			groups: { $exists: true, $ne: null },
		})

		let bulkOps = []
		let entityDoc

		while ((entityDoc = await groupCursor.next()) != null) {
			if (
				!entityDoc.groups ||
				typeof entityDoc.groups !== 'object' ||
				Object.keys(entityDoc.groups).length === 0
			) {
				continue
			}

			const updatedGroups = {}
			let needsUpdate = false

			for (const key of Object.keys(entityDoc.groups)) {
				const oldIds = entityDoc.groups[key]

				if (!Array.isArray(oldIds) || oldIds.length === 0) {
					updatedGroups[key] = []
					continue
				}

				const newIds = []

				for (const oldId of oldIds) {
					const mappedId = idMapping[oldId.toString()]

					if (!mappedId) {
						throw new Error(`Group mapping missing for oldId: ${oldId}`)
					}

					newIds.push(mappedId)
				}

				updatedGroups[key] = newIds
				needsUpdate = true
			}

			if (needsUpdate) {
				bulkOps.push({
					updateOne: {
						filter: { _id: entityDoc._id },
						update: { $set: { groups: updatedGroups } },
					},
				})
			}

			if (bulkOps.length === BATCH_SIZE) {
				await entityCollection.bulkWrite(bulkOps)
				bulkOps = []
			}
		}

		if (bulkOps.length > 0) {
			await entityCollection.bulkWrite(bulkOps)
		}

		log('✅ Phase 4 Completed\n')

		/**
		 * SUMMARY
		 */

		const newEntityTypeCount = await entityTypeCollection.countDocuments({
			tenantId: newTenantId,
		})

		const newEntityCount = await entityCollection.countDocuments({
			tenantId: newTenantId,
		})

		log('=================================================')
		log('MIGRATION SUMMARY')
		log('=================================================')
		log(`EntityTypes (Old): ${currentEntityTypeCount}`)
		log(`EntityTypes (New): ${newEntityTypeCount}`)
		log(`Entities (Old): ${currentEntityCount}`)
		log(`Entities (New): ${newEntityCount}`)
		log(' MIGRATION COMPLETED SUCCESSFULLY\n')

		await client.close()
		process.exit(0)
	} catch (error) {
		if (client) await client.close()
		stopWithError(error)
	}
}

runMigration()

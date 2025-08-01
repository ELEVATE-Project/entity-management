/**
 * name : correctOrgIdValuesInCollections.js
 * description : Normalize orgId/orgIds fields in given collections
 * author : vishnu
 */

require('dotenv').config({ path: '../.env' })
const MongoClient = require('mongodb').MongoClient
const _ = require('lodash')

const mongoUrl = process.env.MONGODB_URL
const dbName = mongoUrl.split('/').pop()
const url = mongoUrl.split(dbName)[0]

// Collections with "orgId" (string) field
const singleOrgIdCollections = ['entities', 'entityTypes', 'userRoleExtension']

// Normalize function
function normalizeOrgId(orgId) {
	return orgId.trim().toLowerCase().replace(/\s+/g, '_')
}

;(async () => {
	const connection = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
	const db = connection.db(dbName)

	try {
		// Process single orgId collections
		for (const collectionName of singleOrgIdCollections) {
			console.log(`\nProcessing collection: ${collectionName}`)
			const orgIds = await db.collection(collectionName).distinct('orgId')
			console.log('orgIds:', orgIds)

			for (const originalOrgId of orgIds) {
				if (typeof originalOrgId !== 'string' || originalOrgId.toUpperCase() === 'ALL') continue

				const normalizedOrgId = normalizeOrgId(originalOrgId)
				if (normalizedOrgId !== originalOrgId) {
					const result = await db
						.collection(collectionName)
						.updateMany({ orgId: originalOrgId }, { $set: { orgId: normalizedOrgId } })
					console.log(
						`Updated ${result.modifiedCount} documents in ${collectionName} from '${originalOrgId}' to '${normalizedOrgId}'`
					)
				}
			}
		}

		console.log('\nNormalization completed!')
		connection.close()
	} catch (error) {
		console.error('Error occurred:', error)
		connection.close()
	}
})()

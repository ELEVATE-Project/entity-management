/**
 * name : helper.js
 * author : Mallanagouda R Biradar
 * created-date : 24-Apr-2025
 * Description : Admin.
 */

// Dependencies
/**
 * ProgramsHelper
 * @class
 */
const adminQueries = require(DB_QUERY_BASE_PATH + '/admin')
const entitiesQueries = require(DB_QUERY_BASE_PATH + '/entities')
const deletionAuditQueries = require(DB_QUERY_BASE_PATH + '/deletionAuditLogs')
const kafkaProducersHelper = require(PROJECT_ROOT_DIRECTORY + '/generics/kafka/producers')
const { ObjectId } = require('mongodb')
module.exports = class AdminHelper {
	/**
	 * create index in the model.
	 * @method
	 * @name createIndex
	 * @param {String} collection - collectionName.
	 * @param {Array} keys - keys data.
	 * @returns {JSON} - success/failure message.
	 */
	static createIndex(collection, keys) {
		return new Promise(async (resolve, reject) => {
			try {
				// Fetch the list of already present indexes for the collection
				let presentIndex = await adminQueries.listIndices(collection)

				// Extract just the key names from the index metadata
				let indexes = presentIndex.map((indexedKeys) => {
					return Object.keys(indexedKeys.key)[0]
				})

				// Use lodash to find keys that are *not* already indexed
				let indexNotPresent = _.differenceWith(keys, indexes)

				// If there are keys that need to be indexed
				if (indexNotPresent.length > 0) {
					indexNotPresent.forEach(async (key) => {
						await adminQueries.createIndex(collection, key)
					})

					// If all keys are already indexed, respond accordingly
					return resolve({
						message: CONSTANTS.apiResponses.KEYS_INDEXED_SUCCESSFULL,
						success: true,
					})
				} else {
					return resolve({
						message: CONSTANTS.apiResponses.KEYS_ALREADY_INDEXED_SUCCESSFULL,
						success: true,
					})
				}
			} catch (error) {
				return resolve({
					status: error.status ? error.status : HTTP_STATUS_CODE.internal_server_error.status,
					success: false,
					message: error.message,
					data: {},
				})
			}
		})
	}

	/**
	 * Deletes an entity and optionally its related child/grouped entities from the database.
	 *
	 * @param {String|ObjectId} entityId - The ID of the main entity to be deleted.
	 * @param {Boolean|String} allowRecursiveDelete - Flag indicating whether related/grouped entities should also be deleted.
	 *
	 * @returns {Promise<Object>} - Result containing the deleted entity info or error details.
	 */
	static allowRecursiveDelete(entityId, allowRecursiveDelete = 'false', tenantId, deletedBy = 'SYSTEM') {
		return new Promise(async (resolve, reject) => {
			try {
				//Fetch the entity document to validate existence and get its metadata
				const filter = { _id: entityId, tenantId: tenantId }
				const entityDocs = await entitiesQueries.entityDocuments(filter, ['groups', 'entityType'])

				if (!entityDocs.length) {
					throw {
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.ENTITY_NOT_FOUND,
					}
				}

				// Extract entity type and prepare entityObjectId
				const entityType = entityDocs[0].entityType
				const entityObjectId = typeof entityId === 'string' ? new ObjectId(entityId) : entityId
				//If allowRecursiveDelete is true, delete this entity and all nested group entities
				if (UTILS.convertStringToBoolean(allowRecursiveDelete)) {
					// Gather all nested group IDs + self
					const relatedEntityIds = new Set()

					// Traverse all group relationships and collect nested entity IDs
					for (const entity of entityDocs) {
						const groups = entity.groups || {}
						Object.values(groups).forEach((ids) => {
							if (Array.isArray(ids)) {
								ids.forEach((id) => relatedEntityIds.add(id.toString()))
							}
						})
					}

					// Include the root entity's ID in deletion
					relatedEntityIds.add(entityObjectId.toString())

					// Convert all to ObjectId type
					const relatedEntityObjectIds = Array.from(relatedEntityIds).map((id) => new ObjectId(id))
					const deletedEntities = await entitiesQueries.removeDocuments({
						_id: { $in: relatedEntityObjectIds },
					})
					// Insert logs into deletionAuditLogs collection
					await this.logDeletion(Array.from(relatedEntityIds), deletedBy)
					for (const id of relatedEntityObjectIds) {
						await this.pushEntityDeleteKafkaEvent(id, deletedBy, tenantId)
					}

					let result = {
						deletedEntitiesCount: deletedEntities.deletedCount,
						deletedEntities: relatedEntityObjectIds,
					}
					resolve({
						message: CONSTANTS.apiResponses.ENTITIES_DELETED_SUCCESSFULLY,
						result: result,
					})
				} else {
					//Delete the document with _id
					const deletedEntities = await entitiesQueries.removeDocuments({ _id: entityObjectId })
					//Remove from other entities' groups
					const unlinkResult = await adminQueries.pullEntityFromGroups(entityType, entityObjectId)
					// Insert logs into deletionAuditLogs collection
					await this.logDeletion([entityObjectId], deletedBy)
					await this.pushEntityDeleteKafkaEvent(entityObjectId, deletedBy, tenantId)
					let result
					if (deletedEntities && unlinkResult) {
						result = {
							deletedEntities: entityId,
							deletedEntitiesCount: deletedEntities.deletedCount,
							unLinkedEntitiesCount: unlinkResult.nModified,
						}
					}
					resolve({
						message: CONSTANTS.apiResponses.ENTITIES_DELETED_SUCCESSFULLY,
						result: result,
					})
				}
			} catch (error) {
				resolve({
					status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
					success: false,
					message: error.message,
					data: {},
				})
			}
		})
	}

	/**
	 * Logs deletion entries for one or more entities into the `deletionAuditLogs` collection.
	 *
	 * @method
	 * @name logDeletion
	 * @param {Array<String|ObjectId>} entityIds - Array of entity IDs (as strings or ObjectIds) to log deletion for.
	 * @param {String|Number} deletedBy - User ID (or 'SYSTEM') who performed the deletion.
	 *
	 * @returns {Promise<Object>} - Returns success status or error information.
	 */
	static logDeletion(entityIds, deletedBy) {
		return new Promise(async (resolve, reject) => {
			try {
				// Prepare log entries
				const logs = entityIds.map((id) => ({
					entityId: new ObjectId(id),
					deletedBy: deletedBy || 'SYSTEM',
					deletedAt: new Date().toISOString(),
				}))
				// Insert logs into deletionAuditLogs collection
				await deletionAuditQueries.deletionAuditLogs(logs)
				return resolve({ success: true })
			} catch (error) {
				resolve({
					status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
					success: false,
					message: error.message,
					data: {},
				})
			}
		})
	}

	/**
	 * Pushes a Kafka event for an entity deletion.
	 *
	 * @param {ObjectId|string} entityId - The MongoDB ObjectId (or string) of the deleted entity.
	 * @param {string|number} deletedBy - The user ID or system name who performed the deletion.
	 * @param {string} tenantId - The tenant code for identifying the tenant.
	 * @param {string|null} [organizationId=null] - (Optional) Organization ID associated with the entity.
	 * @returns {Promise<void>} - Resolves when the Kafka event is pushed or logs an error if it fails.
	 */
	static pushEntityDeleteKafkaEvent(entityId, deletedBy, tenantId) {
		return new Promise(async (resolve, reject) => {
			try {
				// Construct the Kafka message payload with essential metadata
				const kafkaMessage = {
					entity: 'resource',
					type: 'entity',
					eventType: 'delete',
					entityId: entityId.toString(),
					deleted_By: parseInt(deletedBy) || deletedBy,
					tenant_code: tenantId,
				}

				// Push the message to Kafka topic using helper
				const kafkaPushed = await kafkaProducersHelper.pushDeletedEntityToKafka(kafkaMessage)
				return resolve()
			} catch (err) {
				console.error(`Kafka push failed for entityId ${entityId}:`, err.message)
			}
		})
	}
}

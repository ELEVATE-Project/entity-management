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
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
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

				const entityDoc = await entitiesQueries.entityDocuments(filter, ['groups', 'entityType'])

				if (!entityDoc.length) {
					throw {
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.ENTITY_NOT_FOUND,
					}
				}
				// Extract entity type and prepare entityObjectId
				const entityType = entityDoc[0].entityType
				const entityObjectId = typeof entityId === 'string' ? new ObjectId(entityId) : entityId
				//If allowRecursiveDelete is true, delete this entity and all nested group entities
				if (UTILS.convertStringToBoolean(allowRecursiveDelete)) {
					// Initialize a Set to collect entity IDs to delete (ensures uniqueness)
					const relatedEntityIds = new Set()
					// Add the root entity itself
					relatedEntityIds.add(entityObjectId)

					// Extract group relationships (if any) from the entity
					const groups = entityDoc[0].groups || {}
					// Traverse group values and collect all nested entity IDs
					Object.values(groups).forEach((ids) => {
						if (Array.isArray(ids)) {
							ids.forEach((id) => relatedEntityIds.add(id))
						}
					})

					// Convert Set to Array for MongoDB `$in` filter
					const relatedEntityObjectIds = Array.from(relatedEntityIds)

					// Delete all entities collected (root + nested groups)
					const deletedEntities = await entitiesQueries.removeDocuments({
						_id: { $in: relatedEntityObjectIds },
						tenantId: tenantId,
					})

					// Perform post-deletion tasks: unlinking, logging, and pushing Kafka events
					const { unLinkedEntitiesCount } = await this.handlePostEntityDeletionTasks(
						relatedEntityObjectIds,
						entityType,
						deletedBy,
						tenantId
					)

					// Return deletion response
					return resolve({
						message: CONSTANTS.apiResponses.ENTITIES_DELETED_SUCCESSFULLY,
						result: {
							unLinkedEntitiesCount,
							deletedEntitiesCount: deletedEntities.deletedCount,
							deletedEntities: relatedEntityObjectIds,
						},
					})
				} else {
					// If recursive deletion is not allowed, delete only the single entity
					const deletedEntities = await entitiesQueries.removeDocuments({
						_id: entityObjectId,
						tenantId: tenantId,
					})

					// Perform post-deletion tasks: unlinking, logging, and pushing Kafka event
					const { unLinkedEntitiesCount } = await this.handlePostEntityDeletionTasks(
						[entityObjectId],
						entityType,
						deletedBy,
						tenantId
					)

					// Return deletion response
					return resolve({
						message: CONSTANTS.apiResponses.ENTITIES_DELETED_SUCCESSFULLY,
						result: {
							deletedEntities: entityId,
							deletedEntitiesCount: deletedEntities.deletedCount,
							unLinkedEntitiesCount,
						},
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
	 * Handles post-deletion operations for entities such as:
	 * - Unlinking from other entities' groups
	 * - Logging the deletion
	 * - Pushing Kafka events for each deleted entity
	 *
	 * @param {ObjectId[]} deletedIds - Array of ObjectIds for deleted entities
	 * @param {String} entityType - Type of the entity (e.g., "school", "block", etc.)
	 * @param {String|ObjectId} deletedBy - User ID or "SYSTEM" who performed the deletion
	 * @param {String} tenantId - Tenant code for the environment (e.g., "shikshalokam")
	 * @returns {Promise<Object>} Result containing number of unlinked entities
	 */
	static handlePostEntityDeletionTasks(deletedIds, entityType, deletedBy, tenantId) {
		return new Promise(async (resolve, reject) => {
			// Remove from other entities' groups
			const unlinkResult = await adminQueries.pullEntityFromGroups(entityType, deletedIds[0], tenantId)

			// Insert logs into deletionAuditLogs collection
			await this.create(deletedIds, deletedBy)

			// Message:  {"topic":"RESOURCE_DELETION_TOPIC","value":"{\"entity\":\"resource\",\"type\":\"entity\",\"eventType\":\"delete\
			// 	",\"entityIds\":[\"6852c9027248c20014b38b69\",\"6852c9227248c20014b3957d\",\"6852c9227248c20014b3957e\",\"6852c9227248c20014b3957f\
			// 	",\"6852c9227248c20014b39580\",\"6852c9227248c20014b39581\",\"6852c9227248c20014b39582\",\"6852c9227248c20014b39583\",
			// 	\"deleted_By\":1,\"tenant_code\":\"shikshalokam\"}"
			// Push Kafka events
			await this.pushEntityDeleteKafkaEvent(deletedIds, deletedBy, tenantId)
			return resolve({
				unLinkedEntitiesCount: unlinkResult?.nModified || 0,
			})
		})
	}

	/**
	 * Logs deletion entries for one or more entities into the `deletionAuditLogs` collection.
	 *
	 * @method
	 * @name create
	 * @param {Array<String|ObjectId>} entityIds - Array of entity IDs (as strings or ObjectIds) to log deletion for.
	 * @param {String|Number} deletedBy - User ID (or 'SYSTEM') who performed the deletion.
	 *
	 * @returns {Promise<Object>} - Returns success status or error information.
	 */
	static create(entityIds, deletedBy) {
		return new Promise(async (resolve, reject) => {
			try {
				// Prepare log entries
				const logs = entityIds.map((id) => ({
					entityId: new ObjectId(id),
					deletedBy: deletedBy || 'SYSTEM',
					deletedAt: new Date().toISOString(),
				}))
				// Insert logs into create collection
				await deletionAuditQueries.create(logs)
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
	static pushEntityDeleteKafkaEvent(entityIds, deletedBy, tenantId) {
		return new Promise(async (resolve, reject) => {
			try {
				// Construct the Kafka message payload with essential metadata
				const kafkaMessage = {
					entity: 'resource',
					type: 'entity',
					eventType: 'delete',
					entityIds: entityIds,
					deleted_By: parseInt(deletedBy) || deletedBy,
					tenant_code: tenantId,
				}

				// Push the message to Kafka topic using helper
				await kafkaProducersHelper.pushDeletedEntityToKafka(kafkaMessage)
				return resolve()
			} catch (err) {
				console.error(`Kafka push failed for entityId ${entityId}:`, err.message)
			}
		})
	}
}

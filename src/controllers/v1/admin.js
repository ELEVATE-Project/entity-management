/**
 * name : admin.js
 * author : Mallanagouda R Biradar
 * created-date : 24-Apr-2025
 * Description : Admin related information.
 */

// Dependencies
const adminHelper = require(MODULES_BASE_PATH + '/admin/helper')

module.exports = class Admin {
	static get name() {
		return 'admin'
	}

	/**
	 * Indexing specified keys in a model
	 * @method
	 * @name createIndex
	 * @param {Object} req - requested data.
	 * @param {String} req.params._id - collection name.
	 * @param {Array} req.body.keys - keys to be indexed.
	 * @returns {Object} success/failure message.
	 */

	async createIndex(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Extract the name of the collection from route params
				let collection = req.params._id
				// Extract the keys on which the index needs to be created from request body
				let keys = req.body.keys

				// Call helper function to create the index on the given collection with the provided keys
				const isIndexed = await adminHelper.createIndex(collection, keys)

				// Resolve the promise with the result (true/false or index details)
				return resolve(isIndexed)
			} catch (error) {
				return reject({
					status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message || HTTP_STATUS_CODE.internal_server_error.message,
					errorObject: error,
				})
			}
		})
	}

	/**
	 * Controller method to delete an entity (and optionally its related entities).
	 * @api {post} v1/admin/deleteEntity/6852c8de7248c20014b38a61?allowRecursiveDelete=false
	 * @apiVersion 1.0.0
	 * @apiName deleteEntity
	 * @apiGroup Entities
	 * @apiParam {entityId} entityId Mandatory
	 *  @returns {JSON} - Message of successfully created.
	 * @param {Object} req - Express request object
	 * @param {String} req.params._id - The ID of the entity to delete
	 * @param {String|Boolean} req.query.allowRecursiveDelete - Whether to delete related/grouped entities
	 *
	 * @returns {Promise<Object>} - Response object with status and result or error
	 * @returns {JSON} - ENTITIES_DELETED_SUCCESSFULLY
	 * {
    		"message": "ENTITIES_DELETED_SUCCESSFULLY",
    		"status": 200,
    		"result": {
				"deletedEntities": "6825939a97b5680013e6a166",
    		    "deletedEntitiesCount": 1,
    		    "unLinkedEntitiesCount": 1
    		}
		}
	 */
	deleteEntity(req) {
		return new Promise(async (resolve, reject) => {
			try {
				let deletedEntity
				if (
					req.userDetails &&
					req.userDetails.userInformation &&
					req.userDetails.userInformation.roles &&
					req.userDetails.userInformation.roles.includes(CONSTANTS.common.ADMIN_ROLE)
				) {
					deletedEntity = await adminHelper.allowRecursiveDelete(
						req.params._id,
						req.query.allowRecursiveDelete == 'true' ? 'true' : 'false',
						req.userDetails.tenantAndOrgInfo.tenantId,
						req.userDetails.userInformation.userId
					)
				} else {
					throw {
						status: HTTP_STATUS_CODE.forbidden.status,
						message: CONSTANTS.apiResponses.ADMIN_ROLE_REQUIRED,
					}
				}
				return resolve(deletedEntity)
			} catch (error) {
				return reject({
					status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message || HTTP_STATUS_CODE.internal_server_error.message,
					errorObject: error,
				})
			}
		})
	}
}

/**
 * name : admin.js
 * author : Mallanagouda R Biradar
 * created-date : 24-Apr-2025
 * Description : Admin related db queries
 */

// Dependencies
/**
 * Admin
 * @class
 */

module.exports = class Admin {
	/**
	 * list index.
	 * @method
	 * @name listIndices
	 * @param {String} [collectionName] - collection name.
	 * @returns {cursorObject} program details.
	 */

	static listIndices(collectionName) {
		return new Promise(async (resolve, reject) => {
			try {
				// Use Sequelize's internal model reference to call listIndexes on the collection
				let presentIndices = await database.models[collectionName].listIndexes()
				return resolve(presentIndices)
			} catch (error) {
				return reject(error)
			}
		})
	}

	/**
	 * Unlink an entity ID from all parent documents that reference it in their groups.
	 *
	 * @param {String} entityType - Type of the entity (e.g., 'block', 'cluster').
	 * @param {ObjectId} entityId - MongoDB ObjectId of the entity to remove from groups.
	 * @returns {Promise<Object>} - MongoDB updateMany result containing modified count.
	 */
	static pullEntityFromGroups(entityType, entityId) {
		return new Promise(async (resolve, reject) => {
			try {
				//Build the $pull query to remove the entityId from group arrays
				const updateQuery = {
					$pull: {
						[`groups.${entityType}`]: entityId,
					},
				}
				const result = await database.models.entities.updateMany(
					{ [`groups.${entityType}`]: entityId },
					updateQuery
				)
				return resolve(result)
			} catch (error) {
				return reject({
					status: error.status || HTTP_STATUS_CODE.bad_request.status,
					message: error.message || HTTP_STATUS_CODE.bad_request.message,
					errorObject: error,
				})
			}
		})
	}

	/**
	 * create index
	 * @method
	 * @name createIndex
	 * @param {String} [collectionName] - collection name.
	 * @param {String} [key] - key to be indexed
	 * @returns {Object} success/failure object
	 */

	static createIndex(collectionName, key) {
		return new Promise(async (resolve, reject) => {
			try {
				// Use native MongoDB driver to create an ascending index on the specified key
				let createdIndex = await database.models[collectionName].db
					.collection(collectionName)
					.createIndex({ [key]: 1 })
				return resolve(createdIndex)
			} catch (error) {
				return reject(error)
			}
		})
	}
}

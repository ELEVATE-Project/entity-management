/**
 * name : entityTypes.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : Entity Type related information.
 */

// Dependencies
const entityTypesHelper = require(MODULES_BASE_PATH + '/entityTypes/helper')
const csv = require('csvtojson')
const FileStream = require(PROJECT_ROOT_DIRECTORY + '/generics/file-stream')

/**
 * entityType
 * @class
 */

module.exports = class EntityTypes extends Abstract {
	/**
	 * @apiDefine errorBody
	 * @apiError {String} status 4XX,5XX
	 * @apiError {String} message Error
	 */

	/**
	 * @apiDefine successBody
	 *  @apiSuccess {String} status 200
	 * @apiSuccess {String} result Data
	 */

	constructor() {
		super('entityTypes')
	}

	static get name() {
		return 'entityTypes'
	}

	/**
    * @api {get} v1/entityTypes/list List all entity types.
    * @apiVersion 1.0.0
    *  @apiName Entity Type list
    * @apiGroup Entity Types
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest v1/entityTypes/list
    * @apiUse successBody
    * @apiUse errorBody
    * @returns {JSON} - List of all entity types.
    * {
    "message": "ENTITY_TYPES_FETCHED",
    "status": 200,
    "result": [
        {
            "_id": "68f849082be5592a62b67ad3",
            "name": "subroles"
        }
    ]
	}
	*/
	async list(req) {
		return new Promise(async (resolve, reject) => {
			try {
				let organizationId
				let query = {}

				// create query to fetch assets
				query['tenantId'] = req.userDetails.tenantAndOrgInfo
					? req.userDetails.tenantAndOrgInfo.tenantId
					: req.userDetails.userInformation.tenantId

				// handle currentOrgOnly filter
				if (req.query['currentOrgOnly'] && req.query['currentOrgOnly'] == 'true') {
					organizationId = req.userDetails.userInformation.organizationId
					query['orgId'] = { $in: [organizationId] }
				}
				let result = await entityTypesHelper.list(query, ['name'], req.pageNo, req.pageSize, req.searchText)

				return resolve(result)
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
	 * Find all the entity types.
	* @api {post} v1/entityTypes/find all entity types.
    * @apiVersion 1.0.0
    * @apiName find
    * @apiGroup Entity Types
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest v1/entityTypes/find
    * @apiUse successBody
    * @apiUse errorBody
	 * @returns {JSON} - List of all entity types.
	 *   "result": [
        {
    "message": "ENTITY_TYPES_FETCHED",
    "status": 200,
    "result": [
        {
            "_id": "68f849082be5592a62b67ad3",
            "profileForm": [],
            "profileFields": [],
            "types": [],
            "callResponseTypes": [],
            "isObservable": true,
            "immediateChildrenEntityType": [],
            "createdBy": "456",
            "updatedBy": "456",
            "deleted": false,
            "isDeleted": false,
            "name": "subroles",
            "registryDetails": {
                "name": "schoolRegistry"
            },
            "toBeMappedToParentEntities": true,
            "tenantId": "shikshalokam",
            "orgId": "slorg",
            "updatedAt": "2025-10-22T03:06:00.696Z",
            "createdAt": "2025-10-22T03:01:28.026Z",
            "__v": 0
        }
    ]
	}
	 */
	async find(req) {
		return new Promise(async (resolve, reject) => {
			try {
				req.body.query = UTILS.stripOrgIds(req.body.query)
				// Call 'entityTypesHelper.list' to find entity types based on provided query, projection, and skipFields
				let result = await entityTypesHelper.list(
					req.body.query,
					req.body.projection,
					req.pageNo,
					req.pageSize,
					req.searchText
				)

				return resolve(result)
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
	 *  create Entity Types.
	 * @api {POST} /v1/entityTypes/createsingle API's
	 * @apiVersion 1.0.0
	 * @apiName create
	 * @apiGroup Entities
	 * @apiSampleRequest /v1/entityTypes/create
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @param {Object} req -request data.
	 * @returns {CSV}  create single  entity Types data.
	 * 
	 * {
    "message": "ENTITY_INFORMATION_CREATED",
    "status": 200,
    "result": {
        "name": "professional_roles",
        "isObservable": true,
        "toBeMappedToParentEntities": true,
        "tenantId": "shikshalokam",
        "orgId": "slorg",
        "status": "SUCCESS",
        "_id": "68f849082be5592a62b67ad3"
    }
	}
	 */

	async create(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Call 'entityTypesHelper.create' to create a new entity type
				let result = await entityTypesHelper.create(req.body, req.userDetails)
				return resolve(result)
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
	 * Update entityType information.
	 * @api {POST} /v1/entityTypes/update single API's
	 * @apiVersion 1.0.0
	 * @apiName update
	 * @apiGroup Entities
	 * @apiSampleRequest /v1/entityTypes/update/662f7d733f9b670521cadcff
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @param {Object} req - requested entityType data.
	 * @returns {JSON} - Updated entityType information.
	 *  {
    "status": 200,
    "result": {
        "profileForm": [],
        "profileFields": [],
        "types": [],
        "callResponseTypes": [],
        "isObservable": true,
        "immediateChildrenEntityType": [],
        "createdBy": "456",
        "updatedBy": "456",
        "deleted": false,
        "_id": "68f849082be5592a62b67ad3",
        "isDeleted": false,
        "name": "subroles",
        "registryDetails": {
            "name": "schoolRegistry"
        },
        "toBeMappedToParentEntities": true,
        "tenantId": "shikshalokam",
        "orgId": "slorg",
        "updatedAt": "2025-10-22T03:06:00.696Z",
        "createdAt": "2025-10-22T03:01:28.026Z",
        "__v": 0
    }
	}
	 */

	update(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Call 'entityTypesHelper.update' to update an existing entity type
				let result = await entityTypesHelper.update(req.params._id, req.body, req.userDetails)

				return resolve(result)
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
	 * Bulk create Entity Types.
	 * @api {POST} /v1/entityTypes/bulkCreate API by uploading CSV
	 * @apiVersion 1.0.0
	 * @apiName bulkCreate
	 * @apiGroup Entities
	 * @apiSampleRequest /v1/entityTypes/bulkCreate
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @apiParamExample {json} Response:
	 * @param {Object} req -request data.
	 * @returns {CSV} Bulk create entity Types data.
	 */
	async bulkCreate(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Parse CSV data from uploaded file
				let entityTypesCSVData = await csv().fromString(req.files.entityTypes.data.toString())

				// Check if CSV data is valid and contains entity types
				if (!entityTypesCSVData || entityTypesCSVData.length < 1) {
					throw CONSTANTS.apiResponses.ENTITY_TYPE_NOT_CREATED
				}

				// Call 'entityTypesHelper.bulkCreate' to create multiple entity types from CSV data and user details
				const newEntityTypeData = await entityTypesHelper.bulkCreate(entityTypesCSVData, req.userDetails)

				// Check if entity types were created successfully
				if (newEntityTypeData.length > 0 && newEntityTypeData[0].status === CONSTANTS.apiResponses.SUCCESS) {
					const fileName = `EntityType-Upload`
					let fileStream = new FileStream(fileName)
					let input = fileStream.initStream()

					// Use Promise to handle stream processing and resolve with file details
					;(async function () {
						await fileStream.getProcessorPromise()
						return resolve({
							isResponseAStream: true,
							fileNameWithPath: fileStream.fileNameWithPath(),
						})
					})()

					await Promise.all(
						newEntityTypeData.map(async (entityType) => {
							input.push(entityType)
						})
					)

					input.push(null)
				} else {
					const error = new Error(CONSTANTS.apiResponses.ENTITY_TYPE_CREATION_FAILED)
					error.status = HTTP_STATUS_CODE.bad_request.status
					throw error
				}
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
	 * Bulk update Entity Types.
	 * @api {POST} v1/entityTypes/bulkUpdate API by uploading CSV
	 * @apiVersion 1.0.0
	 * @apiName bulkUpdate
	 * @apiGroup Entities
	 * @apiSampleRequest v1/entityTypes/bulkUpdate
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @apiParamExample {json} Response:
	 * @param {Object} req -request data.
	 * @returns {CSV} Bulk update entity Types data.
	 */
	async bulkUpdate(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Parse CSV data from uploaded file
				let entityTypesCSVData = await csv().fromString(req.files.entityTypes.data.toString())

				// Check if CSV data is valid and contains entity types
				if (!entityTypesCSVData || entityTypesCSVData.length < 1) {
					throw CONSTANTS.apiResponses.ENTITY_TYPE_NOT_UPDATED
				}

				// Call 'entityTypesHelper.bulkUpdate' to update multiple entity types from CSV data and user details
				let newEntityTypeData = await entityTypesHelper.bulkUpdate(entityTypesCSVData, req.userDetails)

				// Check if entity types were updated successfully
				if (newEntityTypeData.length > 0) {
					const fileName = `EntityType-Upload`
					let fileStream = new FileStream(fileName)
					let input = fileStream.initStream()

					// Push each updated entity type into the file stream for processing
					;(async function () {
						await fileStream.getProcessorPromise()
						return resolve({
							isResponseAStream: true,
							fileNameWithPath: fileStream.fileNameWithPath(),
						})
					})()

					await Promise.all(
						newEntityTypeData.map(async (entityType) => {
							input.push(entityType)
						})
					)

					input.push(null)
				} else {
					throw CONSTANTS.apiResponses.ENTITY_TYPE_NOT_UPDATED
				}
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

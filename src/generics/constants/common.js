/**
 * name : common.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : All common messages.
 */

module.exports = {
	ACTIVE_STATUS: 'ACTIVE',
	INTERNAL_ACCESS_URLS: [
		'/entityTypes/bulkCreate',
		'/entityTypes/bulkUpdate',
		'/entityTypes/find',
		'/entities/bulkCreate',
		'/entities/bulkUpdate',
		'/entities/add',
		'/entities/update',
		'/entityTypes/create',
		'/entityTypes/update',
		'/entities/find',
		'/userRoleExtension/find',
		'/userRoleExtension/create',
		'/userRoleExtension/update',
		'/entities/createMappingCsv',
		'/admin/createIndex',
	],
	SYSTEM: 'SYSTEM',
	SUCCESS: 'SUCCESS',
	FAILURE: 'FAILURE',
	CACHE_TTL: '43200',
	PROFILE_CONFIG_FORM_KEY: 'profileConfig_v2',
	GET_METHOD: 'GET',
	ENTITYTYPE: 'entityType',
	GROUPS: 'groups',
	AUTH_METHOD: {
		NATIVE: 'native',
		KEYCLOAK_PUBLIC_KEY: 'keycloak_public_key',
	},
	ENGLISH_LANGUGE_CODE: 'en',
	GUEST_URLS: ['/entities/details'],
}

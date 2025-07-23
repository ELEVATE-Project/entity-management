/**
 * name : deletionAuditLogs.js.
 * author : Mallanagouda R Biradar
 * created-date : 23-July-2025
 * Description : Schema for entities.
 */

module.exports = {
	name: 'deletionAuditLogs',
	schema: {
		entityId: {
			type: 'ObjectId',
			index: true,
			unique: true,
		},
		deletedBy: {
			type: String,
			default: 'SYSTEM',
			index: true,
		},
		deletedAt: {
			type: String,
			default: 'SYSTEM',
			index: true,
		},
		createdBy: {
			type: String,
			default: 'SYSTEM',
			index: true,
		},
		updatedBy: {
			type: String,
			default: 'SYSTEM',
		},
	},
}

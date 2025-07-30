# Entity Delete API – Admin Controlled Deletion with Recursive Support

## Overview

This API allows **admin users** to delete a specific entity (like a state, district, or block) either independently or along with all its nested child entities. This operation helps maintain hierarchical consistency across the system.

---

## 🔐 Authorization

Only users with valid **admin-auth-token** are authorized to perform this operation.

---

## 🛠️ API Endpoint

```http
DELETE /entity-management/v1/admin/deleteEntity/:id?allowRecursiveDelete=true
```

---

## 🧾 Parameters

| Parameter              | Type    | Description                                                                                                                                           |
| ---------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `:id`                  | String  | ID of the entity to delete                                                                                                                            |
| `allowRecursiveDelete` | Boolean | If `true`, deletes this entity and all its children. If `false`Delete only the specified entity.Remove that from higher entity groups as well `false` |

---

## 🧩 Headers

-   `content-type: application/json`
-   `internal-access-token`: Internal gateway access token
-   `x-auth-token`: Logged-in admin JWT token
-   `admin-auth-token`: Admin role token
-   `tenantId`: Tenant identifier (e.g., `shikshalokam`)
-   `orgid`: Organization ID (e.g., `SoT`)

---

## 📤 Example cURL

```bash
curl --location --request POST 'http://localhost:5001/entity-management/v1/admin/deleteEntity/6825950197b5680013e6a17c?allowRecursiveDelete=true' \
--header 'content-type: application/json' \
--header 'internal-access-token: 8wE*tM*y(5)' \
--header 'x-auth-token: <JWT-TOKEN>' \
--header 'admin-auth-token: rwwee3$123' \
--header 'tenantId: shikshalokam' \
--header 'orgid: SoT'
```

---

## ✅ Success Response

```json
{
	"message": "ENTITIES_DELETED_SUCCESSFULLY",
	"status": 200,
	"result": {
		"deletedEntitiesCount": 33,
		"deletedEntities": ["68230cdb4e2812081f342809", "68230cdb4e2812081f342808", "...", "6825950197b5680013e6a17c"]
	}
}
```

---

## 🧾 Notes

-   If `allowRecursiveDelete` is `true`, the API will:
    -   Identify and delete all nested child entities of the provided ID.
    -   Remove entity references from parent entities.
    -   Ensure all deletions are broadcasted to analytics (Metabase) via Kafka.
    -   Kafka Topic: `RESOURCE_DELETION_TOPIC`
    -   Kafka Payload Format:

```json
{
  "entity": "resource",
  "type": "entity",
  "eventType": "delete",
  "entityId": "<id>",
  "deleted_By": <userId>,
  "organization_id": <orgId>,
  "tenant_code": "<tenantCode>"
}
```

-   Deletion history is stored in `deletionAuditLogs` with:
    -   `entityId`
    -   `deletedBy`
    -   `deletedAt`

---

## ❗ Error Handling

| Scenario          | Status Code | Message          |
| ----------------- | ----------- | ---------------- |
| Entity not found  | 400         | ENTITY_NOT_FOUND |
| Unauthorized user | 403         | ACCESS_DENIED    |
| Deletion failed   | 500         | DELETION_FAILED  |

---

_Shared with team for integration/testing. Last updated: 2025-07-30_

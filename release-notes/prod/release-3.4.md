# 🚀 Entity-Management-Service Release 3.4.0 

## ✨ Features

-   **[1558] DELETE API in Entity Management** – Introduced a new DELETE API in the Entity Management module to enable removal of entities from the system.
-   **Health Check** – Introduced a health check feature with relevant API endpoints for system monitoring.

---

## 🐞 Bug Fixes

-   N/A for this release.

---

## 🔄 Migration Instructions

Execute the following data migration scripts after deployment:

-   `migrations/normalizeOrgIdInCollections/normalizeOrgIdInCollections.js` – Normalize `orgId/orgIds` fields in collections.

---

👨‍💻 **Service:** Entity Management Service  
🏷️ **Version:** 3.4.0

# 🚀 Tenant Migration Script

This script performs a **complete tenant data migration** between environments.

It handles:

-   🔐 Authentication (Admin / Account login)
-   📦 EntityTypes Migration
-   🏢 Entities Migration
-   🔁 Group Fixing
-   📊 Detailed Logging & Counts
-   ❌ Missed Records Tracking

---

# ⚠️ Important

> ✅ Make sure `input.json` is filled with ALL required keys before running the script.  
> ❌ Missing values (tenantId, orgId, login credentials, etc.) may cause the migration to fail.

---

# 📌 Migration Phases

## Phase 1 – Copy EntityTypes

-   Copies all EntityTypes
-   Tracks:
    -   Total Count
    -   Successfully Migrated
    -   Skipped / Missed (`_id` issues)

## Phase 2 – Copy Entities

-   Copies Entities in **BATCHES**
-   Logs:
    -   Total
    -   Migrated
    -   Missed

## Phase 3 – Fix Groups

-   Updates group mappings using **bulkWrite**
-   Uses batched updates for performance
-   Logs:
    -   Updated Count
    -   Skipped Count

---

# 🛠️ Features

-   ✅ BulkWrite for performance
-   ✅ Batch processing
-   ✅ Detailed migration summary
-   ✅ Logs missed records
-   ✅ Optimized for large datasets

---

# 📂 Project Structure

```
src/
│
└── migrations/
    │
    └── tenantMigration/
        ├── migration.js
        ├── input.json
        └── README.md
```

---

# ⚙️ Configuration (input.json)

```json
{
	"loginCredentails": {
		"createrUserName": "admin@example.com",
		"createrPassword": "password",
		"createrType": "Admin",
		"origin": "https://your-domain.com"
	},
	"tenantMappingConfig": {
		"currentTenantId": "OLD_TENANT_ID",
		"newTenantId": "NEW_TENANT_ID",
		"newOrgId": "NEW_ORG_ID"
	}
}
```

---

# ▶️ How To Run (Normal Execution)

From project root:

```bash
cd src/migrations/tenantMigration
node migration.js
```

---

# ▶️ Run Using PM2

Since PM2 is already installed and the file is inside:

```
src/migrations/tenantMigration
```

### Step 1: Navigate to migration folder

```bash
cd /opt/backend/deployment/entity-management/src/migrations/tenantMigration
```

### Step 2: Run the migration

```bash
node migration.js
```

---

# ▶️ Run Using Docker

If the service is running inside Docker, follow these steps.

## Step 1: Find Container Name

```bash
docker ps
```

Example:

```
CONTAINER ID   IMAGE                  NAME
a1b2c3d4e5f6   entity-management      entity-management-service
```

## Step 2: Enter Container

```bash
docker exec -it entity-management-service bash
```

> Replace `entity-management-service` with your actual container name.

## Step 3: Navigate to Migration Folder

```bash
cd /app/src/migrations/tenantMigration
```

(Adjust `/app` if your container root path is different.)

## Step 4: Run Migration

```bash
node migration.js
```

---

# 📊 Sample Output

```
==============================
 MIGRATION STARTED
==============================

🔐 Logging in...
✅ Login successful. userId: 1
🔌 Connecting to MongoDB...
✅ Connected to DB: elevate-entity

📊 Old EntityTypes: 24
📊 Old Entities: 71539

🚀 Phase 1 - Copying EntityTypes...
✅ Phase 1 Completed (Inserted: 24/24)

🚀 Phase 2 - Copying Entities...
   Processed 1000/71539
   Processed 2000/71539
   Processed 3000/71539
    .....
   Processed 10000/71539

   Processed 71000/71539
✅ Phase 2 Completed (Inserted: 71539/71539)

🚀 Phase 3 - Fixing Groups...
✅ Phase 3 Completed

=================================================
MIGRATION SUMMARY
=================================================
EntityTypes: 24/24
Entities: 71539/71539
Skipped (Missing Type): 0
Skipped TargetedEntityType Mappings: 0
Skipped Group Mappings: 50
=================================================
🎉 MIGRATION COMPLETED SUCCESSFULLY


```

---

# 🛑 Troubleshooting

If you face native module errors (like `ERR_DLOPEN_FAILED`):

```bash
rm -rf node_modules
npm install
```

Or inside Docker:

```bash
npm rebuild
```

---

# 🏁 Final Notes

-   Always verify:
    -   `input.json` values
    -   `.env` variables
    -   MongoDB connection
    -   Target tenant has NO existing data
-   Recommended to run in non-production first
-   Take DB backup before running migration

---

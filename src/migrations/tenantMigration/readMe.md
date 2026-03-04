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

# 📌 Migration Phases

## Phase 1 – Copy EntityTypes

-   Copies all EntityTypes
-   Tracks:
    -   Total Count
    -   Successfully Migrated
    -   Skipped / Missed (\_id issues)

## Phase 2 – Copy Entities

-   Copies Entities in BATCHES
-   Logs:
    -   Total
    -   Migrated
    -   Missed

## Phase 3 – Fix Groups

-   Updates group mappings in bulk
-   Uses batched updates
-   Logs:
    -   Updated Count
    -   Skipped Count

---

# 🛠️ Features

✅ BulkWrite for performance  
✅ Detailed migration summary  
✅ Logs missed `_id` records  
✅ Optimized for large datasets

---

# 📂 Project Structure

```
migration/
│
├── migration.js
├── config.json
└── README.md
```

---

# ⚙️ Configuration (config.json)

```json
{
	"BASE_URL": "https://your-domain.com",
	"mongoUri": "mongodb://localhost:27017",
	"dbName": "elevate-entity",
	"loginCredentails": {
		"email": "admin@example.com",
		"password": "password",
		"createrType": "Admin"
	}
}
```

# ▶️ How To Run

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
✅ Connected to DB: qadb

🚀 Phase 1 - Copying EntityTypes...
Total EntityTypes: 12
Migrated: 12
Missed: 0
✅ Phase 1 Completed

🚀 Phase 2 - Copying Entities...
Total Entities: 84231
Migrated: 84200
Missed: 31
✅ Phase 2 Completed

🚀 Phase 4 - Fixing Groups...
Total Groups Updated: 84200
Missed Updates: 0
✅ Phase 4 Completed

🎉 MIGRATION COMPLETED SUCCESSFULLY
```

# Entity Management Service - Release 3.3.13.2

## 🐞 Bug Fixes

-   **Kafka Health Issue** – Fixed failure occurring in kafka health checks for service when multiple instances are deployed.

-   **Entity Details API Fix** – Fixed an issue where data with externalId of length 12 was incorrectly treated as a MongoDB ObjectId.

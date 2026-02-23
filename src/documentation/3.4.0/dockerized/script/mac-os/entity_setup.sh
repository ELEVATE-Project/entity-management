#!/bin/bash
set -e

# -----------------------------
# Logging function
# -----------------------------
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a setup_log.txt
}

# -----------------------------
log "Checking Docker availability..."
if ! command -v docker >/dev/null 2>&1; then
    echo "❌ Docker is not installed. Install Docker Desktop for Mac first."
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi
log "Docker is installed and running."

# -----------------------------
# Step 2: Download Docker Compose file
# -----------------------------
log "Downloading Docker Compose file..."
curl -OJL https://raw.githubusercontent.com/ELEVATE-Project/entity-management/refs/heads/main/src/documentation/3.4.0/dockerized/dockerFiles/docker-compose.yml
log "Docker Compose file downloaded."

# -----------------------------
# Step 3: Download environment files
# -----------------------------
log "Downloading environment files..."
curl -L \
    -O https://raw.githubusercontent.com/ELEVATE-Project/entity-management/refs/heads/main/src/documentation/3.4.0/dockerized/envs/entity_management_env
log "Environment files downloaded."


# -----------------------------
# Step 5: docker-compose scripts (mac-safe)
# -----------------------------
log "Downloading docker-compose scripts..."
curl -OJL https://raw.githubusercontent.com/ELEVATE-Project/entity-management/refs/heads/main/src/documentation/3.4.0/dockerized/script/mac-os/docker-compose-up.sh
curl -OJL https://raw.githubusercontent.com/ELEVATE-Project/entity-management/refs/heads/main/src/documentation/3.4.0/dockerized/script/mac-os/docker-compose-down.sh
chmod +x docker-compose-down.sh
chmod +x docker-compose-up.sh

# ---- SAFE patch (command only, filenames untouched)
sed -i '' 's/^docker-compose /docker compose /g' docker-compose-up.sh
sed -i '' 's/^docker-compose /docker compose /g' docker-compose-down.sh
log "docker-compose scripts patched safely."


# -----------------------------
# Step 10: config.json
# -----------------------------
log "Downloading config.json..."
curl -L https://raw.githubusercontent.com/ELEVATE-Project/entity-management/refs/heads/main/src/documentation/3.4.0/commonFiles/generics/configFile.json -o config.json
log "config.json downloaded."

# -----------------------------
# Step 11: Start services
# -----------------------------
log "Starting services using docker compose..."
./docker-compose-up.sh
log "Docker services started successfully."

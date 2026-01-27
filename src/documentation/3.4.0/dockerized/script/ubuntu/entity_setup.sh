#!/bin/bash

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> setup_log.txt
}

# Step 1: Download Docker Compose file
log "Downloading Docker Compose file..."
curl -OJL https://raw.githubusercontent.com/ELEVATE-Project/entity-management/refs/heads/dockerSetup/src/documentation/3.4.0/dockerized/dockerFiles/docker-compose.yml
log "Docker Compose file downloaded."

# Step 2: Download environment files
log "Downloading environment files..."
curl -L \
    -O https://raw.githubusercontent.com/ELEVATE-Project/entity-management/refs/heads/dockerSetup/src/documentation/3.4.0/dockerized/envs/entity_management_env \
log "Environment files downloaded."


# Step 6: Download additional scripts
log "Downloading docker-compose scripts..."
curl -OJL https://raw.githubusercontent.com/ELEVATE-Project/entity-management/refs/heads/dockerSetup/src/documentation/3.4.0/dockerized/script/ubuntu/docker-compose-down.sh
curl -OJL https://raw.githubusercontent.com/ELEVATE-Project/entity-management/refs/heads/dockerSetup/src/documentation/3.4.0/dockerized/script/ubuntu/docker-compose-down.sh
log "docker-compose scripts downloaded."

# Step 7: Make the scripts executable
log "Making docker-compose scripts executable..."
chmod +x docker-compose-up.sh
chmod +x docker-compose-down.sh
log "Made docker-compose scripts executable."

# Install MongoDB driver (usually needed if connecting directly to MongoDB/Citus)
npm install mongodb

# Install Mongoose (Object Data Modeling library, if the scripts use it)
npm install mongoose

log "Downloading config.json file..."
curl -L https://raw.githubusercontent.com/ELEVATE-Project/entity-management/refs/heads/dockerSetup/src/documentation/3.4.0/commonFiles/configFile.json -o config.json
log "config.json file is downloaded."

# Step 13: Run docker-compose-up.sh script
log "Running docker-compose-up.sh script..."
./docker-compose-up.sh
log "docker-compose-up.sh script executed."

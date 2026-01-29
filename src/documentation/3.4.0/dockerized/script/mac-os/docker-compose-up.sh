#!/bin/bash

# Get the directory of the shell script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Set environment variables
export entity_management_env="$SCRIPT_DIR/entity_management_env"

# Run docker compose
docker compose -f "$SCRIPT_DIR/docker-compose.yml" up

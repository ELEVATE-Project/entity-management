@echo off

rem Set environment variables
set "entity_management_env=%cd%\entity_management_env"

rem Run docker-compose
docker-compose -f docker-compose.yml up

rem Optionally, clear environment variables after use
set "entity_management_env="

pause
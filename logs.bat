@echo off
if "%1"=="" (
    docker compose -f docker-compose.minimal.yml logs -f
) else (
    docker compose -f docker-compose.minimal.yml logs -f %1
)

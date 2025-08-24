@echo off
echo Stopping URL Shortener infrastructure...
docker compose -f docker-compose.minimal.yml down
echo Services stopped.

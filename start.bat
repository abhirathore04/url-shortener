@echo off
echo Starting URL Shortener infrastructure...
docker compose -f docker-compose.minimal.yml up -d
echo.
echo Services starting...
timeout /t 10 /nobreak >nul
docker compose -f docker-compose.minimal.yml ps
echo.
echo API: http://localhost:8080
echo Health: http://localhost:8080/health
echo MongoDB: localhost:27017

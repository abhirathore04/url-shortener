@echo off
REM Docker Management Scripts for URL Shortener

if "%1"=="" goto help

if "%1"=="build" goto build
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="logs" goto logs
if "%1"=="health" goto health
if "%1"=="stats" goto stats
if "%1"=="cleanup" goto cleanup

:build
echo Building containers...
docker compose -f docker-compose.minimal.yml build
echo Build complete!
goto end

:start
echo Starting services...
docker compose -f docker-compose.minimal.yml --env-file .env.docker up -d
echo Services started!
echo API: http://localhost:8080
echo MongoDB UI: http://localhost:8081 (with --profile development)
goto end

:stop
echo Stopping services...
docker compose -f docker-compose.minimal.yml down
echo Services stopped!
goto end

:restart
call :stop
timeout /t 3 /nobreak >nul
call :start
goto end

:logs
if "%2"=="" (
    docker compose -f docker-compose.minimal.yml logs -f
) else (
    docker compose -f docker-compose.minimal.yml logs -f %2
)
goto end

:health
echo Checking service health...
curl -s http://localhost:8080/health
echo.
echo.
curl -s http://localhost:8080/
goto end

:stats
echo Container resource usage:
docker stats --no-stream
goto end

:cleanup
echo WARNING: This removes all containers, volumes, and images!
set /p confirm=Continue? (y/N): 
if /i "%confirm%"=="y" (
    docker compose -f docker-compose.minimal.yml down -v --remove-orphans
    docker system prune -f
    echo Cleanup complete!
)
goto end

:help
echo Docker Management Commands:
echo.
echo   build     - Build all containers
echo   start     - Start all services
echo   stop      - Stop all services  
echo   restart   - Restart all services
echo   logs      - View logs (optional: service name)
echo   health    - Check service health
echo   stats     - Show resource usage
echo   cleanup   - Remove everything (DANGER)
echo.
echo Examples:
echo   %0 start
echo   %0 logs url-shortener
echo   %0 health

:end

@echo off

:: Stop script for DevOps App containers
:: Stops both development and production containers

echo Stopping DevOps App containers...

:: Stop development containers if running
docker compose -f docker-compose.dev.yml ps -q 2>nul | findstr . >nul
if not errorlevel 1 (
    echo    Stopping development containers...
    docker compose -f docker-compose.dev.yml down
    echo    Development containers stopped
)

:: Stop production containers if running
docker compose -f docker-compose.prod.yml ps -q 2>nul | findstr . >nul
if not errorlevel 1 (
    echo    Stopping production containers...
    docker compose -f docker-compose.prod.yml down
    echo    Production containers stopped
)

echo.
echo All containers stopped!

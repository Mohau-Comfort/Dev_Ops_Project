@echo off
setlocal enabledelayedexpansion

:: Development startup script for DevOps App with Neon Local
:: This script starts the application in development mode with Neon Local

echo.
echo Starting DevOps App in Development Mode
echo ===========================================

:: Check if .env.development exists
if not exist .env.development (
    echo ERROR: .env.development file not found!
    echo    Please copy .env.example to .env.development and update with your Neon credentials.
    exit /b 1
)

:: Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo    Please start Docker Desktop and try again.
    exit /b 1
)

:: Create .neon_local directory if it doesn't exist
if not exist .neon_local mkdir .neon_local

:: Create logs directory if it doesn't exist
if not exist logs mkdir logs

echo.
echo Building and starting development containers...
echo    - Neon Local proxy will create an ephemeral database branch
echo    - Application will run with hot reload enabled
echo.

:: Clean up any previous containers
docker compose -f docker-compose.dev.yml down --remove-orphans 2>nul

:: Start Neon Local first
echo Starting Neon Local...
docker compose -f docker-compose.dev.yml up -d neon-local

:: Wait for Neon Local to be healthy
echo Waiting for Neon Local to be ready...
set timeout=60
set elapsed=0

:wait_loop
docker compose -f docker-compose.dev.yml exec -T neon-local pg_isready -h localhost -p 5432 -U neon >nul 2>&1
if not errorlevel 1 goto :db_ready

if !elapsed! geq %timeout% (
    echo ERROR: Neon Local failed to start within %timeout% seconds
    docker compose -f docker-compose.dev.yml logs neon-local
    exit /b 1
)

timeout /t 2 /nobreak >nul
set /a elapsed+=2
echo    Waiting... ^(!elapsed!s^)
goto :wait_loop

:db_ready
echo Neon Local is ready!

:: Run database migrations
echo.
echo Running database migrations...
docker compose -f docker-compose.dev.yml run --rm app npm run db:migrate

:: Start all services
echo.
echo Starting application...
echo.
echo ===========================================
echo    Application: http://localhost:3000
echo    API Docs:    http://localhost:3000/api-docs
echo    Health:      http://localhost:3000/health
echo    Database:    postgres://neon:npg@localhost:5432/neondb
echo ===========================================
echo.
echo Press Ctrl+C to stop the environment
echo.

:: Start all services and attach to logs
docker compose -f docker-compose.dev.yml up --build

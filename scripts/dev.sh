#!/bin/bash

# Development startup script for DevOps App with Neon Local
# This script starts the application in development mode with Neon Local

set -e

echo "🚀 Starting DevOps App in Development Mode"
echo "==========================================="

# Check if .env.development exists
if [ ! -f .env.development ]; then
    echo "❌ Error: .env.development file not found!"
    echo "   Please copy .env.example to .env.development and update with your Neon credentials."
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "   Please start Docker Desktop and try again."
    exit 1
fi

# Create .neon_local directory if it doesn't exist
mkdir -p .neon_local

# Create logs directory if it doesn't exist
mkdir -p logs

# Add .neon_local to .gitignore if not already present
if ! grep -q ".neon_local/" .gitignore 2>/dev/null; then
    echo ".neon_local/" >> .gitignore
    echo "✅ Added .neon_local/ to .gitignore"
fi

echo ""
echo "📦 Building and starting development containers..."
echo "   - Neon Local proxy will create an ephemeral database branch"
echo "   - Application will run with hot reload enabled"
echo ""

# Clean up any previous containers
docker compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true

# Start development environment in detached mode first to run migrations
echo "🔄 Starting Neon Local..."
docker compose -f docker-compose.dev.yml up -d neon-local

# Wait for Neon Local to be healthy
echo "⏳ Waiting for Neon Local to be ready..."
timeout=60
elapsed=0
while ! docker compose -f docker-compose.dev.yml exec -T neon-local pg_isready -h localhost -p 5432 -U neon >/dev/null 2>&1; do
    if [ $elapsed -ge $timeout ]; then
        echo "❌ Error: Neon Local failed to start within ${timeout} seconds"
        docker compose -f docker-compose.dev.yml logs neon-local
        exit 1
    fi
    sleep 2
    elapsed=$((elapsed + 2))
    echo "   Waiting... (${elapsed}s)"
done
echo "✅ Neon Local is ready!"

# Run database migrations
echo ""
echo "📜 Running database migrations..."
docker compose -f docker-compose.dev.yml run --rm app npm run db:migrate

# Now start all services and attach to logs
echo ""
echo "🎉 Starting application..."
echo ""
echo "==========================================="
echo "   Application: http://localhost:3000"
echo "   API Docs:    http://localhost:3000/api-docs"
echo "   Health:      http://localhost:3000/health"
echo "   Database:    postgres://neon:npg@localhost:5432/neondb"
echo "==========================================="
echo ""
echo "Press Ctrl+C to stop the environment"
echo ""

# Start all services and attach to logs
docker compose -f docker-compose.dev.yml up --build

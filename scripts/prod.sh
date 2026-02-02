#!/bin/bash

# Production startup script for DevOps App with Neon Cloud
# This script starts the application in production mode

set -e

echo "🚀 Starting DevOps App in Production Mode"
echo "==========================================="

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "   Please copy .env.example to .env.production and update with your production credentials."
    exit 1
fi

# Validate required environment variables
source .env.production

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL is not set in .env.production"
    exit 1
fi

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "dev-jwt-secret-change-in-production" ]; then
    echo "❌ Error: JWT_SECRET must be set to a secure value in production"
    echo "   Generate one with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "   Please start Docker and try again."
    exit 1
fi

echo ""
echo "📦 Building and starting production container..."
echo ""

# Build and start production environment
docker compose -f docker-compose.prod.yml up --build -d

echo ""
echo "✅ Production environment started!"
echo ""
echo "==========================================="
echo "   Application: http://localhost:${PORT:-3000}"
echo "   Health:      http://localhost:${PORT:-3000}/health"
echo "==========================================="
echo ""
echo "To view logs:  docker compose -f docker-compose.prod.yml logs -f"
echo "To stop:       docker compose -f docker-compose.prod.yml down"

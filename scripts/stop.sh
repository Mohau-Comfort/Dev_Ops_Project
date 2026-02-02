#!/bin/bash

# Stop script for DevOps App containers
# Stops both development and production containers

echo "🛑 Stopping DevOps App containers..."

# Stop development containers if running
if docker compose -f docker-compose.dev.yml ps -q 2>/dev/null | grep -q .; then
    echo "   Stopping development containers..."
    docker compose -f docker-compose.dev.yml down
    echo "   ✅ Development containers stopped"
fi

# Stop production containers if running
if docker compose -f docker-compose.prod.yml ps -q 2>/dev/null | grep -q .; then
    echo "   Stopping production containers..."
    docker compose -f docker-compose.prod.yml down
    echo "   ✅ Production containers stopped"
fi

echo ""
echo "✅ All containers stopped!"

#!/bin/bash

# Run all database migrations from HOST machine
# This script calls the migration script inside the Docker container

set -e

echo ""
echo "========================================"
echo "  Running All Database Migrations"
echo "========================================"
echo ""

# Check if backend container is running
if ! docker-compose ps backend | grep -q "Up"; then
    echo "❌ Error: Backend container is not running!"
    echo "Please start it first with: docker-compose up -d"
    exit 1
fi

echo "✅ Backend container is running"
echo ""

echo "Executing migrations inside container..."
echo ""

docker-compose exec backend bash /app/run_migrations.sh

echo ""
echo "✅ All migrations completed successfully!"
echo ""


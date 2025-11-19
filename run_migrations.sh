#!/bin/bash

# Run all database migrations
# This script runs migrations in the correct order

set -e

echo "🔄 Running database migrations..."
echo "=================================="
echo ""

# List of migrations in order
MIGRATIONS=(
    "migrate_add_reconciliation_workflow.py"
    "migrate_add_task_validation_review.py"
    "migrate_add_workflow_support.py"
    "migrate_add_period_files.py"
    "migrate_add_performance_indexes.py"
    "migrate_add_reconciliation_tags.py"
    "migrate_add_task_categories.py"
)

# Run each migration
for migration in "${MIGRATIONS[@]}"; do
    echo "📝 Running: $migration"
    if docker-compose exec -T backend python migrations/$migration; then
        echo "✅ $migration completed"
        echo ""
    else
        echo "❌ $migration failed"
        echo "⚠️  Stopping migration process"
        exit 1
    fi
done

echo "🎉 All migrations completed successfully!"
echo ""


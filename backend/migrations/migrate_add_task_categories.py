#!/usr/bin/env python3
"""
Migration: Add task categories for File Cabinet organization

This migration adds the category field to tasks and task_templates
to enable logical grouping in the File Cabinet.
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from backend.config import settings


def run_migration():
    """Execute the migration."""
    engine = create_engine(settings.database_url)
    
    migration_file = os.path.join(os.path.dirname(__file__), 'add_task_categories.sql')
    
    with open(migration_file, 'r') as f:
        sql = f.read()
    
    with engine.begin() as conn:
        # Execute the entire SQL file
        conn.execute(text(sql))
        print("✓ Migration completed successfully: add_task_categories")
        print("  - Added category field to tasks")
        print("  - Added category field to task_templates")
        print("  - Created indexes for category lookups")
        print("  - Auto-categorized existing tasks based on names")


def rollback_migration():
    """Rollback the migration."""
    engine = create_engine(settings.database_url)
    
    rollback_sql = """
    -- Drop indexes
    DROP INDEX IF EXISTS idx_tasks_category;
    DROP INDEX IF EXISTS idx_task_templates_category;
    
    -- Drop columns
    ALTER TABLE tasks DROP COLUMN IF EXISTS category;
    ALTER TABLE task_templates DROP COLUMN IF EXISTS category;
    """
    
    with engine.begin() as conn:
        conn.execute(text(rollback_sql))
        print("✓ Rollback completed successfully: add_task_categories")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Add task categories migration')
    parser.add_argument('--rollback', action='store_true', help='Rollback the migration')
    
    args = parser.parse_args()
    
    if args.rollback:
        rollback_migration()
    else:
        run_migration()


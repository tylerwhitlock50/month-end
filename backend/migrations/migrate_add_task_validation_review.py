#!/usr/bin/env python3
"""
Migration: Add task type, validation fields, and review tracking

Run this script to add:
- TaskType enum (prep/validation)
- Task validation fields
- Review tracking fields
- Trial balance is_reviewed flag
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from backend.database import engine


def run_migration():
    """Execute the migration SQL"""
    print("Starting migration: add_task_validation_and_review_fields")
    
    # Read the SQL file
    sql_file = os.path.join(
        os.path.dirname(__file__),
        'add_task_validation_and_review_fields.sql'
    )
    
    with open(sql_file, 'r') as f:
        sql_content = f.read()
    
    with engine.begin() as conn:
        try:
            # Execute the entire SQL script
            conn.execute(text(sql_content))
            print("✓ Migration completed successfully!")
            print("  - Created task_type enum")
            print("  - Added task_type to task_templates")
            print("  - Added validation fields to tasks")
            print("  - Added review tracking to tasks")
            print("  - Added is_reviewed to trial_balance_accounts")
            print("  - Created performance indexes")
        except Exception as e:
            print(f"✗ Migration failed: {e}")
            raise


if __name__ == "__main__":
    run_migration()


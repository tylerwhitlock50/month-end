#!/usr/bin/env python3
"""
Rollback: Remove task validation and review fields

This script removes all changes from add_task_validation_and_review_fields
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from backend.database import engine


def rollback_migration():
    """Rollback the migration"""
    print("Rolling back migration: add_task_validation_and_review_fields")
    
    with engine.begin() as conn:
        try:
            # Drop indexes
            print("  - Dropping indexes...")
            conn.execute(text("DROP INDEX IF EXISTS idx_tasks_task_type;"))
            conn.execute(text("DROP INDEX IF EXISTS idx_tasks_reviewed_by_id;"))
            conn.execute(text("DROP INDEX IF EXISTS idx_tasks_validation_matches;"))
            conn.execute(text("DROP INDEX IF EXISTS idx_trial_balance_accounts_is_reviewed;"))
            
            # Drop columns from tasks
            print("  - Removing columns from tasks...")
            conn.execute(text("""
                ALTER TABLE tasks 
                DROP COLUMN IF EXISTS task_type,
                DROP COLUMN IF EXISTS reviewed_by_id,
                DROP COLUMN IF EXISTS reviewed_at,
                DROP COLUMN IF EXISTS validation_amount,
                DROP COLUMN IF EXISTS validation_difference,
                DROP COLUMN IF EXISTS validation_matches,
                DROP COLUMN IF EXISTS validation_notes;
            """))
            
            # Drop column from task_templates
            print("  - Removing column from task_templates...")
            conn.execute(text("ALTER TABLE task_templates DROP COLUMN IF EXISTS task_type;"))
            
            # Drop column from trial_balance_accounts
            print("  - Removing column from trial_balance_accounts...")
            conn.execute(text("ALTER TABLE trial_balance_accounts DROP COLUMN IF EXISTS is_reviewed;"))
            
            # Drop the enum type
            print("  - Dropping task_type enum...")
            conn.execute(text("DROP TYPE IF EXISTS task_type;"))
            
            print("✓ Rollback completed successfully!")
        except Exception as e:
            print(f"✗ Rollback failed: {e}")
            raise


if __name__ == "__main__":
    rollback_migration()



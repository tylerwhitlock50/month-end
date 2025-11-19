#!/usr/bin/env python3
"""
Migration: Add reconciliation_tag to trial_balance_accounts

This migration adds the reconciliation_tag field to enable automatic
extraction of reconciliation values from Excel/CSV files.
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
    
    migration_file = os.path.join(os.path.dirname(__file__), 'add_reconciliation_tags.sql')
    
    with open(migration_file, 'r') as f:
        sql = f.read()
    
    with engine.begin() as conn:
        # Execute the entire SQL file
        conn.execute(text(sql))
        print("✓ Migration completed successfully: add_reconciliation_tags")


def rollback_migration():
    """Rollback the migration."""
    engine = create_engine(settings.database_url)
    
    rollback_sql = """
    -- Drop index
    DROP INDEX IF EXISTS idx_trial_balance_accounts_reconciliation_tag;
    
    -- Drop unique constraint
    ALTER TABLE trial_balance_accounts 
    DROP CONSTRAINT IF EXISTS trial_balance_accounts_reconciliation_tag_key;
    
    -- Drop column
    ALTER TABLE trial_balance_accounts 
    DROP COLUMN IF EXISTS reconciliation_tag;
    """
    
    with engine.begin() as conn:
        conn.execute(text(rollback_sql))
        print("✓ Rollback completed successfully: add_reconciliation_tags")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Add reconciliation_tag migration')
    parser.add_argument('--rollback', action='store_true', help='Rollback the migration')
    
    args = parser.parse_args()
    
    if args.rollback:
        rollback_migration()
    else:
        run_migration()


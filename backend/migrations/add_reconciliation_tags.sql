-- Migration: Add reconciliation_tag to trial_balance_accounts
-- This migration adds support for automatic reconciliation value extraction from Excel/CSV files
-- Each account gets a unique tag that can be embedded in reconciliation spreadsheets

-- Add reconciliation_tag column to trial_balance_accounts table
DO $$ BEGIN
    ALTER TABLE trial_balance_accounts ADD COLUMN reconciliation_tag VARCHAR(50);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Generate tags for existing accounts using format: TB-{period_id}-{account_number}
-- This uses the trial balance's period_id and the account number
UPDATE trial_balance_accounts tba
SET reconciliation_tag = 'TB-' || tb.period_id || '-' || tba.account_number
FROM trial_balances tb
WHERE tba.trial_balance_id = tb.id
AND tba.reconciliation_tag IS NULL;

-- Make reconciliation_tag unique after populating existing records
DO $$ BEGIN
    ALTER TABLE trial_balance_accounts 
    ADD CONSTRAINT trial_balance_accounts_reconciliation_tag_key 
    UNIQUE (reconciliation_tag);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Create index for faster tag lookups
DO $$ BEGIN
    CREATE INDEX idx_trial_balance_accounts_reconciliation_tag 
    ON trial_balance_accounts(reconciliation_tag);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;


-- Migration: Add task type, validation fields, and review tracking
-- This migration adds support for:
-- 1. Task types (prep vs validation tasks)
-- 2. Validation amount tracking for validation tasks
-- 3. Review tracking fields
-- 4. Trial balance account reviewed flag

-- Create TaskType enum (if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE task_type AS ENUM ('prep', 'validation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add task_type to task_templates table
DO $$ BEGIN
    ALTER TABLE task_templates ADD COLUMN task_type task_type DEFAULT 'prep' NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add task_type and validation fields to tasks table
DO $$ BEGIN
    ALTER TABLE tasks ADD COLUMN task_type task_type DEFAULT 'prep' NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE tasks ADD COLUMN reviewed_by_id INTEGER REFERENCES users(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE tasks ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE tasks ADD COLUMN validation_amount NUMERIC(18, 2);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE tasks ADD COLUMN validation_difference NUMERIC(18, 2);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE tasks ADD COLUMN validation_matches BOOLEAN;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE tasks ADD COLUMN validation_notes TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add is_reviewed flag to trial_balance_accounts table
DO $$ BEGIN
    ALTER TABLE trial_balance_accounts ADD COLUMN is_reviewed BOOLEAN DEFAULT FALSE NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create indexes for better query performance (if they don't exist)
DO $$ BEGIN
    CREATE INDEX idx_tasks_task_type ON tasks(task_type);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_tasks_reviewed_by_id ON tasks(reviewed_by_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_tasks_validation_matches ON tasks(validation_matches) WHERE validation_matches IS NOT NULL;
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_trial_balance_accounts_is_reviewed ON trial_balance_accounts(is_reviewed);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;


-- Migration: Add task categories for File Cabinet organization
-- This migration adds support for organizing tasks into logical categories
-- for better file organization in the File Cabinet

-- Add category column to task_templates table
DO $$ BEGIN
    ALTER TABLE task_templates ADD COLUMN category VARCHAR(100);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add category column to tasks table
DO $$ BEGIN
    ALTER TABLE tasks ADD COLUMN category VARCHAR(100);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create index for faster category lookups
DO $$ BEGIN
    CREATE INDEX idx_tasks_category ON tasks(category);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_task_templates_category ON task_templates(category);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Set default categories based on task names (best effort)
UPDATE tasks
SET category = CASE
    WHEN LOWER(name) LIKE '%cash%' OR LOWER(name) LIKE '%bank%' THEN 'Cash & Bank'
    WHEN LOWER(name) LIKE '%receivable%' OR LOWER(name) LIKE '%ar %' OR LOWER(name) LIKE '% ar%' THEN 'Accounts Receivable'
    WHEN LOWER(name) LIKE '%inventory%' OR LOWER(name) LIKE '%stock%' THEN 'Inventory'
    WHEN LOWER(name) LIKE '%payable%' OR LOWER(name) LIKE '%ap %' OR LOWER(name) LIKE '% ap%' THEN 'Accounts Payable'
    WHEN LOWER(name) LIKE '%fixed asset%' OR LOWER(name) LIKE '%depreciation%' OR LOWER(name) LIKE '%ppe%' THEN 'Fixed Assets'
    WHEN LOWER(name) LIKE '%accrue%' OR LOWER(name) LIKE '%accrual%' THEN 'Accruals'
    WHEN LOWER(name) LIKE '%revenue%' OR LOWER(name) LIKE '%sales%' THEN 'Revenue'
    WHEN LOWER(name) LIKE '%expense%' OR LOWER(name) LIKE '%cost%' THEN 'Expenses'
    WHEN LOWER(name) LIKE '%prepaid%' OR LOWER(name) LIKE '%deferred%' THEN 'Prepaids & Deferrals'
    WHEN LOWER(name) LIKE '%tax%' THEN 'Tax'
    WHEN LOWER(name) LIKE '%payroll%' OR LOWER(name) LIKE '%salary%' OR LOWER(name) LIKE '%wage%' THEN 'Payroll'
    ELSE 'General'
END
WHERE category IS NULL;

-- Set default categories for templates based on template names
UPDATE task_templates
SET category = CASE
    WHEN LOWER(name) LIKE '%cash%' OR LOWER(name) LIKE '%bank%' THEN 'Cash & Bank'
    WHEN LOWER(name) LIKE '%receivable%' OR LOWER(name) LIKE '%ar %' OR LOWER(name) LIKE '% ar%' THEN 'Accounts Receivable'
    WHEN LOWER(name) LIKE '%inventory%' OR LOWER(name) LIKE '%stock%' THEN 'Inventory'
    WHEN LOWER(name) LIKE '%payable%' OR LOWER(name) LIKE '%ap %' OR LOWER(name) LIKE '% ap%' THEN 'Accounts Payable'
    WHEN LOWER(name) LIKE '%fixed asset%' OR LOWER(name) LIKE '%depreciation%' OR LOWER(name) LIKE '%ppe%' THEN 'Fixed Assets'
    WHEN LOWER(name) LIKE '%accrue%' OR LOWER(name) LIKE '%accrual%' THEN 'Accruals'
    WHEN LOWER(name) LIKE '%revenue%' OR LOWER(name) LIKE '%sales%' THEN 'Revenue'
    WHEN LOWER(name) LIKE '%expense%' OR LOWER(name) LIKE '%cost%' THEN 'Expenses'
    WHEN LOWER(name) LIKE '%prepaid%' OR LOWER(name) LIKE '%deferred%' THEN 'Prepaids & Deferrals'
    WHEN LOWER(name) LIKE '%tax%' THEN 'Tax'
    WHEN LOWER(name) LIKE '%payroll%' OR LOWER(name) LIKE '%salary%' OR LOWER(name) LIKE '%wage%' THEN 'Payroll'
    ELSE 'General'
END
WHERE category IS NULL;


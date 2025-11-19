# Database Migration Guide

## Quick Start - Run All Migrations

### On Windows:
```powershell
.\run_migrations.bat
```

### On Linux/Mac:
```bash
chmod +x run_migrations.sh
./run_migrations.sh
```

### On Server (Docker):
```bash
# If you're SSH'd into your server, just run:
./run_migrations.sh

# Or manually:
docker-compose exec backend python migrations/migrate_add_reconciliation_workflow.py
docker-compose exec backend python migrations/migrate_add_task_validation_review.py
docker-compose exec backend python migrations/migrate_add_workflow_support.py
docker-compose exec backend python migrations/migrate_add_period_files.py
docker-compose exec backend python migrations/migrate_add_performance_indexes.py
docker-compose exec backend python migrations/migrate_add_reconciliation_tags.py
docker-compose exec backend python migrations/migrate_add_task_categories.py
```

## What Each Migration Does

### 1. `migrate_add_reconciliation_workflow.py`
- Adds trial balance reconciliation workflow support
- Creates validation and attachment tables

### 2. `migrate_add_task_validation_review.py`
- Adds validation fields to tasks
- Adds review/approval workflow columns

### 3. `migrate_add_workflow_support.py`
- Adds position tracking for workflow builder
- Enables visual task dependency management

### 4. `migrate_add_period_files.py`
- Enables file uploads at period level
- Separate from task-specific files

### 5. `migrate_add_performance_indexes.py`
- Adds database indexes for faster queries
- Optimizes common lookups

### 6. `migrate_add_reconciliation_tags.py`
- Adds reconciliation tags to trial balance accounts
- Enables automatic value extraction from Excel/CSV
- **IMPORTANT**: Generates unique tags for all existing accounts

### 7. `migrate_add_task_categories.py` ⭐ NEW
- Adds category field to tasks and templates
- Auto-categorizes existing tasks by name patterns
- Enables File Cabinet folder organization

## Individual Migration Commands

If you need to run a specific migration:

```bash
# Run one migration
docker-compose exec backend python migrations/migrate_add_task_categories.py

# Rollback one migration (if supported)
docker-compose exec backend python migrations/migrate_add_task_categories.py --rollback
```

## Checking Migration Status

```bash
# Check if tables exist
docker-compose exec db psql -U monthend -d monthend -c "\dt"

# Check specific columns
docker-compose exec db psql -U monthend -d monthend -c "SELECT column_name FROM information_schema.columns WHERE table_name='tasks';"

# Check task categories
docker-compose exec db psql -U monthend -d monthend -c "SELECT category, COUNT(*) FROM tasks GROUP BY category;"
```

## Troubleshooting

### "Migration already applied"
Some migrations check if changes already exist. This is safe - just means it's already been run.

### "Column already exists"
This means the migration was partially applied. You can usually re-run it safely (migrations use `IF NOT EXISTS` where possible).

### "Permission denied"
Make sure Docker is running and you have permissions:
```bash
sudo chmod +x run_migrations.sh
```

### Starting Fresh
If you want to reset everything:
```bash
# Stop containers
docker-compose down

# Remove volumes (⚠️ DESTROYS ALL DATA)
docker-compose down -v

# Rebuild and setup
./setup.sh
```

## Production Deployment

For deploying to production:

1. **Backup your database first!**
   ```bash
   docker-compose exec db pg_dump -U monthend monthend > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Run migrations**
   ```bash
   ./run_migrations.sh
   ```

3. **Verify**
   ```bash
   # Check that all tables/columns exist
   docker-compose exec backend python -c "from backend.database import engine; from sqlalchemy import inspect; print(inspect(engine).get_table_names())"
   ```

4. **Test the application**
   - Login and check File Cabinet
   - Create a task and verify category field works
   - Upload a file with reconciliation tag

## Migration Order Matters!

Always run migrations in this order:
1. reconciliation_workflow
2. task_validation_review
3. workflow_support
4. period_files
5. performance_indexes
6. reconciliation_tags
7. task_categories ← Latest

The `run_migrations.sh` script handles this automatically.

## Need Help?

- Check `backend/migrations/README.md` for detailed migration documentation
- Each migration file has comments explaining what it does
- Look at the SQL files (e.g., `add_task_categories.sql`) to see exact schema changes


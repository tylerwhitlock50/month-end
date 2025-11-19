@echo off
REM Run all database migrations for Windows
REM This script runs migrations in the correct order

echo Running database migrations...
echo ==================================
echo.

echo Running: migrate_add_reconciliation_workflow.py
docker-compose exec -T backend python migrations/migrate_add_reconciliation_workflow.py
if errorlevel 1 goto error
echo [32mCompleted: migrate_add_reconciliation_workflow.py[0m
echo.

echo Running: migrate_add_task_validation_review.py
docker-compose exec -T backend python migrations/migrate_add_task_validation_review.py
if errorlevel 1 goto error
echo [32mCompleted: migrate_add_task_validation_review.py[0m
echo.

echo Running: migrate_add_workflow_support.py
docker-compose exec -T backend python migrations/migrate_add_workflow_support.py
if errorlevel 1 goto error
echo [32mCompleted: migrate_add_workflow_support.py[0m
echo.

echo Running: migrate_add_period_files.py
docker-compose exec -T backend python migrations/migrate_add_period_files.py
if errorlevel 1 goto error
echo [32mCompleted: migrate_add_period_files.py[0m
echo.

echo Running: migrate_add_performance_indexes.py
docker-compose exec -T backend python migrations/migrate_add_performance_indexes.py
if errorlevel 1 goto error
echo [32mCompleted: migrate_add_performance_indexes.py[0m
echo.

echo Running: migrate_add_reconciliation_tags.py
docker-compose exec -T backend python migrations/migrate_add_reconciliation_tags.py
if errorlevel 1 goto error
echo [32mCompleted: migrate_add_reconciliation_tags.py[0m
echo.

echo Running: migrate_add_task_categories.py
docker-compose exec -T backend python migrations/migrate_add_task_categories.py
if errorlevel 1 goto error
echo [32mCompleted: migrate_add_task_categories.py[0m
echo.

echo [32mAll migrations completed successfully![0m
goto end

:error
echo [31mMigration failed! Stopping.[0m
exit /b 1

:end


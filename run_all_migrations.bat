@echo off
REM Run all database migrations from HOST machine
REM This script calls the migration script inside the Docker container

echo.
echo ========================================
echo   Running All Database Migrations
echo ========================================
echo.

echo Checking if backend container is running...
docker-compose ps backend | findstr "Up" >nul
if errorlevel 1 (
    echo [31mError: Backend container is not running![0m
    echo Please start it first with: docker-compose up -d
    exit /b 1
)

echo [32mBackend container is running[0m
echo.

echo Executing migrations inside container...
echo.

docker-compose exec backend bash /app/run_migrations.sh

if errorlevel 1 (
    echo.
    echo [31mMigrations failed![0m
    exit /b 1
)

echo.
echo [32mAll migrations completed successfully![0m
echo.


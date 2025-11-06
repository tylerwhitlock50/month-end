#!/bin/bash

# Month-End Close Manager Setup Script
# This script helps set up the application quickly

set -e

echo "🚀 Month-End Close Manager Setup"
echo "=================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration"
    echo ""
fi

# Create files directory
echo "📁 Creating files directory..."
mkdir -p files
echo ""

# Build and start containers
echo "🐳 Building Docker containers..."
docker-compose build
echo ""

echo "🚀 Starting services..."
docker-compose up -d
echo ""

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10
echo ""

# Initialize database
echo "🗄️  Initializing database..."
docker-compose exec -T backend python init_db.py --seed
echo ""

# Read port configuration from .env if it exists
FRONTEND_PORT=5173
BACKEND_PORT=8000
if [ -f .env ]; then
    # Extract port values from .env file
    ENV_FRONTEND_PORT=$(grep -E "^FRONTEND_PORT=" .env | cut -d '=' -f2)
    ENV_BACKEND_PORT=$(grep -E "^BACKEND_PORT=" .env | cut -d '=' -f2)
    
    # Use extracted values if they exist
    [ ! -z "$ENV_FRONTEND_PORT" ] && FRONTEND_PORT=$ENV_FRONTEND_PORT
    [ ! -z "$ENV_BACKEND_PORT" ] && BACKEND_PORT=$ENV_BACKEND_PORT
fi

echo "✅ Setup complete!"
echo ""
echo "📊 Access the application:"
echo "   Frontend: http://localhost:$FRONTEND_PORT"
echo "   Backend API: http://localhost:$BACKEND_PORT"
echo "   API Docs: http://localhost:$BACKEND_PORT/docs"
echo ""
echo "🔐 Default login credentials:"
echo "   Email: admin@monthend.com"
echo "   Password: admin123"
echo ""
echo "⚠️  Remember to:"
echo "   1. Change the default password after first login"
echo "   2. Update SECRET_KEY in .env for production"
echo "   3. Configure email/Slack if needed"
echo ""
echo "🎉 Happy closing!"


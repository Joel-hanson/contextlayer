#!/bin/bash

# MCP Bridge Development Environ# Build and start the development environment
echo "🐳 Building and starting Docker containers..."
docker-compose down -v 2>/dev/null || true  # Clean up any existing containers

# Install dependencies first to speed up subsequent builds
echo "📦 Installing dependencies..."
docker-compose build app

docker-compose up -dSetup Script
# This script sets up the complete Docker-based development environment

set -e  # Exit on any error

echo "Setting up MCP Bridge Development Environment"
echo "================================================"

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "Docker and Docker Compose are installed"

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p docker/postgres/data
mkdir -p docker/pgadmin/data
mkdir -p logs

# Set permissions for PostgreSQL data directory
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo chown -R 999:999 docker/postgres/data
fi

echo "Directories created"

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo ".env file created. Please review and update the environment variables if needed."
else
    echo ".env file already exists"
fi

# Build and start the development environment
echo "Building and starting Docker containers..."
docker-compose down -v 2>/dev/null || true  # Clean up any existing containers
docker-compose build
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check if services are running
echo "Checking service status..."

# Check PostgreSQL
if docker-compose exec -T db pg_isready -U mcp_user -d mcp_bridge_db &> /dev/null; then
    echo "PostgreSQL is ready"
else
    echo "PostgreSQL is not ready. Check the logs with: docker-compose logs db"
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
    echo "Redis is ready"
else
    echo "Redis is not ready. Check the logs with: docker-compose logs redis"
fi

# Check if the application is responding
sleep 5
if curl -f http://localhost:3000 &> /dev/null; then
    echo "Application is ready"
else
    echo "Application is starting up. This may take a few more moments..."
fi

echo ""
echo "Setup Complete!"
echo "=================="
echo ""
echo "Your MCP Bridge development environment is ready!"
echo ""
echo "🌐 Application:     http://localhost:3000"
echo "   pgAdmin:        http://localhost:5050"
echo "   - Email:         admin@mcpbridge.com"
echo "   - Password:      admin123"
echo ""
echo "  Useful Commands:"
echo "   Start:           docker-compose up -d"
echo "   Stop:            docker-compose down"
echo "   Logs:            docker-compose logs -f [service]"
echo "   Shell (app):     docker-compose exec app sh"
echo "   Shell (db):      docker-compose exec db psql -U mcp_user -d mcp_bridge_db"
echo ""
echo " For more information, see DOCKER.md"
echo ""
echo "Happy coding!"

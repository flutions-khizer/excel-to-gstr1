#!/bin/bash

# Excel to GSTR-1 Converter - Deployment Script
# This script helps deploy the application to a Linode instance

set -e

echo "🚀 Excel to GSTR-1 Converter - Deployment Script"
echo "=================================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   See DEPLOYMENT.md for installation instructions."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   See DEPLOYMENT.md for installation instructions."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Build and start the application
echo "📦 Building Docker image..."
docker compose build

echo ""
echo "🚀 Starting application..."
docker compose up -d

echo ""
echo "⏳ Waiting for application to start..."
sleep 5

# Check if container is running
if docker compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Application is running!"
    echo ""
    echo "📍 Application URL: http://localhost:3000"
    echo ""
    echo "📋 Useful commands:"
    echo "   - View logs: docker compose logs -f app"
    echo "   - Stop app: docker compose down"
    echo "   - Restart app: docker compose restart"
    echo "   - View status: docker compose ps"
    echo ""
else
    echo ""
    echo "❌ Application failed to start. Check logs with:"
    echo "   docker compose logs app"
    exit 1
fi


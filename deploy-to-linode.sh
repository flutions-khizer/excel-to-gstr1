#!/bin/bash

# Excel to GSTR-1 Converter - Linode Deployment Script
# This script deploys the application to a Linode server via SSH

set -e

echo "🚀 Excel to GSTR-1 Converter - Linode Deployment"
echo "=================================================="
echo ""

# Check for required parameters
if [ -z "$1" ]; then
    echo "Usage: ./deploy-to-linode.sh <linode-ip-or-hostname> [ssh-user] [app-directory]"
    echo ""
    echo "Example: ./deploy-to-linode.sh 192.0.2.1 root /opt/excel-to-gstr1"
    echo ""
    echo "If SSH user is not provided, 'root' will be used."
    echo "If app directory is not provided, '/opt/excel-to-gstr1' will be used."
    exit 1
fi

LINODE_HOST="$1"
SSH_USER="${2:-root}"
APP_DIR="${3:-/opt/excel-to-gstr1}"

echo "📋 Deployment Configuration:"
echo "   Host: $LINODE_HOST"
echo "   User: $SSH_USER"
echo "   Directory: $APP_DIR"
echo ""

# Check if we can connect to the server
echo "🔌 Testing SSH connection..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$SSH_USER@$LINODE_HOST" exit 2>/dev/null; then
    echo "❌ Cannot connect to $SSH_USER@$LINODE_HOST"
    echo "   Please ensure:"
    echo "   1. SSH key is set up or password authentication is enabled"
    echo "   2. Server is accessible"
    echo "   3. Firewall allows SSH (port 22)"
    echo ""
    echo "   You may need to run: ssh-copy-id $SSH_USER@$LINODE_HOST"
    exit 1
fi

echo "✅ SSH connection successful"
echo ""

# Check if Docker is installed on remote server
echo "🐳 Checking Docker installation on remote server..."
if ! ssh "$SSH_USER@$LINODE_HOST" "command -v docker &> /dev/null"; then
    echo "❌ Docker is not installed on the remote server."
    echo "   Please install Docker first. See DEPLOYMENT.md for instructions."
    exit 1
fi

if ! ssh "$SSH_USER@$LINODE_HOST" "command -v docker compose &> /dev/null && docker compose version &> /dev/null || docker-compose version &> /dev/null"; then
    echo "❌ Docker Compose is not installed on the remote server."
    echo "   Please install Docker Compose first. See DEPLOYMENT.md for instructions."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Create app directory on remote server
echo "📁 Creating application directory..."
ssh "$SSH_USER@$LINODE_HOST" "mkdir -p $APP_DIR"
echo "✅ Directory created"
echo ""

# Create a temporary tar archive of the project
echo "📦 Creating deployment package..."
TEMP_TAR=$(mktemp)
tar --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='*.xlsx' \
    --exclude='*.csv' \
    --exclude='*.json' \
    --exclude='sample-data.txt' \
    --exclude='__tests__' \
    -czf "$TEMP_TAR" .

echo "✅ Package created"
echo ""

# Upload the archive to the server
echo "⬆️  Uploading files to server..."
scp "$TEMP_TAR" "$SSH_USER@$LINODE_HOST:/tmp/excel-to-gstr1-deploy.tar.gz"
rm "$TEMP_TAR"
echo "✅ Files uploaded"
echo ""

# Extract and deploy on the server
echo "📂 Extracting files on server..."
ssh "$SSH_USER@$LINODE_HOST" "cd $APP_DIR && tar -xzf /tmp/excel-to-gstr1-deploy.tar.gz && rm /tmp/excel-to-gstr1-deploy.tar.gz"
echo "✅ Files extracted"
echo ""

# Build and start the application
echo "🔨 Building and starting application..."
ssh "$SSH_USER@$LINODE_HOST" "cd $APP_DIR && docker compose down 2>/dev/null || true"
ssh "$SSH_USER@$LINODE_HOST" "cd $APP_DIR && docker compose up -d --build"

echo ""
echo "⏳ Waiting for application to start..."
sleep 5

# Check if container is running
if ssh "$SSH_USER@$LINODE_HOST" "cd $APP_DIR && docker compose ps | grep -q Up"; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📍 Application URL: http://$LINODE_HOST:3000"
    echo ""
    echo "📋 Useful commands:"
    echo "   - View logs: ssh $SSH_USER@$LINODE_HOST 'cd $APP_DIR && docker compose logs -f app'"
    echo "   - Stop app: ssh $SSH_USER@$LINODE_HOST 'cd $APP_DIR && docker compose down'"
    echo "   - Restart app: ssh $SSH_USER@$LINODE_HOST 'cd $APP_DIR && docker compose restart'"
    echo "   - View status: ssh $SSH_USER@$LINODE_HOST 'cd $APP_DIR && docker compose ps'"
    echo ""
else
    echo ""
    echo "⚠️  Application may not have started correctly. Check logs with:"
    echo "   ssh $SSH_USER@$LINODE_HOST 'cd $APP_DIR && docker compose logs app'"
    exit 1
fi


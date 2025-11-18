#!/bin/bash
# deploy-frontend.sh
# Complete deployment script for frontend on web server
# This script is meant to be run ON the web server (gt-omr-web-1)
# Usage: sudo ./deploy-frontend.sh [--skip-deps] [--skip-build]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
LOCAL_ROOT="/opt/exam-system-frontend"
CEPHFS_BASE="/cephfs/exam-system/frontend"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse arguments
SKIP_DEPS=false
SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-deps)
      SKIP_DEPS=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--skip-deps] [--skip-build]"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Exam System Frontend - Complete Deployment Script   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: Please run as root (sudo)${NC}"
    exit 1
fi

# Get server information
HOSTNAME=$(hostname)
SERVER_IP=$(hostname -I | awk '{print $1}')

echo "Server Information:"
echo "  Hostname: $HOSTNAME"
echo "  IP Address: $SERVER_IP"
echo "  Local Root: $LOCAL_ROOT"
echo "  CephFS Base: $CEPHFS_BASE"
echo ""

# Step 1: Install dependencies
if [ "$SKIP_DEPS" = false ]; then
    echo -e "${BLUE}═══ Step 1: Installing Dependencies ═══${NC}"
    
    if [ -f "$SCRIPT_DIR/install-dependencies.sh" ]; then
        bash "$SCRIPT_DIR/install-dependencies.sh"
    else
        echo -e "${YELLOW}Warning: install-dependencies.sh not found${NC}"
        echo "Checking if dependencies are already installed..."
        
        # Check critical dependencies
        MISSING_DEPS=()
        
        if ! command -v node &> /dev/null; then
            MISSING_DEPS+=("node")
        fi
        if ! command -v pnpm &> /dev/null; then
            MISSING_DEPS+=("pnpm")
        fi
        if ! command -v pm2 &> /dev/null; then
            MISSING_DEPS+=("pm2")
        fi
        if ! command -v nginx &> /dev/null; then
            MISSING_DEPS+=("nginx")
        fi
        
        if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
            echo -e "${RED}Error: Missing dependencies: ${MISSING_DEPS[*]}${NC}"
            echo "Please install dependencies manually or provide install-dependencies.sh"
            exit 1
        else
            echo -e "${GREEN}✓ All dependencies are installed${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⊘ Skipping dependency installation${NC}"
fi

echo ""

# Step 2: Setup local directory structure
echo -e "${BLUE}═══ Step 2: Setting up Directory Structure ═══${NC}"

if [ -f "$SCRIPT_DIR/setup-frontend-local.sh" ]; then
    bash "$SCRIPT_DIR/setup-frontend-local.sh"
else
    echo -e "${YELLOW}Warning: setup-frontend-local.sh not found${NC}"
    echo "Creating basic directory structure..."
    
    mkdir -p "$LOCAL_ROOT"/{logs,tmp/{uploads,processing},cache,backups/{configs,releases}}
    mkdir -p "$CEPHFS_BASE"/{releases,shared/{uploads,cache,logs}}
    
    # Create symlink if doesn't exist
    if [ ! -L "$LOCAL_ROOT/current" ]; then
        ln -s "$CEPHFS_BASE/current" "$LOCAL_ROOT/current"
    fi
    
    echo -e "${GREEN}✓ Basic directory structure created${NC}"
fi

echo ""

# Step 3: Verify code is deployed to CephFS
echo -e "${BLUE}═══ Step 3: Verifying Code Deployment ═══${NC}"

if [ ! -d "$CEPHFS_BASE/current" ]; then
    echo -e "${RED}Error: No code found at $CEPHFS_BASE/current${NC}"
    echo "Please run the sync script from the development machine first:"
    echo "  ./scripts/dev-sync-frontend.sh"
    exit 1
fi

# Check for essential files
REQUIRED_FILES=("package.json" "next.config.mjs")
MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$CEPHFS_BASE/current/$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${RED}Error: Missing required files: ${MISSING_FILES[*]}${NC}"
    echo "Please ensure the code is properly synced from development"
    exit 1
fi

echo -e "${GREEN}✓ Code deployment verified${NC}"

# Show current release info
if [ -L "$CEPHFS_BASE/current" ]; then
    CURRENT_RELEASE=$(readlink -f "$CEPHFS_BASE/current")
    echo "  Current release: $CURRENT_RELEASE"
fi

echo ""

# Step 4: Install Node.js dependencies
if [ "$SKIP_BUILD" = false ]; then
    echo -e "${BLUE}═══ Step 4: Installing Node.js Dependencies ═══${NC}"
    
    cd "$CEPHFS_BASE/current"
    
    echo "Running: pnpm install --prod --frozen-lockfile"
    
    # Run as www-data user if possible
    if id "www-data" &>/dev/null; then
        sudo -u www-data pnpm install --prod --frozen-lockfile
    else
        pnpm install --prod --frozen-lockfile
    fi
    
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${YELLOW}⊘ Skipping dependency installation${NC}"
fi

echo ""

# Step 5: Create/Update environment file
echo -e "${BLUE}═══ Step 5: Configuring Environment ═══${NC}"

ENV_FILE="$LOCAL_ROOT/.env.local"

if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Environment file exists: $ENV_FILE${NC}"
    echo "Keeping existing configuration"
else
    echo "Creating environment file..."
    cat > "$ENV_FILE" << EOF
# Production Environment Configuration
# Server: $HOSTNAME ($SERVER_IP)
# Generated: $(date)

NODE_ENV=production
PORT=3000

# API Configuration
NEXT_PUBLIC_API_URL=http://gt-omr-api-1:8000

# Server identification
SERVER_ID=$HOSTNAME
SERVER_IP=$SERVER_IP

# Logging
LOG_LEVEL=info
LOG_DIR=$LOCAL_ROOT/logs

# Cache
CACHE_DIR=$LOCAL_ROOT/cache

# Uploads
UPLOAD_DIR=$LOCAL_ROOT/tmp/uploads
MAX_UPLOAD_SIZE=104857600

# Performance
NODE_OPTIONS=--max-old-space-size=4096
EOF
    
    chmod 600 "$ENV_FILE"
    chown www-data:www-data "$ENV_FILE"
    echo -e "${GREEN}✓ Environment file created${NC}"
fi

# Link env file to current deployment
if [ ! -L "$CEPHFS_BASE/current/.env.local" ]; then
    ln -sf "$ENV_FILE" "$CEPHFS_BASE/current/.env.local"
fi

echo ""

# Step 6: Configure Nginx
echo -e "${BLUE}═══ Step 6: Configuring Nginx ═══${NC}"

if [ -f "$SCRIPT_DIR/configure-nginx.sh" ]; then
    bash "$SCRIPT_DIR/configure-nginx.sh" "_"
else
    echo -e "${YELLOW}Warning: configure-nginx.sh not found${NC}"
    echo "Please configure Nginx manually"
fi

echo ""

# Step 7: Start/Restart application with PM2
echo -e "${BLUE}═══ Step 7: Starting Application with PM2 ═══${NC}"

cd "$CEPHFS_BASE/current"

# Check if PM2 process exists
if pm2 describe exam-system-frontend &>/dev/null; then
    echo "Application is already running, reloading..."
    
    # Use reload for zero-downtime restart
    pm2 reload exam-system-frontend
    echo -e "${GREEN}✓ Application reloaded${NC}"
else
    echo "Starting application for the first time..."
    
    # Start with ecosystem config
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
    else
        echo -e "${RED}Error: ecosystem.config.js not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Application started${NC}"
fi

# Save PM2 process list
pm2 save

# Show PM2 status
echo ""
pm2 status

echo ""

# Step 8: Verify deployment
echo -e "${BLUE}═══ Step 8: Verifying Deployment ═══${NC}"

# Wait for application to start
echo "Waiting for application to start..."
sleep 5

# Test local connection
echo "Testing local connection..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ Application is responding on port 3000${NC}"
else
    echo -e "${YELLOW}! Application may not be responding yet${NC}"
    echo "Check PM2 logs: pm2 logs exam-system-frontend"
fi

# Test Nginx proxy
if command -v nginx &> /dev/null && systemctl is-active --quiet nginx; then
    echo "Testing Nginx proxy..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✓ Nginx proxy is working${NC}"
    else
        echo -e "${YELLOW}! Nginx proxy may not be configured${NC}"
    fi
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Deployment Completed Successfully!           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

echo "Deployment Summary:"
echo "  Server: $HOSTNAME ($SERVER_IP)"
echo "  Code Location: $CEPHFS_BASE/current"
echo "  Environment: $ENV_FILE"
echo "  PM2 Process: exam-system-frontend"
echo "  Port: 3000"
echo ""

echo "Access the application:"
echo "  Local: http://localhost:3000"
echo "  Network: http://$SERVER_IP"
echo ""

echo "Management Commands:"
echo "  View logs:    pm2 logs exam-system-frontend"
echo "  Restart:      pm2 restart exam-system-frontend"
echo "  Stop:         pm2 stop exam-system-frontend"
echo "  Status:       pm2 status"
echo "  Monitor:      pm2 monit"
echo ""

echo "Nginx Commands:"
echo "  Test config:  nginx -t"
echo "  Reload:       systemctl reload nginx"
echo "  Status:       systemctl status nginx"
echo "  Logs:         tail -f /var/log/nginx/exam-system-frontend.access.log"
echo ""

echo -e "${BLUE}Deployment log saved to: $LOCAL_ROOT/logs/deployment-$(date +%Y%m%d_%H%M%S).log${NC}"

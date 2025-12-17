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
BUILD=false

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
    --build)
      BUILD=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--skip-deps] [--skip-build] [--build]"
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

echo ""

# Step 4: Create/Update environment file
echo -e "${BLUE}═══ Step 4: Configuring Environment ═══${NC}"

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

# API Configuration - UNIFIED GATEWAY
# Browser uses relative path (proxied by Nginx/Next.js)
NEXT_PUBLIC_API_URL=/api
# Server-Side (SSR) uses internal DNS
INTERNAL_API_URL=http://gt-omr-api.gt:8000

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

# Step 5: Install Node.js dependencies and build
if [ "$SKIP_BUILD" = false ]; then
    echo -e "${BLUE}═══ Step 5: Installing Dependencies and Building ═══${NC}"
    
    cd "$CEPHFS_BASE/current"
    
    # Install all dependencies (including devDependencies for build)
    echo "Installing dependencies..."
    if [ "$BUILD" = true ]; then
        echo "Running: pnpm install --frozen-lockfile (all dependencies for build)"
        pnpm install --frozen-lockfile
    else
        echo "Running: pnpm install --prod --frozen-lockfile (production only)"
        pnpm install --prod --frozen-lockfile
    fi
    
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    
    # Build if requested
    if [ "$BUILD" = true ]; then
        echo ""
        echo "Building Next.js application..."
        pnpm build
        echo -e "${GREEN}✓ Build complete${NC}"
        
        # Copy static files for standalone mode
        echo ""
        echo "Setting up standalone server..."
        if [ -d ".next/standalone" ]; then
            # Copy static files
            cp -r .next/static .next/standalone/.next/
            
            # Copy public folder if it exists
            if [ -d "public" ]; then
                cp -r public .next/standalone/
            fi
            
            echo -e "${GREEN}✓ Standalone server ready${NC}"
        else
            echo -e "${YELLOW}⚠ Standalone mode not configured in next.config.mjs${NC}"
        fi
        
        # After build, remove devDependencies to save space
        echo ""
        echo "Removing devDependencies..."
        pnpm install --prod --frozen-lockfile || true  # Ignore husky prepare script error
        echo -e "${GREEN}✓ DevDependencies removed${NC}"
    fi
else
    echo -e "${YELLOW}⊘ Skipping dependency installation and build${NC}"
fi

echo ""

# Step 6: Configure Nginx
echo -e "${BLUE}═══ Step 6: Configuring Nginx ═══${NC}"

# if [ -f "$SCRIPT_DIR/configure-nginx.sh" ]; then
#     bash "$SCRIPT_DIR/configure-nginx.sh" "_"
# else
#     echo -e "${YELLOW}Warning: configure-nginx.sh not found${NC}"
#     echo "Please configure Nginx manually"
# fi
echo -e "${YELLOW}Skipping Nginx configuration (Handled by configure-proxies.sh)${NC}"

echo ""

# Step 7: Start/Restart application with PM2
echo -e "${BLUE}═══ Step 7: Starting Application with PM2 ═══${NC}"

cd "$CEPHFS_BASE/current"

# Set PM2_HOME to local directory (owned by www-data)
export PM2_HOME="$LOCAL_ROOT/pm2"

# Ensure PM2_HOME directory exists with correct permissions
sudo mkdir -p "$PM2_HOME"
sudo chown -R www-data:www-data "$PM2_HOME"

# Check if PM2 process exists
if sudo -u www-data PM2_HOME="$PM2_HOME" pm2 describe exam-system-frontend &>/dev/null; then
    echo "Application is already running, reloading..."
    
    # Use reload for zero-downtime restart
    sudo -u www-data PM2_HOME="$PM2_HOME" pm2 reload exam-system-frontend
    echo -e "${GREEN}✓ Application reloaded${NC}"
else
    echo "Starting application for the first time..."
    
    # Use ecosystem config from LOCAL_ROOT
    if [ -f "$LOCAL_ROOT/ecosystem.config.js" ]; then
        sudo -u www-data PM2_HOME="$PM2_HOME" pm2 start "$LOCAL_ROOT/ecosystem.config.js"
    else
        echo -e "${RED}Error: ecosystem.config.js not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Application started${NC}"
fi

# Save PM2 process list
sudo -u www-data PM2_HOME="$PM2_HOME" pm2 save

# Show PM2 status
echo ""
sudo -u www-data PM2_HOME="$PM2_HOME" pm2 status

echo ""

# Configure systemd service for auto-start
echo "Configuring PM2 systemd service..."

# Create systemd service file
cat > /etc/systemd/system/pm2-www-data.service << EOF
[Unit]
Description=PM2 process manager
Documentation=https://pm2.keymetrics.io/
After=network.target

[Service]
Type=forking
User=www-data
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment=PM2_HOME=/opt/exam-system-frontend/pm2
PIDFile=/opt/exam-system-frontend/pm2/pm2.pid
ExecStart=/usr/bin/pm2 resurrect
ExecReload=/usr/bin/pm2 reload all
ExecStop=/usr/bin/pm2 kill
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable pm2-www-data.service
echo -e "${GREEN}✓ PM2 systemd service configured${NC}"

# Configure ubuntu user's bashrc for PM2
if ! grep -q 'PM2_HOME=/opt/exam-system-frontend/pm2' /home/ubuntu/.bashrc 2>/dev/null; then
    echo "Configuring ubuntu user's bashrc for PM2..."
    cat >> /home/ubuntu/.bashrc << 'BASHRC'

# PM2 Configuration for exam-system-frontend
export PM2_HOME=/opt/exam-system-frontend/pm2
alias pm2='sudo -u www-data PM2_HOME=/opt/exam-system-frontend/pm2 pm2'
BASHRC
    chown ubuntu:ubuntu /home/ubuntu/.bashrc
    echo -e "${GREEN}✓ Ubuntu user's bashrc configured${NC}"
else
    echo -e "${GREEN}✓ Ubuntu user's bashrc already configured${NC}"
fi

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

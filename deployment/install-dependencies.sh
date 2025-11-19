#!/bin/bash
# install-dependencies.sh
# Installs Node.js, pnpm, PM2, and Nginx on Ubuntu 24.04
# Usage: sudo ./install-dependencies.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Installing Frontend Dependencies ===${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: Please run as root (sudo)${NC}"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    echo -e "${RED}Error: Cannot detect OS version${NC}"
    exit 1
fi

echo "Detected OS: $OS $VER"

if [[ "$OS" != "Ubuntu" ]] || [[ "$VER" != "24.04" ]]; then
    echo -e "${YELLOW}Warning: This script is designed for Ubuntu 24.04${NC}"
    echo -e "${YELLOW}Current OS: $OS $VER${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}=== Step 1: Update System ===${NC}"
apt-get update
apt-get upgrade -y

echo ""
echo -e "${BLUE}=== Step 2: Install Prerequisites ===${NC}"
apt-get install libbz2-1.0=1.0.8-5.1 -y --allow-downgrades # Specific version for compatibility
apt-get install bzip2 -y
apt-get install -y \
    curl \
    wget \
    gnupg \
    ca-certificates \
    software-properties-common \
    build-essential \
    git

echo ""
echo -e "${BLUE}=== Step 3: Install Node.js 20 LTS ===${NC}"

# Check if Node.js is already installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${YELLOW}Node.js is already installed: $NODE_VERSION${NC}"
    
    # Check if it's version 20
    if [[ "$NODE_VERSION" == v20* ]]; then
        echo -e "${GREEN}✓ Node.js 20 LTS is already installed, skipping installation${NC}"
        SKIP_NODE=true
    else
        echo -e "${YELLOW}Warning: Installed version is not Node.js 20${NC}"
        echo "Upgrading to Node.js 20 LTS..."
        # Remove old Node.js
        apt-get remove -y nodejs npm
        apt-get autoremove -y
        SKIP_NODE=false
    fi
else
    SKIP_NODE=false
fi

if [ "$SKIP_NODE" = false ]; then
    echo "Installing Node.js 20 LTS..."
    
    # Add NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    
    # Install Node.js
    apt-get install -y nodejs
    
    # Verify installation
    NODE_VERSION=$(node -v)
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"
    echo -e "${GREEN}✓ npm installed: $NPM_VERSION${NC}"
fi

echo ""
echo -e "${BLUE}=== Step 4: Install pnpm ===${NC}"

if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm -v)
    echo -e "${GREEN}✓ pnpm is already installed: $PNPM_VERSION (skipping)${NC}"
else
    echo "Installing pnpm..."
    npm install -g pnpm@latest
    PNPM_VERSION=$(pnpm -v)
    echo -e "${GREEN}✓ pnpm installed: $PNPM_VERSION${NC}"
fi

echo ""
echo -e "${BLUE}=== Step 5: Install PM2 ===${NC}"

if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 -v)
    echo -e "${GREEN}✓ PM2 is already installed: $PM2_VERSION (skipping)${NC}"
else
    echo "Installing PM2..."
    npm install -g pm2@latest
    PM2_VERSION=$(pm2 -v)
    echo -e "${GREEN}✓ PM2 installed: $PM2_VERSION${NC}"
fi

echo ""
echo -e "${BLUE}=== Step 6: Install Nginx ===${NC}"

if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1 | cut -d'/' -f2)
    echo -e "${GREEN}✓ Nginx is already installed: $NGINX_VERSION (skipping)${NC}"
else
    echo "Installing Nginx..."
    apt-get install -y nginx
    
    # Enable and start Nginx
    systemctl enable nginx
    systemctl start nginx
    
    NGINX_VERSION=$(nginx -v 2>&1 | cut -d'/' -f2)
    echo -e "${GREEN}✓ Nginx installed: $NGINX_VERSION${NC}"
fi

# Check Nginx status
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
else
    echo -e "${YELLOW}! Nginx is not running${NC}"
    echo "Starting Nginx..."
    systemctl start nginx
fi

echo ""
echo -e "${BLUE}=== Step 7: Install Additional Tools ===${NC}"

# Install rsync (for deployment syncing)
if ! command -v rsync &> /dev/null; then
    echo "Installing rsync..."
    apt-get install -y rsync
    echo -e "${GREEN}✓ rsync installed${NC}"
else
    echo -e "${GREEN}✓ rsync already installed${NC}"
fi

# Install logrotate (usually pre-installed)
if ! command -v logrotate &> /dev/null; then
    echo "Installing logrotate..."
    apt-get install -y logrotate
    echo -e "${GREEN}✓ logrotate installed${NC}"
else
    echo -e "${GREEN}✓ logrotate already installed${NC}"
fi

echo ""
echo -e "${GREEN}=== Installation Summary ===${NC}"
echo ""
echo "System:"
echo "  OS: $OS $VER"
echo ""
echo "Node.js Ecosystem:"
echo "  Node.js: $(node -v)"
echo "  npm: $(npm -v)"
echo "  pnpm: $(pnpm -v)"
echo "  PM2: $(pm2 -v)"
echo ""
echo "Web Server:"
echo "  Nginx: $(nginx -v 2>&1 | cut -d'/' -f2)"
echo "  Status: $(systemctl is-active nginx)"
echo ""
echo "Additional Tools:"
echo "  rsync: $(rsync --version | head -1 | cut -d' ' -f3)"
echo "  logrotate: $(logrotate --version 2>&1 | head -1 | cut -d' ' -f2)"
echo ""
echo -e "${GREEN}=== All dependencies installed successfully! ===${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Configure CephFS mount (if not already done)"
echo "2. Run setup-frontend-local.sh to create directory structure"
echo "3. Run configure-nginx.sh to set up Nginx reverse proxy"
echo "4. Deploy frontend code and start with PM2"

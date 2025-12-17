#!/bin/bash
# configure-nginx.sh
# Configures Nginx as reverse proxy for Next.js frontend
# Usage: sudo ./configure-nginx.sh [SERVER_NAME]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Configuring Nginx for Frontend ===${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: Please run as root (sudo)${NC}"
    exit 1
fi

# Configuration
SERVER_NAME="${1:-_}"  # Default to catch-all server
FRONTEND_PORT="3000"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
CONFIG_NAME="exam-system-frontend"

# Detect server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo "Configuration:"
echo "  Server Name: $SERVER_NAME"
echo "  Server IP: $SERVER_IP"
echo "  Frontend Port: $FRONTEND_PORT"
echo "  Config File: $NGINX_SITES_AVAILABLE/$CONFIG_NAME"
echo ""

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}Error: Nginx is not installed${NC}"
    echo "Please run install-dependencies.sh first"
    exit 1
fi

# Backup existing config if exists
if [ -f "$NGINX_SITES_AVAILABLE/$CONFIG_NAME" ]; then
    BACKUP_FILE="$NGINX_SITES_AVAILABLE/$CONFIG_NAME.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}Backing up existing config to: $BACKUP_FILE${NC}"
    cp "$NGINX_SITES_AVAILABLE/$CONFIG_NAME" "$BACKUP_FILE"
fi

# Create Nginx configuration
echo "Creating Nginx configuration..."
cat > "$NGINX_SITES_AVAILABLE/$CONFIG_NAME" << 'EOF'
# Exam System Frontend - Next.js Application
# Reverse proxy configuration
# UNIFIED GATEWAY IMPLEMENTATION

# WebSocket Header Handling
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

# Logic to preserve HTTPS protocol status
# If X-Forwarded-Proto is missing (internal access), default to $scheme (http)
# If provided (by Cloudflare/Tunnel), trust it.
map $http_x_forwarded_proto $final_forwarded_proto {
    default $http_x_forwarded_proto;
    ''      $scheme;
}

upstream nextjs_upstream {
    # PM2 cluster mode runs multiple instances
    # Nginx will load balance between them
    server 127.0.0.1:3000;
    keepalive 64;
}

# Python Backend Upstream (Unified Gateway Target)
upstream fastapi_upstream {
    # Using DNS name as requested for VIP/LoadBalancer support
    server gt-omr-api.gt:8000;
    keepalive 64;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=frontend_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;

server {
    listen 80;
    listen [::]:80;
    
    server_name SERVER_NAME_PLACEHOLDER;
    
    # --- GLOBAL PROXY HEADERS ---
    # These headers are applied to ALL locations unless overridden
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    
    # CRITICAL: Force HTTPS for the app's perspective if we are behind Cloudflare
    # This uses the mapped logic above.
    proxy_set_header X-Forwarded-Proto $final_forwarded_proto;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Logging
    access_log /var/log/nginx/exam-system-frontend.access.log;
    error_log /var/log/nginx/exam-system-frontend.error.log;
    
    # Max upload size (100MB for batch uploads)
    client_max_body_size 100M;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # --- 1. ROUTE TO PYTHON API (Unified Gateway) ---
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://fastapi_upstream;
        
        # Extended timeouts for API processing (e.g. big uploads)
        proxy_read_timeout 300s;
        proxy_cache_bypass $http_upgrade;
        
        # CRITICAL: Disable buffering to allow direct streaming
        proxy_request_buffering off;
    }
    
    # --- 2. ROUTE TO NEXT.JS (Static & App) ---
    # Static files from Next.js
    location /_next/static {
        proxy_cache STATIC;
        proxy_pass http://nextjs_upstream;
        
        # Cache static assets aggressively
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    # Public files
    location /public {
        proxy_cache STATIC;
        proxy_pass http://nextjs_upstream;
        add_header Cache-Control "public, max-age=3600";
    }
    

    
    # WebSocket support for hot reload (development)
    location /_next/webpack-hmr {
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }
    
    # All other requests
    location / {
        limit_req zone=frontend_limit burst=20 nodelay;
        
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://nextjs_upstream;
    }
}
EOF

# Replace placeholder with actual server name
sed -i "s/SERVER_NAME_PLACEHOLDER/$SERVER_NAME/g" "$NGINX_SITES_AVAILABLE/$CONFIG_NAME"

echo -e "${GREEN}✓ Nginx config created${NC}"

# Create cache directory
echo "Setting up cache..."
if ! grep -q "proxy_cache_path" /etc/nginx/nginx.conf; then
    # Add cache configuration to http block
    sed -i '/http {/a \    # Cache configuration\n    proxy_cache_path /var/cache/nginx/static levels=1:2 keys_zone=STATIC:10m inactive=7d use_temp_path=off;' /etc/nginx/nginx.conf
    echo -e "${GREEN}✓ Added cache configuration to nginx.conf${NC}"
else
    echo -e "${YELLOW}! Cache configuration already exists${NC}"
fi

# Create cache directory
mkdir -p /var/cache/nginx/static
chown -R www-data:www-data /var/cache/nginx
echo -e "${GREEN}✓ Cache directory created${NC}"

# Enable the site
if [ -L "$NGINX_SITES_ENABLED/$CONFIG_NAME" ]; then
    echo -e "${YELLOW}! Site already enabled${NC}"
else
    ln -s "$NGINX_SITES_AVAILABLE/$CONFIG_NAME" "$NGINX_SITES_ENABLED/$CONFIG_NAME"
    echo -e "${GREEN}✓ Site enabled${NC}"
fi

# Disable default site if it exists
if [ -L "$NGINX_SITES_ENABLED/default" ]; then
    echo "Disabling default Nginx site..."
    rm "$NGINX_SITES_ENABLED/default"
    echo -e "${GREEN}✓ Default site disabled${NC}"
fi

# Test Nginx configuration
echo ""
echo "Testing Nginx configuration..."
if nginx -t; then
    # Reload or Start Nginx
    echo "Applying Nginx configuration..."
    if systemctl is-active --quiet nginx; then
        systemctl reload nginx
        echo -e "${GREEN}✓ Nginx reloaded${NC}"
    else
        systemctl start nginx
        echo -e "${GREEN}✓ Nginx started${NC}"
    fi
else
    echo -e "${RED}✗ Nginx configuration test failed${NC}"
    echo "Please check the configuration and try again"
    exit 1
fi

# Check Nginx status
echo ""
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
else
    echo -e "${RED}✗ Nginx is not running${NC}"
    echo "Starting Nginx..."
    systemctl start nginx
fi

echo ""
echo -e "${GREEN}=== Nginx Configuration Complete ===${NC}"
echo ""
echo "Configuration file: $NGINX_SITES_AVAILABLE/$CONFIG_NAME"
echo "Enabled: Yes"
echo ""
echo "Access the application:"
echo "  http://$SERVER_IP"
if [ "$SERVER_NAME" != "_" ]; then
    echo "  http://$SERVER_NAME"
fi
echo ""
echo "Nginx logs:"
echo "  Access: /var/log/nginx/exam-system-frontend.access.log"
echo "  Error: /var/log/nginx/exam-system-frontend.error.log"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Ensure frontend is running: pm2 status"
echo "2. Test access: curl http://localhost"
echo "3. Check logs: tail -f /var/log/nginx/exam-system-frontend.access.log"

#!/bin/bash
# configure-proxies.sh
# Configures Nginx for Multi-tier Architecture (Layer 1 Ingress or Layer 2 Unified Gateway)
# Usage: sudo ./configure-proxies.sh --layer [1|2] --domain [DOMAIN]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Default values
LAYER=""
DOMAIN="omr.gongtham.net"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --layer) LAYER="$2"; shift ;;
        --domain) DOMAIN="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

echo -e "${BLUE}=== Configuring Nginx Proxy Layer ${LAYER} ===${NC}"

# Validation
if [[ -z "$LAYER" ]]; then
    echo "Please specify layer: --layer 1 (Ingress) or --layer 2 (Unified Gateway)"
    exit 1
fi

if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: Please run as root (sudo)${NC}"
    exit 1
fi

# Detect Server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

# Check Nginx
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}Error: Nginx is not installed.${NC}"
    exit 1
fi

configure_layer_1() {
    CONFIG_NAME="omr-ingress-layer1"
    echo -e "${BLUE}Configuring Layer 1: Ingress (Cloudflare Tunnel Target)${NC}"
    echo "Domain: $DOMAIN"
    echo "Listening Port: 8091"
    
    cat > "$NGINX_SITES_AVAILABLE/$CONFIG_NAME" << EOF
# LAYER 1: Ingress / Tunnel Endpoint
# Receives traffic from Cloudflare Tunnel (Port 8091)
# Forwards to Layer 2 (Unified Gateway)

upstream layer2_gateway {
    server gt-omr-web-1.gt:80;  # API Server, port 80
    keepalive 64;
}

server {
    listen 8091;
    server_name $DOMAIN;

    access_log /var/log/nginx/layer1-ingress.access.log;
    error_log /var/log/nginx/layer1-ingress.error.log warn;

    # 1. Handling Large Uploads at Ingress
    client_max_body_size 500M;

    location / {
        proxy_pass http://layer2_gateway;

        # Proxy Headers - Pass original client info
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade"; # Needed for Websockets
        
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https; # Force HTTPS semantics from Tunnel

        # Timeouts - Must be > Layer 2 timeouts
        proxy_connect_timeout 75s;
        proxy_send_timeout 3600s;
        proxy_read_timeout 3600s;

        # Disable buffering to allow streaming through ingress
        proxy_request_buffering off;
        proxy_buffering off;
    }
}
EOF
    enable_site "$CONFIG_NAME"
}

configure_layer_2() {
    CONFIG_NAME="omr-gateway-layer2"
    echo -e "${BLUE}Configuring Layer 2: Unified Gateway (Application Logic)${NC}"
    echo "Listening Port: 80"
    
    cat > "$NGINX_SITES_AVAILABLE/$CONFIG_NAME" << EOF
# LAYER 2: Unified Application Gateway
# Receives traffic from Layer 1
# Splits traffic to Next.js (Frontend) and FastAPI (Backend)
# Implements Real-time vs REST lanes

# WebSocket Helper
map \$http_upgrade \$connection_upgrade {
    default upgrade;
    '' close;
}

map \$http_x_forwarded_proto \$final_forwarded_proto {
    default \$http_x_forwarded_proto;
    ''      \$scheme;
}

upstream nextjs_upstream {
    server 127.0.0.1:3000;
    keepalive 64;
}

upstream fastapi_upstream {
    server gt-omr-api.gt:8000;
    keepalive 64;
}

# Rate Limiting
limit_req_zone \$binary_remote_addr zone=frontend_limit:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=50r/s; # Increased for API

server {
    listen 80;
    listen [::]:80;
    server_name _;

    # Global Proxy Headers
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection \$connection_upgrade;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$final_forwarded_proto;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    access_log /var/log/nginx/layer2-gateway.access.log;
    error_log /var/log/nginx/layer2-gateway.error.log;

    client_max_body_size 500M;

    # --- LANE 1: Real-time API (Streaming/Uploads) ---
    # Matches /api/realtime/ and rewrites to /api/
    location ~ ^/api/realtime/(.*)\$ {
        # Limit Burst
        limit_req zone=api_limit burst=50 nodelay;
        
        # Rewrite URL: /api/realtime/batches -> /api/batches
        rewrite ^/api/realtime/(.*)\$ /api/\$1 break;
        
        proxy_pass http://fastapi_upstream;

        # OPTIMIZATION: Disable Buffering for Streams
        proxy_request_buffering off;
        proxy_buffering off;

        # EXTENDED TIMEOUTS
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_connect_timeout 75s;

        proxy_cache_bypass \$http_upgrade;
    }

    # --- LANE 2: Standard REST API (Default) ---
    # Matches /api/
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://fastapi_upstream;
        
        # Standard Buffering (Valid for small JSON responses)
        # Nginx default buffering is ON, which is good for storage/network efficiency
        
        # Standard Timeouts
        proxy_read_timeout 60s;
        
        proxy_cache_bypass \$http_upgrade;
    }

    # --- NEXT.JS ROUTES ---
    location /_next/static {
        proxy_cache STATIC;
        proxy_pass http://nextjs_upstream;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /public {
        proxy_cache STATIC;
        proxy_pass http://nextjs_upstream;
        add_header Cache-Control "public, max-age=3600";
    }

    location /_next/webpack-hmr {
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
    }

    location / {
        limit_req zone=frontend_limit burst=20 nodelay;
        proxy_pass http://nextjs_upstream;
    }

    location /health {
        access_log off;
        proxy_pass http://nextjs_upstream;
    }
}
EOF
    
    # Ensure cache config exists
    setup_cache

    # Site is enabled manually by the user
    # enable_site "$CONFIG_NAME"
    
    # Disable default if exists
    [ -L "$NGINX_SITES_ENABLED/default" ] && rm "$NGINX_SITES_ENABLED/default"
}

setup_cache() {
    if ! grep -q "proxy_cache_path" /etc/nginx/nginx.conf; then
         # This simple sed might be fragile but works for standard installs
         sed -i '/http {/a \    proxy_cache_path /var/cache/nginx/static levels=1:2 keys_zone=STATIC:10m inactive=7d use_temp_path=off;' /etc/nginx/nginx.conf
    fi
    mkdir -p /var/cache/nginx/static
    chown -R www-data:www-data /var/cache/nginx
}

enable_site() {
    local SITE=$1
    echo "Enabling $SITE..."
    if [ -f "$NGINX_SITES_AVAILABLE/$SITE" ]; then
        ln -sf "$NGINX_SITES_AVAILABLE/$SITE" "$NGINX_SITES_ENABLED/$SITE"
        echo -e "${GREEN}✓ Enabled $SITE${NC}"
    else
        echo -e "${RED}Error: Config $SITE not found${NC}"
        exit 1
    fi
}

# Main Execution
if [ "$LAYER" == "1" ]; then
    configure_layer_1
elif [ "$LAYER" == "2" ]; then
    configure_layer_2
fi

# Reload Nginx
echo "Testing Nginx configuration..."
nginx -t && systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded successfully${NC}"

exit 0

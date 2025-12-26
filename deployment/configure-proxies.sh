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
LAYER="2"
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
if ! command -v nginx &> /dev/null && ! command -v openresty &> /dev/null; then
    echo -e "${RED}Error: Nginx or OpenResty is not installed.${NC}"
    exit 1
fi

configure_layer_1() {
    CONFIG_NAME="omr-ingress-layer1"
    echo -e "${BLUE}Configuring Layer 1: Ingress (Cloudflare Tunnel Target)${NC}"
    echo "Domain: $DOMAIN"
    echo "Listening Port: 8091 & 80"
    
    # Backup existing config if exists
    if [ -f "$NGINX_SITES_AVAILABLE/$CONFIG_NAME" ]; then
        BACKUP_FILE="$NGINX_SITES_AVAILABLE/$CONFIG_NAME.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${YELLOW}Backing up existing config to: $BACKUP_FILE${NC}"
        cp "$NGINX_SITES_AVAILABLE/$CONFIG_NAME" "$BACKUP_FILE"
    fi
    
    cat > "$NGINX_SITES_AVAILABLE/$CONFIG_NAME" << EOF
# LAYER 1: Ingress / Tunnel Endpoint
# Receives traffic from Cloudflare Tunnel (Port 8091)
# Receives traffic from local network (Port 80)
# Forwards to Layer 2 (Unified Gateway)

upstream layer2_gateway {
    server gt-omr-web-1.gt:80;
    server gt-omr-web-2.gt:80;
    server gt-omr-web-3.gt:80;
    keepalive 64;
}

# Public traffic (Cloudflare)
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
        proxy_read_timeout 3600s;

        # Disable buffering to allow streaming through ingress
        proxy_request_buffering off;
        proxy_buffering off;

        # Increase buffer size for headers only (not body)
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
}

# Local traffic
server {
    listen 80;
    server_name omr.gt;

    # Logging for internal traffic
    access_log /var/log/nginx/layer1-internal.access.log;
    error_log /var/log/nginx/layer1-internal.error.log warn;

    # Match the max body size of the public ingress so internal users can upload too
    client_max_body_size 500M;

    location / {
        # Re-use the existing upstream defined in Layer 1
        proxy_pass http://layer2_gateway;

        # Standard Proxy Headers
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade"; # Essential for WebSockets

        # Pass the Host header 'omr.gt' to Layer 2
        proxy_set_header Host \$host;

        # Real IP Handling
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;

        # IMPORTANT CHANGE:
        # Unlike the Cloudflare block which forces 'https',
        # internal traffic usually comes over 'http'.
        # Using \$scheme passes the actual protocol used by the client.
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Timeouts - keeping consistent with public ingress
        proxy_connect_timeout 75s;
        proxy_read_timeout 3600s;

        # Disable buffering for streaming/realtime consistency
        proxy_request_buffering off;
        proxy_buffering off;
    }
}
EOF
    enable_site "$CONFIG_NAME"
}


# OpenResty Paths
OPENRESTY_CONF_DIR="/etc/openresty"
OPENRESTY_CONF_D="/etc/openresty/conf.d"
OPENRESTY_MAIN_CONF="/etc/openresty/nginx.conf"

setup_openresty_main_conf() {
    echo "Configuring OpenResty main config..."
    if [ ! -f "$OPENRESTY_MAIN_CONF" ]; then
        echo -e "${RED}Error: OpenResty config not found at $OPENRESTY_MAIN_CONF${NC}"
        return 1
    fi

    # Backup
    if [ ! -f "$OPENRESTY_MAIN_CONF.bak" ]; then
        cp "$OPENRESTY_MAIN_CONF" "$OPENRESTY_MAIN_CONF.bak"
    fi

    # Ensure conf.d include exists
    if ! grep -q "include $OPENRESTY_CONF_D/\*\.conf;" "$OPENRESTY_MAIN_CONF"; then
        sed -i "/http {/a \    include $OPENRESTY_CONF_D/*.conf;" "$OPENRESTY_MAIN_CONF"
    else
        echo "Main config already includes conf.d"
    fi

    # Ensure cache path exists (for static content)
    mkdir -p /var/cache/nginx/static
    chown -R nobody:adm /var/cache/nginx
    if ! grep -q "proxy_cache_path.*/var/cache/nginx/static" "$OPENRESTY_MAIN_CONF"; then
        sed -i "/http {/a \    proxy_cache_path /var/cache/nginx/static levels=1:2 keys_zone=STATIC:10m inactive=7d use_temp_path=off;" "$OPENRESTY_MAIN_CONF"
    fi
}

resolve_ipv4() {
    local HOST=$1
    # Try getent ahosts first (glibc)
    local IP=$(getent ahosts "$HOST" | awk '{ print $1 }' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -n 1)
    
    # Fallback to getent hosts
    if [ -z "$IP" ]; then
        IP=$(getent hosts "$HOST" | awk '{ print $1 }' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -n 1)
    fi

    echo "$IP"
}

configure_layer_2() {
    CONFIG_NAME="omr-gateway"
    echo -e "${BLUE}Configuring Layer 2: Unified Gateway (OpenResty)${NC}"
    
    # Setup Main Config first
    setup_openresty_main_conf
    mkdir -p "$OPENRESTY_CONF_D"

    # resolve upstreams to IPv4
    API_NODE_1=$(resolve_ipv4 "gt-omr-api-1")
    API_NODE_2=$(resolve_ipv4 "gt-omr-api-2")
    
    if [ -z "$API_NODE_1" ]; then API_NODE_1="127.0.0.1"; fi 
    if [ -z "$API_NODE_2" ]; then API_NODE_2="127.0.0.1"; fi

    echo "Resolved API Nodes: $API_NODE_1, $API_NODE_2"

    cat > "$OPENRESTY_CONF_D/omr-gateway.conf" << EOF
# LAYER 2: Unified Application Gateway (OpenResty)
# Receives traffic from Layer 1
# Splits traffic to Next.js (Frontend) and FastAPI (Backend)

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

# Lua Configuration for Active Health Checks
lua_package_path "/usr/local/openresty/lualib/?.lua;;";
lua_shared_dict healthcheck 1m;

init_worker_by_lua_block {
    local hc = require "resty.upstream.healthcheck"
    local ok, err = hc.spawn_checker{
        shm = "healthcheck",
        upstream = "fastapi_upstream",
        type = "http",
        http_req = "GET / HTTP/1.0\r\nHost: gt-omr-api.gt\r\nUser-Agent: lua-resty-upstream-healthcheck\r\n\r\n",
        interval = 2000,
        timeout = 1000,
        fall = 3,
        rise = 2,
        valid_statuses = {200, 302},
        concurrency = 1,
    }
    if not ok then
        ngx.log(ngx.ERR, "failed to spawn health checker: ", err)
        return
    end
}

upstream fastapi_upstream {
    # Resolved IPv4 addresses to avoid 'Connection refused' on IPv6
    server $API_NODE_1:8000;
    server $API_NODE_2:8000;
    keepalive 64;
}

# Rate Limiting
limit_req_zone \$binary_remote_addr zone=frontend_limit:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=50r/s;

server {
    listen 80;
    listen [::]:80;
    server_name _;

    # Real IP Config
    set_real_ip_from 10.10.24.0/22;
    real_ip_header X-Forwarded-For;
    real_ip_recursive on;

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

    # Lane 1: Real-time API
    location ~ ^/api/realtime/(.*)\$ {
        limit_req zone=api_limit burst=50 nodelay;
        rewrite ^/api/realtime/(.*)\$ /api/\$1 break;
        proxy_pass http://fastapi_upstream;
        proxy_request_buffering off;
        proxy_buffering off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_connect_timeout 75s;
        proxy_cache_bypass \$http_upgrade;
    }

    # Lane 2: Standard REST API
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://fastapi_upstream;
        proxy_read_timeout 60s;
        proxy_cache_bypass \$http_upgrade;
    }

    # Internal Video Streaming
    location /protected_videos/ {
        internal;
        alias /cephfs/omr/tutorials/;
        aio threads;
        directio 512;
        output_buffers 1 2M;
        sendfile on;
        sendfile_max_chunk 512k;
        add_header Accept-Ranges bytes;
        proxy_max_temp_file_size 0;
    }

    # Next.js Routes
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

    # Health Check Status Page
    location /status {
        access_log off;
        default_type text/plain;
        content_by_lua_block {
            local hc = require "resty.upstream.healthcheck"
            ngx.say("Nginx Worker PID: ", ngx.worker.pid())
            ngx.print(hc.status_page())
        }
    }
}
EOF

    echo -e "${GREEN}✓ OpenResty configured at $OPENRESTY_CONF_D/omr-gateway.conf${NC}"
    
    echo "Reloading OpenResty..."
    openresty -t && systemctl reload openresty
    echo -e "${GREEN}✓ OpenResty reloaded${NC}"
}

# Main Execution
if [ "$LAYER" == "1" ]; then
    configure_layer_1
    # Reload Nginx for Layer 1
    echo "Testing Nginx configuration..."
    nginx -t && systemctl reload nginx
    echo -e "${GREEN}✓ Nginx reloaded successfully${NC}"
elif [ "$LAYER" == "2" ]; then
    configure_layer_2
fi


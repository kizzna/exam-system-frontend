#!/bin/bash
# setup-local-ssl.sh
# Sets up SSL for local ingress using Cloudflare DNS-01 challenge
# Usage: sudo ./setup-local-ssl.sh [my-domain.com] [email]

set -e

DOMAIN="${1:-omr.gongtham.net}"
EMAIL="${2:-admin@gongtham.net}"
SECRETS_DIR="/root/.secrets"
CLOUDFLARE_CREDENTIALS="$SECRETS_DIR/cloudflare.ini"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: Please run as root (sudo)${NC}"
    exit 1
fi

echo -e "${GREEN}=== Setting up Local SSL for $DOMAIN ===${NC}"

# 1. Install Certbot and Cloudflare Plugin
echo "Installing Certbot and Cloudflare plugin..."
apt-get update
apt-get install -y certbot python3-certbot-dns-cloudflare

# 2. Check for Credentials
if [ ! -f "$CLOUDFLARE_CREDENTIALS" ]; then
    # Check if user put it in home dir, copy to root
    if [ -f "/home/ubuntu/.secrets/cloudflare.ini" ]; then
        echo "Found cloudflare.ini in home directory, copying to $SECRETS_DIR..."
        mkdir -p "$SECRETS_DIR"
        cp "/home/ubuntu/.secrets/cloudflare.ini" "$CLOUDFLARE_CREDENTIALS"
        chmod 600 "$CLOUDFLARE_CREDENTIALS"
    else
        echo -e "${RED}Error: Cloudflare credentials not found at $CLOUDFLARE_CREDENTIALS${NC}"
        echo "Please create this file with content:"
        echo "dns_cloudflare_api_token = YOUR_TOKEN_HERE"
        exit 1
    fi
fi

chmod 600 "$CLOUDFLARE_CREDENTIALS"

# 3. Request Certificate
echo "Requesting certificate for $DOMAIN..."
# We request a wildcard too if it's a base domain, but for now just the specific domain to be safe
# Add --deploy-hook to reload nginx automatically
certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials "$CLOUDFLARE_CREDENTIALS" \
  --dns-cloudflare-propagation-seconds 60 \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  --deploy-hook "systemctl reload nginx"

echo -e "${GREEN}=== Certificate setup complete! ===${NC}"
echo "Certificates are located at: /etc/letsencrypt/live/$DOMAIN/"

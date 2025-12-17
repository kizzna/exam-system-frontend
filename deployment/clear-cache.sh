#!/bin/bash
# clear-cache.sh
# Clears Nginx Proxy Cache and Next.js Cache to fix redirect loops

set -e

echo "=== Clearing Caches on $(hostname) ==="

# 1. Clear Nginx Proxy Cache
if [ -d "/var/cache/nginx/static" ]; then
    echo "Clearing Nginx Static Cache..."
    sudo rm -rf /var/cache/nginx/static/*
    echo "✓ Nginx cache cleared"
else
    echo "Nginx cache directory not found (skipping)"
fi

# 2. Clear Next.js Cache (Start fresh)
# adjust path if your app is elsewhere
APP_DIR="/workspaces/omr-frontend"  # Adjust if deployed to a different path on server
if [ -d "$APP_DIR/.next/cache" ]; then
    echo "Clearing Next.js ISR Cache..."
    rm -rf "$APP_DIR/.next/cache"
    echo "✓ Next.js cache cleared"
fi

# 3. Restart Services
echo "Restarting Nginx..."
sudo systemctl reload nginx

echo "Restarting Next.js (PM2)..."
pm2 reload exam-system-frontend || echo "PM2 reload failed (is app running?)"

echo "=== Cache Clearing Complete ==="
echo "Please verify access now."

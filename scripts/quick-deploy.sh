#!/bin/bash
# Quick Deploy - Fast sync and restart for development iteration
# Syncs only changed files and restarts PM2 without rebuilding
# Usage: ./scripts/quick-deploy.sh [server|all]

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
LOCAL_DIR="/workspaces/omr-frontend"
CEPHFS_CURRENT="/cephfs/exam-system/frontend/current"
TARGET="${1:-gt-omr-web-1}"

echo -e "${BLUE}⚡ Quick Deploy - Fast Iteration Mode${NC}"
echo ""

# Function to deploy to single server
deploy_to_server() {
  local server=$1
  echo -e "${BLUE}📦 Deploying to $server...${NC}"
  
  # Sync files (only changed files, no build artifacts)
  echo "  → Syncing files..."
  rsync -az --delete \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.next' \
    --exclude='.env.local' \
    --exclude='tests' \
    --exclude='playwright-report' \
    --exclude='.pnpm-store' \
    "$LOCAL_DIR/" "$CEPHFS_CURRENT/" 2>&1 | grep -v "^sending\|^total\|^sent\|^receiving" || true
  
  # Reload PM2 (graceful reload without downtime)
  echo "  → Reloading application..."
  ssh "$server" "sudo -u www-data PM2_HOME=/opt/exam-system-frontend/pm2 pm2 reload exam-system-frontend --update-env" &>/dev/null
  
  # Quick health check
  sleep 1
  HTTP_CODE=$(ssh "$server" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000" || echo "000")
  
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
    echo -e "  ${GREEN}✓ $server deployed and online (HTTP $HTTP_CODE)${NC}"
  else
    echo -e "  ${YELLOW}⚠ $server deployed but HTTP $HTTP_CODE${NC}"
  fi
}

# Deploy based on target
if [ "$TARGET" = "all" ]; then
  echo "Syncing to CephFS..."
  rsync -az --delete \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.next' \
    --exclude='.env.local' \
    --exclude='tests' \
    --exclude='playwright-report' \
    --exclude='.pnpm-store' \
    "$LOCAL_DIR/" "$CEPHFS_CURRENT/"
  
  echo ""
  for server in gt-omr-web-{1,2,3}; do
    deploy_to_server "$server"
  done
else
  deploy_to_server "$TARGET"
fi

echo ""
echo -e "${GREEN}✅ Quick deploy complete!${NC}"
echo ""
echo "Test at: http://${TARGET}.gt/dashboard"
echo ""
echo "Note: Changes to package.json, next.config.mjs, or dependencies"
echo "      require full rebuild: ./deployment/remote-deploy.sh $TARGET --build"

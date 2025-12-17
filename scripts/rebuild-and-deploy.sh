#!/bin/bash
# Rebuild and Deploy - Full build with deployment
# Use when dependencies or build config changes
# Usage: ./scripts/rebuild-and-deploy.sh [server|all]

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

TARGET="${1:-gt-omr-web-1}"

echo -e "${BLUE}🔨 Full Rebuild and Deploy${NC}"
echo ""

# Sync code first
echo "Syncing code to CephFS..."
bash /workspaces/omr-frontend/scripts/dev-sync-frontend.sh

echo ""

# Deploy with build
if [ "$TARGET" = "all" ]; then
  for server in gt-omr-web-{1,2,3}; do
    echo -e "${BLUE}Deploying to $server...${NC}"
    /workspaces/omr-frontend/deployment/remote-deploy.sh "$server" --build --skip-deps
  done
else
  /workspaces/omr-frontend/deployment/remote-deploy.sh "$TARGET" --build --skip-deps
fi

echo ""
echo -e "${GREEN}✅ Full rebuild and deploy complete!${NC}"

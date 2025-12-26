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

MAIN_SERVER="gt-omr-web-1"
TARGET="${1:-$MAIN_SERVER}"

echo -e "${BLUE}🔨 Full Rebuild and Deploy${NC}"
echo "Main Server: $MAIN_SERVER"
echo "Target: $TARGET"
echo ""

# Sync logic moved to remote-deploy.sh to be handled centrally
# Sync code first, sync only once by checking if it is main server
# if [ "$TARGET" = "$MAIN_SERVER" ]; then
#   echo "Syncing code to CephFS..."
#   bash /workspaces/omr-frontend/scripts/dev-sync-frontend.sh
# else
#   echo "Skipping code sync"
# fi

echo ""

# Deploy with build
if [ "$TARGET" = "all" ]; then
  # update main server first
  echo -e "${BLUE}Updating main server...${NC}"
  /workspaces/omr-frontend/deployment/remote-deploy.sh "$MAIN_SERVER" --build --skip-deps
  echo ""
  # update 2nd and 3rd server
  for server in gt-omr-web-{2,3}; do
    echo -e "${BLUE}Deploying to $server...${NC}"
    /workspaces/omr-frontend/deployment/remote-deploy.sh "$server" --skip-deps
  done
# Test new flow
elif [ "$TARGET" = "all2" ]; then
  echo -e "${BLUE}Updating main server...${NC}"
  echo -e "Stopping nginx on $MAIN_SERVER..."
  ssh $MAIN_SERVER "sudo ngx stop"
  # update main server
  echo -e "Updating main server..."
  /workspaces/omr-frontend/deployment/remote-deploy.sh "$MAIN_SERVER" --build --skip-deps
  echo -e "Starting nginx on $MAIN_SERVER..."
  ssh $MAIN_SERVER "sudo ngx start"
  echo ""
  # update 2nd and 3rd server
  for server in gt-omr-web-{2,3}; do
    echo -e "${BLUE}Deploying to $server...${NC}"
    echo -e "Stopping nginx on $server..."
    ssh $server "sudo ngx stop"
    echo -e "Updating $server..."
    /workspaces/omr-frontend/deployment/remote-deploy.sh "$server" --skip-deps
    echo -e "Starting nginx on $server..."
    ssh $server "sudo ngx start"
    echo ""
  done
else
  # Single server deployment - must build if it's the main server or if we want to force a rebuild
  # Since this is "rebuild-and-deploy", we generally assume a build is wanted.
  /workspaces/omr-frontend/deployment/remote-deploy.sh "$TARGET" --build --skip-deps
fi

echo ""
echo -e "${GREEN}✅ Full rebuild and deploy complete!${NC}"

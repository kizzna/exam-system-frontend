#!/bin/bash
# remote-deploy.sh
# Deploys frontend to remote server from development machine
# This script runs on the DEV machine and orchestrates the full deployment
# Usage: ./remote-deploy.sh [SERVER] [--build] [--skip-deps]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Default configuration
SERVER="${1:-gt-omr-web-1}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"

# Parse arguments
BUILD=false
SKIP_DEPS=false

shift || true  # Remove first argument (server name)

while [[ $# -gt 0 ]]; do
  case $1 in
    --build)
      BUILD=true
      shift
      ;;
    --skip-deps)
      SKIP_DEPS=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [SERVER] [--build] [--skip-deps]"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Remote Frontend Deployment Orchestrator          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

echo "Configuration:"
echo "  Target Server: $SERVER"
echo "  Build Before Deploy: $BUILD"
echo "  Skip Dependencies: $SKIP_DEPS"
echo "  Workspace: $WORKSPACE_DIR"
echo ""

# Verify SSH connection
echo -e "${BLUE}═══ Step 1: Verifying SSH Connection ═══${NC}"
if ssh -o ConnectTimeout=5 "$SERVER" "echo 'SSH connection successful'" &>/dev/null; then
    echo -e "${GREEN}✓ SSH connection to $SERVER is working${NC}"
else
    echo -e "${RED}Error: Cannot connect to $SERVER via SSH${NC}"
    echo "Please ensure:"
    echo "  1. Server is reachable"
    echo "  2. Passwordless SSH is configured"
    echo "  3. Server name is correct"
    exit 1
fi

# Get server info
SERVER_INFO=$(ssh "$SERVER" "hostname && hostname -I | awk '{print \$1}'")
SERVER_HOSTNAME=$(echo "$SERVER_INFO" | sed -n '1p')
SERVER_IP=$(echo "$SERVER_INFO" | sed -n '2p')

echo "  Server Hostname: $SERVER_HOSTNAME"
echo "  Server IP: $SERVER_IP"
echo ""

# Step 2: Transfer deployment scripts to server
echo -e "${BLUE}═══ Step 2: Transferring Deployment Scripts ═══${NC}"

ssh "$SERVER" "mkdir -p /tmp/exam-system-deployment"

echo "Copying deployment scripts..."
scp "$SCRIPT_DIR/install-dependencies.sh" \
    "$SCRIPT_DIR/setup-frontend-local.sh" \
    "$SCRIPT_DIR/configure-nginx.sh" \
    "$SCRIPT_DIR/deploy-frontend.sh" \
    "$SERVER:/tmp/exam-system-deployment/" &>/dev/null

ssh "$SERVER" "chmod +x /tmp/exam-system-deployment/*.sh"

echo -e "${GREEN}✓ Scripts transferred successfully${NC}"
echo ""

# Step 3: Sync code to CephFS
echo -e "${BLUE}═══ Step 3: Syncing Code to CephFS ═══${NC}"

SYNC_SCRIPT="$WORKSPACE_DIR/scripts/dev-sync-frontend.sh"

if [ ! -f "$SYNC_SCRIPT" ]; then
    echo -e "${RED}Error: Sync script not found: $SYNC_SCRIPT${NC}"
    exit 1
fi

echo "Running sync script..."
bash "$SYNC_SCRIPT"

echo -e "${GREEN}✓ Code synced to CephFS${NC}"
echo ""

# Step 4: Run deployment on server
echo -e "${BLUE}═══ Step 4: Running Deployment on Server ═══${NC}"

DEPLOY_ARGS=""
if [ "$SKIP_DEPS" = true ]; then
    DEPLOY_ARGS="$DEPLOY_ARGS --skip-deps"
fi
if [ "$BUILD" = true ]; then
    DEPLOY_ARGS="$DEPLOY_ARGS --build"
fi

echo "Executing deployment script on $SERVER..."
echo ""

# Run deployment script on remote server with sudo
ssh -t "$SERVER" "sudo bash /tmp/exam-system-deployment/deploy-frontend.sh $DEPLOY_ARGS"

echo ""
echo -e "${GREEN}✓ Deployment completed on server${NC}"
echo ""

# Step 5: Verify deployment
echo -e "${BLUE}═══ Step 5: Verifying Deployment ═══${NC}"

# Check PM2 status
echo "Checking PM2 status..."
PM2_STATUS=$(ssh "$SERVER" "pm2 jlist 2>/dev/null | jq -r '.[] | select(.name==\"exam-system-frontend\") | .pm2_env.status'")

if [ "$PM2_STATUS" = "online" ]; then
    echo -e "${GREEN}✓ Application is online${NC}"
else
    echo -e "${YELLOW}! Application status: ${PM2_STATUS:-unknown}${NC}"
fi

# Test HTTP connection
echo "Testing HTTP connection..."
HTTP_CODE=$(ssh "$SERVER" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000" || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
    echo -e "${GREEN}✓ Application is responding (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${YELLOW}! Application response: HTTP $HTTP_CODE${NC}"
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Remote Deployment Completed Successfully!       ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

echo "Deployment Information:"
echo "  Target Server: $SERVER_HOSTNAME ($SERVER_IP)"
echo "  Application Status: $PM2_STATUS"
echo "  HTTP Response: $HTTP_CODE"
echo ""

echo "Access URLs:"
echo "  Direct: http://$SERVER_IP:3000"
echo "  Nginx:  http://$SERVER_IP"
echo ""

echo "Quick Commands:"
echo "  Check logs:     ssh $SERVER 'pm2 logs exam-system-frontend'"
echo "  Check status:   ssh $SERVER 'pm2 status'"
echo "  Restart app:    ssh $SERVER 'pm2 restart exam-system-frontend'"
echo "  Monitor:        ssh $SERVER 'pm2 monit'"
echo ""

echo "To deploy to additional servers:"
echo "  $0 gt-omr-web-2"
echo "  $0 gt-omr-web-3"
echo ""

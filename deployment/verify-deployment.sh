#!/bin/bash
# verify-deployment.sh
# Verifies frontend deployment on a server
# Usage: ./verify-deployment.sh [SERVER]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

SERVER="${1:-gt-omr-web-1}"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Frontend Deployment Verification              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Target Server: $SERVER"
echo ""

# Test SSH connection
echo -e "${BLUE}[1/10] Testing SSH Connection...${NC}"
if ssh -o ConnectTimeout=5 "$SERVER" "echo 'OK'" &>/dev/null; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
else
    echo -e "${RED}✗ Cannot connect via SSH${NC}"
    exit 1
fi

# Get server info
SERVER_INFO=$(ssh "$SERVER" "hostname && hostname -I | awk '{print \$1}'")
SERVER_HOSTNAME=$(echo "$SERVER_INFO" | sed -n '1p')
SERVER_IP=$(echo "$SERVER_INFO" | sed -n '2p')
echo "  Hostname: $SERVER_HOSTNAME"
echo "  IP: $SERVER_IP"
echo ""

# Check dependencies
echo -e "${BLUE}[2/10] Checking Dependencies...${NC}"
DEPS_OK=true

if ssh "$SERVER" "command -v node &>/dev/null"; then
    NODE_VER=$(ssh "$SERVER" "node -v")
    echo -e "${GREEN}✓ Node.js: $NODE_VER${NC}"
else
    echo -e "${RED}✗ Node.js not found${NC}"
    DEPS_OK=false
fi

if ssh "$SERVER" "command -v pnpm &>/dev/null"; then
    PNPM_VER=$(ssh "$SERVER" "pnpm -v")
    echo -e "${GREEN}✓ pnpm: $PNPM_VER${NC}"
else
    echo -e "${RED}✗ pnpm not found${NC}"
    DEPS_OK=false
fi

if ssh "$SERVER" "command -v pm2 &>/dev/null"; then
    PM2_VER=$(ssh "$SERVER" "pm2 -v")
    echo -e "${GREEN}✓ PM2: $PM2_VER${NC}"
else
    echo -e "${RED}✗ PM2 not found${NC}"
    DEPS_OK=false
fi

if ssh "$SERVER" "command -v nginx &>/dev/null"; then
    NGINX_VER=$(ssh "$SERVER" "nginx -v 2>&1 | cut -d'/' -f2")
    echo -e "${GREEN}✓ Nginx: $NGINX_VER${NC}"
else
    echo -e "${RED}✗ Nginx not found${NC}"
    DEPS_OK=false
fi

if [ "$DEPS_OK" = false ]; then
    echo -e "${RED}Some dependencies are missing. Run install-dependencies.sh${NC}"
fi
echo ""

# Check CephFS
echo -e "${BLUE}[3/10] Checking CephFS Mount...${NC}"
if ssh "$SERVER" "[ -d /cephfs/exam-system/frontend ]"; then
    echo -e "${GREEN}✓ CephFS mounted${NC}"
    
    # Check current release
    if ssh "$SERVER" "[ -L /cephfs/exam-system/frontend/current ]"; then
        CURRENT=$(ssh "$SERVER" "readlink -f /cephfs/exam-system/frontend/current")
        echo "  Current release: $CURRENT"
    else
        echo -e "${YELLOW}! No current release symlink${NC}"
    fi
else
    echo -e "${RED}✗ CephFS not mounted or frontend directory missing${NC}"
fi
echo ""

# Check local directory structure
echo -e "${BLUE}[4/10] Checking Local Directory Structure...${NC}"
if ssh "$SERVER" "[ -d /opt/exam-system-frontend ]"; then
    echo -e "${GREEN}✓ Local directory exists${NC}"
    
    # Check symlink
    if ssh "$SERVER" "[ -L /opt/exam-system-frontend/current ]"; then
        echo -e "${GREEN}✓ Symlink to CephFS exists${NC}"
    else
        echo -e "${YELLOW}! Symlink missing${NC}"
    fi
    
    # Check env file
    if ssh "$SERVER" "[ -f /opt/exam-system-frontend/.env.local ]"; then
        echo -e "${GREEN}✓ Environment file exists${NC}"
    else
        echo -e "${YELLOW}! Environment file missing${NC}"
    fi
else
    echo -e "${RED}✗ Local directory not found${NC}"
fi
echo ""

# Check code deployment
echo -e "${BLUE}[5/10] Checking Code Deployment...${NC}"
if ssh "$SERVER" "[ -f /cephfs/exam-system/frontend/current/package.json ]"; then
    echo -e "${GREEN}✓ Code deployed to CephFS${NC}"
    
    # Check node_modules
    if ssh "$SERVER" "[ -d /cephfs/exam-system/frontend/current/node_modules ]"; then
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${YELLOW}! Dependencies not installed${NC}"
    fi
    
    # Check .next build
    if ssh "$SERVER" "[ -d /cephfs/exam-system/frontend/current/.next ]"; then
        echo -e "${GREEN}✓ Production build exists${NC}"
    else
        echo -e "${YELLOW}! Production build missing${NC}"
    fi
else
    echo -e "${RED}✗ Code not deployed${NC}"
fi
echo ""

# Check PM2 status
echo -e "${BLUE}[6/10] Checking PM2 Status...${NC}"
if ssh "$SERVER" "pm2 describe exam-system-frontend &>/dev/null"; then
    PM2_STATUS=$(ssh "$SERVER" "pm2 jlist 2>/dev/null | jq -r '.[] | select(.name==\"exam-system-frontend\") | .pm2_env.status'")
    
    if [ "$PM2_STATUS" = "online" ]; then
        echo -e "${GREEN}✓ Application is online${NC}"
        
        # Get instance count
        INSTANCES=$(ssh "$SERVER" "pm2 jlist 2>/dev/null | jq '[.[] | select(.name==\"exam-system-frontend\")] | length'")
        echo "  Instances: $INSTANCES"
        
        # Get uptime
        UPTIME=$(ssh "$SERVER" "pm2 jlist 2>/dev/null | jq -r '.[] | select(.name==\"exam-system-frontend\") | .pm2_env.pm_uptime' | head -1")
        if [ -n "$UPTIME" ]; then
            UPTIME_HUMAN=$(date -d "@$((UPTIME/1000))" -u +"%Y-%m-%d %H:%M:%S")
            echo "  Started: $UPTIME_HUMAN"
        fi
    else
        echo -e "${RED}✗ Application status: ${PM2_STATUS}${NC}"
    fi
else
    echo -e "${RED}✗ Application not found in PM2${NC}"
fi
echo ""

# Check Nginx
echo -e "${BLUE}[7/10] Checking Nginx...${NC}"
if ssh "$SERVER" "systemctl is-active nginx &>/dev/null"; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
    
    # Check config
    if ssh "$SERVER" "[ -f /etc/nginx/sites-available/exam-system-frontend ]"; then
        echo -e "${GREEN}✓ Nginx config exists${NC}"
        
        # Check if enabled
        if ssh "$SERVER" "[ -L /etc/nginx/sites-enabled/exam-system-frontend ]"; then
            echo -e "${GREEN}✓ Site is enabled${NC}"
        else
            echo -e "${YELLOW}! Site not enabled${NC}"
        fi
    else
        echo -e "${YELLOW}! Nginx config missing${NC}"
    fi
    
    # Test config
    if ssh "$SERVER" "nginx -t &>/dev/null"; then
        echo -e "${GREEN}✓ Nginx config is valid${NC}"
    else
        echo -e "${RED}✗ Nginx config has errors${NC}"
    fi
else
    echo -e "${RED}✗ Nginx is not running${NC}"
fi
echo ""

# Test application port
echo -e "${BLUE}[8/10] Testing Application Port (3000)...${NC}"
HTTP_CODE=$(ssh "$SERVER" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000" || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
    echo -e "${GREEN}✓ Application responding on port 3000 (HTTP $HTTP_CODE)${NC}"
elif [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✓ Application responding with redirect (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ Application not responding (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test Nginx proxy
echo -e "${BLUE}[9/10] Testing Nginx Proxy...${NC}"
NGINX_CODE=$(ssh "$SERVER" "curl -s -o /dev/null -w '%{http_code}' http://localhost" || echo "000")

if [ "$NGINX_CODE" = "200" ] || [ "$NGINX_CODE" = "304" ]; then
    echo -e "${GREEN}✓ Nginx proxy working (HTTP $NGINX_CODE)${NC}"
elif [ "$NGINX_CODE" = "301" ] || [ "$NGINX_CODE" = "302" ]; then
    echo -e "${GREEN}✓ Nginx proxy responding with redirect (HTTP $NGINX_CODE)${NC}"
else
    echo -e "${RED}✗ Nginx proxy not working (HTTP $NGINX_CODE)${NC}"
fi
echo ""

# Check logs for errors
echo -e "${BLUE}[10/10] Checking Recent Logs...${NC}"
ERROR_COUNT=$(ssh "$SERVER" "pm2 logs exam-system-frontend --lines 100 --nostream 2>/dev/null | grep -i error | wc -l" || echo "0")

if [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓ No recent errors in PM2 logs${NC}"
else
    echo -e "${YELLOW}! Found $ERROR_COUNT error(s) in recent logs${NC}"
    echo "  Review with: ssh $SERVER 'pm2 logs exam-system-frontend --lines 100'"
fi

# Check Nginx error log
NGINX_ERRORS=$(ssh "$SERVER" "tail -50 /var/log/nginx/exam-system-frontend.error.log 2>/dev/null | wc -l" || echo "0")
if [ "$NGINX_ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✓ No recent Nginx errors${NC}"
else
    echo -e "${YELLOW}! Found entries in Nginx error log${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                 Verification Summary                  ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

ALL_OK=true

# Critical checks
if [ "$DEPS_OK" = false ]; then ALL_OK=false; fi
if [ "$PM2_STATUS" != "online" ]; then ALL_OK=false; fi
if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "304" ] && [ "$HTTP_CODE" != "301" ] && [ "$HTTP_CODE" != "302" ]; then ALL_OK=false; fi

if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo ""
    echo "Access URLs:"
    echo "  Direct: http://$SERVER_IP:3000"
    echo "  Nginx:  http://$SERVER_IP"
    echo ""
    echo "Status: ${GREEN}DEPLOYMENT SUCCESSFUL${NC}"
else
    echo -e "${RED}✗ Some checks failed${NC}"
    echo ""
    echo "Status: ${RED}DEPLOYMENT HAS ISSUES${NC}"
    echo ""
    echo "Review the output above and check:"
    echo "  1. PM2 logs: ssh $SERVER 'pm2 logs exam-system-frontend'"
    echo "  2. Nginx logs: ssh $SERVER 'tail -f /var/log/nginx/exam-system-frontend.error.log'"
    echo "  3. System status: ssh $SERVER 'pm2 monit'"
fi
echo ""

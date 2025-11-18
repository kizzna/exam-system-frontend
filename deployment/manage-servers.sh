#!/bin/bash
# manage-servers.sh
# Utility script for managing multiple frontend servers
# Usage: ./manage-servers.sh [command] [options]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Server list (modify as needed)
SERVERS=("gt-omr-web-1" "gt-omr-web-2" "gt-omr-web-3")

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Functions
show_usage() {
    cat << EOF
Frontend Server Management Utility

USAGE:
    $0 <command> [options]

COMMANDS:
    deploy-all [--build]     Deploy to all servers
    status                   Show status of all servers
    logs [server]           Show logs from server(s)
    restart-all             Restart application on all servers
    reload-all              Reload application on all servers (zero-downtime)
    verify-all              Verify deployment on all servers
    list                    List all configured servers
    exec [command]          Execute command on all servers
    
OPTIONS:
    --build                 Build before deploying
    --skip-deps            Skip dependency installation
    
EXAMPLES:
    $0 deploy-all --build
    $0 status
    $0 logs gt-omr-web-1
    $0 restart-all
    $0 exec "pm2 status"

EOF
}

# Deploy to all servers
deploy_all() {
    local BUILD_FLAG=""
    local SKIP_DEPS_FLAG=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --build)
                BUILD_FLAG="--build"
                shift
                ;;
            --skip-deps)
                SKIP_DEPS_FLAG="--skip-deps"
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           Deploying to All Servers                   ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    for server in "${SERVERS[@]}"; do
        echo -e "${BLUE}━━━ Deploying to $server ━━━${NC}"
        
        if "$SCRIPT_DIR/remote-deploy.sh" "$server" $BUILD_FLAG $SKIP_DEPS_FLAG; then
            echo -e "${GREEN}✓ $server deployment successful${NC}"
        else
            echo -e "${RED}✗ $server deployment failed${NC}"
            read -p "Continue with remaining servers? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
        echo ""
    done
    
    echo -e "${GREEN}All deployments completed${NC}"
}

# Show status of all servers
show_status() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║              Server Status Overview                  ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    for server in "${SERVERS[@]}"; do
        echo -e "${BLUE}━━━ $server ━━━${NC}"
        
        # Check SSH connectivity
        if ! ssh -o ConnectTimeout=5 "$server" "echo 'OK'" &>/dev/null; then
            echo -e "${RED}✗ Cannot connect via SSH${NC}"
            echo ""
            continue
        fi
        
        # Get server info
        SERVER_IP=$(ssh "$server" "hostname -I | awk '{print \$1}'")
        echo "IP: $SERVER_IP"
        
        # Check PM2 status
        if ssh "$server" "command -v pm2 &>/dev/null && pm2 describe exam-system-frontend &>/dev/null"; then
            PM2_STATUS=$(ssh "$server" "pm2 jlist 2>/dev/null | jq -r '.[] | select(.name==\"exam-system-frontend\") | .pm2_env.status'")
            INSTANCES=$(ssh "$server" "pm2 jlist 2>/dev/null | jq '[.[] | select(.name==\"exam-system-frontend\")] | length'")
            
            if [ "$PM2_STATUS" = "online" ]; then
                echo -e "Status: ${GREEN}ONLINE${NC} ($INSTANCES instances)"
            else
                echo -e "Status: ${RED}$PM2_STATUS${NC}"
            fi
            
            # Get memory usage
            MEMORY=$(ssh "$server" "pm2 jlist 2>/dev/null | jq '[.[] | select(.name==\"exam-system-frontend\")] | map(.monit.memory) | add' 2>/dev/null || echo '0'")
            MEMORY_MB=$((MEMORY / 1024 / 1024))
            echo "Memory: ${MEMORY_MB}MB"
            
            # Get CPU usage
            CPU=$(ssh "$server" "pm2 jlist 2>/dev/null | jq '[.[] | select(.name==\"exam-system-frontend\")] | map(.monit.cpu) | add' 2>/dev/null || echo '0'")
            echo "CPU: ${CPU}%"
        else
            echo -e "Status: ${RED}NOT RUNNING${NC}"
        fi
        
        # Check HTTP response
        HTTP_CODE=$(ssh "$server" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000" 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
            echo -e "HTTP: ${GREEN}$HTTP_CODE${NC}"
        else
            echo -e "HTTP: ${RED}$HTTP_CODE${NC}"
        fi
        
        echo ""
    done
}

# Show logs from server(s)
show_logs() {
    local SERVER="${1:-all}"
    
    if [ "$SERVER" = "all" ]; then
        echo "Showing logs from all servers (last 20 lines each):"
        echo ""
        
        for srv in "${SERVERS[@]}"; do
            echo -e "${BLUE}━━━ $srv ━━━${NC}"
            ssh "$srv" "pm2 logs exam-system-frontend --lines 20 --nostream 2>/dev/null || echo 'No logs available'"
            echo ""
        done
    else
        echo -e "${BLUE}Streaming logs from $SERVER...${NC}"
        echo "Press Ctrl+C to stop"
        echo ""
        ssh -t "$SERVER" "pm2 logs exam-system-frontend"
    fi
}

# Restart all servers
restart_all() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║          Restarting All Servers                      ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    for server in "${SERVERS[@]}"; do
        echo -e "${BLUE}━━━ Restarting $server ━━━${NC}"
        
        if ssh "$server" "pm2 restart exam-system-frontend"; then
            echo -e "${GREEN}✓ $server restarted${NC}"
        else
            echo -e "${RED}✗ $server restart failed${NC}"
        fi
        echo ""
    done
}

# Reload all servers (zero-downtime)
reload_all() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║       Reloading All Servers (Zero-Downtime)          ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    for server in "${SERVERS[@]}"; do
        echo -e "${BLUE}━━━ Reloading $server ━━━${NC}"
        
        if ssh "$server" "pm2 reload exam-system-frontend"; then
            echo -e "${GREEN}✓ $server reloaded${NC}"
        else
            echo -e "${RED}✗ $server reload failed${NC}"
        fi
        echo ""
    done
}

# Verify all servers
verify_all() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║          Verifying All Servers                       ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    for server in "${SERVERS[@]}"; do
        echo -e "${BLUE}━━━ Verifying $server ━━━${NC}"
        echo ""
        
        if "$SCRIPT_DIR/verify-deployment.sh" "$server"; then
            echo -e "${GREEN}✓ $server verification passed${NC}"
        else
            echo -e "${RED}✗ $server verification failed${NC}"
        fi
        echo ""
        read -p "Press Enter to continue to next server..."
        echo ""
    done
}

# List all servers
list_servers() {
    echo -e "${BLUE}Configured Servers:${NC}"
    echo ""
    
    for i in "${!SERVERS[@]}"; do
        server="${SERVERS[$i]}"
        
        # Try to get IP
        if IP=$(ssh -o ConnectTimeout=2 "$server" "hostname -I | awk '{print \$1}'" 2>/dev/null); then
            echo -e "  $((i+1)). $server ${GREEN}(${IP})${NC}"
        else
            echo -e "  $((i+1)). $server ${RED}(unreachable)${NC}"
        fi
    done
    echo ""
}

# Execute command on all servers
exec_all() {
    local CMD="$*"
    
    if [ -z "$CMD" ]; then
        echo -e "${RED}Error: No command specified${NC}"
        echo "Usage: $0 exec <command>"
        exit 1
    fi
    
    echo -e "${BLUE}Executing on all servers: ${YELLOW}$CMD${NC}"
    echo ""
    
    for server in "${SERVERS[@]}"; do
        echo -e "${BLUE}━━━ $server ━━━${NC}"
        
        if ssh "$server" "$CMD"; then
            echo -e "${GREEN}✓ Success${NC}"
        else
            echo -e "${RED}✗ Failed${NC}"
        fi
        echo ""
    done
}

# Main script logic
if [ $# -eq 0 ]; then
    show_usage
    exit 0
fi

COMMAND=$1
shift

case $COMMAND in
    deploy-all)
        deploy_all "$@"
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$@"
        ;;
    restart-all)
        restart_all
        ;;
    reload-all)
        reload_all
        ;;
    verify-all)
        verify_all
        ;;
    list)
        list_servers
        ;;
    exec)
        exec_all "$@"
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac

#!/bin/bash
# setup-frontend-local.sh
# Sets up local directory structure for frontend on gt-omr-web-1
# Usage: sudo ./setup-frontend-local.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Setting up Frontend Local Environment ===${NC}"
echo ""

# Configuration
LOCAL_ROOT="/opt/exam-system-frontend"
CEPHFS_FRONTEND="/cephfs/exam-system/frontend"
USER="www-data"
GROUP="www-data"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: Please run as root (sudo)${NC}"
    exit 1
fi

# Check CephFS is mounted
if [ ! -d "/cephfs" ]; then
    echo -e "${RED}Error: CephFS not mounted at /cephfs${NC}"
    echo "Please mount CephFS first"
    exit 1
fi

if [ ! -d "$CEPHFS_FRONTEND" ]; then
    echo -e "${YELLOW}Warning: CephFS frontend not found at $CEPHFS_FRONTEND${NC}"
    echo "Creating directory structure..."
    mkdir -p "$CEPHFS_FRONTEND"/{releases,shared/{uploads,cache,logs}}
fi

# Create local directory structure
echo "Creating local directory structure..."
mkdir -p "$LOCAL_ROOT"/{logs,tmp/{uploads,processing},cache,backups/{configs,releases}}

# Create symlink to shared code
echo "Creating symlink to CephFS..."
if [ -L "$LOCAL_ROOT/current" ]; then
    echo "  Symlink already exists"
    ls -l "$LOCAL_ROOT/current"
elif [ -e "$LOCAL_ROOT/current" ]; then
    echo -e "${YELLOW}  Warning: $LOCAL_ROOT/current exists but is not a symlink${NC}"
    echo "  Moving to backups..."
    mv "$LOCAL_ROOT/current" "$LOCAL_ROOT/backups/current.backup.$(date +%Y%m%d_%H%M%S)"
    ln -s "$CEPHFS_FRONTEND/current" "$LOCAL_ROOT/current"
else
    ln -s "$CEPHFS_FRONTEND/current" "$LOCAL_ROOT/current"
    echo -e "${GREEN}  ✓ Symlink created${NC}"
fi

# Create local .env file
if [ ! -f "$LOCAL_ROOT/.env.local" ]; then
    echo "Creating local environment file..."
    cat > "$LOCAL_ROOT/.env.local" << 'EOF'
# Server-specific environment variables
# gt-omr-web-1

# Node environment
NODE_ENV=production
PORT=3000

# API Configuration
NEXT_PUBLIC_API_URL=http://10.10.24.131:8000

# Server identification (useful for multi-server setup)
SERVER_ID=gt-omr-web-1
SERVER_IP=10.10.24.151

# Logging
LOG_LEVEL=info
LOG_DIR=/opt/exam-system-frontend/logs

# Cache
CACHE_DIR=/opt/exam-system-frontend/cache

# Uploads (if handling local uploads)
UPLOAD_DIR=/opt/exam-system-frontend/tmp/uploads
MAX_UPLOAD_SIZE=104857600

# Performance
NODE_OPTIONS=--max-old-space-size=4096
EOF
    echo -e "${GREEN}  ✓ Created .env.local${NC}"
else
    echo -e "${YELLOW}  ! .env.local already exists, skipping${NC}"
fi

# Create PM2 ecosystem config
if [ ! -f "$LOCAL_ROOT/ecosystem.config.js" ]; then
    echo "Creating PM2 ecosystem config..."
cat > "$LOCAL_ROOT/ecosystem.config.js" << 'EOFPM2'
module.exports = {
  apps: [{
    name: 'exam-system-frontend',
    script: '.next/standalone/server.js',
    
    // Use symlink to shared code
    cwd: '/opt/exam-system-frontend/current',
    
    // Cluster mode - PM2 will run multiple instances
    instances: 'max', // Use all available CPU cores
    exec_mode: 'cluster',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_API_URL: 'http://10.10.24.131:8000',
      HOSTNAME: '0.0.0.0',
      
      // Local paths
      LOG_DIR: '/opt/exam-system-frontend/logs',
      CACHE_DIR: '/opt/exam-system-frontend/cache',
      UPLOAD_DIR: '/opt/exam-system-frontend/tmp/uploads',
      
      // Server identification
      SERVER_ID: 'gt-omr-web-1',
      SERVER_IP: '10.10.24.151',
      
      // Performance
      NODE_OPTIONS: '--max-old-space-size=4096'
    },
    
    // Use local log files
    error_file: '/opt/exam-system-frontend/logs/error.log',
    out_file: '/opt/exam-system-frontend/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Resource limits
    max_memory_restart: '4G',
    
    // Restart policy
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Don't watch files
    watch: false,
    
    // Graceful shutdown
    kill_timeout: 5000
  }]
};
EOFPM2
    echo -e "${GREEN}  ✓ Created ecosystem.config.js${NC}"
else
    echo -e "${YELLOW}  ! ecosystem.config.js already exists, skipping${NC}"
fi

# Create backup script
if [ ! -f "$LOCAL_ROOT/scripts/backup-local-config.sh" ]; then
    echo "Creating backup script..."
    mkdir -p "$LOCAL_ROOT/scripts"
    cat > "$LOCAL_ROOT/scripts/backup-local-config.sh" << 'EOF'
#!/bin/bash
# Backup local configuration files

BACKUP_DIR="/opt/exam-system-frontend/backups/configs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup local configs
tar -czf "$BACKUP_DIR/config-$TIMESTAMP.tar.gz" \
    /opt/exam-system-frontend/.env.local \
    /opt/exam-system-frontend/ecosystem.config.js \
    /etc/nginx/sites-available/exam-system-frontend 2>/dev/null || true

# Keep last 30 backups
ls -t "$BACKUP_DIR"/config-*.tar.gz 2>/dev/null | tail -n +31 | xargs rm -f

echo "Config backup completed: $TIMESTAMP"
EOF
    chmod +x "$LOCAL_ROOT/scripts/backup-local-config.sh"
    echo -e "${GREEN}  ✓ Created backup script${NC}"
fi

# Create cache cleanup script
if [ ! -f "$LOCAL_ROOT/scripts/cleanup-cache.sh" ]; then
    echo "Creating cache cleanup script..."
    cat > "$LOCAL_ROOT/scripts/cleanup-cache.sh" << 'EOF'
#!/bin/bash
# Clean up old cache and temp files

# Clean cache older than 7 days
find /opt/exam-system-frontend/cache -type f -mtime +7 -delete 2>/dev/null

# Clean temp files older than 1 day
find /opt/exam-system-frontend/tmp -type f -mtime +1 -delete 2>/dev/null

echo "Cache cleanup completed: $(date)" >> /opt/exam-system-frontend/logs/maintenance.log
EOF
    chmod +x "$LOCAL_ROOT/scripts/cleanup-cache.sh"
    echo -e "${GREEN}  ✓ Created cleanup script${NC}"
fi

# Set ownership
echo "Setting ownership to $USER:$GROUP..."
chown -R $USER:$GROUP "$LOCAL_ROOT"

# Set permissions
echo "Setting permissions..."
chmod 755 "$LOCAL_ROOT"
chmod 755 "$LOCAL_ROOT"/{logs,tmp,cache,backups,scripts}
chmod 775 "$LOCAL_ROOT"/tmp/{uploads,processing}
chmod 600 "$LOCAL_ROOT/.env.local"
chmod 644 "$LOCAL_ROOT/ecosystem.config.js"

# Create logrotate config
if [ ! -f "/etc/logrotate.d/exam-system-frontend" ]; then
    echo "Creating logrotate configuration..."
    cat > /etc/logrotate.d/exam-system-frontend << 'EOF'
/opt/exam-system-frontend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs 2>/dev/null || true
    endscript
}
EOF
    echo -e "${GREEN}  ✓ Created logrotate config${NC}"
fi

# Verify setup
echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "Directory structure:"
if command -v tree &> /dev/null; then
    tree -L 2 -a "$LOCAL_ROOT"
else
    ls -la "$LOCAL_ROOT"
fi

echo ""
echo "Symlink verification:"
ls -l "$LOCAL_ROOT/current"
if [ -L "$LOCAL_ROOT/current" ]; then
    echo -e "${GREEN}  ✓ Symlink OK${NC}"
    readlink -f "$LOCAL_ROOT/current" || echo -e "${YELLOW}  ! Target does not exist yet${NC}"
else
    echo -e "${RED}  ✗ Symlink not created${NC}"
fi

echo ""
echo "File permissions:"
ls -la "$LOCAL_ROOT" | head -10

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Ensure CephFS frontend deployment is synced:"
echo "   ls /cephfs/exam-system/frontend/current"
echo ""
echo "2. Review and customize server-specific config:"
echo "   vim $LOCAL_ROOT/.env.local"
echo ""
echo "3. If Node.js/PM2 not installed, install them:"
echo "   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
echo "   sudo apt-get install -y nodejs"
echo "   sudo npm install -g pnpm pm2"
echo ""
echo "4. Start the application:"
echo "   cd $LOCAL_ROOT"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "5. Set up cron jobs (optional):"
echo "   echo '0 2 * * * $LOCAL_ROOT/scripts/backup-local-config.sh' | crontab -"
echo "   echo '0 3 * * * $LOCAL_ROOT/scripts/cleanup-cache.sh' | crontab -"
echo ""
echo -e "${GREEN}Setup script completed successfully!${NC}"

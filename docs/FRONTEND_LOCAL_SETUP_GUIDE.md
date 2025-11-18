# Frontend Local Setup Guide - Hybrid CephFS + Local Storage

**Server:** gt-omr-web-1  
**Date:** November 18, 2025  
**Pattern:** Mirror backend's `/opt/omr/` structure

---

## Architecture Overview

### Backend Pattern (Current)
```
/opt/omr/
├── current -> /cephfs/omr/current    # Symlink to shared code
├── logs/                             # Local logs
├── tmp/                              # Local temp files
└── venv/                             # Local Python environment
```

### Frontend Pattern (Recommended)
```
/opt/exam-system-frontend/
├── current -> /cephfs/exam-system/frontend/current  # Symlink to shared code
├── logs/                                            # Local logs
├── tmp/                                             # Local temp files
├── cache/                                           # Local build cache
└── node_modules -> current/node_modules             # OR local if needed
```

---

## Why Hybrid Approach?

### ✅ Keep on CephFS (Shared)
- **Source code** - App, components, lib, config files
- **Build output** - `.next/` directory (pre-built)
- **node_modules** - Production dependencies (if consistent across servers)
- **Static assets** - Public files, images

### ✅ Keep Locally (Server-Specific)
- **Logs** - Each server's application logs
- **Temp files** - Upload buffers, processing temp
- **Cache** - Server-specific Next.js cache
- **Process state** - PM2 state, PIDs
- **Environment configs** - Server-specific .env files

---

## Recommended Structure

### Complete Directory Layout

```
/opt/exam-system-frontend/
├── current -> /cephfs/exam-system/frontend/current
│
├── logs/                           # Local application logs
│   ├── error.log
│   ├── out.log
│   ├── pm2.log
│   └── nginx-access.log -> /var/log/nginx/omr-access.log
│
├── tmp/                            # Local temporary files
│   ├── uploads/                    # Temporary file uploads
│   └── processing/                 # Processing buffers
│
├── cache/                          # Local Next.js cache
│   ├── .next/cache/                # Build cache (if not using shared)
│   └── images/                     # Image optimization cache
│
├── .env.local                      # Server-specific environment
│
└── backups/                        # Local backups
    ├── node_modules.backup.YYYYMMDD/
    └── configs/

# CephFS (shared across servers)
/cephfs/exam-system/frontend/
├── current -> releases/dev-20251118_143022
├── releases/
│   └── dev-20251118_143022/
│       ├── .next/                  # Pre-built output
│       ├── app/
│       ├── components/
│       ├── lib/
│       ├── public/
│       ├── node_modules/           # Production dependencies
│       ├── package.json
│       ├── next.config.mjs
│       └── .env.production         # Default production config
│
└── shared/                         # Optional shared persistent data
    ├── uploads/                    # User uploads (if needed)
    └── user-cache/                 # User-specific cache
```

---

## Setup Script for gt-omr-web-1

Create this setup script:

```bash
#!/bin/bash
# setup-frontend-local.sh
# Sets up local directory structure for frontend on gt-omr-web-1

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    echo "Please run as root (sudo)"
    exit 1
fi

# Check CephFS is mounted
if [ ! -d "$CEPHFS_FRONTEND" ]; then
    echo -e "${YELLOW}Warning: CephFS frontend not found at $CEPHFS_FRONTEND${NC}"
    echo "Make sure CephFS is mounted and synced from dev container"
    exit 1
fi

# Create local directory structure
echo "Creating local directory structure..."
mkdir -p "$LOCAL_ROOT"/{logs,tmp/{uploads,processing},cache,backups}

# Create symlink to shared code
echo "Creating symlink to CephFS..."
if [ -L "$LOCAL_ROOT/current" ]; then
    echo "Symlink already exists, removing old one..."
    rm "$LOCAL_ROOT/current"
fi
ln -s "$CEPHFS_FRONTEND/current" "$LOCAL_ROOT/current"

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
    echo -e "${GREEN}✓ Created .env.local${NC}"
else
    echo -e "${YELLOW}! .env.local already exists, skipping${NC}"
fi

# Set ownership
echo "Setting ownership to $USER:$GROUP..."
chown -R $USER:$GROUP "$LOCAL_ROOT"

# Set permissions
echo "Setting permissions..."
chmod 755 "$LOCAL_ROOT"
chmod 755 "$LOCAL_ROOT"/{logs,tmp,cache,backups}
chmod 775 "$LOCAL_ROOT"/tmp/{uploads,processing}
chmod 600 "$LOCAL_ROOT/.env.local"

# Verify setup
echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "Directory structure:"
tree -L 2 "$LOCAL_ROOT" 2>/dev/null || ls -la "$LOCAL_ROOT"

echo ""
echo "Symlink verification:"
ls -l "$LOCAL_ROOT/current"

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Verify CephFS deployment has necessary files"
echo "2. Review and customize $LOCAL_ROOT/.env.local"
echo "3. Set up PM2 with ecosystem.config.js"
echo "4. Start the application: pm2 start ecosystem.config.js"
echo ""
```

Save as `/opt/exam-system-frontend/setup-frontend-local.sh`, then:

```bash
sudo chmod +x /opt/exam-system-frontend/setup-frontend-local.sh
sudo /opt/exam-system-frontend/setup-frontend-local.sh
```

---

## PM2 Ecosystem Configuration

Create `/opt/exam-system-frontend/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'exam-system-frontend',
    script: 'node_modules/.bin/next',
    args: 'start',
    
    // Use symlink to shared code
    cwd: '/opt/exam-system-frontend/current',
    
    // Cluster mode for load balancing
    instances: 4,
    exec_mode: 'cluster',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_API_URL: 'http://10.10.24.131:8000',
      
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
    max_memory_restart: '2G',
    
    // Restart policy
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Don't watch files (we deploy via symlink updates)
    watch: false,
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
```

---

## Next.js Configuration

Update `/cephfs/exam-system/frontend/current/next.config.mjs` to use local cache:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use local cache directory (faster on local SSD)
  distDir: process.env.CACHE_DIR 
    ? `${process.env.CACHE_DIR}/.next` 
    : '.next',
  
  // Compress responses
  compress: true,
  
  // Image optimization with local cache
  images: {
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Use local cache for optimized images
    loader: 'default',
  },
  
  // Output standalone for production
  output: 'standalone',
  
  // Logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  // Performance
  swcMinify: true,
  
  // Custom headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Server-ID',
            value: process.env.SERVER_ID || 'unknown',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## Deployment Workflow

### 1. Development (Dev Container)

```bash
# In /workspaces/exam-system-frontend

# Make changes
vim app/dashboard/page.tsx

# Test locally
pnpm dev

# Build for production
pnpm build
```

### 2. Sync to CephFS

```bash
# Deploy with production build
./scripts/dev-sync-frontend.sh --build

# This updates /cephfs/exam-system/frontend/current
```

### 3. Deploy on gt-omr-web-1

```bash
# SSH to server
ssh gt-omr-web-1

# The symlink automatically points to new code
ls -la /opt/exam-system-frontend/current
# -> /cephfs/exam-system/frontend/current -> releases/dev-YYYYMMDD_HHMMSS

# Reload PM2 (graceful restart)
pm2 reload exam-system-frontend

# Or full restart if needed
pm2 restart exam-system-frontend

# Verify
pm2 status
pm2 logs exam-system-frontend --lines 50
curl http://localhost:3000
```

### 4. Verify Deployment

```bash
# Check which release is active
readlink /opt/exam-system-frontend/current
readlink /cephfs/exam-system/frontend/current

# Check server response includes server ID
curl -I http://localhost:3000 | grep X-Server-ID

# Monitor logs
tail -f /opt/exam-system-frontend/logs/out.log
```

---

## File Location Decision Matrix

| File/Directory | Location | Reason |
|----------------|----------|---------|
| **Source Code** | CephFS | Shared, version controlled |
| `app/`, `components/`, `lib/` | CephFS | Code to run |
| `package.json` | CephFS | Dependency definitions |
| **Build Output** | CephFS | Pre-built, ready to run |
| `.next/` | CephFS | Built during sync |
| `node_modules/` | CephFS | Consistent dependencies |
| **Local Data** | Local | Server-specific |
| Logs | `/opt/exam-system-frontend/logs/` | Each server's logs |
| Cache | `/opt/exam-system-frontend/cache/` | Local SSD faster |
| Temp uploads | `/opt/exam-system-frontend/tmp/` | Temporary processing |
| `.env.local` | Local | Server-specific config |
| **Shared Persistent Data** | CephFS | If needed |
| User uploads | `/cephfs/exam-system/frontend/shared/uploads/` | Accessible from all servers |

---

## Multi-Server Setup (Future)

When adding more web servers (gt-omr-web-2, gt-omr-web-3):

### On Each Server

```bash
# 1. Mount CephFS
sudo mount /cephfs

# 2. Run setup script
sudo /opt/exam-system-frontend/setup-frontend-local.sh

# 3. Customize .env.local
sudo vim /opt/exam-system-frontend/.env.local
# Update SERVER_ID and SERVER_IP

# 4. Start PM2
cd /opt/exam-system-frontend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Load Balancer Configuration

Update Nginx on load balancer:

```nginx
upstream nextjs_cluster {
    least_conn;  # Route to server with fewest connections
    
    server 10.10.24.151:3000 weight=1 max_fails=3 fail_timeout=30s;
    server 10.10.24.152:3000 weight=1 max_fails=3 fail_timeout=30s;
    server 10.10.24.153:3000 weight=1 max_fails=3 fail_timeout=30s;
    
    keepalive 64;
}

server {
    listen 443 ssl http2;
    server_name omr.example.com;
    
    location / {
        proxy_pass http://nextjs_cluster;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        # Preserve client IP
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Sticky sessions (optional)
        # ip_hash;
    }
}
```

---

## Rollback Procedure

### Symlink Rollback (Fast)

```bash
# On gt-omr-web-1
ssh gt-omr-web-1

# Change symlink on CephFS
cd /cephfs/exam-system/frontend
sudo ln -sfn releases/dev-20251117_180000 current

# Local symlink automatically follows
ls -la /opt/exam-system-frontend/current
# -> /cephfs/exam-system/frontend/current -> releases/dev-20251117_180000

# Reload PM2
pm2 reload exam-system-frontend

# Verify
curl http://localhost:3000
```

### Local Rollback (Emergency)

If CephFS fails:

```bash
# Use local backup
cd /opt/exam-system-frontend
sudo rm current
sudo ln -s backups/release-20251117_180000 current

pm2 restart exam-system-frontend
```

---

## Monitoring & Maintenance

### Log Rotation

Create `/etc/logrotate.d/exam-system-frontend`:

```
/opt/exam-system-frontend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Cache Cleanup

Create cron job:

```bash
# /etc/cron.daily/exam-system-frontend-cache-cleanup
#!/bin/bash
# Clean cache older than 7 days

find /opt/exam-system-frontend/cache -type f -mtime +7 -delete
find /opt/exam-system-frontend/tmp -type f -mtime +1 -delete

echo "Cache cleanup completed: $(date)" >> /opt/exam-system-frontend/logs/maintenance.log
```

### Disk Usage Monitoring

```bash
# Check local storage
du -sh /opt/exam-system-frontend/*

# Check CephFS storage
du -sh /cephfs/exam-system/frontend/releases/*

# Check logs
du -sh /opt/exam-system-frontend/logs/
```

---

## Backup Strategy

### Local Config Backup

```bash
#!/bin/bash
# /opt/exam-system-frontend/scripts/backup-local-config.sh

BACKUP_DIR="/opt/exam-system-frontend/backups/configs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup local configs
tar -czf "$BACKUP_DIR/config-$TIMESTAMP.tar.gz" \
    /opt/exam-system-frontend/.env.local \
    /opt/exam-system-frontend/ecosystem.config.js \
    /etc/nginx/sites-available/exam-system-frontend

# Keep last 30 backups
ls -t "$BACKUP_DIR"/config-*.tar.gz | tail -n +31 | xargs rm -f

echo "Config backup completed: $TIMESTAMP"
```

Run daily via cron:

```bash
0 2 * * * /opt/exam-system-frontend/scripts/backup-local-config.sh
```

---

## Troubleshooting

### Symlink Issues

```bash
# Check symlink chain
ls -la /opt/exam-system-frontend/current
readlink -f /opt/exam-system-frontend/current

# Verify CephFS is mounted
mountpoint /cephfs
ls /cephfs/exam-system/frontend/current

# Recreate symlink if broken
sudo rm /opt/exam-system-frontend/current
sudo ln -s /cephfs/exam-system/frontend/current /opt/exam-system-frontend/current
```

### Local vs CephFS Cache

If experiencing cache issues:

```bash
# Clear local cache
rm -rf /opt/exam-system-frontend/cache/*

# Use CephFS cache instead
# Update ecosystem.config.js:
# CACHE_DIR: '/cephfs/exam-system/frontend/shared/cache'
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R www-data:www-data /opt/exam-system-frontend

# Fix permissions
sudo chmod 755 /opt/exam-system-frontend
sudo chmod 775 /opt/exam-system-frontend/tmp/{uploads,processing}
sudo chmod 600 /opt/exam-system-frontend/.env.local
```

---

## Comparison: Backend vs Frontend

| Aspect | Backend (/opt/omr) | Frontend (/opt/exam-system-frontend) |
|--------|-------------------|------------------------------|
| **Code Location** | CephFS symlink | CephFS symlink |
| **Dependencies** | Local venv | CephFS node_modules |
| **Build Output** | N/A (Python) | CephFS .next/ |
| **Logs** | Local | Local |
| **Temp Files** | Local | Local |
| **Cache** | Local | Local (configurable) |
| **Config** | Local .env | Local .env.local |
| **Process Manager** | systemd | PM2 |
| **Deployment** | Restart service | PM2 reload |

---

## Summary

✅ **Keep Local:**
- Logs (`/opt/exam-system-frontend/logs/`)
- Cache (`/opt/exam-system-frontend/cache/`)
- Temp files (`/opt/exam-system-frontend/tmp/`)
- Server-specific config (`.env.local`)

✅ **Keep on CephFS:**
- Source code (app/, components/, lib/)
- Build output (`.next/`)
- Dependencies (`node_modules/`)
- Shared config (`.env.production`)

✅ **Use Symlink:**
- `/opt/exam-system-frontend/current` → `/cephfs/exam-system/frontend/current`

This mirrors the backend pattern while adapting for Node.js/Next.js specifics! 🚀

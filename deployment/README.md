# Frontend Deployment Guide

Complete deployment system for the OMR Exam System Frontend on Ubuntu 24.04 servers running in Incus containers.

## Overview

This deployment system supports:

- ✅ Automated installation of all dependencies (Node.js, pnpm, PM2, Nginx)
- ✅ CephFS-based shared storage for multi-server deployments
- ✅ Zero-downtime deployments with PM2 cluster mode
- ✅ Nginx reverse proxy with caching and rate limiting
- ✅ Easy replication across multiple servers

## Architecture

```
Development Machine              CephFS Storage                Web Servers (gt-omr-web-1/2/3)
┌─────────────────┐            ┌──────────────────┐          ┌─────────────────────────┐
│                 │            │                  │          │ /opt/exam-system-frontend│
│  /workspace     │   sync     │  /cephfs/exam-   │          │   ├── current -> cephfs  │
│  (source code)  │ =========> │   system/        │          │   ├── logs/              │
│                 │            │   frontend/      │ <======> │   ├── cache/             │
│  scripts/       │            │   ├── current    │          │   └── .env.local         │
│  dev-sync-      │            │   ├── releases/  │          │                          │
│  frontend.sh    │            │   └── shared/    │          │  PM2 Cluster (4 instances)│
└─────────────────┘            └──────────────────┘          │  Nginx (reverse proxy)   │
                                                              └─────────────────────────┘
```

## Deployment Scripts

### 1. `install-dependencies.sh`

Installs all required software on the web server:

- Node.js 20 LTS
- pnpm package manager
- PM2 process manager
- Nginx web server
- Supporting tools (rsync, logrotate)

### 2. `setup-frontend-local.sh`

Creates the local directory structure and configurations:

- Creates `/opt/exam-system-frontend` directory structure
- Sets up symlink to CephFS shared code
- Creates server-specific `.env.local` file
- Creates PM2 ecosystem config
- Sets up backup and cleanup scripts
- Configures logrotate

### 3. `configure-nginx.sh`

Configures Nginx as reverse proxy:

- Creates Nginx site configuration
- Sets up caching for static assets
- Configures rate limiting
- Enables the site and reloads Nginx

### 4. `deploy-frontend.sh`

Complete deployment script (runs on web server):

- Verifies all dependencies
- Sets up directory structure
- Verifies code deployment from CephFS
- Installs Node.js dependencies
- Configures environment
- Sets up Nginx
- Starts/restarts application with PM2

### 5. `remote-deploy.sh`

Orchestrates deployment from development machine:

- Syncs code to CephFS
- Transfers deployment scripts to server
- Runs deployment on remote server
- Verifies deployment success

### 6. `verify-deployment.sh`

Comprehensive deployment verification:

- Checks all dependencies installed
- Verifies CephFS mount and code deployment
- Tests PM2 status and application health
- Validates Nginx configuration
- Checks HTTP connectivity
- Reviews logs for errors

### 7. `manage-servers.sh`

Multi-server management utility:

- Deploy to all servers at once
- Show status of all servers
- Restart/reload all servers
- Verify all deployments
- Execute commands across all servers

## Quick Start

### Initial Setup (First Server)

From your development machine:

```bash
# 1. Deploy to first server (gt-omr-web-1)
cd /workspace/deployment
./remote-deploy.sh gt-omr-web-1 --build
```

This will:

1. Build the Next.js application
2. Sync code to CephFS
3. Install all dependencies on the server
4. Configure and start the application

### Subsequent Deployments

For code updates:

```bash
# Quick deployment (no rebuild, skip deps check)
./remote-deploy.sh gt-omr-web-1 --skip-deps

# With fresh build
./remote-deploy.sh gt-omr-web-1 --build
```

### Deploy to Additional Servers

```bash
# Deploy to second server
./remote-deploy.sh gt-omr-web-2

# Deploy to third server
./remote-deploy.sh gt-omr-web-3

# Or deploy to all servers at once
./manage-servers.sh deploy-all
```

## Multi-Server Management

The `manage-servers.sh` utility provides convenient commands for managing multiple servers:

### Check Status of All Servers

```bash
./manage-servers.sh status
```

### Deploy to All Servers

```bash
# Deploy to all servers
./manage-servers.sh deploy-all

# Deploy with build
./manage-servers.sh deploy-all --build

# Deploy without checking dependencies
./manage-servers.sh deploy-all --skip-deps
```

### Restart/Reload All Servers

```bash
# Zero-downtime reload
./manage-servers.sh reload-all

# Full restart
./manage-servers.sh restart-all
```

### Verify All Deployments

```bash
./manage-servers.sh verify-all
```

### View Logs

```bash
# Show recent logs from all servers
./manage-servers.sh logs

# Stream logs from specific server
./manage-servers.sh logs gt-omr-web-1
```

### Execute Command on All Servers

```bash
./manage-servers.sh exec "pm2 status"
./manage-servers.sh exec "df -h /cephfs"
./manage-servers.sh exec "uptime"
```

### List Configured Servers

```bash
./manage-servers.sh list
```

## Manual Deployment Steps

If you prefer to run steps manually or troubleshoot:

### On Development Machine

```bash
# 1. Sync code to CephFS
cd /workspace
./scripts/dev-sync-frontend.sh --build

# 2. Transfer deployment scripts to server
scp deployment/*.sh gt-omr-web-1:/tmp/
```

### On Web Server (SSH to gt-omr-web-1)

```bash
# 1. Install dependencies (first time only)
sudo /tmp/install-dependencies.sh

# 2. Setup directory structure (first time only)
sudo /tmp/setup-frontend-local.sh

# 3. Configure Nginx (first time only)
sudo /tmp/configure-nginx.sh

# 4. Deploy application
sudo /tmp/deploy-frontend.sh --skip-deps
```

## Configuration Files

### Server-Specific: `/opt/exam-system-frontend/.env.local`

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=http://gt-omr-api-1:8000
SERVER_ID=gt-omr-web-1
SERVER_IP=10.10.24.151
```

### PM2 Configuration: `/opt/exam-system-frontend/ecosystem.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'exam-system-frontend',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/opt/exam-system-frontend/current',
    instances: 4,
    exec_mode: 'cluster',
    // ... more config
  }]
};
```

### Nginx Configuration: `/etc/nginx/sites-available/exam-system-frontend`

Includes:

- Reverse proxy to PM2 cluster
- Static file caching
- Rate limiting
- Security headers

## Common Operations

### View Application Status

```bash
# SSH to server
ssh gt-omr-web-1

# Check PM2 status
pm2 status

# View logs
pm2 logs exam-system-frontend

# Monitor resources
pm2 monit
```

### Restart Application

```bash
# Zero-downtime reload
pm2 reload exam-system-frontend

# Full restart
pm2 restart exam-system-frontend

# Stop application
pm2 stop exam-system-frontend
```

### Check Nginx

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx

# View access logs
tail -f /var/log/nginx/exam-system-frontend.access.log

# View error logs
tail -f /var/log/nginx/exam-system-frontend.error.log
```

### Update Code

From development machine:

```bash
# 1. Sync new code to CephFS
./scripts/dev-sync-frontend.sh

# 2. Reload application on server
ssh gt-omr-web-1 "pm2 reload exam-system-frontend"
```

## Directory Structure

### On Web Server

```
/opt/exam-system-frontend/
├── current -> /cephfs/exam-system/frontend/current  # Symlink to shared code
├── .env.local                                        # Server-specific config
├── ecosystem.config.js                               # PM2 configuration
├── logs/                                             # Local logs
│   ├── error.log
│   ├── out.log
│   └── deployment-*.log
├── cache/                                            # Local cache
├── tmp/                                              # Temporary files
│   ├── uploads/
│   └── processing/
├── backups/                                          # Configuration backups
│   ├── configs/
│   └── releases/
└── scripts/                                          # Maintenance scripts
    ├── backup-local-config.sh
    └── cleanup-cache.sh
```

### On CephFS (Shared)

```
/cephfs/exam-system/frontend/
├── current -> releases/dev-20251118_143022  # Symlink to active release
├── releases/                                 # Code releases
│   ├── dev-20251118_143022/
│   ├── dev-20251118_095511/
│   └── ...
└── shared/                                   # Shared data
    ├── uploads/
    ├── cache/
    └── logs/
```

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs exam-system-frontend --lines 100

# Check if dependencies are installed
cd /cephfs/exam-system/frontend/current
ls -la node_modules/

# Reinstall dependencies
pnpm install --prod

# Try starting manually
NODE_ENV=production pnpm start
```

### Nginx 502 Bad Gateway

```bash
# Check if application is running
pm2 status

# Check application is listening on port 3000
netstat -tpln | grep 3000

# Check Nginx error log
tail -f /var/log/nginx/exam-system-frontend.error.log

# Test direct connection
curl http://localhost:3000
```

### CephFS Not Mounted

```bash
# Check if CephFS is mounted
mount | grep cephfs

# Check mount point
ls -la /cephfs/exam-system/frontend/

# Remount if needed (if you have mount script)
sudo mount -t ceph ...
```

### Dependencies Installation Failed

```bash
# Update package lists
sudo apt-get update

# Try installing manually
sudo apt-get install -y curl wget gnupg ca-certificates

# Install Node.js manually
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
sudo npm install -g pnpm@latest

# Install PM2
sudo npm install -g pm2@latest
```

## Performance Tuning

### PM2 Cluster Instances

Edit `/opt/exam-system-frontend/ecosystem.config.js`:

```javascript
// For 4-core server
instances: 4

// For 8-core server
instances: 8

// Or use 'max' for auto-detection
instances: 'max'
```

Then reload:

```bash
pm2 reload exam-system-frontend
```

### Nginx Cache Size

Edit `/etc/nginx/nginx.conf`:

```nginx
# Increase cache size
proxy_cache_path /var/cache/nginx/static levels=1:2 keys_zone=STATIC:50m inactive=7d use_temp_path=off;
```

### Memory Limits

Edit `.env.local`:

```env
# Increase Node.js memory limit (default 4GB)
NODE_OPTIONS=--max-old-space-size=8192
```

## Monitoring

### Application Metrics

```bash
# PM2 monitoring
pm2 monit

# CPU and Memory usage
pm2 status

# Process list
pm2 list
```

### Nginx Metrics

```bash
# Active connections
sudo systemctl status nginx

# Request rate
tail -f /var/log/nginx/exam-system-frontend.access.log | pv -l -i 1 -r > /dev/null
```

### System Resources

```bash
# Overall system status
htop

# Disk usage
df -h

# CephFS usage
df -h /cephfs
```

## Security Considerations

1. **Environment Files**: `.env.local` contains sensitive configuration
   - Permissions: `600` (read/write owner only)
   - Owner: `www-data:www-data`

2. **Nginx**: Production deployment should use HTTPS
   - Install SSL certificates
   - Redirect HTTP to HTTPS
   - Update Nginx configuration

3. **Firewall**: Configure firewall rules

   ```bash
   # Allow HTTP/HTTPS
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

4. **PM2**: Save process list for auto-restart
   ```bash
   pm2 save
   pm2 startup
   ```

## Maintenance

### Daily Tasks (Automated via Cron)

```bash
# Add to crontab for www-data user
0 2 * * * /opt/exam-system-frontend/scripts/backup-local-config.sh
0 3 * * * /opt/exam-system-frontend/scripts/cleanup-cache.sh
```

### Weekly Tasks

- Review application logs
- Check disk usage
- Verify backup integrity

### Monthly Tasks

- Update dependencies (if needed)
- Review Nginx access patterns
- Clean old releases from CephFS

## Support

For issues or questions:

1. Check logs: `pm2 logs exam-system-frontend`
2. Check Nginx logs: `/var/log/nginx/exam-system-frontend.error.log`
3. Review this documentation
4. Check deployment script output

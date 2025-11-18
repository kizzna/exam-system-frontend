# Frontend Deployment System - Complete

✅ **Deployment system created successfully!**

## What's Been Created

### Deployment Scripts (7 files)

1. **`install-dependencies.sh`** - Installs Node.js, pnpm, PM2, Nginx on Ubuntu 24.04
2. **`setup-frontend-local.sh`** - Sets up local directory structure and CephFS symlinks
3. **`configure-nginx.sh`** - Configures Nginx reverse proxy with caching and rate limiting
4. **`deploy-frontend.sh`** - Complete deployment script (runs on server)
5. **`remote-deploy.sh`** - Orchestrates deployment from dev machine
6. **`verify-deployment.sh`** - Comprehensive deployment verification
7. **`dev-sync-frontend.sh`** - Syncs code from dev to CephFS (enhanced)

### Documentation (3 files)

1. **`README.md`** - Complete deployment guide with architecture, troubleshooting, monitoring
2. **`DEPLOYMENT_CHECKLIST.md`** - Step-by-step checklist for deployments
3. **`QUICK_REFERENCE.md`** - Quick command reference

## Quick Start

### First Deployment (Automated)

```bash
cd /workspace/deployment
./remote-deploy.sh gt-omr-web-1 --build
```

This single command will:

- ✅ Build the Next.js application
- ✅ Sync code to CephFS
- ✅ Install all dependencies (Node.js, pnpm, PM2, Nginx)
- ✅ Configure server directories
- ✅ Set up Nginx reverse proxy
- ✅ Start application with PM2
- ✅ Verify deployment

### Verify Deployment

```bash
./verify-deployment.sh gt-omr-web-1
```

### Update Code (Fast)

```bash
./remote-deploy.sh gt-omr-web-1 --skip-deps
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Development Machine                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ /workspace (your code)                                    │  │
│  │  └── deployment/                                          │  │
│  │      ├── remote-deploy.sh  <── Run this!                 │  │
│  │      └── ...                                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ SSH + rsync
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CephFS Storage                           │
│  /cephfs/exam-system/frontend/                                  │
│    ├── current -> releases/dev-TIMESTAMP                        │
│    ├── releases/                                                │
│    │   ├── dev-20251118_143022/  (code, node_modules, .next)  │
│    │   └── dev-20251118_095511/                                │
│    └── shared/ (logs, uploads, cache)                          │
└────────────────────────┬───────────────────────────────────────┘
                         │ CephFS mount
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Web Server (gt-omr-web-1/2/3)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ /opt/exam-system-frontend/                                │  │
│  │  ├── current -> /cephfs/exam-system/frontend/current     │  │
│  │  ├── .env.local (server-specific config)                 │  │
│  │  ├── logs/ (local logs)                                  │  │
│  │  └── cache/ (local cache)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  PM2 Cluster (4 instances) ─────┐                               │
│    ├── Instance 1 (port 3000)   │                               │
│    ├── Instance 2 (port 3000)   │ Load balanced                 │
│    ├── Instance 3 (port 3000)   │                               │
│    └── Instance 4 (port 3000) ──┘                               │
│                         │                                        │
│                         ▼                                        │
│  Nginx (port 80) ──────────────────────────────────────────────│
│    ├── Reverse proxy                                            │
│    ├── Static caching                                           │
│    ├── Rate limiting                                            │
│    └── Security headers                                         │
│                         │                                        │
└─────────────────────────┼────────────────────────────────────────┘
                          │
                          ▼
                    Users / Browser
```

## Key Features

### 1. **Zero-Downtime Deployments**

- PM2 cluster mode with rolling restarts
- Multiple instances serve traffic during updates

### 2. **Shared Code Storage**

- Code stored once on CephFS
- All servers reference the same code
- Reduces deployment time and storage

### 3. **Easy Scaling**

- Deploy to additional servers with one command
- Each server maintains local logs and cache
- Shared code ensures consistency

### 4. **Automated Setup**

- One command installs everything
- Idempotent scripts (safe to run multiple times)
- Comprehensive error checking

### 5. **Production-Ready**

- Nginx caching for static assets
- Rate limiting for API protection
- Security headers
- Log rotation
- Process monitoring with PM2

## Common Tasks

### Deploy to Multiple Servers

```bash
# Deploy to all three servers
./remote-deploy.sh gt-omr-web-1
./remote-deploy.sh gt-omr-web-2
./remote-deploy.sh gt-omr-web-3
```

### Update Code

```bash
# Fast update (no rebuild, skip dependency check)
./remote-deploy.sh gt-omr-web-1 --skip-deps

# Full update with build
./remote-deploy.sh gt-omr-web-1 --build
```

### Check Status

```bash
# Verify deployment
./verify-deployment.sh gt-omr-web-1

# Manual check
ssh gt-omr-web-1 "pm2 status"
```

### View Logs

```bash
# PM2 logs
ssh gt-omr-web-1 "pm2 logs exam-system-frontend"

# Nginx access log
ssh gt-omr-web-1 "tail -f /var/log/nginx/exam-system-frontend.access.log"

# Nginx error log
ssh gt-omr-web-1 "tail -f /var/log/nginx/exam-system-frontend.error.log"
```

### Restart Application

```bash
# Zero-downtime reload
ssh gt-omr-web-1 "pm2 reload exam-system-frontend"

# Full restart
ssh gt-omr-web-1 "pm2 restart exam-system-frontend"
```

## File Structure

```
/workspace/
├── deployment/              # All deployment scripts
│   ├── install-dependencies.sh
│   ├── setup-frontend-local.sh
│   ├── configure-nginx.sh
│   ├── deploy-frontend.sh
│   ├── remote-deploy.sh
│   ├── verify-deployment.sh
│   ├── README.md            # Comprehensive guide
│   ├── DEPLOYMENT_CHECKLIST.md
│   └── QUICK_REFERENCE.md
│
└── scripts/
    └── dev-sync-frontend.sh  # Enhanced with auto pnpm install
```

## What Each Script Does

### `remote-deploy.sh` (Main Orchestrator)

- Runs on: **Development machine**
- Purpose: One-command deployment
- Actions:
  1. Verifies SSH connection
  2. Transfers deployment scripts to server
  3. Syncs code to CephFS
  4. Executes deployment on server
  5. Verifies deployment success

### `install-dependencies.sh`

- Runs on: **Web server** (via remote-deploy or manually)
- Purpose: Install all required software
- Installs: Node.js 20, pnpm, PM2, Nginx, rsync, logrotate

### `setup-frontend-local.sh`

- Runs on: **Web server** (via remote-deploy or manually)
- Purpose: Create directory structure
- Creates: `/opt/exam-system-frontend/` with symlinks, configs, logs

### `configure-nginx.sh`

- Runs on: **Web server** (via remote-deploy or manually)
- Purpose: Set up Nginx reverse proxy
- Configures: Proxy, caching, rate limiting, security headers

### `deploy-frontend.sh`

- Runs on: **Web server** (via remote-deploy or manually)
- Purpose: Complete deployment process
- Actions: All of the above + start application

### `verify-deployment.sh`

- Runs on: **Development machine**
- Purpose: Verify deployment success
- Checks: Dependencies, CephFS, code, PM2, Nginx, connectivity

### `dev-sync-frontend.sh`

- Runs on: **Development machine**
- Purpose: Sync code to CephFS
- Actions: Build (optional), rsync to CephFS, install dependencies

## Next Steps

1. **Test the deployment:**

   ```bash
   ./deployment/remote-deploy.sh gt-omr-web-1 --build
   ```

2. **Verify it worked:**

   ```bash
   ./deployment/verify-deployment.sh gt-omr-web-1
   ```

3. **Access the application:**
   - Get server IP from verification output
   - Open browser: `http://SERVER_IP`

4. **Deploy to additional servers:**
   ```bash
   ./deployment/remote-deploy.sh gt-omr-web-2
   ./deployment/remote-deploy.sh gt-omr-web-3
   ```

## Documentation

- **Full Guide**: `deployment/README.md` - Complete reference with troubleshooting
- **Checklist**: `deployment/DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment checklist
- **Quick Ref**: `deployment/QUICK_REFERENCE.md` - Common commands and tasks

## Support

If you encounter issues:

1. Run verification script: `./deployment/verify-deployment.sh gt-omr-web-1`
2. Check the comprehensive README: `deployment/README.md`
3. Review logs: `ssh gt-omr-web-1 "pm2 logs exam-system-frontend"`

---

**Status:** ✅ Ready for deployment!

**Created:** November 18, 2025  
**For:** OMR Exam System Frontend  
**Platform:** Ubuntu 24.04 / Incus Containers  
**Storage:** CephFS

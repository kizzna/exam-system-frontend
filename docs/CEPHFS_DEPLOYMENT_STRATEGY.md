# CephFS Deployment Strategy - Exam Management System

**Date:** November 18, 2025  
**Status:** Migration Planning

---

## Current Infrastructure

### Servers
```
OMR Workers:     gt-omr-app-1 to gt-omr-app-5  (10.10.24.121-125)
FastAPI Servers: gt-omr-api-1, gt-omr-api-2    (10.10.24.131-132)
Database:        db2                           (10.10.24.238)
Web Server:      gt-omr-web-1                  (10.10.24.151)
```

### Current CephFS Structure
```
/cephfs/
└── omr/                        # Backend (existing)
    ├── current -> releases/dev-YYYYMMDD_HHMMSS
    └── releases/
```

---

## Recommended CephFS Structure

### Phase 1: Current State (Keep Backend As-Is)

```
/cephfs/
├── omr/                                    # ← Backend (unchanged)
│   ├── current -> releases/dev-20251118_143022
│   └── releases/
│       ├── dev-20251118_143022/
│       ├── dev-20251118_120000/
│       └── dev-20251117_180000/
│
└── exam-system/                            # ← New structure
    ├── frontend/
    │   ├── current -> releases/dev-20251118_143022
    │   ├── releases/
    │   │   ├── dev-20251118_143022/        # Active deployment
    │   │   │   ├── .next/                  # Build output
    │   │   │   ├── public/
    │   │   │   ├── app/
    │   │   │   ├── components/
    │   │   │   ├── lib/
    │   │   │   ├── node_modules/           # Production deps
    │   │   │   ├── package.json
    │   │   │   ├── next.config.mjs
    │   │   │   └── .env.production
    │   │   ├── dev-20251118_120000/
    │   │   └── dev-20251117_180000/
    │   │
    │   └── shared/                         # Persistent data
    │       ├── uploads/                    # User uploads
    │       ├── cache/                      # Next.js cache
    │       └── logs/                       # Application logs
    │
    ├── shared/                             # Cross-service resources
    │   ├── configs/
    │   │   ├── nginx/
    │   │   ├── ssl/
    │   │   └── monitoring/
    │   ├── assets/
    │   │   ├── images/
    │   │   ├── fonts/
    │   │   └── templates/
    │   └── docs/
    │       ├── API_SPECS.md
    │       ├── ARCHITECTURE.md
    │       └── DEPLOYMENT.md
    │
    └── .archive/                           # Backup old deployments
        ├── frontend-20251101/
        └── backend-20251015/
```

### Phase 2: Future Migration (Post-Phase 7)

```
/cephfs/
├── omr/                                    # ← Keep for compatibility (symlink)
│   └── [symlink to /cephfs/exam-system/backend]
│
└── exam-system/
    ├── backend/                            # ← Migrated backend
    │   ├── current -> releases/dev-20251218_100000
    │   ├── releases/
    │   │   └── dev-20251218_100000/
    │   │       ├── src/
    │   │       ├── config/
    │   │       └── requirements.txt
    │   └── shared/
    │       ├── logs/
    │       └── uploads/
    │
    ├── frontend/                           # ← Already migrated
    └── shared/                             # ← Shared resources
```

---

## Deployment Workflow

### Frontend Deployment (gt-omr-web-1)

#### 1. Development (Dev Container)

```bash
# In /workspaces/exam-system-frontend

# Make changes
vim app/dashboard/page.tsx

# Test locally
pnpm dev
# Visit http://localhost:3000

# Build and test production mode
pnpm build
pnpm start
```

#### 2. Sync to CephFS

```bash
# Option A: Sync without build (faster, for testing)
./scripts/dev-sync-frontend.sh

# Option B: Sync with production build (for deployment)
./scripts/dev-sync-frontend.sh --build

# Option C: Dry run (check what will be synced)
./scripts/dev-sync-frontend.sh --dry-run
```

#### 3. Deploy on gt-omr-web-1

```bash
# SSH to web server
ssh gt-omr-web-1

# Navigate to deployment
cd /cephfs/exam-system/frontend/current

# Install/update dependencies (if not synced)
pnpm install --prod

# Build if not already built
pnpm build

# Start with PM2 (production process manager)
pm2 start ecosystem.config.js
# or
pm2 restart exam-system-frontend

# Verify
curl http://localhost:3000
pm2 logs exam-system-frontend
```

#### 4. Nginx Reverse Proxy (gt-omr-web-1)

```nginx
# /etc/nginx/sites-available/exam-system-frontend

upstream nextjs_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name omr.example.com;
    
    # Redirect to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name omr.example.com;
    
    ssl_certificate /cephfs/exam-system/shared/configs/ssl/cert.pem;
    ssl_certificate_key /cephfs/exam-system/shared/configs/ssl/key.pem;
    
    # Next.js static files
    location /_next/static/ {
        alias /cephfs/exam-system/frontend/current/.next/static/;
        expires 1y;
        access_log off;
    }
    
    # Public static files
    location /static/ {
        alias /cephfs/exam-system/frontend/current/public/;
        expires 1y;
        access_log off;
    }
    
    # Next.js API routes and pages
    location / {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Server Configuration

### gt-omr-web-1 Setup

#### 1. Install Node.js 20

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Install PM2
sudo npm install -g pm2
```

#### 2. PM2 Ecosystem Config

Create `/cephfs/exam-system/frontend/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'exam-system-frontend',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/cephfs/exam-system/frontend/current',
    instances: 4,  // 4 instances for load balancing
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_API_URL: 'http://10.10.24.131:8000'
    },
    error_file: '/cephfs/exam-system/frontend/shared/logs/error.log',
    out_file: '/cephfs/exam-system/frontend/shared/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '2G',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

#### 3. Systemd Service (Auto-start on boot)

Create `/etc/systemd/system/exam-system-frontend.service`:

```ini
[Unit]
Description=Exam System Frontend Next.js Application
After=network.target

[Service]
Type=forking
User=www-data
Group=www-data
WorkingDirectory=/cephfs/exam-system/frontend/current
Environment="PATH=/usr/bin:/usr/local/bin"
ExecStart=/usr/local/bin/pm2 start ecosystem.config.js
ExecReload=/usr/local/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/local/bin/pm2 stop ecosystem.config.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable exam-system-frontend
sudo systemctl start exam-system-frontend
```

#### 4. Mount CephFS on gt-omr-web-1

```bash
# Install CephFS client
sudo apt-get install ceph-fuse

# Create mount point
sudo mkdir -p /cephfs

# Add to /etc/fstab
echo "mon1:6789,mon2:6789,mon3:6789:/ /cephfs ceph name=admin,secretfile=/etc/ceph/admin.secret,noatime,_netdev 0 2" | sudo tee -a /etc/fstab

# Mount
sudo mount /cephfs

# Verify
ls /cephfs/exam-system/frontend/
```

---

## Dev Container Configuration

### Frontend Dev Container

Add to `/workspaces/exam-system-frontend/.devcontainer/devcontainer.json`:

```json
{
  "name": "Exam System Frontend",
  "dockerComposeFile": "docker-compose.yml",
  "service": "frontend",
  "workspaceFolder": "/workspace",
  
  "mounts": [
    "source=/mnt/cephfs/exam-system,target=/mnt/cephfs/exam-system,type=bind"
  ],
  
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "bradlc.vscode-tailwindcss"
      ]
    }
  },
  
  "forwardPorts": [3000, 8000],
  
  "postCreateCommand": "pnpm install",
  "postStartCommand": "pnpm dev"
}
```

---

## Migration Checklist

### Phase 1: Frontend Setup (Current)

- [ ] Create `/cephfs/exam-system/` directory structure
- [ ] Create `/cephfs/exam-system/frontend/` subdirectories
- [ ] Copy `FRONTEND_DEV_SYNC.sh` to frontend project
- [ ] Update frontend dev container with CephFS mount
- [ ] Test sync from dev container to CephFS
- [ ] Install Node.js 20 on gt-omr-web-1
- [ ] Install PM2 on gt-omr-web-1
- [ ] Mount CephFS on gt-omr-web-1
- [ ] Create PM2 ecosystem config
- [ ] Deploy first frontend build to CephFS
- [ ] Start Next.js with PM2
- [ ] Configure Nginx reverse proxy
- [ ] Test frontend access via Nginx
- [ ] Set up systemd service for auto-start
- [ ] Document deployment process

### Phase 2: Backend Migration (Post-Phase 7)

- [ ] Create `/cephfs/exam-system/backend/` structure
- [ ] Update backend `dev-sync.sh` for new location
- [ ] Test backend deployment to new location
- [ ] Update all worker containers to use new path
- [ ] Update API containers to use new path
- [ ] Create symlink `/cephfs/omr -> /cephfs/exam-system/backend`
- [ ] Verify all services working with new paths
- [ ] Archive old `/cephfs/omr/` releases
- [ ] Update documentation

---

## Rollback Procedure

### Quick Rollback (Symlink Change)

```bash
# SSH to gt-omr-web-1
ssh gt-omr-web-1

# List available releases
ls -la /cephfs/exam-system/frontend/releases/

# Change symlink to previous release
cd /cephfs/exam-system/frontend
ln -sfn releases/dev-20251118_120000 current

# Restart PM2
pm2 restart exam-system-frontend

# Verify
curl http://localhost:3000
```

### Full Rollback (Emergency)

```bash
# Stop current deployment
pm2 stop exam-system-frontend

# Restore previous release
cd /cephfs/exam-system/frontend
rm current
ln -sfn releases/dev-20251117_180000 current

# Restart
pm2 start ecosystem.config.js

# Check logs
pm2 logs exam-system-frontend
```

---

## Monitoring & Logs

### PM2 Monitoring

```bash
# Real-time logs
pm2 logs exam-system-frontend

# Status
pm2 status

# Detailed info
pm2 describe exam-system-frontend

# Metrics
pm2 monit
```

### Log Locations

```
Frontend Logs:
  /cephfs/exam-system/frontend/shared/logs/error.log
  /cephfs/exam-system/frontend/shared/logs/out.log

Nginx Logs:
  /var/log/nginx/access.log
  /var/log/nginx/error.log

System Logs:
  journalctl -u exam-system-frontend -f
```

---

## Load Balancing (Future)

### Multi-Server Setup

When scaling to multiple web servers:

```
/cephfs/exam-system/frontend/
└── current/  (shared across all web servers)

Web Servers:
  gt-omr-web-1:3000  (PM2 cluster mode, 4 instances)
  gt-omr-web-2:3000  (Future)
  gt-omr-web-3:3000  (Future)

Nginx Load Balancer:
  upstream nextjs_backend {
    server 10.10.24.151:3000 weight=1;
    server 10.10.24.152:3000 weight=1;
    server 10.10.24.153:3000 weight=1;
  }
```

---

## Best Practices

### 1. Always Build Before Production Deployment

```bash
# Development testing
./scripts/dev-sync-frontend.sh

# Production deployment
./scripts/dev-sync-frontend.sh --build
```

### 2. Keep Last 10 Releases

The sync script automatically cleans up old releases, keeping the last 10.

### 3. Use Environment Variables

```bash
# /cephfs/exam-system/frontend/current/.env.production
NEXT_PUBLIC_API_URL=http://10.10.24.131:8000
NODE_ENV=production
```

### 4. Monitor Resource Usage

```bash
# Check memory usage
pm2 monit

# Check disk usage
df -h /cephfs

# Check release sizes
du -sh /cephfs/exam-system/frontend/releases/*
```

### 5. Backup Before Major Changes

```bash
# Backup current deployment
tar -czf /cephfs/exam-system/.archive/frontend-backup-$(date +%Y%m%d).tar.gz \
  -C /cephfs/exam-system/frontend current
```

---

## Troubleshooting

### Frontend Won't Start

```bash
# Check PM2 logs
pm2 logs exam-system-frontend --err

# Check if port is in use
sudo lsof -i :3000

# Kill zombie processes
pm2 kill
pm2 start ecosystem.config.js
```

### CephFS Not Accessible

```bash
# Check mount
mountpoint /cephfs

# Remount
sudo mount -a

# Check Ceph cluster health
ceph -s
```

### Sync Errors

```bash
# Verify CephFS in dev container
ls /mnt/cephfs/exam-system

# Check permissions
ls -la /mnt/cephfs/exam-system/frontend
```

---

## Summary

**Recommended Approach:**

1. ✅ **Keep backend at `/cephfs/omr/`** for now (no disruption)
2. ✅ **Start frontend at `/cephfs/exam-system/frontend/`** (clean structure)
3. ✅ **Create shared resources at `/cephfs/exam-system/shared/`**
4. ✅ **Migrate backend to `/cephfs/exam-system/backend/`** after Phase 7
5. ✅ **Use release-based deployments with symlinks** (easy rollback)
6. ✅ **Automate with dev-sync scripts** (consistent deployments)

This approach gives you:
- Zero backend disruption
- Clean frontend structure from day 1
- Easy rollback capability
- Future scalability
- Unified system structure

**Next Step:** Run the sync script to deploy Phase 1 frontend! 🚀

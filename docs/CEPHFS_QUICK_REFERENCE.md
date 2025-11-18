# CephFS Quick Reference - OMR Exam System

**Last Updated:** November 18, 2025

---

## 📁 Directory Structure

```
/cephfs/
├── omr/                                    # Backend (current location)
│   ├── current -> releases/dev-YYYYMMDD_HHMMSS
│   └── releases/
│
└── exam-system/                            # New unified structure
    ├── frontend/
    │   ├── current -> releases/dev-YYYYMMDD_HHMMSS
    │   ├── releases/
    │   └── shared/ (uploads, cache, logs)
    │
    ├── backend/                            # Future (Phase 7+)
    │   ├── current -> releases/dev-YYYYMMDD_HHMMSS
    │   └── releases/
    │
    └── shared/
        ├── configs/
        ├── assets/
        └── docs/
```

---

## 🚀 Common Commands

### Backend Deployment (Current)

```bash
# In dev container (/workspaces/omr-backend)
./scripts/dev-sync.sh --dry-run           # Preview changes
./scripts/dev-sync.sh                     # Deploy to CephFS

# On production servers
ssh gt-omr-api-1 'ls -la /cephfs/omr/current'
ssh gt-omr-app-1 'systemctl restart omr-worker'
```

### Frontend Deployment (New)

```bash
# In dev container (/workspaces/exam-system-frontend)
./scripts/dev-sync-frontend.sh --dry-run  # Preview
./scripts/dev-sync-frontend.sh            # Quick sync
./scripts/dev-sync-frontend.sh --build    # Production deploy

# On web server
ssh gt-omr-web-1 'pm2 restart exam-system-frontend'
ssh gt-omr-web-1 'pm2 logs exam-system-frontend'
```

---

## 🔄 Deployment Workflow

### Development Cycle

```
1. Code in Dev Container
   └─> Make changes in VS Code
   
2. Test Locally
   ├─> Backend:  http://localhost:8000
   └─> Frontend: http://localhost:3000
   
3. Sync to CephFS
   ├─> Backend:  ./scripts/dev-sync.sh
   └─> Frontend: ./scripts/dev-sync-frontend.sh --build
   
4. Deploy on Production
   ├─> Backend:  SSH to workers → restart services
   └─> Frontend: SSH to web-1 → pm2 restart
   
5. Verify
   ├─> Backend:  curl http://10.10.24.131:8000/api/health
   └─> Frontend: curl http://10.10.24.151:3000
```

---

## 🖥️ Server Information

| Server(s) | IP | Role | Local Path | CephFS Path |
|-----------|----|----|------------|-------------|
| gt-omr-app-1 to 5 | 10.10.24.121-125 | Workers | `/opt/omr/current` | → `/cephfs/omr/current` |
| gt-omr-api-1, 2 | 10.10.24.131-132 | FastAPI | `/opt/omr/current` | → `/cephfs/omr/current` |
| gt-omr-web-1 | 10.10.24.151 | Next.js | `/opt/exam-system-frontend/current` | → `/cephfs/exam-system/frontend/current` |
| db2 | 10.10.24.238 | MySQL | N/A | N/A |

---

## 📝 Quick Tasks

### Initial Frontend Setup (One-Time)

```bash
# On gt-omr-web-1
ssh gt-omr-web-1

# Copy setup script (or create it on server)
sudo nano /tmp/setup-frontend-local.sh
# Paste script content, then:
sudo chmod +x /tmp/setup-frontend-local.sh
sudo /tmp/setup-frontend-local.sh

# This creates:
# /opt/exam-system-frontend/current -> /cephfs/exam-system/frontend/current
# /opt/exam-system-frontend/logs/
# /opt/exam-system-frontend/cache/
# /opt/exam-system-frontend/.env.local
```

### Check Current Deployment

```bash
# Backend version
ls -la /opt/omr/current
ls -la /cephfs/omr/current

# Frontend version
ssh gt-omr-web-1 'ls -la /opt/exam-system-frontend/current'
ssh gt-omr-web-1 'ls -la /cephfs/exam-system/frontend/current'

# All releases
ls -lt /cephfs/omr/releases/
ls -lt /cephfs/exam-system/frontend/releases/
```

### Rollback to Previous Version

```bash
# Backend rollback
cd /cephfs/omr
ln -sfn releases/dev-20251117_180000 current
# Restart services on all workers

# Frontend rollback
cd /cephfs/exam-system/frontend
ln -sfn releases/dev-20251117_180000 current
ssh gt-omr-web-1 'pm2 restart exam-system-frontend'
```

### Clean Up Old Releases

```bash
# Backend (keep last 10)
cd /cephfs/omr/releases
ls -t | tail -n +11 | xargs rm -rf

# Frontend (auto-cleaned by sync script)
# Manual: cd /cephfs/exam-system/frontend/releases && ls -t | tail -n +11 | xargs rm -rf
```

### Monitor Services

```bash
# Backend API
ssh gt-omr-api-1 'systemctl status omr-api'
ssh gt-omr-api-1 'journalctl -u omr-api -f'

# Frontend
ssh gt-omr-web-1 'pm2 status'
ssh gt-omr-web-1 'pm2 logs exam-system-frontend'
ssh gt-omr-web-1 'pm2 monit'
```

### Check CephFS Health

```bash
# Mount status
mountpoint /cephfs

# Disk usage
df -h /cephfs

# Directory sizes
du -sh /cephfs/omr/releases/*
du -sh /cephfs/exam-system/frontend/releases/*

# Ceph cluster status
ceph -s
ceph df
```

---

## 🔧 Troubleshooting

### CephFS Not Accessible

```bash
# Check mount
mountpoint /cephfs
mount | grep cephfs

# Remount
sudo mount -a

# Or manual mount
sudo mount -t ceph mon1:6789,mon2:6789:/ /cephfs -o name=admin,secret=XXX
```

### Backend Not Starting

```bash
# Check logs
ssh gt-omr-api-1 'journalctl -u omr-api -n 100'

# Verify Python environment
ssh gt-omr-api-1 'cd /cephfs/omr/current && python3 --version'

# Check database connection
ssh gt-omr-api-1 'mysql -h db2 -u omr_user -p omr_db -e "SELECT 1"'
```

### Frontend Not Starting

```bash
# Check PM2 status
ssh gt-omr-web-1 'pm2 list'

# View logs
ssh gt-omr-web-1 'pm2 logs exam-system-frontend --lines 100'

# Restart
ssh gt-omr-web-1 'pm2 restart exam-system-frontend'

# Nuclear option
ssh gt-omr-web-1 'pm2 kill && pm2 start /cephfs/exam-system/frontend/current/ecosystem.config.js'
```

### Sync Script Errors

```bash
# Check CephFS mount in dev container
ls /mnt/cephfs/omr
ls /mnt/cephfs/exam-system

# Verify permissions
ls -la /mnt/cephfs/omr/
ls -la /mnt/cephfs/exam-system/frontend/

# Test rsync
rsync --dry-run -av /workspaces/omr-backend/ /mnt/cephfs/omr/releases/test/
```

---

## 📊 Performance Checks

### Backend Performance

```bash
# API response time
time curl -s http://10.10.24.131:8000/api/health

# Worker CPU/Memory
ssh gt-omr-app-1 'htop'
ssh gt-omr-app-1 'free -h'
```

### Frontend Performance

```bash
# Next.js response time
time curl -s http://10.10.24.151:3000

# PM2 metrics
ssh gt-omr-web-1 'pm2 monit'

# Check instance distribution
ssh gt-omr-web-1 'pm2 describe exam-system-frontend'
```

### Database Performance

```bash
# Connection pool
ssh db2 'mysql -e "SHOW STATUS LIKE \"Threads%\""'

# Slow queries
ssh db2 'mysql -e "SHOW PROCESSLIST"'
```

---

## 🎯 Phase Checklist

### Phase 1: Auth & Users ✅
- [x] Backend deployed to `/cephfs/omr/`
- [x] Frontend structure created at `/cephfs/exam-system/frontend/`
- [x] Dev-sync scripts working
- [ ] Frontend deployed with PM2
- [ ] Nginx configured

### Phase 2: Batches Upload
- [ ] Backend batch endpoints deployed
- [ ] Frontend upload UI deployed
- [ ] Test file upload workflow

### Future Phases
- [ ] Phase 3-7 deployments
- [ ] Migrate backend to `/cephfs/exam-system/backend/`
- [ ] Add load balancing for frontend

---

## 📚 Documentation

| Document | Purpose | Location |
|----------|---------|----------|
| CEPHFS_DEPLOYMENT_STRATEGY.md | Full deployment guide | `/workspaces/omr-backend/` |
| FRONTEND_PROJECT_SETUP_GUIDE.md | Frontend setup | `/workspaces/omr-backend/` |
| FRONTEND_DEV_SYNC.sh | Frontend sync script | Project root |
| dev-sync.sh | Backend sync script | `scripts/` |
| PHASE1_FRONTEND_GUIDE.md | Phase 1 API specs | `/workspaces/omr-backend/` |

---

## 🔑 Key Contacts

| Role | Server | Port | Health Check |
|------|--------|------|--------------|
| Backend API | gt-omr-api-1 | 8000 | `/api/health` |
| Frontend | gt-omr-web-1 | 3000 | `/` |
| Database | db2 | 3306 | N/A |
| Workers | gt-omr-app-1-5 | N/A | `systemctl status` |

---

**💡 Tip:** Bookmark this file for quick reference during development and deployment!

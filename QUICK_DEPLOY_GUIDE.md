# Quick Deployment Guide

## 🚀 Fast Development Workflow

### Quick Deploy (5-10 seconds)

**Use for:** Code changes in `.tsx`, `.ts`, `.css` files  
**Does NOT rebuild:** Just syncs and reloads PM2

```bash
# Single server
./scripts/quick-deploy.sh gt-omr-web-1

# All servers
./scripts/quick-deploy.sh all
```

### Full Rebuild (2-3 minutes)

**Use for:** Changes to `package.json`, `next.config.mjs`, new dependencies  
**Does full:** Install deps + build + deploy

```bash
# Single server
./scripts/rebuild-and-deploy.sh gt-omr-web-1

# All servers
./scripts/rebuild-and-deploy.sh all
```

---

## 📋 Common Tasks

### After Code Changes

```bash
# Quick iteration (recommended for most changes)
./scripts/quick-deploy.sh gt-omr-web-1

# Test in browser
open http://gt-omr-web-1.gt/dashboard
```

### After Package Changes

```bash
# Full rebuild required
./scripts/rebuild-and-deploy.sh gt-omr-web-1
```

### Check Status

```bash
# All servers
./scripts/status-web

# Single server PM2
./scripts/pm2-web gt-omr-web-1 list

# View logs
./scripts/pm2-web gt-omr-web-1 logs
```

### Restart Application

```bash
# Graceful reload (no downtime)
./scripts/pm2-web gt-omr-web-1 reload exam-system-frontend

# Hard restart
./scripts/pm2-web gt-omr-web-1 restart exam-system-frontend

# All servers
./scripts/pm2-web all reload exam-system-frontend
```

---

## 🔧 Manual Deployment (Advanced)

### Step-by-Step

```bash
# 1. Sync code to CephFS
bash scripts/dev-sync-frontend.sh

# 2. Deploy to server with build
./deployment/remote-deploy.sh gt-omr-web-1 --build

# 3. Deploy to other servers (they share CephFS build)
./scripts/pm2-web all reload exam-system-frontend
```

---

## 📁 File Structure Fix Applied

**Problem:** Dashboard was returning 404  
**Root Cause:** Route group `(dashboard)` doesn't create a `/dashboard` URL

**Old Structure (WRONG):**

```
app/
  (dashboard)/
    page.tsx          ← This creates route at "/" not "/dashboard"
    users/page.tsx    ← This creates "/users" not "/dashboard/users"
```

**New Structure (CORRECT):**

```
app/
  dashboard/
    page.tsx          ← Creates route at "/dashboard" ✓
    users/page.tsx    ← Creates route at "/dashboard/users" ✓
    layout.tsx        ← Dashboard layout with sidebar
```

---

## 🎯 Routes Now Available

- `/` - Home page
- `/login` - Login page
- `/dashboard` - Dashboard home ✓ FIXED
- `/dashboard/users` - User management
- `/dashboard/batches` - Batch management
- `/dashboard/students` - Student management
- `/dashboard/tasks` - Task management
- `/dashboard/audit` - Audit logs
- `/dashboard/review` - Review interface
- `/dashboard/grading/answer-keys` - Answer key management
- `/dashboard/grading/exports` - Export management

---

## 🔑 Test Credentials

```
Username: admin
Password: admin123
```

---

## 💡 Tips

1. **Use quick-deploy for 90% of changes** - It's 10x faster
2. **Only rebuild when you change:**
   - package.json
   - next.config.mjs
   - ecosystem.config.js
   - Add new dependencies

3. **CephFS is shared** - Only build on one server, reload others
4. **PM2 graceful reload** - Use `reload` not `restart` to avoid downtime

---

## 🐛 Troubleshooting

### Dashboard still 404?

```bash
# Check if route exists in build
ssh gt-omr-web-1 'cat /opt/exam-system-frontend/current/.next/routes-manifest.json' | jq -r '.staticRoutes[].page' | grep dashboard

# Should show:
# /dashboard
# /dashboard/users
# etc.
```

### Application not responding?

```bash
# Check PM2 status
./scripts/pm2-web gt-omr-web-1 list

# Check logs
./scripts/pm2-web gt-omr-web-1 logs --lines 50

# Hard restart
./scripts/pm2-web gt-omr-web-1 restart exam-system-frontend
```

### Wrong instance count?

```bash
# Should show 4 instances per server
./scripts/status-web

# If wrong, check ecosystem.config.js
ssh gt-omr-web-1 'grep instances /opt/exam-system-frontend/ecosystem.config.js'

# Should be: instances: 4
# NOT: instances: 'max'
```

---

## 📚 Scripts Reference

| Script                  | Purpose             | Speed     |
| ----------------------- | ------------------- | --------- |
| `quick-deploy.sh`       | Sync + reload only  | ⚡ 5-10s  |
| `rebuild-and-deploy.sh` | Full build + deploy | 🔨 2-3min |
| `status-web`            | Check all servers   | ⚡ 1s     |
| `pm2-web`               | PM2 commands        | ⚡ 1-2s   |
| `dev-sync-frontend.sh`  | Sync to CephFS only | ⚡ 10s    |
| `remote-deploy.sh`      | Full deployment     | 🔨 2-3min |

**Recommendation:** Use `quick-deploy.sh` for iterative development!

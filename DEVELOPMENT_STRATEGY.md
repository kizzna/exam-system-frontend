# Development Strategy - Phases 2-7

## 🎯 Recommended Approach

**Use local dev server in dev container for ALL remaining phases**

### Why This Works Best for You

1. **10 Gbps LAN** = File changes appear instantly in dev container
2. **Remote SSH** = Feels like local development in VS Code
3. **Same Network** = Direct access to production API servers
4. **5 More Phases** = Hundreds of iterations ahead

---

## 📊 Time Savings Calculation

### Current: Production Deployment Per Change

```
Iteration cycle:
├─ Edit code in VS Code          (1 min)
├─ Deploy to gt-omr-web-1         (2 min build + deploy)
├─ Test in browser                (30 sec)
└─ Fix issues and repeat

Total per iteration: ~3.5 minutes
```

### Recommended: Local Dev Server

```
Iteration cycle:
├─ Edit code in VS Code          (1 min)
├─ Hot reload in browser         (< 1 sec!)
├─ Test immediately              (10 sec)
└─ Fix issues and repeat

Total per iteration: ~1 minute (3.5x faster!)
```

**For 5 phases × 50 iterations each:**

- Production method: 250 × 3.5 min = **14.5 hours** ⏰
- Local dev method: 250 × 1 min = **4.2 hours** ⚡
- **Time saved: 10.3 hours!**

---

## 🔧 Setup (One-Time, 2 Minutes)

### 1. Install Dependencies (if needed)

```bash
cd /workspace
pnpm install
```

### 2. Configure Environment

```bash
# Already exists, verify it points to production API
cat .env.local
```

Expected:

```env
NEXT_PUBLIC_API_URL=http://gt-omr-api-1.gt:8000
```

### 3. Start Dev Server

```bash
pnpm dev
```

### 4. Access from Your Machine

```
Your browser → http://<VM-IP>:3000

Or if you have port forwarding:
Your browser → http://localhost:3000
```

---

## 💡 Development Workflow

### Daily Routine

```bash
# Morning: Start dev server (in dev container terminal)
cd /workspace
pnpm dev

# VS Code will show:
# ✓ Ready on http://0.0.0.0:3000
```

### During Development

1. **Edit files in VS Code** (Remote SSH to dev container)
   - Changes sync instantly (10 Gbps LAN!)
2. **Browser auto-reloads** (< 1 second)
   - See changes immediately
3. **TypeScript errors show in VS Code** (instant)
   - Fix before running
4. **Repeat** without any deployment!

### End of Phase / When Ready for Production

```bash
# Test production build locally first
pnpm build

# If successful, deploy to production servers
./scripts/rebuild-and-deploy.sh gt-omr-web-1
./scripts/rebuild-and-deploy.sh gt-omr-web-2
./scripts/rebuild-and-deploy.sh gt-omr-web-3
```

---

## 🎯 Deployment Strategy for Phases 2-7

### Option A: One Deployment After All Phases (Fastest)

```
Phase 2-7: Local development in dev container
    ├─ Week 1-2: Phases 2-3 (Batches, Answer Keys)
    ├─ Week 3-4: Phases 4-5 (Students, Tasks)
    ├─ Week 5-6: Phases 6-7 (Review, Grading)
    ├─ Test all features locally
    └─ Deploy ONCE to production

Deployments: 1
Time: Most efficient
```

### Option B: Deploy Per Major Milestone (Recommended)

```
Milestone 1: Phases 2-3 (Upload & Management)
    ├─ Develop locally
    ├─ Test thoroughly
    └─ Deploy → Get stakeholder feedback

Milestone 2: Phases 4-5 (Data Management)
    ├─ Develop locally
    ├─ Test thoroughly
    └─ Deploy → Get stakeholder feedback

Milestone 3: Phases 6-7 (Processing & Review)
    ├─ Develop locally
    ├─ Test thoroughly
    └─ Deploy → Final release

Deployments: 3
Time: Good balance
User feedback: Regular
```

### Option C: Deploy Per Phase (If Stakeholders Need Constant Updates)

```
Each phase:
    ├─ Develop locally
    └─ Deploy

Deployments: 6
Time: More overhead
User feedback: Continuous
```

**My recommendation: Option B** - Best balance of speed and feedback

---

## 🔍 Your Network Architecture

```
┌─────────────────────────────────────────────────┐
│  Your Machine                                   │
│  ├─ VS Code Client                              │
│  └─ Browser                                     │
└────────────┬────────────────────────────────────┘
             │ 10 Gbps LAN (Fast!)
             ↓
┌─────────────────────────────────────────────────┐
│  Ubuntu 22.04 VM                                │
│  └─ Docker (Dev Container - Ubuntu 24.04)      │
│      ├─ Next.js Dev Server :3000                │
│      ├─ File watcher (instant reload)           │
│      └─ TypeScript compiler                     │
└────────────┬────────────────────────────────────┘
             │ Same network
             ↓
┌─────────────────────────────────────────────────┐
│  Production Servers (Same LAN)                  │
│  ├─ gt-omr-api-1:8000   (Backend API)          │
│  ├─ gt-omr-web-1:3000   (Production Frontend)  │
│  ├─ gt-omr-web-2:3000                           │
│  └─ gt-omr-web-3:3000                           │
└─────────────────────────────────────────────────┘
```

**Benefits:**

- ✅ Dev container can call API directly (same network)
- ✅ File changes sync instantly (10 Gbps)
- ✅ Browser can access dev server (port forwarding or direct IP)
- ✅ Production servers separate (no interference)

---

## 🧪 Testing Strategy

### During Development (Local)

```bash
# 1. Start dev server
pnpm dev

# 2. Access in browser
http://<VM-IP>:3000/dashboard/batches

# 3. Test features:
# - Upload batch (calls gt-omr-api-1:8000)
# - View progress (real-time polling)
# - Filter batches
# - All features work exactly like production
```

### Before Production Deployment

```bash
# 1. Build production bundle
pnpm build

# 2. Fix any build errors

# 3. Test production build locally (optional)
pnpm start

# 4. Deploy to production
./scripts/rebuild-and-deploy.sh gt-omr-web-1
```

---

## 🐛 Troubleshooting

### Issue: Can't access dev server from browser

**Check port forwarding in VS Code:**

- VS Code should auto-forward port 3000
- Look for "PORTS" tab in VS Code
- Or manually forward: Command Palette → "Forward a Port" → 3000

**Or access directly via VM IP:**

```bash
# Get VM IP
hostname -I

# Access in browser
http://<VM-IP>:3000
```

### Issue: API calls failing

**Test API connectivity from dev container:**

```bash
curl http://gt-omr-api-1.gt:8000/api/health
```

If fails, check network/DNS in dev container.

### Issue: Hot reload not working

**Restart dev server:**

```bash
# Stop: Ctrl+C
# Start: pnpm dev
```

**Or check file watchers:**

```bash
# Increase watchers (if needed)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## 📋 Quick Commands Reference

### Development

```bash
# Start dev server
pnpm dev

# Build production bundle (test locally)
pnpm build

# Run production build locally
pnpm start

# Type check
pnpm type-check

# Lint
pnpm lint
```

### Deployment (When Ready)

```bash
# Deploy to single server
./scripts/rebuild-and-deploy.sh gt-omr-web-1

# Deploy to all servers
for server in gt-omr-web-{1,2,3}; do
  ./scripts/rebuild-and-deploy.sh $server
done
```

### Monitoring

```bash
# Check production servers
bash scripts/status-web

# Check API servers
ssh gt-omr-api-1 'systemctl status omr-api'
```

---

## ✅ Recommended Next Steps

1. **Fix TypeScript error** (already done ✓)

2. **Start local dev server:**

   ```bash
   cd /workspace
   pnpm dev
   ```

3. **Access in browser:**
   - VS Code will auto-forward port 3000
   - Or use http://<VM-IP>:3000

4. **Continue Phase 2 development locally:**
   - Test batch upload
   - Test progress monitoring
   - Fix any issues instantly

5. **When Phase 2 is complete:**
   - Deploy to production for stakeholder testing
   - Or continue with Phase 3 locally

6. **Repeat for Phases 3-7:**
   - Develop everything locally
   - Deploy at milestones (Option B)

---

## 🎯 Summary

**Your Setup is Perfect for Local Development!**

- ✅ **10 Gbps LAN** = Instant file sync
- ✅ **Remote SSH** = Seamless VS Code experience
- ✅ **Same Network** = Direct API access
- ✅ **Dev Container** = Isolated, reproducible environment

**Recommended Workflow:**

1. **Develop locally** in dev container (hot reload, instant feedback)
2. **Deploy to production** at milestones (3 deployments for 6 phases)
3. **Save 10+ hours** of deployment wait time

**Start now:**

```bash
pnpm dev
```

Then open http://localhost:3000 (or VM IP:3000) in your browser! 🚀

---

**Questions? Issues? Let me know!**

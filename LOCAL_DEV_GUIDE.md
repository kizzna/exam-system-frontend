# Local Development Guide

**Recommended workflow for Phase 2-7 development**

---

## 🎯 Why Develop Locally?

### Speed Comparison

| Action           | Production Deployment | Local Development |
| ---------------- | --------------------- | ----------------- |
| Code change      | 2 minutes             | < 1 second        |
| TypeScript error | After 2 min build     | Instant in IDE    |
| Test in browser  | After deployment      | Immediate         |
| Fix → Test cycle | 2 min × iterations    | Instant           |

**For 5 phases × 20 iterations each = 200+ minutes saved!**

### Benefits

- ✅ **Instant feedback** - See changes immediately
- ✅ **Fast iteration** - No deployment wait time
- ✅ **Offline work** - No network dependency
- ✅ **Better debugging** - Console logs, React DevTools
- ✅ **TypeScript checking** - Errors shown in IDE immediately
- ✅ **Hot reload** - UI updates without page refresh

---

## 🚀 Quick Start

### 1. Setup (One-time)

```bash
# In dev container
bash scripts/setup-local-dev.sh

# Or manually:
pnpm install
cp .env.local.example .env.local
```

### 2. Start Development Server

```bash
pnpm dev
```

**Output:**

```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
- wait compiling...
```

### 3. Access Application

Open in browser: **http://localhost:3000**

### 4. Develop

- Edit files in `app/`, `components/`, `lib/`
- Changes auto-reload in browser
- TypeScript errors shown instantly
- Test features immediately

### 5. Deploy to Production (When Ready)

```bash
# After phase is complete and tested locally
./scripts/rebuild-and-deploy.sh gt-omr-web-1
```

---

## 📁 Configuration

### .env.local

```env
# API Configuration - Point to production API
NEXT_PUBLIC_API_URL=http://gt-omr-api-1.gt:8000

# Development
NEXT_PUBLIC_ENABLE_DEBUG=true

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-key
```

**Why point to production API?**

- Frontend dev container doesn't need local API server
- Use actual production data for testing
- Consistent behavior with production

---

## 🔧 Development Workflow

### Phase 2: Batch Management (Current)

**Local Development:**

```bash
# 1. Start dev server
pnpm dev

# 2. Edit files (example: add new feature)
# components/batches/BatchUploadForm.tsx

# 3. Save → Browser auto-reloads → Test immediately

# 4. Fix TypeScript errors (shown in IDE)

# 5. Repeat until phase complete
```

**Production Deployment:**

```bash
# Only when Phase 2 is complete and tested
./scripts/rebuild-and-deploy.sh gt-omr-web-1
./scripts/rebuild-and-deploy.sh gt-omr-web-2
./scripts/rebuild-and-deploy.sh gt-omr-web-3
```

### Phase 3-7: Future Development

**Recommended:**

1. Develop **all phases** locally (Phase 2-7)
2. Test each phase thoroughly in localhost:3000
3. Deploy to production **once** when all phases complete
4. OR: Deploy per phase if you need stakeholder feedback

---

## 🧪 Testing Locally

### Backend API Access

**From dev container:**

```bash
# Test API connection
curl http://gt-omr-api-1.gt:8000/api/health

# Test authentication
curl -X POST http://gt-omr-api-1.gt:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Frontend Testing

1. **Login:** http://localhost:3000/login
   - Username: `admin`
   - Password: `admin123`

2. **Navigate:** http://localhost:3000/dashboard/batches

3. **Test features:**
   - Upload batch
   - View progress
   - Filter batches
   - View details

### Hot Reload Testing

```bash
# 1. Start dev server
pnpm dev

# 2. Open http://localhost:3000/dashboard/batches

# 3. Edit a component (e.g., change button text)
# components/batches/BatchUploadForm.tsx
# Change: "Upload New Batch" → "Upload Batch 🚀"

# 4. Save file

# 5. Browser auto-reloads → See change immediately
```

---

## 🐛 Troubleshooting

### Issue: "Module not found"

**Solution:**

```bash
rm -rf node_modules .next
pnpm install
pnpm dev
```

### Issue: "Port 3000 already in use"

**Solution:**

```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
pnpm dev -- -p 3001
```

### Issue: "API connection failed"

**Check:**

```bash
# Test API server from dev container
curl http://gt-omr-api-1.gt:8000/api/health

# If fails, check API server status
ssh gt-omr-api-1 'systemctl status omr-api'
```

### Issue: TypeScript errors in IDE

**Solution:**

```bash
# Restart TypeScript server in VS Code
# Command Palette (Ctrl+Shift+P)
# > TypeScript: Restart TS Server
```

---

## 📊 Performance Comparison

### Example: Adding a new component

**Production Deployment Method:**

```
1. Create component                 (5 min)
2. Deploy to server                 (2 min)
3. Build fails (TypeScript error)   (2 min wasted)
4. Fix error                        (1 min)
5. Deploy again                     (2 min)
6. Test in browser                  (1 min)
7. Need to adjust styling           (2 min)
8. Deploy again                     (2 min)
9. Test                             (1 min)
Total: 18 minutes (3 deployments)
```

**Local Development Method:**

```
1. Create component                 (5 min)
2. TypeScript error shown instantly (0 sec)
3. Fix error                        (1 min)
4. Test in browser (hot reload)     (1 sec)
5. Adjust styling                   (2 min)
6. Test (hot reload)                (1 sec)
Total: 8 minutes (13x faster!)
```

---

## 🎯 Recommended Strategy for Phases 2-7

### Option 1: Deploy Per Phase (Recommended for Stakeholder Feedback)

```
Phase 2: Batch Management
  ├─ Develop locally (2-3 days)
  ├─ Test thoroughly
  └─ Deploy to production → Get feedback

Phase 3: Answer Keys
  ├─ Develop locally (2-3 days)
  ├─ Test thoroughly
  └─ Deploy to production → Get feedback

... (Phases 4-7)
```

**Deployments:** 6 total (one per phase)

### Option 2: Deploy After All Phases (Fastest Development)

```
Phases 2-7: All Features
  ├─ Develop locally (2-3 weeks)
  ├─ Test all phases thoroughly
  └─ Deploy to production once → Complete system

```

**Deployments:** 1 total (fastest)

### Option 3: Hybrid (Best Balance)

```
Develop locally:
  ├─ Phases 2-3 (related features)
  └─ Deploy → Test → Get feedback

Develop locally:
  ├─ Phases 4-5 (related features)
  └─ Deploy → Test → Get feedback

Develop locally:
  ├─ Phases 6-7 (related features)
  └─ Deploy → Test → Get feedback
```

**Deployments:** 3 total (good balance)

---

## 📋 Daily Workflow

### Morning

```bash
# Start dev server
cd /workspace
pnpm dev

# Open browser
# http://localhost:3000
```

### During Development

```bash
# Edit files
# Save → Auto-reload → Test → Repeat

# No deployment needed!
```

### End of Day / Phase Complete

```bash
# Stop dev server
Ctrl+C

# Optional: Build to verify production build works
pnpm build

# Deploy if phase is complete
./scripts/rebuild-and-deploy.sh gt-omr-web-1
```

---

## 🚀 Next Steps

### For Remaining Phases

1. **Phase 3: Answer Keys**
   - Develop locally first
   - Test with localhost:3000
   - Deploy when complete

2. **Phase 4: Student Management**
   - Continue local development
   - Faster iteration
   - Deploy when ready

3. **Phases 5-7: Continue pattern**
   - Local dev = fast
   - Production deploy = milestones

---

## ✅ Benefits Summary

| Aspect         | Local Dev           | Production Deploy   |
| -------------- | ------------------- | ------------------- |
| **Speed**      | ⚡ Instant          | 🐌 2 minutes        |
| **Feedback**   | 🎯 Immediate        | ⏰ After build      |
| **TypeScript** | ✓ IDE shows errors  | ✗ After 2 min build |
| **Debugging**  | ✓ Console, DevTools | ✗ Remote logs       |
| **Network**    | ✓ Offline capable   | ✗ Requires SSH      |
| **Iterations** | ∞ Free              | 💰 2 min each       |

---

## 🎓 Learning Resources

### Next.js Development

- **Dev Server:** `pnpm dev` - Auto-reload, fast refresh
- **Build:** `pnpm build` - Production build test
- **Lint:** `pnpm lint` - Check code quality
- **Type Check:** `pnpm type-check` - Verify TypeScript

### Debugging

- **React DevTools:** Browser extension
- **Console Logs:** Show immediately in browser
- **Network Tab:** See API requests/responses
- **VS Code Debugger:** Attach to Next.js process

---

## 💡 Pro Tips

1. **Keep dev server running** - Start once, develop all day
2. **Use TypeScript strict mode** - Catch errors early
3. **Test in browser DevTools** - Faster than production logs
4. **Build before deploying** - `pnpm build` to verify
5. **Deploy at milestones** - Not every change
6. **Use hot reload** - No manual refresh needed
7. **Check console** - Errors show immediately

---

## 📞 Support

**Issues with local dev:**

- Check this guide
- Restart dev server
- Clear `.next/` folder
- Reinstall dependencies

**Issues with production deploy:**

- Test locally first with `pnpm build`
- Check deployment logs
- Verify API connectivity

---

**Happy Developing! 🚀**

**Remember:** Local development = Fast iteration = Better productivity!

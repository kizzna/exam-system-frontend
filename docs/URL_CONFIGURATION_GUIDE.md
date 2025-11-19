# URL Configuration Guide - Exam System

## Problem Solved

**Issue:** Browser couldn't resolve `gt-omr-api-1:8000` when accessing the frontend from the local network.

**Error:** `POST http://gt-omr-api-1:8000/api/auth/login net::ERR_NAME_NOT_RESOLVED`

**Solution:** Use `.gt` domain suffix for all URLs that need to be accessible from browsers on the network.

---

## URL Architecture

### Backend API URLs

#### Internal (Server-to-Server)

- **Used by:** Server-side code, deployment scripts, health checks
- **Format:** `http://gt-omr-api-1:8000`
- **Accessible from:** Dev container, web servers, database servers
- **Not accessible from:** External browsers on the network

#### External (Browser-Accessible)

- **Used by:** Frontend JavaScript running in user's browser
- **Format:** `http://gt-omr-api-1.gt:8000`
- **Accessible from:** Any device on the network (browsers, curl, etc.)
- **DNS:** Resolved by network DNS or /etc/hosts

### Frontend URLs

#### Server Access

- **gt-omr-web-1.gt** → http://10.10.24.151
- **gt-omr-web-2.gt** → http://10.10.24.152
- **gt-omr-web-3.gt** → http://10.10.24.153

#### Port Configuration

- **Port 80:** Nginx reverse proxy (recommended for users)
- **Port 3000:** Direct PM2 application (for testing/debugging)

---

## Configuration Files

### 1. Environment Variables

#### `.env.local.example` (Template)

```env
NEXT_PUBLIC_API_URL=http://gt-omr-api-1.gt:8000
```

#### `.env.local` (Active - local dev)

```env
NEXT_PUBLIC_API_URL=http://gt-omr-api-1.gt:8000
```

**Note:** The `NEXT_PUBLIC_` prefix makes this variable available to browser-side JavaScript.

### 2. PM2 Configuration

#### `ecosystem.config.js`

```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3000,
  NEXT_PUBLIC_API_URL: 'http://gt-omr-api-1.gt:8000',  // ✅ With .gt domain
}
```

**Important:** This overrides any .env.local file when running with PM2.

### 3. Next.js Configuration

#### `next.config.mjs`

```javascript
images: {
  remotePatterns: [
    { protocol: 'http', hostname: 'localhost' },
    { protocol: 'http', hostname: 'gt-omr-api-1' },      // Internal
    { protocol: 'http', hostname: 'gt-omr-api-1.gt' },   // External ✅
  ],
}
```

#### `lib/utils/constants.ts`

```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://gt-omr-api-1.gt:8000';
//                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                                   Fallback with .gt domain ✅
```

---

## How It Works

### Request Flow (Browser → API)

1. **User opens:** `http://gt-omr-web-1.gt/login`
2. **Browser loads:** Login page with JavaScript
3. **JavaScript makes API call:** `POST http://gt-omr-api-1.gt:8000/api/auth/login`
4. **DNS Resolution:**
   - Browser resolves `gt-omr-api-1.gt` → `10.10.24.154` (example)
5. **API responds:** With tokens and user data
6. **Frontend stores:** Tokens in localStorage
7. **Subsequent requests:** Include `Authorization: Bearer {token}`

### Why .gt Domain is Needed

```
┌─────────────────────────────────────────────────────────┐
│  User's Browser (on network)                            │
│  ┌────────────────────────────────────────────┐         │
│  │ Can resolve:                                │         │
│  │ ✅ gt-omr-api-1.gt  → 10.10.24.154          │         │
│  │ ❌ gt-omr-api-1     → Name not found        │         │
│  └────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Inside Servers/Dev Container                           │
│  ┌────────────────────────────────────────────┐         │
│  │ Can resolve both:                           │         │
│  │ ✅ gt-omr-api-1     → 10.10.24.154          │         │
│  │ ✅ gt-omr-api-1.gt  → 10.10.24.154          │         │
│  └────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

---

## Backend Configuration (for reference)

The backend API needs to allow CORS for requests from `http://gt-omr-web-*.gt`:

### FastAPI CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://gt-omr-web-1.gt",
        "http://gt-omr-web-2.gt",
        "http://gt-omr-web-3.gt",
        "http://gt-omr-web-1.gt:3000",
        "http://gt-omr-web-2.gt:3000",
        "http://gt-omr-web-3.gt:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Testing

### 1. Test API Accessibility from Browser

Open this URL in your browser:

```
http://gt-omr-api-1.gt:8000/docs
```

Should show Swagger UI documentation.

### 2. Test Frontend Login

1. Open: `http://gt-omr-web-1.gt/login`
2. Enter credentials: `admin` / `admin123`
3. Open browser DevTools → Network tab
4. Should see: `POST http://gt-omr-api-1.gt:8000/api/auth/login` with status 200

### 3. Test from Command Line

```bash
# From any machine on the network
curl -X POST http://gt-omr-api-1.gt:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Should return JSON with `access_token`.

---

## Deployment Checklist

After changing URL configuration:

- [ ] Update `ecosystem.config.js` with `.gt` domain
- [ ] Update `lib/utils/constants.ts` fallback
- [ ] Update `next.config.mjs` image patterns
- [ ] Rebuild application: `pnpm run build`
- [ ] Sync to CephFS: `./scripts/dev-sync-frontend.sh`
- [ ] Deploy to all servers: `./deployment/remote-deploy.sh gt-omr-web-{1,2,3} --build`
- [ ] Test login from browser
- [ ] Check browser DevTools → Network tab for API calls
- [ ] Verify no CORS errors in console

---

## Troubleshooting

### Issue: ERR_NAME_NOT_RESOLVED

**Cause:** Browser can't resolve hostname without `.gt` domain.

**Fix:** Ensure all `NEXT_PUBLIC_API_URL` values use `.gt` domain:

```bash
grep -r "NEXT_PUBLIC_API_URL" /workspace/{ecosystem.config.js,lib/utils/constants.ts,.env.local}
```

All should show: `http://gt-omr-api-1.gt:8000`

### Issue: CORS Error

**Cause:** Backend doesn't allow requests from frontend domain.

**Fix:** Add frontend domains to backend CORS allowed origins.

### Issue: Still seeing old URL in browser

**Cause:** Browser cached old JavaScript bundle.

**Fix:**

1. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R)
2. Clear cache and reload
3. Open in incognito/private window

### Issue: PM2 not picking up new env vars

**Cause:** PM2 caches environment variables.

**Fix:**

```bash
ssh gt-omr-web-1 'pm2 delete exam-system-frontend'
ssh gt-omr-web-1 'cd /cephfs/exam-system/frontend/current && pm2 start ecosystem.config.js'
```

---

## Network Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  User's Browser (10.10.24.x network)                         │
│                                                               │
│  Accessing: http://gt-omr-web-1.gt/login                     │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  gt-omr-web-1.gt (10.10.24.151)                              │
│  ┌────────────────────────────────────────────────┐          │
│  │  Nginx :80 → localhost:3000                    │          │
│  │  ┌──────────────────────────────────────────┐  │          │
│  │  │  PM2 Cluster (4 instances)               │  │          │
│  │  │  Next.js App with                        │  │          │
│  │  │  NEXT_PUBLIC_API_URL=                    │  │          │
│  │  │    http://gt-omr-api-1.gt:8000  ◄────────┼──┼──────┐   │
│  │  └──────────────────────────────────────────┘  │      │   │
│  └────────────────────────────────────────────────┘      │   │
└───────────────────────────────────────────────────────────┼───┘
                                                            │
                         User's browser makes API call      │
                         (from JavaScript)                  │
                                                            │
                                                            ▼
┌──────────────────────────────────────────────────────────────┐
│  gt-omr-api-1.gt:8000 (10.10.24.154)                         │
│  ┌────────────────────────────────────────────────┐          │
│  │  FastAPI Backend                               │          │
│  │  - CORS allows gt-omr-web-*.gt                 │          │
│  │  - Returns JSON with tokens                    │          │
│  └────────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────┘
```

---

## Summary

### ✅ What Was Fixed

1. **ecosystem.config.js:** Changed `http://gt-omr-api-1:8000` → `http://gt-omr-api-1.gt:8000`
2. **lib/utils/constants.ts:** Updated fallback URL to use `.gt` domain
3. **next.config.mjs:** Added `gt-omr-api-1.gt` to allowed image hostnames
4. **Rebuilt and redeployed:** All 3 frontend servers

### ✅ Result

- Browser can now resolve API hostname
- Login works from network browsers
- No more `ERR_NAME_NOT_RESOLVED` errors
- All API calls use publicly accessible URL

### 🔑 Key Principle

**Client-side (browser) code needs publicly resolvable hostnames.**  
**Server-side code can use internal hostnames.**

---

**Updated:** November 19, 2025  
**Status:** ✅ FIXED

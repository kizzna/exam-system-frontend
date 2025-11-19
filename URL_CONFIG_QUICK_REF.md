# URL Configuration - Quick Reference

## ✅ FIXED: Browser Access to API

### Problem

Browser couldn't resolve `gt-omr-api-1:8000` (missing `.gt` domain)

### Solution

All URLs now use `.gt` domain suffix for network accessibility.

---

## Current Configuration

### Backend API

```
http://gt-omr-api-1.gt:8000
```

### Frontend Servers

```
http://gt-omr-web-1.gt
http://gt-omr-web-2.gt
http://gt-omr-web-3.gt
```

---

## Files Updated

1. **ecosystem.config.js**

   ```javascript
   NEXT_PUBLIC_API_URL: 'http://gt-omr-api-1.gt:8000';
   ```

2. **lib/utils/constants.ts**

   ```typescript
   API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://gt-omr-api-1.gt:8000';
   ```

3. **next.config.mjs**

   ```javascript
   hostname: 'gt-omr-api-1.gt'; // Added to image patterns
   ```

4. **.env.local.example**
   ```env
   NEXT_PUBLIC_API_URL=http://gt-omr-api-1.gt:8000
   ```

---

## Testing

### From Browser

1. Open: http://gt-omr-web-1.gt/login
2. Login: `admin` / `admin123`
3. Check DevTools Network tab
4. Should see: `POST http://gt-omr-api-1.gt:8000/api/auth/login` ✅

### From Command Line

```bash
# Test API
curl http://gt-omr-api-1.gt:8000/docs

# Test Login
curl -X POST http://gt-omr-api-1.gt:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## Network Accessibility

| Hostname          | Port | Accessible From  | Purpose               |
| ----------------- | ---- | ---------------- | --------------------- |
| `gt-omr-api-1.gt` | 8000 | Network browsers | API (browser JS)      |
| `gt-omr-api-1`    | 8000 | Servers only     | API (internal)        |
| `gt-omr-web-1.gt` | 80   | Network browsers | Frontend (Nginx)      |
| `gt-omr-web-1.gt` | 3000 | Network browsers | Frontend (PM2 direct) |

---

## Deployment Status

✅ **All servers deployed with correct configuration**

- gt-omr-web-1: Running
- gt-omr-web-2: Running
- gt-omr-web-3: Running

---

## If You Need to Change URLs

1. Update `ecosystem.config.js`
2. Update `lib/utils/constants.ts` (fallback)
3. Rebuild: `pnpm run build`
4. Sync: `./scripts/dev-sync-frontend.sh`
5. Deploy: `./deployment/remote-deploy.sh gt-omr-web-{1,2,3} --build`

---

**Status:** ✅ WORKING  
**Date:** November 19, 2025

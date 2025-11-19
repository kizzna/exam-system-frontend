# Phase 1 Quick Test Guide

## Access URLs

### Frontend

- **Web 1:** http://gt-omr-web-1.gt
- **Web 2:** http://gt-omr-web-2.gt
- **Web 3:** http://gt-omr-web-3.gt
- **Load Balanced:** http://gt-omr-web.gt (if configured)

### Backend API

- **API Server:** http://gt-omr-api-1:8000
- **API Docs (Swagger):** http://gt-omr-api-1:8000/docs
- **API Docs (ReDoc):** http://gt-omr-api-1:8000/redoc

---

## Test Credentials

### Admin User

```
Username: admin
Password: admin123
```

---

## Test Scenarios

### 1. Login Flow ✅

1. Open http://gt-omr-web-1.gt/login
2. Enter username: `admin`
3. Enter password: `admin123`
4. Click "Sign In"
5. Should redirect to `/dashboard`
6. Should see "Welcome back, System Administrator!"

### 2. Protected Routes ✅

1. Open http://gt-omr-web-1.gt/dashboard (without login)
2. Should redirect to `/login?redirect=/dashboard`
3. After login, should return to `/dashboard`

### 3. User Management ✅

1. Login as admin
2. Click "Users" in sidebar
3. Should see user list with pagination
4. Click "Add User" button
5. Fill form:
   ```
   Username: testuser
   Email: test@example.com
   Full Name: Test User
   Password: testpass123
   Role Hierarchy: Organization (3)
   ```
6. Click "Create User"
7. New user should appear in list

### 4. Edit User ✅

1. In user list, click pencil icon on any user
2. Edit dialog should open (currently basic)
3. Modify email or full name
4. Click "Update User"
5. Changes should reflect in list

### 5. Delete User ✅

1. In user list, click trash icon on a user
2. Confirm deletion
3. User should be soft-deleted (is_active = false)

### 6. Token Refresh ✅

1. Login to app
2. Open browser DevTools → Application → LocalStorage
3. Find `auth-storage` key
4. Wait 30 minutes (or manually expire token)
5. Make any API call
6. Should auto-refresh token and retry

### 7. Logout ✅

1. Click user profile at bottom of sidebar
2. Click "Logout" button
3. Should redirect to `/login`
4. Should clear all stored tokens

---

## API Testing (cURL)

### Login

```bash
curl -X POST http://gt-omr-api-1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Expected response:

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "user_id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "full_name": "System Administrator",
    "is_admin": true,
    "role_hierarchy": 0
  }
}
```

### Get Current User

```bash
TOKEN="your_access_token_here"
curl -X GET http://gt-omr-api-1:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### List Users

```bash
TOKEN="your_access_token_here"
curl -X GET "http://gt-omr-api-1:8000/api/users?page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Create User

```bash
TOKEN="your_access_token_here"
curl -X POST http://gt-omr-api-1:8000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "password123",
    "full_name": "New User",
    "role_hierarchy": 3
  }'
```

---

## Server Management

### Check PM2 Status

```bash
# On all servers
for server in gt-omr-web-{1..3}; do
  echo "=== $server ==="
  ssh $server "pm2 status | grep exam-system"
done
```

### View Logs

```bash
# Real-time logs
ssh gt-omr-web-1 'pm2 logs exam-system-frontend'

# Last 50 lines
ssh gt-omr-web-1 'pm2 logs exam-system-frontend --lines 50 --nostream'
```

### Restart Application

```bash
# Graceful reload (zero downtime)
ssh gt-omr-web-1 'pm2 reload exam-system-frontend'

# Hard restart
ssh gt-omr-web-1 'pm2 restart exam-system-frontend'
```

### Monitor Resources

```bash
ssh gt-omr-web-1 'pm2 monit'
```

---

## Troubleshooting

### Issue: Login returns 401

**Check:**

1. Verify API is running: `curl http://gt-omr-api-1:8000/health`
2. Check credentials are correct
3. Look at network tab in browser DevTools
4. Check backend logs

### Issue: User list not loading

**Check:**

1. Verify user is admin: `user.is_admin === true`
2. Check API endpoint: `curl -H "Authorization: Bearer TOKEN" http://gt-omr-api-1:8000/api/users`
3. Look at browser console for errors
4. Check PM2 logs: `pm2 logs exam-system-frontend`

### Issue: Token refresh not working

**Check:**

1. Verify refresh token exists in localStorage
2. Check axios interceptor in DevTools network tab
3. Verify refresh endpoint: `curl -X POST http://gt-omr-api-1:8000/api/auth/refresh -d '{"refresh_token":"..."}'`

### Issue: Page not loading

**Check:**

1. PM2 status: `ssh gt-omr-web-1 'pm2 status'`
2. Nginx status: `ssh gt-omr-web-1 'systemctl status nginx'`
3. Port 3000 listening: `ssh gt-omr-web-1 'netstat -tlnp | grep 3000'`
4. Build exists: `ssh gt-omr-web-1 'ls -la /cephfs/exam-system/frontend/current/.next'`

---

## Browser DevTools Checklist

### Network Tab

- [ ] Login POST returns 200 with tokens
- [ ] Auth header included: `Authorization: Bearer ...`
- [ ] API calls to `http://gt-omr-api-1:8000/api/...`
- [ ] 401 errors trigger refresh flow

### Console Tab

- [ ] No JavaScript errors
- [ ] No CORS errors
- [ ] React Query devtools showing (if enabled)

### Application Tab → LocalStorage

- [ ] `auth-storage` contains:
  ```json
  {
    "state": {
      "user": {...},
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
  ```

---

## Performance Benchmarks

### Expected Metrics

- **Page Load Time:** < 1 second
- **API Response Time:** < 200ms
- **Login Time:** < 500ms
- **Token Refresh:** < 100ms

### Load Testing (basic)

```bash
# Test login endpoint
ab -n 100 -c 10 -p login.json -T application/json \
  http://gt-omr-api-1:8000/api/auth/login

# Where login.json contains:
# {"username":"admin","password":"admin123"}
```

---

## Success Criteria

### ✅ Authentication

- [ ] Can login with valid credentials
- [ ] Cannot login with invalid credentials
- [ ] Tokens stored correctly
- [ ] Protected routes redirect to login
- [ ] Logged-in users can't access /login
- [ ] Token refresh works automatically
- [ ] Logout clears all state

### ✅ User Management

- [ ] Admin can view user list
- [ ] Non-admin gets permission denied
- [ ] Pagination works (forward/back)
- [ ] Can create new users
- [ ] Can edit existing users
- [ ] Can delete users
- [ ] Form validation works

### ✅ Deployment

- [ ] All 3 servers running
- [ ] PM2 cluster mode (4 instances each)
- [ ] Nginx proxying correctly
- [ ] No build errors
- [ ] No console errors in browser

---

## Quick Deployment

### From Dev Container

```bash
# 1. Sync code
cd /workspace
./scripts/dev-sync-frontend.sh

# 2. Deploy to all servers
./deployment/remote-deploy.sh gt-omr-web-1 --build
./deployment/remote-deploy.sh gt-omr-web-2 --build
./deployment/remote-deploy.sh gt-omr-web-3 --build

# 3. Verify
for server in gt-omr-web-{1..3}; do
  curl -I http://$server:3000
done
```

### Quick Reload (No Build)

```bash
for server in gt-omr-web-{1..3}; do
  ssh $server 'pm2 reload exam-system-frontend'
done
```

---

## Contact & Support

- **API Documentation:** http://gt-omr-api-1:8000/docs
- **Implementation Guide:** `/workspace/PHASE1_IMPLEMENTATION_COMPLETE.md`
- **Phase 1 Spec:** `/workspace/docs/PHASE1_FRONTEND_GUIDE.md`

**Status:** ✅ All systems operational

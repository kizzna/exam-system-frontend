# Technical Change Request: Infrastructure & Architecture Update
**Project:** OMR Exam System (`omr.gongtham.net`)
**Date:** 2025-12-16
**Objective:** Fix "Redirect Loops," "Mixed Content" errors, and implement a Unified Gateway architecture to hide internal IPs.

## 1. Architecture Overview
We are moving to a **Unified Gateway** model. All traffic (Frontend and API) will pass through the public Nginx entry point. The browser will no longer communicate directly with the Python API container IP.

**Traffic Flow:**
1.  **Frontend Traffic:** `https://omr.gongtham.net/*` → Nginx → Next.js Container
2.  **API Traffic:** `https://omr.gongtham.net/api/*` → Nginx → FastAPI Container

---

## 2. Infrastructure / DevOps Tasks

### 2.1 Cloudflare Settings (Crucial)
**Action:** Log in to Cloudflare Dashboard.
**Path:** SSL/TLS > Overview
**Setting:** Change encryption mode to **Full** or **Full (Strict)**.
*   *Reasoning:* "Flexible" mode causes infinite redirect loops because Cloudflare talks to our origin over HTTP, but Next.js redirects back to HTTPS.
NOTE: Finished, It was set to Full (Strict) 9 years ago and never changed.

### 2.2 Ingress Nginx (`0443-8091-omr-gongtham-net.conf`)
**Action:** Update the configuration to ensure the `X-Forwarded-Proto` header is explicitly set.

**File:** `/etc/nginx/sites-enabled/0443-8091-omr-gongtham-net.conf`
**Change in `server { listen 443 ... }` block:**
```nginx
location / {
    proxy_pass http://omr_backend;
    
    # ... keep existing headers ...
    
    # ADD THIS LINE:
    proxy_set_header X-Forwarded-Proto https; 
}
```

### 2.3 Webapp Container Nginx (`exam-system-frontend`)
**Action:** Replace the existing configuration to handle header inheritance correctly and proxy API traffic.

**File:** `/etc/nginx/sites-enabled/exam-system-frontend`
**Content:**
```nginx
# WebSocket Header Handling
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

# Logic to preserve HTTPS protocol status
map $http_x_forwarded_proto $final_forwarded_proto {
    default $http_x_forwarded_proto;
    ''      $scheme;
}

upstream nextjs_upstream {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Python Backend Upstream
upstream fastapi_upstream {
    server 10.10.24.131:8000; # Internal IP of Python Container
    keepalive 64;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=frontend_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;

server {
    listen 80;
    listen [::]:80;
    server_name gt-omr-web-1;

    # --- GLOBAL PROXY HEADERS ---
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $final_forwarded_proto; # Fixes Redirect Loop

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logs
    access_log /var/log/nginx/exam-system-frontend.access.log;
    error_log /var/log/nginx/exam-system-frontend.error.log;
    client_max_body_size 100M;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # --- 1. ROUTE TO PYTHON API ---
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://fastapi_upstream;
        
        # Extended timeouts for API processing
        proxy_read_timeout 300s;
        proxy_cache_bypass $http_upgrade;
    }

    # --- 2. ROUTE TO NEXT.JS (Static & App) ---
    location /_next/static {
        proxy_cache STATIC;
        proxy_pass http://nextjs_upstream;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /public {
        proxy_cache STATIC;
        proxy_pass http://nextjs_upstream;
        add_header Cache-Control "public, max-age=3600";
    }

    location / {
        limit_req zone=frontend_limit burst=20 nodelay;
        proxy_pass http://nextjs_upstream;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 3. Frontend Developers (Next.js)

### 3.1 Update Environment Variables
We must stop using hardcoded internal IPs (`http://10.10.x.x`) in the browser.

**Action:** Update `.env.production` (or your Docker env vars):

| Variable | Old Value | New Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `http://10.10.24.131:8000` | `/api` |
| `INTERNAL_API_URL` | *(Not set)* | `http://10.10.24.131:8000` |

### 3.2 Update Fetch Logic (SSR Support)
If you are fetching data inside `getServerSideProps` or Server Components, a relative path `/api` will fail because Node.js doesn't know the domain.

**Action:** Update your API utility/axios config:

```javascript
// Example helper
const getBaseUrl = () => {
  // If running on the browser (Client Side)
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL; // Returns "/api"
  }
  // If running on the server (Server Side Rendering)
  // Fallback to internal IP if variable exists, or use localhost
  return process.env.INTERNAL_API_URL || 'http://127.0.0.1:3000/api'; 
};

// Use this base URL for requests
const response = await fetch(`${getBaseUrl()}/batches`);
```

---

## 4. Backend Developers (FastAPI)

### 4.1 Route Prefixes
Nginx is now forwarding requests to `/api/...`.
**Action:** Ensure your `main.py` handles the prefix correctly.
*   If your code has `@app.get("/batches")`, Nginx sending `/api/batches` might cause a 404.
*   **Fix:** Either update Nginx to strip the path (complex) OR update FastAPI to use a root router with `/api` prefix.

### 4.2 Middleware Configuration
Ensure the API trusts the Nginx headers so that generated links (pagination, HATEOAS) use `https://`.

**Action:** Update `main.py`:

```python
from fastapi import FastAPI
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

app = FastAPI(root_path="/api") # root_path handles the stripping logic automatically if needed

# Trust Nginx to tell us the real IP and Scheme (HTTPS)
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")
```

---

## 5. Verification Steps

1.  **Check Redirects:** Open `https://omr.gongtham.net` in Incognito. The page should load immediately (Status 200) without "Too Many Redirects."
2.  **Check API:** Open Developer Tools (F12) -> Network Tab.
    *   Navigate to a dashboard page.
    *   Verify XHR requests go to `https://omr.gongtham.net/api/batches` (Status 200).
    *   **Fail Condition:** If you see requests to `http://10.10...`, the Frontend Env Vars were not updated.
    *   **Fail Condition:** If you see `Mixed Content Blocked`, the Frontend is still trying to use HTTP.
For the development environment where you run `pnpm dev` and access via port 3000 directly (bypassing Nginx), you should use **Next.js Rewrites**.

This allows you to keep the frontend code identical to production (using `/api` relative paths) while letting the Next.js development server act as the "Unified Gateway" proxy.

Here is the setup for your developers.

### 1. The Strategy
*   **Production:** Nginx listens on port 80/443 and routes `/api` to Python.
*   **Development:** Next.js listens on port 3000. It proxies `/api` requests to **Nginx (Layer 2 Gateway)**.
*   **Why:** This ensures that all custom Nginx logic (Rewrites for Real-time lane, Buffering settings, etc.) applies in Dev as well.

### 2. Update `next.config.js`
Your `next.config.mjs` is configured to proxy requests to the Nginx Gateway.

```javascript
// next.config.mjs
async rewrites() {
return [
    {
    source: '/api/:path*',
    // DESTINATION: Nginx Unified Gateway
    destination: `${process.env.API_PROXY_URL || 'http://gt-omr-web-1.gt'}/api/:path*`, 
    },
]
},
```

### 3. Update Development Environment Variables
If you need to override the gateway location (e.g. strict local development without containers):

**File:** `.env.development` (or your local `.env`)

```ini
# 1. The React App uses this. 
NEXT_PUBLIC_API_URL=/api

# 2. Used by next.config.js (Server side) to know where to proxy.
# Default is http://gt-omr-web-1.gt (The Nginx Container)
API_PROXY_URL=http://localhost:80 # If running Nginx locally on host
```

### 4. How the Flow Works in Dev

1.  **Developer** opens `http://omr-frontend-dev.gt:3000/dashboard`.
2.  **Browser** executes React code: `fetch('/api/realtime/batches/upload')`.
3.  **Next.js Proxy** sends request to `http://gt-omr-web-1.gt/api/realtime/batches/upload`.
4.  **Nginx Gateway** receives request.
    *   Matches `Lane 1` (Realtime).
    *   **Rewrites URL**: `/api/realtime/...` -> `/api/...`.
    *   Proxies to Backend (`http://gt-omr-api.gt:8000`).
5.  **FastAPI** receives clean URL `/api/batches/upload`.
6.  **Success!**

### 5. Special Note for SSR
For `getServerSideProps`, use the helper `getBaseUrl()` which typically points to the internal URL or Nginx.
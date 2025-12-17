For the development environment where you run `pnpm dev` and access via port 3000 directly (bypassing Nginx), you should use **Next.js Rewrites**.

This allows you to keep the frontend code identical to production (using `/api` relative paths) while letting the Next.js development server act as the "Unified Gateway" proxy.

Here is the setup for your developers.

### 1. The Strategy
*   **Production:** Nginx listens on port 80/443 and routes `/api` to Python.
*   **Development:** Next.js (Webpack/Turbopack) listens on port 3000 and routes `/api` to Python.
*   **Codebase:** The React code always fetches `/api/...` (it doesn't care which environment it is in).

### 2. Update `next.config.js`
Modify your `next.config.js` to include a rewrite rule. This tells the dev server: "If you see a request for `/api`, don't look for a page, send it to the backend container."

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... your existing config ...

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // DESTINATION: The internal Docker DNS name of your FastAPI container
        // Example: http://gt-omr-backend:8000/api/:path*
        destination: `${process.env.API_PROXY_URL || 'http://127.0.0.1:8000'}/api/:path*`, 
      },
    ]
  },
}

module.exports = nextConfig
```

*Note: In production, Nginx sits **in front** of Next.js and catches `/api` requests first, so this Next.js config effectively gets ignored in prod, which is exactly what we want.*

### 3. Update Development Environment Variables
In your dev container, you need to define where the backend lives.

**File:** `.env.development` (or your local `.env`)

```ini
# 1. The React App uses this. 
# Keep it relative! This hits Next.js dev server on port 3000.
NEXT_PUBLIC_API_URL=/api

# 2. Used by next.config.js (Server side) to know where to proxy.
# Use the Docker Service Name of the python container + port.
API_PROXY_URL=http://gt-omr-backend:8000
# OR if using local host networking: http://10.10.24.131:8000

# 3. Used for Server-Side Rendering (SSR) inside getServerSideProps
# Since SSR runs inside the node process, it can't use relative paths.
INTERNAL_API_URL=http://gt-omr-backend:8000
```

### 4. How the Flow Works in Dev

1.  **Developer** opens `http://omr-frontend-dev.gt:3000/dashboard`.
2.  **Browser** executes React code: `fetch('/api/batches')`.
3.  **Request** goes to `http://omr-frontend-dev.gt:3000/api/batches`.
4.  **Next.js Dev Server** sees the `rewrites` rule match.
5.  **Next.js** proxies the request to `http://gt-omr-backend:8000/api/batches`.
6.  **FastAPI** responds.
7.  **Next.js** sends response back to Browser.

**Benefit:** No CORS errors, no "Mixed Content" errors, and the code looks exactly the same as Production.

### 5. Special Note for SSR (Server Side Rendering)
If you use `getServerSideProps` or Server Components, `fetch` runs inside the Node.js container, not the browser.

Relative URLs (like `/api/batches`) **do not work** in SSR because Node.js doesn't know "who" it is hosting.

You must use a utility helper in your code:

```javascript
// lib/api-config.js or similar
export const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use relative path, let Nginx (Prod) or Next.js Rewrites (Dev) handle it
    return process.env.NEXT_PUBLIC_API_URL; // Value: "/api"
  } else {
    // Server-side: Direct container-to-container communication
    // Prod: http://10.10.24.131:8000
    // Dev: http://gt-omr-backend:8000
    return process.env.INTERNAL_API_URL; 
  }
};

// Usage
const res = await fetch(`${getBaseUrl()}/batches`);
```
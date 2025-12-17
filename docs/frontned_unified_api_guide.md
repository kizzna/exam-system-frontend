# Frontend API Consumption Guide

## Overview
As part of the Unified Gateway update, the API is now served exclusively through the public Nginx gateway at `https://omr.gongtham.net/api`. This changes how the frontend—both client-side and server-side—must connect to the backend.

## 1. Base URL Configuration

### Client-Side Requests (Browser)
Requests made from the browser (e.g., inside `useEffect`, event handlers, or SWR/TanStack Query) should use the relative path `/api`.

**Why?**
- The browser is already at `https://omr.gongtham.net`.
- Nginx automatically routes `/api/...` to the FastAPI backend.
- This avoids CORS issues and hardcoded IP headers.

**Example:**
```javascript
// ✅ CORRECT
const res = await fetch('/api/batches');

// ❌ INCORRECT
const res = await fetch('http://10.10.x.x:8000/api/batches');
```

### Server-Side Requests (Next.js SSR / Server Components)
Requests made from the Node.js server (e.g., `getServerSideProps`, Server Components) **cannot** use relative paths because the server doesn't have a "current domain" in the same way a browser does.

You must configure an internal URL or use the Service Name if inside Docker.

**Environment Variables (.env):**
```bash
# Public URL for browser public assets (image links etc returned by api)
NEXT_PUBLIC_API_URL=/api

# Internal URL for Node.js server-to-server communication
INTERNAL_API_URL=http://omr-backend:8000
# OR if local development:
# INTERNAL_API_URL=http://localhost:8000
```

**Helper Function Pattern:**
```javascript
export const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL; // Returns "/api"
  }
  return process.env.INTERNAL_API_URL || 'http://localhost:8000';
};
```

## 2. Updated Endpoints
Most endpoints remain the same, but the **Health Check** endpoint has been moved.

| Old Endpoint | New Endpoint | Notes |
| :--- | :--- | :--- |
| `/health` | `/api/health` | Consistent with global prefix |
| `/api/batches` | `/api/batches` | No change |
| `/api/auth/*` | `/api/auth/*` | No change |

## 3. Handling Redirects & Mixed Content
- **Strict HTTPS:** The API now assumes HTTPS. If you manually type `http://`, Nginx will redirect you.
- **Proxy Headers:** The backend now trusts `X-Forwarded-Proto`. If the API returns a full URL (e.g., for paginated `next_page` links), it will correctly use `https://omr.gongtham.net` instead of `http://10.10.x.x`.

## 4. Verification
If you see "Network Error" or 404s:
1. Check your `.env` file updates.
2. Verify you aren't stripping `/api` manually in your axios/fetch wrapper. The backend RECEIVES requests at `/api/resource`.


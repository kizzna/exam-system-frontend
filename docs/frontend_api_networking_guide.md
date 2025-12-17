# Frontend API Networking Guide

## Overview

We have migrated to a **Multi-tier Reverse Proxy Architecture**. This ensures stability for long-running processes (like large uploads) while maintaining speed for standard API requests.

The backend now exposes two "lanes" for API traffic:

1.  **Standard Lane (`/api/`)**: For 95% of requests (Users, Tasks, Profiles, etc.).
2.  **Real-time Lane (`/api/realtime/`)**: EXCLUSIVELY for **Server-Sent Events (SSE)**, **WebSockets**, and **Large File Uploads**.

---

## 1. Which URL to use?

### ✅ Standard Requests (Default)
Use the standard `/api` prefix for all CRUD operations.
*   **Endpoint**: `/api/users`, `/api/tasks`, `/api/auth`
*   **Behavior**: Optimized for quick response times (buffered). 60s timeout.

### 🚀 Real-time Requests
Use the `/api/realtime` prefix **ONLY** for:
1.  **Batch Uploads** (`POST /api/realtime/batches/upload`)
2.  **SSE Streams** (`GET /api/realtime/jobs/stream`)
3.  **WebSockets**

*   **Behavior**: Unbuffered (Streaming), 1-hour timeout.
*   **Note**: The backend sees these requests as `/api/...`. The `/realtime` segment is stripped by the gateway. You simply prepend it in the frontend.

---

## 2. Implementation Guide

### A. Helper Function
We recommend adding a helper to your API client config:

```typescript
// utils/api.ts

export const API_BASE = '/api';
export const API_REALTIME_BASE = '/api/realtime';

/**
 * Selects the correct base URL based on operation type
 */
export const getApiUrl = (endpoint: string, isRealtime = false) => {
  const base = isRealtime ? API_REALTIME_BASE : API_BASE;
  // Ensure endpoint doesn't start with /api if we are appending to base
  const cleanEndpoint = endpoint.replace(/^\/api/, ''); 
  return `${base}${cleanEndpoint}`;
};
```

### B. Example: Uploading a Batch (Real-time Lane)
**Crucial**: You must use the Real-time lane to avoid 30s/60s timeouts on large files.

```typescript
import { getApiUrl } from './utils/api';

async function uploadBatch(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  // Use Real-time Lane
  const url = getApiUrl('/batches/upload', true); // -> /api/realtime/batches/upload
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    // No headers needed (browser sets Content-Type for FormData)
  });
  
  if (!response.ok) throw new Error('Upload failed');
  return response.json();
}
```

### C. Example: Listening to SSE (Real-time Lane)

```typescript
import { getApiUrl } from './utils/api';

function subscribeToProgress(batchId: string) {
  // Use Real-time Lane
  const url = getApiUrl(`/jobs/${batchId}/stream`, true); // -> /api/realtime/jobs/...
  
  const eventSource = new EventSource(url);
  
  eventSource.onmessage = (event) => {
    console.log('Progress:', JSON.parse(event.data));
  };
  
  return eventSource;
}
```

### D. Example: Getting User List (Standard Lane)

```typescript
import { getApiUrl } from './utils/api';

async function getUsers() {
  // Use Standard Lane (Default)
  const url = getApiUrl('/users'); // -> /api/users
  
  const response = await fetch(url);
  return response.json();
}
```

---

## 3. Server-Side Rendering (SSR)
For Server-Side requests (e.g. `getServerSideProps` in Next.js), you **cannot** use relative paths.

*   **Internal Access**: Use the direct Service URL if inside Docker (`http://omr-backend:8000`) or the standard Loopback.
*   **Public Access**: Use the full domain `https://omr.gongtham.net/api/...`.

**Note**: For SSR, you usually don't need the Real-time lane as SSR requests should be short-lived.

---

## 4. Troubleshooting

| Error | Cause | Solution |
| :--- | :--- | :--- |
| **504 Gateway Timeout** (after exactly 60s) | Using Standard Lane for a long upload. | Switch to `/api/realtime/...` |
| **404 Not Found** on `/api/realtime/...` | Nginx Gateway not configured or Rewrite failed. | Contact DevOps to check Layer 2 config. |
| **400 Bad Request** during upload | Connection interrupted or Body Parsing error. | Ensure traffic is going through Real-time lane (Buffering OFF). |


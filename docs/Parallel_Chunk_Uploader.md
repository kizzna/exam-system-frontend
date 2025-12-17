# Parallel Chunk Uploader
This is the **Parallel Chunk Uploader**.

To fix your speed issue, we need to change the logic from **Serial** (wait for chunk 1 -> send chunk 2) to **Parallel** (send chunk 1, 2, 3, 4 at the same time).

### Why this is faster
On a 500Mbps link with a Cloudflare Tunnel, your bottleneck is **Latency (RTT)**, not Bandwidth.
*   **Serial:** 1 second upload + 0.5s server wait = 1.5s per chunk.
*   **Parallel (4x):** You upload 4 chunks in that same 1.5s window.

### The Refactored Code (`chunked-upload.ts`)

I have rewritten `uploadInChunks` to use a **Concurrency Pool**. It uploads Chunk 0 first (to get the ID), then floods the remaining chunks 4 at a time.

```typescript
/**
 * Chunked Upload Utility (Parallel Version)
 * Handles file uploads > 100MB
 *
 * Optimization:
 * - Uses Parallel Uploads (Concurrency = 4) to saturate bandwidth
 * - Chunk 0 is uploaded serially to establish Session/Upload ID
 * - Chunks 1..N are uploaded in parallel
 */

import type { ChunkUploadProgress, UploadType } from './types/batches';
import { useAuthStore } from './stores/auth-store';
import { API_BASE_URL } from './utils/constants';
import { getApiUrl } from './utils/api';

const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks
const CLOUDFLARE_LIMIT = 100 * 1024 * 1024; // 100MB Cloudflare limit
const MAX_RETRIES = 3;
const CONCURRENCY_LIMIT = 4; // How many chunks to upload at once

function getAuthToken(): string | null {
  return useAuthStore.getState().accessToken;
}

/**
 * Helper: Uploads a single chunk with internal retry logic
 */
async function uploadSingleChunkWithRetry(
  chunk: Blob,
  chunkIndex: number,
  totalChunks: number,
  file: File,
  uploadType: UploadType,
  uploadId: string | null,
  taskId: string | null,
  notes: string | null,
  profileId: number | null,
  signal?: AbortSignal
): Promise<{ upload_id: string; batch_id?: string }> {
  const isLastChunk = chunkIndex === totalChunks - 1;
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    if (signal?.aborted) throw new Error('Upload cancelled');

    try {
      const formData = new FormData();
      formData.append('chunk', chunk, `${file.name}.part${chunkIndex}`);
      formData.append('chunk_index', chunkIndex.toString());
      formData.append('total_chunks', totalChunks.toString());
      formData.append('filename', file.name);
      formData.append('upload_type', uploadType);
      formData.append('is_final_chunk', isLastChunk.toString());

      if (uploadId) formData.append('upload_id', uploadId);
      if (taskId) formData.append('task_id', taskId);
      
      // Only attach notes/profile to the final chunk
      if (isLastChunk) {
        if (notes) formData.append('notes', notes);
        if (profileId) formData.append('profile_id', profileId.toString());
      }

      const token = getAuthToken();
      if (!token) throw new Error('No authentication token found');

      // Note: We use fetch here. Fetch does not give upload progress events.
      // Progress is calculated based on completed chunks in the main loop.
      const response = await fetch(getApiUrl('/batches/upload-chunk', true), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        signal, // Connect abort signal
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(error.message || `Chunk ${chunkIndex} failed`);
      }

      return await response.json();
    } catch (error) {
      retryCount++;
      const isAbort = error instanceof Error && error.name === 'AbortError';
      if (isAbort) throw error;

      console.error(`[Chunk ${chunkIndex}] Attempt ${retryCount} failed:`, error);
      
      if (retryCount >= MAX_RETRIES) {
        throw new Error(`Chunk ${chunkIndex} failed after ${MAX_RETRIES} attempts`);
      }

      // Exponential backoff
      const delayMs = Math.pow(2, retryCount) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Unexpected error in retry loop');
}

/**
 * Upload file in chunks PARALLELIZED
 */
async function uploadInChunks(
  file: File,
  uploadType: UploadType,
  taskId: string | null,
  notes: string | null,
  profileId: number | null,
  onProgress: (progress: ChunkUploadProgress) => void,
  signal?: AbortSignal
): Promise<{ batch_id: string }> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  let uploadId: string | null = null;
  
  // Track progress
  let chunksCompleted = 0;
  // We approximate bytes uploaded because fetch doesn't stream progress
  const updateProgress = () => {
    // Calculate approximate bytes based on completed chunks
    // (This isn't perfect but works for fetch)
    const estimatedBytes = Math.min((chunksCompleted / totalChunks) * file.size, file.size);
    onProgress({
      chunksTotal: totalChunks,
      chunksUploaded: chunksCompleted,
      bytesUploaded: estimatedBytes,
      bytesTotal: file.size,
      percentage: (chunksCompleted / totalChunks) * 100,
      currentChunk: chunksCompleted // Just for display
    });
  };

  console.log(`[Parallel Upload] Starting: ${file.name} (${totalChunks} chunks)`);

  // --- STEP 1: Upload Chunk 0 Serially ---
  // We MUST do this to get the 'upload_id' from the server to link subsequent chunks
  const chunk0 = file.slice(0, CHUNK_SIZE);
  const res0 = await uploadSingleChunkWithRetry(
    chunk0, 0, totalChunks, file, uploadType, null, taskId, notes, profileId, signal
  );
  
  uploadId = res0.upload_id;
  chunksCompleted++;
  updateProgress();
  
  if (totalChunks === 1) {
    return { batch_id: res0.batch_id! };
  }

  // --- STEP 2: Upload Chunks 1..N in Parallel ---
  // We use a pool to limit concurrency (e.g. 4 at a time)
  
  const pendingIndices = Array.from({ length: totalChunks - 1 }, (_, i) => i + 1); // [1, 2, 3...]
  let activeUploads = 0;
  let resultBatchId: string | null = null;
  
  // Helper to process the queue
  const processQueue = async (): Promise<void> => {
    if (pendingIndices.length === 0) return;

    // Grab next index
    const index = pendingIndices.shift()!;
    const start = index * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunkBlob = file.slice(start, end);

    activeUploads++;
    
    try {
      const res = await uploadSingleChunkWithRetry(
        chunkBlob, index, totalChunks, file, uploadType, uploadId, taskId, notes, profileId, signal
      );
      
      if (res.batch_id) {
        resultBatchId = res.batch_id;
      }
      
      chunksCompleted++;
      updateProgress();
    } finally {
      activeUploads--;
    }

    // Recursively pick up next job if queue not empty
    if (pendingIndices.length > 0) {
      return processQueue();
    }
  };

  // Start initial pool
  const workers = [];
  const limit = Math.min(CONCURRENCY_LIMIT, pendingIndices.length);
  
  for (let i = 0; i < limit; i++) {
    workers.push(processQueue());
  }

  // Wait for all workers to drain the queue
  await Promise.all(workers);

  if (!resultBatchId) {
    throw new Error('Upload completed but no Batch ID returned from server');
  }

  console.log(`[Parallel Upload] Complete! Batch: ${resultBatchId}`);
  return { batch_id: resultBatchId };
}

// ... Keep uploadDirect and uploadFile and uploadImages as they were ...
// (Copy them from your existing file, they don't need changes except calling the new uploadInChunks)

/**
 * Main upload function
 */
export async function uploadFile(
  file: File,
  uploadType: UploadType,
  taskId: string | null,
  notes: string | null,
  profileId: number | null,
  onProgress: (progress: ChunkUploadProgress) => void,
  signal?: AbortSignal
): Promise<{ batch_id: string }> {
  if (!file) throw new Error('No file provided');
  if ((uploadType === 'zip_no_qr' || uploadType === 'images') && !taskId) {
    throw new Error('Task ID required');
  }

  const needsChunking = file.size > CLOUDFLARE_LIMIT;

  if (needsChunking) {
    return uploadInChunks(file, uploadType, taskId, notes, profileId, onProgress, signal);
  } else {
    return uploadDirect(file, uploadType, taskId, notes, profileId, onProgress, signal);
  }
}

async function uploadDirect(
  file: File,
  uploadType: UploadType,
  taskId: string | null,
  notes: string | null,
  profileId: number | null,
  onProgress: (progress: ChunkUploadProgress) => void,
  signal?: AbortSignal
): Promise<{ batch_id: string }> {
    // ... [Paste your exact existing uploadDirect code here] ...
    // ... Just ensure it imports constants correctly ...
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        // ... (rest of logic)
        // This part was fine in your original code
        if (uploadType === 'images') formData.append('files', file);
        else formData.append('file', file);
        
        formData.append('upload_type', uploadType);
        if (taskId) formData.append('task_id', taskId);
        if (notes) formData.append('notes', notes);
        if (profileId) formData.append('profile_id', profileId.toString());

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress({
              chunksTotal: 1,
              chunksUploaded: 0,
              bytesUploaded: e.loaded,
              bytesTotal: e.total,
              percentage: (e.loaded / e.total) * 100,
              currentChunk: 1,
            });
          }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200 || xhr.status === 202) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                reject(new Error(`Upload failed: ${xhr.status}`));
            }
        });
        xhr.addEventListener('error', () => reject(new Error('Network Error')));
        xhr.addEventListener('abort', () => reject(new Error('Aborted')));
        if (signal) signal.addEventListener('abort', () => xhr.abort());

        const token = getAuthToken();
        xhr.open('POST', getApiUrl('/batches/upload', true));
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
    });
}

// --- RE-INSERT YOUR EXISTING uploadImages FUNCTION HERE ---
export async function uploadImages(
  files: File[],
  taskId: string,
  notes: string | null,
  profileId: number | null,
  onProgress: (progress: ChunkUploadProgress) => void,
  signal?: AbortSignal
): Promise<{ batch_id: string }> {
    // ... [Paste your existing uploadImages code here] ...
    // (This function is fine as-is)
    // Just a placeholder to remind you to keep it
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > CLOUDFLARE_LIMIT) throw new Error("Batch size too large");
    
    return new Promise((resolve, reject) => {
        // ... existing XHR logic ...
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));
        formData.append('upload_type', 'images');
        formData.append('task_id', taskId);
        if(notes) formData.append('notes', notes);
        if(profileId) formData.append('profile_id', profileId.toString());

        xhr.upload.addEventListener('progress', (e) => {
             if (e.lengthComputable) onProgress({
                 chunksTotal: 1, chunksUploaded: 0, bytesUploaded: e.loaded, bytesTotal: e.total, percentage: (e.loaded/e.total)*100, currentChunk: 1
             });
        });
        
        xhr.addEventListener('load', () => resolve(JSON.parse(xhr.responseText)));
        xhr.addEventListener('error', () => reject(new Error('Network')));
        
        const token = getAuthToken();
        xhr.open('POST', `${API_BASE_URL}/batches/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
    });
}
```

After updating the Typescript code your uploads should be significantly faster (3x-4x).
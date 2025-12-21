/**
 * Chunked Upload Utility
 * Handles file uploads > 100MB due to Cloudflare limit
 *
 * Features:
 * - Automatic chunking for files > 100MB
 * - 50MB chunk size for optimal performance
 * - Retry logic (3 attempts per chunk)
 * - Progress tracking
 * - Exponential backoff on failures
 */

import type { ChunkUploadProgress, UploadType } from './types/batches';
import { useAuthStore } from './stores/auth-store';
import { API_BASE_URL } from './utils/constants';
import { getApiUrl } from './utils/api';

// Dynamic chunk size calculator
function getChunkSize(totalBytes: number): number {
  const MB = 1024 * 1024;

  if (totalBytes <= 100 * MB) return 5 * MB;
  if (totalBytes <= 500 * MB) return 10 * MB;
  if (totalBytes <= 1000 * MB) return 20 * MB;
  if (totalBytes <= 2000 * MB) return 30 * MB;
  if (totalBytes <= 4000 * MB) return 40 * MB; // 2000-4000MB range

  return 50 * MB; // 4000MB+
}

const CLOUDFLARE_LIMIT = 100 * 1024 * 1024; // 100MB Cloudflare limit
const MAX_RETRIES = 3;

/**
 * Get auth token from Zustand store
 */
function getAuthToken(): string | null {
  return useAuthStore.getState().accessToken;
}

/**
 * Upload file directly (< 100MB)
 */
async function uploadDirect(
  file: File,
  uploadType: UploadType,
  taskId: string | null,
  notes: string | null,
  profileId: number | null,
  onProgress: (progress: ChunkUploadProgress) => void,
  alignmentMode?: 'hybrid' | 'standard' | 'imreg_dft',
  signal?: AbortSignal
): Promise<{ batch_id: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    // Build form data based on upload type
    if (uploadType === 'images') {
      formData.append('files', file);
    } else {
      formData.append('file', file);
    }

    formData.append('upload_type', uploadType);
    if (taskId) {
      formData.append('task_id', taskId);
    }
    if (notes) {
      formData.append('notes', notes);
    }
    if (profileId) {
      formData.append('profile_id', profileId.toString());
    }
    if (alignmentMode && alignmentMode !== 'hybrid') {
      formData.append('alignment_mode', alignmentMode);
    }

    // Track upload progress
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
      if (xhr.status === 202 || xhr.status === 200) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve({ batch_id: result.batch_id });
        } catch (error) {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.message || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Upload cancelled by user'));
      });
    }

    const token = getAuthToken();
    if (!token) {
      reject(new Error('No authentication token found'));
      return;
    }

    xhr.open('POST', getApiUrl('/batches/upload', true));
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

const CONCURRENCY_LIMIT = process.env.NEXT_PUBLIC_CONCURRENCY_LIMIT
  ? parseInt(process.env.NEXT_PUBLIC_CONCURRENCY_LIMIT, 10)
  : 4;

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
  alignmentMode?: 'hybrid' | 'standard' | 'imreg_dft',
  signal?: AbortSignal
): Promise<{ upload_id: string; batch_id?: string }> {
  const isLastChunk = chunkIndex === totalChunks - 1;
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    if (signal?.aborted) throw new Error('Upload cancelled by user');

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
        if (alignmentMode && alignmentMode !== 'hybrid') formData.append('alignment_mode', alignmentMode);
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
        throw new Error(error.message || `Chunk ${chunkIndex + 1} failed`);
      }

      return await response.json();
    } catch (error) {
      retryCount++;
      const isAbort = error instanceof Error && error.name === 'AbortError';
      if (isAbort) throw error; // Don't retry aborts

      console.error(`[Chunk ${chunkIndex + 1}] Attempt ${retryCount} failed:`, error);

      if (retryCount >= MAX_RETRIES) {
        throw new Error(
          `Chunk ${chunkIndex + 1}/${totalChunks} failed after ${MAX_RETRIES} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      // Exponential backoff
      const delayMs = Math.pow(2, retryCount) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Unexpected error in retry loop');
}

/**
 * Upload file in chunks (Parallelized)
 */
async function uploadInChunks(
  file: File,
  uploadType: UploadType,
  taskId: string | null,
  notes: string | null,
  profileId: number | null,
  onProgress: (progress: ChunkUploadProgress) => void,
  alignmentMode?: 'hybrid' | 'standard' | 'imreg_dft',
  signal?: AbortSignal
): Promise<{ batch_id: string }> {
  const chunkSize = getChunkSize(file.size);
  const totalChunks = Math.ceil(file.size / chunkSize);
  let uploadId: string | null = null;

  // Track progress
  let chunksCompleted = 0;

  const updateProgress = () => {
    // Calculate approximate bytes based on completed chunks
    const estimatedBytes = Math.min((chunksCompleted / totalChunks) * file.size, file.size);
    onProgress({
      chunksTotal: totalChunks,
      chunksUploaded: chunksCompleted,
      bytesUploaded: estimatedBytes,
      bytesTotal: file.size,
      percentage: (chunksCompleted / totalChunks) * 100,
      currentChunk: chunksCompleted
    });
  };

  console.log(
    `[Parallel Upload] Starting: ${file.name} (${totalChunks} chunks), Chunk Size: ${(chunkSize / 1024 / 1024).toFixed(2)}MB, Concurrency: ${CONCURRENCY_LIMIT}`
  );

  // --- STEP 1: Upload Chunk 0 Serially ---
  // We MUST do this to get the 'upload_id' from the server to link subsequent chunks
  const chunk0 = file.slice(0, chunkSize);
  const res0 = await uploadSingleChunkWithRetry(
    chunk0,
    0,
    totalChunks,
    file,
    uploadType,
    null,
    taskId,
    notes,
    profileId,
    alignmentMode,
    signal
  );

  uploadId = res0.upload_id;
  chunksCompleted++;
  updateProgress();

  if (totalChunks === 1) {
    // If only one chunk, we are done
    return { batch_id: res0.batch_id! };
  }

  // --- STEP 2: Upload Chunks 1..N in Parallel ---
  // We use a pool to limit concurrency
  const pendingIndices = Array.from({ length: totalChunks - 1 }, (_, i) => i + 1); // [1, 2, 3...]
  let resultBatchId: string | null = null;

  // Helper to process the queue
  const processQueue = async (): Promise<void> => {
    if (pendingIndices.length === 0) return;

    // Grab next index
    const index = pendingIndices.shift()!;
    const start = index * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunkBlob = file.slice(start, end);

    try {
      const res = await uploadSingleChunkWithRetry(
        chunkBlob,
        index,
        totalChunks,
        file,
        uploadType,
        uploadId,
        taskId,
        notes,
        profileId,
        alignmentMode,
        signal
      );

      if (res.batch_id) {
        resultBatchId = res.batch_id;
      }

      chunksCompleted++;
      updateProgress();
    } catch (error) {
      // Stop other workings on fatal error? 
      // For now we just let the error propagate up from Promise.all
      throw error;
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



/**
 * Main upload function with automatic chunking
 *
 * @param file - File to upload
 * @param uploadType - Upload strategy ('zip_qr', 'zip_no_qr', 'images')
 * @param taskId - Task ID (required for zip_no_qr and images)
 * @param notes - Optional notes
 * @param onProgress - Progress callback
 * @returns Promise resolving to batch_id
 */
export async function uploadFile(
  file: File,
  uploadType: UploadType,
  taskId: string | null,
  notes: string | null,
  profileId: number | null,
  onProgress: (progress: ChunkUploadProgress) => void,
  alignmentMode?: 'hybrid' | 'standard' | 'imreg_dft',
  signal?: AbortSignal
): Promise<{ batch_id: string }> {
  // Validate inputs
  if (!file) {
    throw new Error('No file provided');
  }

  if ((uploadType === 'zip_no_qr' || uploadType === 'images') && !taskId) {
    throw new Error('Task ID required for this upload type');
  }

  if (taskId && !/^\d{8}$/.test(taskId)) {
    throw new Error('Task ID must be 8 digits');
  }

  // Check if chunking is needed
  // For zip_with_qr, we ALWAYS use chunking to leverage parallel uploads for speed
  const needsChunking = uploadType === 'zip_with_qr' || file.size > CLOUDFLARE_LIMIT;

  console.log(
    `[Upload] File: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB, Chunking: ${needsChunking}`
  );

  if (needsChunking) {
    return uploadInChunks(file, uploadType, taskId, notes, profileId, onProgress, alignmentMode, signal);
  } else {
    return uploadDirect(file, uploadType, taskId, notes, profileId, onProgress, alignmentMode, signal);
  }
}

/**
 * Upload multiple image files
 *
 * @param files - Array of image files
 * @param taskId - Task ID (required)
 * @param notes - Optional notes
 * @param onProgress - Progress callback
 * @returns Promise resolving to batch_id
 */
export async function uploadImages(
  files: File[],
  taskId: string,
  notes: string | null,
  profileId: number | null,
  onProgress: (progress: ChunkUploadProgress) => void,
  alignmentMode?: 'hybrid' | 'standard' | 'imreg_dft',
  signal?: AbortSignal
): Promise<{ batch_id: string }> {
  if (!files || files.length === 0) {
    throw new Error('No files provided');
  }

  if (!taskId || !/^\d{8}$/.test(taskId)) {
    throw new Error('Valid 8-digit task ID required');
  }

  // For multiple images, we'll upload them as a single request
  // If total size > 100MB, we need to split into batches or use chunking
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  if (totalSize > CLOUDFLARE_LIMIT) {
    // TODO: Implement multi-file chunked upload
    // For now, error out
    throw new Error(
      `Total file size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds 100MB limit. Please upload fewer images at once.`
    );
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    // Add all files
    files.forEach((file) => {
      formData.append('files', file);
    });

    formData.append('upload_type', 'images');
    formData.append('task_id', taskId);
    if (notes) {
      formData.append('notes', notes);
    }
    if (profileId) {
      formData.append('profile_id', profileId.toString());
    }
    if (alignmentMode && alignmentMode !== 'hybrid') {
      formData.append('alignment_mode', alignmentMode);
    }

    // Track upload progress
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
      if (xhr.status === 202 || xhr.status === 200) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve({ batch_id: result.batch_id });
        } catch (error) {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.message || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Upload cancelled by user'));
      });
    }

    const token = getAuthToken();
    if (!token) {
      reject(new Error('No authentication token found'));
      return;
    }

    xhr.open('POST', `${API_BASE_URL}/batches/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

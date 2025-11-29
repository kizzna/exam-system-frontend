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

const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks
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

    xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL}/api/batches/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

/**
 * Upload file in chunks (> 100MB)
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
  let uploadedBytes = 0;

  console.log(
    `[Chunked Upload] File: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB, Chunks: ${totalChunks}`
  );

  // Upload each chunk
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    if (signal?.aborted) {
      throw new Error('Upload cancelled by user');
    }
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    const isLastChunk = chunkIndex === totalChunks - 1;

    console.log(
      `[Chunked Upload] Chunk ${chunkIndex + 1}/${totalChunks}: ${(chunk.size / 1024 / 1024).toFixed(2)}MB`
    );

    // Retry logic for this chunk
    let retryCount = 0;
    let chunkUploaded = false;

    while (retryCount < MAX_RETRIES && !chunkUploaded) {
      try {
        const formData = new FormData();
        formData.append('chunk', chunk, `${file.name}.part${chunkIndex}`);
        formData.append('chunk_index', chunkIndex.toString());
        formData.append('total_chunks', totalChunks.toString());
        formData.append('filename', file.name);
        formData.append('upload_type', uploadType);
        formData.append('is_final_chunk', isLastChunk.toString());

        if (uploadId) {
          formData.append('upload_id', uploadId);
        }
        if (taskId) {
          formData.append('task_id', taskId);
        }
        if (notes && isLastChunk) {
          // Only send notes with final chunk
          formData.append('notes', notes);
        }
        if (profileId && isLastChunk) {
          formData.append('profile_id', profileId.toString());
        }

        const token = getAuthToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/batches/upload-chunk`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Upload failed' }));
          throw new Error(error.message || `Chunk ${chunkIndex + 1} upload failed`);
        }

        const result = await response.json();

        // Save upload_id from first chunk
        if (chunkIndex === 0) {
          uploadId = result.upload_id;
          console.log(`[Chunked Upload] Upload ID: ${uploadId}`);
        }

        // Update progress
        uploadedBytes = end;
        onProgress({
          chunksTotal: totalChunks,
          chunksUploaded: chunkIndex + 1,
          bytesUploaded: uploadedBytes,
          bytesTotal: file.size,
          percentage: (uploadedBytes / file.size) * 100,
          currentChunk: chunkIndex + 1,
        });

        chunkUploaded = true;

        // If last chunk, return batch info
        if (isLastChunk) {
          console.log(`[Chunked Upload] Complete! Batch ID: ${result.batch_id}`);
          return { batch_id: result.batch_id };
        }
      } catch (error) {
        retryCount++;
        console.error(
          `[Chunked Upload] Chunk ${chunkIndex + 1} attempt ${retryCount} failed:`,
          error
        );

        if (retryCount >= MAX_RETRIES) {
          throw new Error(
            `Chunk ${chunkIndex + 1}/${totalChunks} failed after ${MAX_RETRIES} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }

        // Exponential backoff before retry
        const delayMs = Math.pow(2, retryCount) * 1000;
        console.log(`[Chunked Upload] Retrying chunk ${chunkIndex + 1} in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error('Upload failed: Unknown error');
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
  const needsChunking = file.size > CLOUDFLARE_LIMIT;

  console.log(
    `[Upload] File: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB, Chunking: ${needsChunking}`
  );

  if (needsChunking) {
    return uploadInChunks(file, uploadType, taskId, notes, profileId, onProgress, signal);
  } else {
    return uploadDirect(file, uploadType, taskId, notes, profileId, onProgress, signal);
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

    xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL}/api/batches/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

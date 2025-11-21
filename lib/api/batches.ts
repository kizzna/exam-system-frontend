/**
 * Batch API Service
 * Phase 2: Backend-compatible batch operations
 */

import type {
  Batch,
  BatchProgress,
  BatchStatusResponse,
  ListBatchesParams,
  ListBatchesResponse,
} from '../types/batches';
import { useAuthStore } from '../stores/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://gt-omr-api-1:8000';

/**
 * Get auth token from Zustand store
 */
function getAuthHeader(): HeadersInit {
  const token = useAuthStore.getState().accessToken;

  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Handle API response errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const error = await response.json();
      errorMessage = error.message || error.detail || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Get batch progress (lightweight polling endpoint)
 */
export async function getBatchProgress(batchId: string): Promise<BatchProgress> {
  const response = await fetch(`${API_URL}/api/batches/${batchId}/progress`, {
    headers: getAuthHeader(),
  });

  return handleResponse<BatchProgress>(response);
}

/**
 * Get detailed batch status
 */
export async function getBatchStatus(
  batchId: string,
  includeSheets: boolean = false,
  limit: number = 100
): Promise<BatchStatusResponse> {
  const params = new URLSearchParams({
    include_sheets: includeSheets.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(`${API_URL}/api/batches/${batchId}/status?${params}`, {
    headers: getAuthHeader(),
  });

  const data = await handleResponse<BatchStatusResponse>(response);
  console.log('[Batches API] getBatchStatus response:', data);
  return data;
}

/**
 * List batches with pagination and filtering
 */
export async function listBatches(params: ListBatchesParams = {}): Promise<ListBatchesResponse> {
  const { status, page = 1, page_size = 50, offset = (page - 1) * page_size } = params;

  const queryParams = new URLSearchParams({
    page_size: page_size.toString(),
    offset: offset.toString(),
  });

  if (status) {
    queryParams.append('status', status);
  }

  const response = await fetch(`${API_URL}/api/batches/?${queryParams}`, {
    headers: getAuthHeader(),
  });

  const data = await handleResponse<ListBatchesResponse>(response);

  // Debug logging
  if (data.batches && data.batches.length > 0) {
    console.log('[Batches API] Sample batch data:', data.batches[0]);
  }

  return data;
}

/**
 * Delete batch (admin only)
 */
export async function deleteBatch(batchId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/batches/${batchId}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });

  return handleResponse<void>(response);
}

/**
 * Batch API client
 */
export const batchesAPI = {
  getProgress: getBatchProgress,
  getStatus: getBatchStatus,
  list: listBatches,
  delete: deleteBatch,
};

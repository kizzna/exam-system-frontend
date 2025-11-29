/**
 * Batch API Service
 * Phase 2: Backend-compatible batch operations
 */

import apiClient from './client';
import type {
  Batch,
  BatchProgress,
  BatchStatusResponse,
  ListBatchesParams,
  ListBatchesResponse,
  BatchStats,
} from '../types/batches';

/**
 * Get batch statistics
 */
export async function getBatchStats(batchId: string): Promise<BatchStats> {
  const response = await apiClient.get<BatchStats>(`/api/batches/${batchId}/stats`);
  return response.data;
}

/**
 * Get batch progress (lightweight polling endpoint)
 */
export async function getBatchProgress(batchId: string): Promise<BatchProgress> {
  const response = await apiClient.get<BatchProgress>(`/api/batches/${batchId}/progress`);
  return response.data;
}

/**
 * Get detailed batch status
 */
export async function getBatchStatus(
  batchId: string,
  includeSheets: boolean = false,
  limit: number = 100
): Promise<BatchStatusResponse> {
  const response = await apiClient.get<BatchStatusResponse>(`/api/batches/${batchId}/status`, {
    params: {
      include_sheets: includeSheets,
      limit: limit,
    },
  });

  console.log('[Batches API] getBatchStatus response:', response.data);
  return response.data;
}

/**
 * List batches with pagination and filtering
 */
export async function listBatches(params: ListBatchesParams = {}): Promise<ListBatchesResponse> {
  const { status, page = 1, page_size = 50, offset = (page - 1) * page_size } = params;

  const response = await apiClient.get<ListBatchesResponse>('/api/batches/', {
    params: {
      page_size,
      offset,
      ...(status && { status }),
    },
  });

  // Debug logging
  if (response.data.batches && response.data.batches.length > 0) {
    console.log('[Batches API] Sample batch data:', response.data.batches[0]);
  }

  return response.data;
}

/**
 * Delete batch (admin only)
 */
export async function deleteBatch(batchId: string): Promise<void> {
  await apiClient.delete(`/api/batches/${batchId}`);
}

/**
 * Recovery response interface
 */
export interface RecoverBatchResponse {
  success: boolean;
  message: string;
  sheets_recovered: number;
  answers_recovered: number;
}

/**
 * Recover batch from Redis buffer (for failed/timeout batches)
 */
export async function recoverBatch(batchId: string): Promise<RecoverBatchResponse> {
  const response = await apiClient.post<RecoverBatchResponse>(`/api/batches/${batchId}/recover`);
  return response.data;
}

/**
 * Batch API client
 */
export const batchesAPI = {
  getProgress: getBatchProgress,
  getStatus: getBatchStatus,
  list: listBatches,
  delete: deleteBatch,
  recover: recoverBatch,
  checkRecoverable,
  cancel: cancelBatch,
};

/**
 * Check if batch data is recoverable
 */
export async function checkRecoverable(batchId: string): Promise<{
  batch_uuid: string;
  has_progress_data: boolean;
  recoverable_sheets_count: number;
  total_sheets_count: number;
  is_recoverable: boolean;
}> {
  const response = await apiClient.get(`/api/batches/${batchId}/recoverable`);
  return response.data;
}

/**
 * Cancel batch processing
 */
export async function cancelBatch(batchId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await apiClient.post(`/api/batches/${batchId}/cancel`);
  return response.data;
}

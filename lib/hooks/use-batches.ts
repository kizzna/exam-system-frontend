/**
 * React Query Hooks for Batch Operations
 * Phase 2: Batch Upload & Management
 */

'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { uploadFile, uploadImages } from '../chunked-upload';
import { batchesAPI } from '../api/batches';
import type {
  Batch,
  BatchProgress,
  BatchStatusResponse,
  ListBatchesParams,
  ListBatchesResponse,
  UploadType,
  ChunkUploadProgress,
} from '../types/batches';

/**
 * Query keys for batch operations
 */
export const batchQueryKeys = {
  all: ['batches'] as const,
  lists: () => [...batchQueryKeys.all, 'list'] as const,
  list: (params: ListBatchesParams) => [...batchQueryKeys.lists(), params] as const,
  details: () => [...batchQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...batchQueryKeys.details(), id] as const,
  progress: (id: string) => [...batchQueryKeys.all, 'progress', id] as const,
  status: (id: string) => [...batchQueryKeys.all, 'status', id] as const,
};

/**
 * Hook: List batches with pagination and filtering
 */
export function useBatches(params: ListBatchesParams = {}) {
  return useQuery({
    queryKey: batchQueryKeys.list(params),
    queryFn: () => batchesAPI.list(params),
    staleTime: 5000, // Cache for 5 seconds
  });
}

/**
 * Hook: Get batch progress (for real-time polling)
 */
export function useBatchProgress(batchId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: batchQueryKeys.progress(batchId || ''),
    queryFn: () => batchesAPI.getProgress(batchId!),
    enabled: enabled && !!batchId,
    refetchInterval: (query) => {
      // Stop polling when completed or failed
      const data = query.state.data;
      if (!data) return 2000;
      return ['completed', 'failed'].includes(data.status) ? false : 2000;
    },
    staleTime: 0, // Always refetch for real-time updates
  });
}

/**
 * Hook: Get detailed batch status
 */
export function useBatchStatus(
  batchId: string | null,
  includeSheets: boolean = false,
  limit: number = 100
) {
  return useQuery({
    queryKey: batchQueryKeys.status(batchId || ''),
    queryFn: () => batchesAPI.getStatus(batchId!, includeSheets, limit),
    enabled: !!batchId,
    staleTime: 10000, // Cache for 10 seconds
  });
}

/**
 * Hook: Check if batch is recoverable
 */
export function useRecoverable(batchId: string | null, enabled: boolean = false) {
  return useQuery({
    queryKey: [...batchQueryKeys.details(), batchId, 'recoverable'],
    queryFn: () => batchesAPI.checkRecoverable(batchId!),
    enabled: enabled && !!batchId,
    staleTime: 0, // Always check fresh
  });
}

/**
 * Hook: Cancel batch processing
 */
export function useCancelBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (batchId: string) => batchesAPI.cancel(batchId),
    onSuccess: (data, batchId) => {
      // Invalidate batch details and list
      queryClient.invalidateQueries({ queryKey: batchQueryKeys.detail(batchId) });
      queryClient.invalidateQueries({ queryKey: batchQueryKeys.lists() });
    },
  });
}

/**
 * Hook: Upload batch with chunking support
 */
export function useBatchUpload() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      file,
      uploadType,
      taskId,
      notes,
      onProgress,
      signal,
    }: {
      file: File;
      uploadType: UploadType;
      taskId: string | null;
      notes: string | null;
      onProgress: (progress: ChunkUploadProgress) => void;
      signal?: AbortSignal;
    }) => {
      return uploadFile(file, uploadType, taskId, notes, onProgress, signal);
    },
    onSuccess: (data) => {
      // Invalidate batch lists to show new batch
      queryClient.invalidateQueries({ queryKey: batchQueryKeys.lists() });

      // Prefetch the new batch's progress
      queryClient.prefetchQuery({
        queryKey: batchQueryKeys.progress(data.batch_id),
        queryFn: () => batchesAPI.getProgress(data.batch_id),
      });
    },
  });
}

/**
 * Hook: Upload multiple images
 */
export function useImagesUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      files,
      taskId,
      notes,
      onProgress,
      signal,
    }: {
      files: File[];
      taskId: string;
      notes: string | null;
      onProgress: (progress: ChunkUploadProgress) => void;
      signal?: AbortSignal;
    }) => {
      return uploadImages(files, taskId, notes, onProgress, signal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: batchQueryKeys.lists() });
    },
  });
}

/**
 * Hook: Delete batch (admin only)
 */
export function useDeleteBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (batchId: string) => batchesAPI.delete(batchId),
    onSuccess: () => {
      // Invalidate all batch lists
      queryClient.invalidateQueries({ queryKey: batchQueryKeys.lists() });
    },
  });
}

/**
 * Hook: Auto-polling progress for active batches
 * Polls every 2 seconds until batch is completed or failed
 */
export function useProgressPolling(
  batchId: string | null,
  options: {
    enabled?: boolean;
    onComplete?: (batch: BatchProgress) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const { enabled = true, onComplete, onError } = options;

  const query = useQuery({
    queryKey: batchQueryKeys.progress(batchId || ''),
    queryFn: async () => {
      const progress = await batchesAPI.getProgress(batchId!);

      // Call onComplete when batch finishes
      if (['completed', 'failed'].includes(progress.status) && onComplete) {
        onComplete(progress);
      }

      return progress;
    },
    enabled: enabled && !!batchId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      return ['completed', 'failed'].includes(data.status) ? false : 2000;
    },
    staleTime: 0,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handle errors
  if (query.error && onError) {
    onError(query.error as Error);
  }

  return query;
}

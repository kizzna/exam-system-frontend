import apiClient from './client';
import { Batch, CreateBatchRequest, BatchUploadProgress } from '../types/batches';
import { PaginatedResponse } from '../types/api';

export const batchesApi = {
  getBatches: async (params?: { page?: number; size?: number }): Promise<PaginatedResponse<Batch>> => {
    const response = await apiClient.get<PaginatedResponse<Batch>>('/batches', { params });
    return response.data;
  },

  getBatch: async (id: string): Promise<Batch> => {
    const response = await apiClient.get<Batch>(`/batches/${id}`);
    return response.data;
  },

  createBatch: async (data: CreateBatchRequest): Promise<Batch> => {
    const response = await apiClient.post<Batch>('/batches', data);
    return response.data;
  },

  uploadChunk: async (
    batchId: string,
    chunk: Blob,
    chunkIndex: number,
    totalChunks: number,
    fileName: string
  ): Promise<BatchUploadProgress> => {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunk_index', chunkIndex.toString());
    formData.append('total_chunks', totalChunks.toString());
    formData.append('file_name', fileName);

    const response = await apiClient.post<BatchUploadProgress>(
      `/batches/${batchId}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  deleteBatch: async (id: string): Promise<void> => {
    await apiClient.delete(`/batches/${id}`);
  },
};

import apiClient from './client';
import { Export, CreateExportRequest } from '../types/exports';
import { PaginatedResponse } from '../types/api';

export const exportsApi = {
  getExports: async (): Promise<PaginatedResponse<Export>> => {
    const response = await apiClient.get<PaginatedResponse<Export>>('/exports');
    return response.data;
  },

  getExport: async (id: string): Promise<Export> => {
    const response = await apiClient.get<Export>(`/exports/${id}`);
    return response.data;
  },

  createExport: async (data: CreateExportRequest): Promise<Export> => {
    const response = await apiClient.post<Export>('/exports', data);
    return response.data;
  },

  downloadExport: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/exports/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  deleteExport: async (id: string): Promise<void> => {
    await apiClient.delete(`/exports/${id}`);
  },
};

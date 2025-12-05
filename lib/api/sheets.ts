import apiClient from './client';
import { Sheet, SheetCorrectionRequest, BulkSheetUpdateRequest, OverlayResponse, OMRLayout, AnswerKey } from '../types/sheets';
import { PaginatedResponse } from '../types/api';

export const sheetsApi = {
  getSheets: async (params?: { page?: number; size?: number; status?: string; batch_id?: string }): Promise<PaginatedResponse<Sheet>> => {
    const response = await apiClient.get<PaginatedResponse<Sheet>>('/sheets', { params });
    return response.data;
  },

  getSheet: async (id: string): Promise<Sheet> => {
    const response = await apiClient.get<Sheet>(`/sheets/${id}`);
    return response.data;
  },

  correctSheet: async (id: string, data: SheetCorrectionRequest): Promise<Sheet> => {
    const response = await apiClient.post<Sheet>(`/sheets/${id}/correct`, data);
    return response.data;
  },

  bulkUpdate: async (data: BulkSheetUpdateRequest): Promise<void> => {
    await apiClient.post('/sheets/bulk-update', data);
  },

  rereadSheet: async (id: string): Promise<Sheet> => {
    const response = await apiClient.post<Sheet>(`/sheets/${id}/reread`);
    return response.data;
  },

  getOverlay: async (id: string): Promise<OverlayResponse> => {
    const response = await apiClient.get<OverlayResponse>(`/sheets/${id}/overlay`);
    return response.data;
  },

  getSheetImageUrl: (id: string, part: 'top' | 'bottom', width?: number): string => {
    const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/sheets/${id}/image?part=${part}`;
    return width ? `${baseUrl}&width=${width}` : baseUrl;
  },

  getLayout: async (): Promise<OMRLayout> => {
    const response = await apiClient.get<OMRLayout>('/sheets/layout');
    return response.data;
  },

  getAnswerKey: async (taskId: string): Promise<AnswerKey> => {
    const response = await apiClient.get<AnswerKey>(`/sheets/answer-key/${taskId}`);
    return response.data;
  },
};

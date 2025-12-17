import apiClient from './client';
import { Sheet, SheetCorrectionRequest, BulkSheetUpdateRequest, OverlayResponse, OMRLayout, AnswerKey, SheetInfoUpdateRequest, SheetVerificationRequest, AnswerEditPayload } from '../types/sheets';
import { API_BASE_URL } from '../utils/constants';
import { PaginatedResponse } from '../types/api';
import { RosterEntry } from '../types/tasks';

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
    // API_BASE_URL now handles client/server context (client='/api', server='http://...')
    // Next.js rewrites /api/sheets -> internal/sheets
    const baseUrl = `${API_BASE_URL}/sheets/${id}/image?part=${part}`;
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



  updateSheetInfo: async (data: SheetInfoUpdateRequest): Promise<RosterEntry[]> => {
    const response = await apiClient.patch<RosterEntry[]>('/sheets/info', data);
    return response.data;
  },

  verifySheet: async (id: string, data: SheetVerificationRequest): Promise<void> => {
    await apiClient.patch(`/sheets/${id}/verify`, data);
  },

  updateSheetAnswers: async (id: string, data: AnswerEditPayload): Promise<void> => {
    await apiClient.patch(`/sheets/${id}/answers`, data);
  },

  batchDelete: async (sheet_ids: number[]): Promise<void> => {
    await apiClient.post('/sheets/batch-delete', { sheet_ids });
  },

  batchRestore: async (sheet_ids: number[]): Promise<void> => {
    await apiClient.post('/sheets/batch-restore', { sheet_ids });
  },

  relocate: async (data: { sheet_ids: number[]; source_task_id: number; target_task_id: number; target_class_level?: number; target_class_group?: number }): Promise<void> => {
    await apiClient.post('/sheets/relocate', data);
  },

  swap: async (data: { task_id_a: number; task_id_b: number }): Promise<void> => {
    await apiClient.post('/sheets/swap', data);
  },

  reprocessSheet: async (data: { sheet_ids: number[]; profile_id: number }): Promise<{ status: string; message: string; task_id: string }> => {
    const response = await apiClient.post<{ status: string; message: string; task_id: string }>('/sheets/reprocess', data);
    return response.data;
  },
};

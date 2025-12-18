import apiClient from './client';
import { AuditLog, AuditLogParams } from '../types/audit';
import { PaginatedResponse } from '../types/api';

export const auditApi = {
  getAuditLogs: async (params?: AuditLogParams): Promise<PaginatedResponse<AuditLog>> => {
    const response = await apiClient.get<PaginatedResponse<AuditLog>>('/audit-logs', { params });
    return response.data;
  },

  getAuditLog: async (id: string): Promise<AuditLog> => {
    const response = await apiClient.get<AuditLog>(`/audit/${id}`);
    return response.data;
  },
};

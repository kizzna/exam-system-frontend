import apiClient from './client';
import { AnswerKey, CreateAnswerKeyRequest, GradingRequest, GradingResult } from '../types/grading';
import { PaginatedResponse } from '../types/api';

export const gradingApi = {
  getAnswerKeys: async (): Promise<PaginatedResponse<AnswerKey>> => {
    const response = await apiClient.get<PaginatedResponse<AnswerKey>>('/grading/answer-keys');
    return response.data;
  },

  getAnswerKey: async (id: string): Promise<AnswerKey> => {
    const response = await apiClient.get<AnswerKey>(`/grading/answer-keys/${id}`);
    return response.data;
  },

  createAnswerKey: async (data: CreateAnswerKeyRequest): Promise<AnswerKey> => {
    const response = await apiClient.post<AnswerKey>('/grading/answer-keys', data);
    return response.data;
  },

  updateAnswerKey: async (id: string, data: Partial<CreateAnswerKeyRequest>): Promise<AnswerKey> => {
    const response = await apiClient.patch<AnswerKey>(`/grading/answer-keys/${id}`, data);
    return response.data;
  },

  deleteAnswerKey: async (id: string): Promise<void> => {
    await apiClient.delete(`/grading/answer-keys/${id}`);
  },

  gradeExam: async (data: GradingRequest): Promise<GradingResult[]> => {
    const response = await apiClient.post<GradingResult[]>('/grading/grade', data);
    return response.data;
  },
};

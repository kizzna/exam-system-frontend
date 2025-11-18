import apiClient from './client';
import { Task, CreateTaskRequest, TaskAssignmentRequest, TaskDistributionRequest } from '../types/tasks';
import { PaginatedResponse } from '../types/api';

export const tasksApi = {
  getTasks: async (params?: { page?: number; size?: number; status?: string }): Promise<PaginatedResponse<Task>> => {
    const response = await apiClient.get<PaginatedResponse<Task>>('/tasks', { params });
    return response.data;
  },

  getTask: async (id: string): Promise<Task> => {
    const response = await apiClient.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (data: CreateTaskRequest): Promise<Task> => {
    const response = await apiClient.post<Task>('/tasks', data);
    return response.data;
  },

  assignTasks: async (data: TaskAssignmentRequest): Promise<void> => {
    await apiClient.post('/tasks/assign', data);
  },

  distributeTasks: async (data: TaskDistributionRequest): Promise<void> => {
    await apiClient.post('/tasks/distribute', data);
  },

  updateTask: async (id: string, data: Partial<Task>): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },
};

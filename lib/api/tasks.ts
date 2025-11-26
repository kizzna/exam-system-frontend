import apiClient from './client';
import { Task, CreateTaskRequest, TaskAssignmentRequest, TaskDistributionRequest } from '../types/tasks';
import { PaginatedResponse } from '../types/api';

export const tasksApi = {
  getTasks: async (params?: {
    eval_center_id?: number;
    processing_status?: string;
    class_level?: number;
    exam_center_code?: number;
    hon_id?: number;
    parent_part_id?: number;
    ss_snr_id?: number;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<Task>> => {
    const response = await apiClient.get<PaginatedResponse<Task>>('/tasks/', { params });
    return response.data;
  },

  getTask: async (id: number): Promise<Task> => {
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

  unassignTasks: async (taskIds: number[]): Promise<void> => {
    await apiClient.post('/tasks/unassign', { task_ids: taskIds });
  },

  distributeTasks: async (data: TaskDistributionRequest): Promise<void> => {
    await apiClient.post('/tasks/distribute', data);
  },

  updateTask: async (id: number, data: Partial<Task>): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  deleteTask: async (id: number): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },
};

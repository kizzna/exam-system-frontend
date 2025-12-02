import apiClient from './client';
import { Task, CreateTaskRequest, TaskAssignmentRequest, TaskDistributionRequest, TaskStats, RosterEntry } from '../types/tasks';
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

    latest_batch_id?: number;
    task_id?: string;
    class_group?: number;
    error_count?: number;
    err_duplicate_sheets_count?: number;
    err_low_answer_count?: number;
    err_student_id_count?: number;
    err_exam_center_id_count?: number;
    err_class_group_count?: number;
    err_class_level_count?: number;
    page?: number;
    size?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Task>> => {
    const response = await apiClient.get<PaginatedResponse<Task>>('/tasks/', { params });
    return response.data;
  },

  getTaskStats: async (params?: {
    eval_center_id?: number;
    processing_status?: string;
    class_level?: number;
    exam_center_code?: number;
    latest_batch_id?: number;
    task_id?: string;
    class_group?: number;
    error_count?: number;
    err_duplicate_sheets_count?: number;
    err_low_answer_count?: number;
    err_student_id_count?: number;
    err_exam_center_id_count?: number;
    err_class_group_count?: number;
    err_class_level_count?: number;
  }): Promise<TaskStats> => {
    const response = await apiClient.get<TaskStats>('/tasks/stats', { params });
    return response.data;
  },

  getTask: async (task_id: number): Promise<Task> => {
    const response = await apiClient.get<Task>(`/tasks/${task_id}`);
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

  updateTask: async (task_id: number, data: Partial<Task>): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/tasks/${task_id}`, data);
    return response.data;
  },

  deleteTask: async (task_id: number): Promise<void> => {
    await apiClient.delete(`/tasks/${task_id}`);
  },

  getRoster: async (task_id: number): Promise<RosterEntry[]> => {
    const response = await apiClient.get<RosterEntry[]>(`/tasks/${task_id}/roster`);
    return response.data;
  },

  getExamCenterInfo: async (task_id: string | number): Promise<import('../types/tasks').ExamCenterInfo> => {
    const response = await apiClient.get<import('../types/tasks').ExamCenterInfo>(`/tasks/${task_id}/exam-center-info`);
    return response.data;
  },

};

import apiClient from './client';
import { User, CreateUserRequest, UpdateUserRequest, UserListParams } from '../types/users';
import { PaginatedResponse } from '../types/api';

export const usersApi = {
  getUsers: async (params?: UserListParams): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get<PaginatedResponse<User>>('/users', { params });
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  createUser: async (data: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post<User>('/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  assignRoles: async (id: string, roles: string[]): Promise<User> => {
    const response = await apiClient.post<User>(`/users/${id}/roles`, { roles });
    return response.data;
  },
};

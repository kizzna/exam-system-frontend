import apiClient from './client';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserListParams,
  UserListResponse,
} from '../types/users';

export const usersApi = {
  getUsers: async (params?: UserListParams): Promise<UserListResponse> => {
    const response = await apiClient.get<UserListResponse>('/users', { params });
    return response.data;
  },

  getUser: async (userId: number): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${userId}`);
    return response.data;
  },

  createUser: async (data: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post<User>('/users', data);
    return response.data;
  },

  updateUser: async (userId: number, data: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.patch<User>(`/users/${userId}`, data);
    return response.data;
  },

  deleteUser: async (userId: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/users/${userId}`
    );
    return response.data;
  },

  changePassword: async (userId: number, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`/users/${userId}/password`, {
      new_password: newPassword,
    });
    return response.data;
  },
};

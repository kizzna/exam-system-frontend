import apiClient from './client';
import {
  LoginRequest,
  LoginResponse,
  TokenResponse,
  RefreshTokenRequest,
  UserInfo,
} from '../types/auth';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/api/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  logout: async (): Promise<void> => {
    // Note: API doesn't have logout endpoint, just clear local state
    // await apiClient.post('/api/auth/logout');
  },

  verifyToken: async (): Promise<boolean> => {
    try {
      await apiClient.get('/api/auth/verify');
      return true;
    } catch {
      return false;
    }
  },

  getCurrentUser: async (): Promise<UserInfo> => {
    const response = await apiClient.get<UserInfo>('/api/auth/me');
    return response.data;
  },
};

import apiClient from './client';
import { Student, StudentSearchParams } from '../types/students';
import { PaginatedResponse } from '../types/api';

export const studentsApi = {
  searchStudents: async (params: StudentSearchParams): Promise<PaginatedResponse<Student>> => {
    const response = await apiClient.get<PaginatedResponse<Student>>('/students/search', { params });
    return response.data;
  },

  getStudent: async (id: string): Promise<Student> => {
    const response = await apiClient.get<Student>(`/students/${id}`);
    return response.data;
  },
};

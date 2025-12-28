import apiClient from './client';
import { Student, StudentSearchParams, StudentSearchResponse } from '../types/students';
import { PaginatedResponse } from '../types/api';

export const studentsApi = {
  searchStudents: async (params: StudentSearchParams): Promise<StudentSearchResponse> => {
    const response = await apiClient.get<StudentSearchResponse>('/students/search', { params });
    return response.data;
  },

  getStudent: async (id: string): Promise<Student> => {
    const response = await apiClient.get<Student>(`/students/${id}`);
    return response.data;
  },
};

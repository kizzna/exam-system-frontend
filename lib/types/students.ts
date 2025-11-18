// Student types
export interface Student {
  id: string;
  student_id: string;
  name: string;
  email?: string;
  grade?: string;
  section?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentSearchParams {
  query?: string;
  grade?: string;
  section?: string;
  page?: number;
  size?: number;
}

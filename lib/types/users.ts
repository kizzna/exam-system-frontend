import { UserScope } from './auth';

// User types
export interface User {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  scopes: UserScope[];
  last_login_at: string | null;
  login_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  username: string; // 3-50 chars, unique
  email: string; // Valid email, unique
  password: string; // Min 8 chars
  full_name: string; // 1-100 chars
  is_admin: boolean;
  scopes: UserScope[];
}

export interface UpdateUserRequest {
  email?: string;
  full_name?: string;
  is_active?: boolean;
  is_admin?: boolean;
  scopes?: UserScope[];
}

export interface UserListParams {
  page?: number;
  page_size?: number;
  is_active?: boolean;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

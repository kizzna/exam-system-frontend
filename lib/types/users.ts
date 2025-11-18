// User types
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  roles: string[];
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  roles?: string[];
}

export interface UpdateUserRequest {
  email?: string;
  full_name?: string;
  is_active?: boolean;
  roles?: string[];
}

export interface UserListParams {
  page?: number;
  size?: number;
  search?: string;
  role?: string;
  is_active?: boolean;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface ScopeFilter {
  class_levels?: number[];
  exam_centers_include?: number[];
  exam_centers_ranges?: { start: number; end: number }[];
  snr_id_list?: number[];
  task_id_list?: number[];
}

export interface UserScope {
  scope_type: 'global' | 'eval_center' | 'snr_authority';
  scope_id: number;
  filters: ScopeFilter;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserInfo;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface UserInfo {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  role_hierarchy: number; // 0=global admin, 1=order, 2=region, 3=org
  school_id: number | null;
  class_id: number | null;
  scopes: UserScope[];
}

export interface User extends UserInfo {
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

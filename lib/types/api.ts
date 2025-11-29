// Common API types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
  stats?: any; // Using any for now to avoid circular deps or complex generics, or define specific stats type
}

export interface ApiError {
  detail: string;
  status_code: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  message?: string;
}

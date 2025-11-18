// Audit types
export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
}

export interface AuditLog {
  id: string;
  user_id: string;
  username: string;
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditLogParams {
  user_id?: string;
  action?: AuditAction;
  resource_type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  size?: number;
}

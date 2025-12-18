// Audit types
export enum AuditAction {
  LOGIN = 'LOGIN',
  BATCH_IMPORT = 'BATCH_IMPORT',
  SHEET_UPDATE = 'SHEET_UPDATE',
  TASK_UPDATE = 'TASK_UPDATE',
  TASK_SWAP = 'TASK_SWAP',
  SHEET_RELOCATE = 'SHEET_RELOCATE',
  SHEET_RESTORE = 'SHEET_RESTORE',
  SHEET_DELETE = 'SHEET_DELETE',
}

export interface AuditUser {
  id: number;
  username: string;
  email: string;
}

export interface AuditLog {
  id: number;
  action: string; // can be AuditAction or string
  resource_type: string;
  resource_id: string;
  user: AuditUser;
  details: Record<string, any>;
  ip_address: string;
  created_at: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
}

export interface AuditLogParams {
  page?: number;
  size?: number;
  action?: string;
  resource_type?: string;
  resource_id?: string;
  username?: string;
  start_date?: string;
  end_date?: string;
}

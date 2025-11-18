// Export types
export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json',
}

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface Export {
  id: string;
  name: string;
  format: ExportFormat;
  status: ExportStatus;
  batch_id?: string;
  file_url?: string;
  file_size?: number;
  created_by: string;
  created_at: string;
  completed_at?: string;
}

export interface CreateExportRequest {
  name: string;
  format: ExportFormat;
  batch_id?: string;
  filters?: Record<string, any>;
}

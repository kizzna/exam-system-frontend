// Batch types
export enum BatchStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum UploadStrategy {
  REPLACE = 'replace',
  MERGE = 'merge',
  APPEND = 'append',
}

export interface Batch {
  id: string;
  name: string;
  description?: string;
  status: BatchStatus;
  upload_strategy: UploadStrategy;
  total_files: number;
  processed_files: number;
  failed_files: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CreateBatchRequest {
  name: string;
  description?: string;
  upload_strategy: UploadStrategy;
}

export interface BatchUploadProgress {
  batch_id: string;
  total_chunks: number;
  uploaded_chunks: number;
  percentage: number;
  status: string;
}

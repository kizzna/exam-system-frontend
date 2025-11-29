/**
 * Phase 2: Batch Upload & Management Type Definitions
 * Backend API Compatible Types
 * Generated: November 20, 2025
 */

/**
 * Batch processing status enum
 */
export type BatchStatus =
  | 'uploaded' // Initial state after upload
  | 'validating' // Validating QR codes and file structure
  | 'processing' // Processing sheets
  | 'completed' // All sheets processed successfully
  | 'failed' // Processing failed
  | 'reprocessing'; // Re-running failed sheets

/**
 * Upload strategy types
 * Note: Backend accepts 'zip_with_qr' for uploads but may return 'zip_qr' in responses
 */
export type UploadType =
  | 'zip_with_qr' // ZIP file with QR codes on sheets
  | 'zip_no_qr' // ZIP file without QR codes (requires task_id)
  | 'images'; // Direct image files upload

/**
 * Backend response may use different naming
 */
export type BackendUploadType = UploadType | 'zip_qr';

/**
 * Batch entity (from database)
 */
export interface Batch {
  batch_id: number; // Integer ID (internal)
  batch_uuid: string; // UUID for API operations
  batch_name: string; // Original filename
  upload_type: BackendUploadType; // Upload strategy (may use backend naming)
  task_id: string | null; // 8-digit task ID
  status: BatchStatus; // Current processing status
  sheet_count: number; // Total sheets in batch
  processed_count: number; // Successfully processed sheets
  failed_count: number; // Failed sheets
  created_at: string; // ISO 8601 timestamp
  completed_at: string | null; // ISO 8601 or null
  uploaded_by: number; // User ID who uploaded
  uploaded_by_username?: string; // Username (populated in some queries)
  notes: string | null; // User-provided notes
}

/**
 * Progress tracking data (lightweight polling endpoint)
 */
export interface BatchProgress {
  batch_uuid: string;
  status: BatchStatus;
  sheet_count: number;
  processed_count: number;
  failed_count: number;
  progress_percentage: number; // 0-100
  created_at: string; // ISO 8601
  completed_at: string | null; // ISO 8601 or null
}

/**
 * Sheet-level status (optional detail)
 */
export interface SheetStatus {
  sheet_uuid: string;
  batch_uuid: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sequence_number: number;
  error_message: string | null;
  image_path: string;
}

/**
 * Detailed batch status response
 * Maps to backend JobStatusResponse from jobs.py
 */
export interface BatchStatusResponse {
  batch_id: string; // Backend uses batch_id (not batch_uuid)
  status: BatchStatus;
  total_sheets: number; // Backend uses total_sheets (not sheet_count)
  processed_sheets: number; // Backend uses processed_sheets (not processed_count)
  failed_sheets: number; // Backend uses failed_sheets (not failed_count)
  pending_sheets: number;
  created_at: string;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  error_message: string | null;
  sheets: SheetStatus[] | null; // Optional, when include_sheets=true
}

/**
 * Upload batch request parameters
 */
export interface UploadBatchRequest {
  // For ZIP uploads (Strategy 1 & 2)
  file?: File; // Single ZIP file

  // For direct image uploads (Strategy 3)
  files?: File[]; // Multiple image files

  // Upload configuration
  upload_type: UploadType; // Strategy selection
  task_id?: string; // Required for zip_no_qr and images
  notes?: string; // Optional notes
  user_id?: string; // Override user (admin only)
}

/**
 * Upload batch response
 */
export interface UploadBatchResponse {
  batch_id: string; // UUID for tracking
  status: string; // Initial status
  message: string; // Success message
  total_size: number; // Bytes uploaded
}

/**
 * List batches query parameters
 */
export interface ListBatchesParams {
  status?: BatchStatus; // Filter by status
  page?: number; // Page number (1-based)
  page_size?: number; // Results per page (default: 50)
  offset?: number; // Pagination offset (default: 0)
}

/**
 * List batches response
 */
export interface ListBatchesResponse {
  total: number; // Total batches matching filters
  limit: number; // Page size
  offset: number; // Current offset
  batches: Batch[];
}

/**
 * API error response
 */
export interface APIError {
  error: string; // Error type
  message: string; // Human-readable message
  status_code: number; // HTTP status code
  path?: string; // Request path
}

/**
 * Chunked upload progress
 */
export interface ChunkUploadProgress {
  chunksTotal: number; // Total chunks
  chunksUploaded: number; // Chunks completed
  bytesUploaded: number; // Bytes uploaded
  bytesTotal: number; // Total file size
  percentage: number; // Progress percentage (0-100)
  currentChunk: number; // Current chunk being uploaded
}

/**
 * Chunk upload metadata
 */
export interface ChunkMetadata {
  chunk_index: number; // 0-based chunk index
  total_chunks: number; // Total chunks in upload
  upload_id?: string; // Unique upload ID (from first chunk)
  filename: string; // Original filename
  is_final_chunk: boolean; // True for last chunk
}

export interface BatchStats {
  registered_total: number;
  sheets_total: number;
  error_total: number;
  err_duplicate_sheets_total: number;
  err_low_answer_total: number;
  err_student_id_total: number;
  err_center_code_total: number;
  err_class_group_total: number;
  err_class_level_total: number;
}

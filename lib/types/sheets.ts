// Sheet types
export enum SheetStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  NEEDS_CORRECTION = 'needs_correction',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export interface Sheet {
  id: string;
  student_id?: string;
  student_name?: string;
  batch_id: string;
  image_url: string;
  status: SheetStatus;
  qr_code?: string;
  bubbles?: BubbleData[];
  corrections?: Correction[];
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BubbleData {
  id: string;
  question_number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value?: string;
  confidence?: number;
}

export interface Correction {
  id: string;
  type: 'manual' | 'qr' | 'answer';
  field: string;
  old_value?: string;
  new_value: string;
  corrected_by: string;
  corrected_at: string;
  reason?: string;
}

export interface SheetCorrectionRequest {
  type: 'manual' | 'qr' | 'answer';
  field: string;
  new_value: string;
  reason?: string;
}

export interface BulkSheetUpdateRequest {
  sheet_ids: string[];
  status?: SheetStatus;
  action?: 'reread' | 'reject' | 'approve';
}

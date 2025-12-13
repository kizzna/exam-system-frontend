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

export interface OverlayDimensions {
  w: number;
  h: number;
}

export interface OverlayMarker {
  x: number;
  y: number;
  val: number | string;
  step_y: number;
  base_y: number;
  col?: number;
}

export interface OverlayTopData {
  dimensions: OverlayDimensions;
  values: {
    class_level: number | string;
    class_group: number | string;
    exam_center: number | string;
    student_roll: number | string;
  };
  scores: Record<string, number>;
}

export interface OverlayAnswer {
  q: number;
  val: number | null;
}

export interface OverlayBottomData {
  dimensions: OverlayDimensions;
  answers: OverlayAnswer[];
}

export interface OverlayResponse {
  top: OverlayTopData;
  bottom: OverlayBottomData;
  student_name?: {
    value: string;
    x: number;
    y: number;
  };
}

export interface OverlayCoordinate {
  x: number;
  y: number;
}

export interface OMRLayout {
  dimensions: OverlayDimensions;
  config: {
    top: { crop_x: number; crop_y: number; crop_w: number; crop_h: number };
    bottom: { crop_x: number; crop_y: number; crop_w: number; crop_h: number };
  };
  header_layout: {
    id_class_level: OverlayCoordinate[];
    id_group_level: OverlayCoordinate[];
    [key: string]: OverlayCoordinate[]; // For dynamic columns like id_exam_center_col_X
  };
  questions: Record<string, Record<string, OverlayCoordinate>>;
}

export interface AnswerKey {
  [questionNo: string]: number;
}
export interface SheetInfoUpdateRequest {
  sheet_ids: string[];
  updates: {
    student_roll?: string;
  };
}

export interface SheetVerificationRequest {
  corrected_flags: {
    marked_present?: boolean;
    too_few_answers?: boolean;
    passed_by_policy?: boolean;
    manual_corrected?: boolean;
  };
}

export interface AnswerEditPayload {
  answers: Record<string, number>;
}

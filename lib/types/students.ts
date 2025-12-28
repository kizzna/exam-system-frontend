// Student types based on search_student_name_feature.md
export interface Student {
  snr_name: string;
  task_id: string;
  exam_center_code: string;
  class_level: string;
  class_group: string;
  master_roll: string;
  student_roll: string;
  prefix_name: string;
  firstname: string;
  lastname: string;
  present_status: string;
}

export interface StudentSearchParams {
  q: string;
  limit?: number;
  offset?: number;
}

export interface StudentSearchResponse {
  data: Student[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

// Grading types
export interface AnswerKey {
  id: string;
  exam_id: string;
  name: string;
  total_questions: number;
  answers: Answer[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Answer {
  question_number: number;
  correct_answer: string;
  points: number;
}

export interface CreateAnswerKeyRequest {
  exam_id: string;
  name: string;
  answers: Answer[];
}

export interface GradingRequest {
  batch_id: string;
  answer_key_id: string;
}

export interface GradingResult {
  id: string;
  student_id: string;
  batch_id: string;
  answer_key_id: string;
  total_score: number;
  max_score: number;
  percentage: number;
  graded_at: string;
  graded_by: string;
}

// Task types
export enum TaskStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to?: string;
  assigned_by?: string;
  batch_id?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  assigned_to?: string;
  batch_id?: string;
  due_date?: string;
}

export interface TaskAssignmentRequest {
  user_id: string;
  task_ids: string[];
}

export interface TaskDistributionRequest {
  task_ids: string[];
  user_ids: string[];
  strategy: 'fair' | 'workload' | 'random';
}

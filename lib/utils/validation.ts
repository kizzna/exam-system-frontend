import { z } from 'zod';

// Login validation schema
export const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// User validation schema
export const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  roles: z.array(z.string()).optional(),
});

// Batch validation schema
export const batchSchema = z.object({
  name: z.string().min(3, 'Batch name must be at least 3 characters'),
  description: z.string().optional(),
  upload_strategy: z.enum(['replace', 'merge', 'append']),
});

// Task validation schema
export const taskSchema = z.object({
  title: z.string().min(3, 'Task title must be at least 3 characters'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
});

// Answer key validation schema
export const answerKeySchema = z.object({
  exam_id: z.string().min(1, 'Exam ID is required'),
  name: z.string().min(3, 'Answer key name must be at least 3 characters'),
  answers: z.array(
    z.object({
      question_number: z.number().min(1),
      correct_answer: z.string().min(1),
      points: z.number().min(0),
    })
  ),
});

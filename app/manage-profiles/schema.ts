import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name is too long'),

  studentId: z.string().max(20, 'Student ID is too long').optional().or(z.literal('')), // Allows empty string if they haven't set it yet

  course: z.string().min(2, 'Course name is required'),

  faculty: z.string().min(2, 'Faculty is required'),

  year: z.string().min(1, 'Please select a year'),
});

// Infer the TypeScript type from the schema automatically
export type ProfileFormValues = z.infer<typeof profileSchema>;

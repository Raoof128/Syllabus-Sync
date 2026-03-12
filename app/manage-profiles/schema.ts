import { z } from 'zod';
import type { Translator } from '@/lib/types/translator';
import type { TranslationKey } from '@/lib/i18n/translations';

export const createProfileSchema = (t: Translator) =>
  z.object({
    name: z.string().min(2, t('nameMinLength')).max(50, t('nameTooLong')),

    studentId: z.string().max(20, t('studentIdTooLong')).optional().or(z.literal('')), // Allows empty string if they haven't set it yet

    course: z.string().min(2, t('courseRequired')),

    faculty: z.string().min(2, t('facultyRequired')),

    year: z.string().min(1, t('pleaseSelectYear')),
  });

export const profileSchema = createProfileSchema((key: TranslationKey) => {
  const fallbacks: Record<string, string> = {
    nameMinLength: 'Name must be at least 2 characters',
    nameTooLong: 'Name is too long',
    studentIdTooLong: 'Student ID is too long',
    courseRequired: 'Course is required',
    facultyRequired: 'Faculty is required',
    pleaseSelectYear: 'Please select your year',
  };

  return fallbacks[key] || key;
});

// Infer the TypeScript type from the schema automatically
export type ProfileFormValues = z.infer<typeof profileSchema>;

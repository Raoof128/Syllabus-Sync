import * as z from 'zod';
import { SECURITY_CONFIG } from '@/lib/constants/config';

// Pass the translation function 't' into the schema generator
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createSignupSchema = (t: (key: any) => string) => {
  return z
    .object({
      email: z.string().email(t('validation.invalidEmail')),
      password: z
        .string()
        .min(SECURITY_CONFIG.MIN_PASSWORD_LENGTH, t('validation.passwordTooShort'))
        .regex(/[A-Z]/, t('validation.passwordUppercase'))
        .regex(/[0-9]/, t('validation.passwordNumber')),
      confirmPassword: z.string(),
      agreedToTerms: z.literal(true, {
        message: t('validation.termsRequired'),
      }),
      // Hidden honeypot field
      _gotcha: z.string().max(0, 'Bot detected'),

      // Profile fields
      fullName: z.string().min(1, t('validation.fullNameRequired')),
      studentId: z.string().min(1, t('validation.studentIdRequired')),
      course: z.string().optional(),
      year: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordsMismatch'),
      path: ['confirmPassword'],
    });
};

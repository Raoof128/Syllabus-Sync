import * as z from 'zod';
import { SECURITY_CONFIG } from '@/lib/constants/config';

// Basic HTML tag stripper for client-side XSS prevention (layer 1)
const stripHtmlTags = (val: string): string => {
  return val.replace(/<[^>]*>?/gm, '');
};

// Pass the translation function 't' into the schema generator
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createSignupSchema = (t: (key: any) => string) => {
  return z
    .object({
      email: z.string().trim().toLowerCase().email(t('validation.invalidEmail')),
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
      // NOTE: This field must *not* fail validation when populated, otherwise the
      // server-side honeypot branch becomes unreachable. We validate type/size only.
      _gotcha: z.string().max(200).optional().default(''),

      // Profile fields with sanitization
      fullName: z.string().trim().min(1, t('validation.fullNameRequired')).transform(stripHtmlTags),
      studentId: z.string().trim().min(1, t('validation.studentIdRequired')),
      course: z.string().optional(),
      year: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordsMismatch'),
      path: ['confirmPassword'],
    });
};

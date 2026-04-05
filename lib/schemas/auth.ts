import * as z from 'zod';
import { SECURITY_CONFIG } from '@/lib/constants/config';
import type { Translator } from '@/lib/types/translator';

// Basic HTML tag stripper for client-side XSS prevention (layer 1)
const stripHtmlTags = (val: string): string => {
  return val.replace(/<[^>]*>?/gm, '');
};

// Step 1 schema (auth only). Used by the signup form to validate the first
// page *independently* of the profile fields. Validating the full schema
// to move between steps is unreliable: the `.refine()` at the top level
// forces every field to be evaluated in one pass, which races with RHF's
// resolver identity changing while i18n hydrates. Keeping step 1 isolated
// guarantees the "Next" button always sees a deterministic result.
export const createAuthStepSchema = (t: Translator) => {
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
      // Hidden honeypot field — accept any short string, never fail it here.
      _gotcha: z.string().max(200).optional().default(''),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordsMismatch'),
      path: ['confirmPassword'],
    });
};

// Pass the translation function 't' into the schema generator
export const createSignupSchema = (t: Translator) => {
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
      faculty: z.string().trim().min(1, t('facultyRequired')),
      course: z.string().trim().min(1, t('courseRequired')),
      year: z.string().trim().min(1, t('yearRequired')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordsMismatch'),
      path: ['confirmPassword'],
    });
};

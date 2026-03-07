import { z } from 'zod';
import type { Translator } from '@/lib/types/translator';
import type { TranslationKey } from '@/lib/i18n/translations';

export const createLoginSchema = (t: Translator) =>
  z.object({
    email: z.string().min(1, t('loginEmailRequired')).email(t('loginValidEmail')),
    password: z.string().min(1, t('loginPasswordRequired')),
  });

// Default schema for use in non-i18n contexts (e.g. server actions)
export const loginSchema = createLoginSchema((key: TranslationKey) => {
  const fallbacks: Record<string, string> = {
    loginEmailRequired: 'Email is required',
    loginValidEmail: 'Please enter a valid university email',
    loginPasswordRequired: 'Password is required',
  };
  return fallbacks[key] || key;
});

export type LoginFormData = z.infer<typeof loginSchema>;

import type { TranslationKey } from '@/lib/i18n/translations';

/**
 * Translator function type matching the typed translation hook signature.
 *
 * This type is used by schema factories (createLoginSchema, createSignupSchema, etc.)
 * to accept the translation function from useTypedTranslation().
 */
export type Translator = (key: TranslationKey, vars?: Record<string, string | number>) => string;

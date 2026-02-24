import { useTranslation } from '@/lib/hooks/useTranslation';
import { TranslationKey } from '@/lib/i18n/translations';

/**
 * A type-safe wrapper around the translation hook.
 * This ensures that translation keys are validated at build time.
 *
 * @example
 * const { t } = useTypedTranslation();
 * t('settings'); // ✅ Valid
 * t('invalid_key'); // ❌ Build Error
 */
export const useTypedTranslation = () => {
  const { t, ...rest } = useTranslation();

  // The original t is already typed as (key: TranslationKey, ...),
  // but we wrap it here to explicitly enforce the contract requested in the blueprint.
  // This hook serves as the designated type-safe entry point for translations.
  const typedT = (key: TranslationKey, vars?: Record<string, string | number>) => t(key, vars);

  return { t: typedT, ...rest };
};

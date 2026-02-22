import { useCallback } from "react";
import { useTypedTranslation } from "@/lib/hooks/useTypedTranslation";
import type { TranslationKey } from "@/lib/i18n/translations";

/**
 * Type-safe translation hook with fallback support
 *
 * This hook wraps useTypedTranslation to provide a safeT function that:
 * 1. Attempts to cast string keys to TranslationKey type
 * 2. Falls back to provided fallback if translation returns the key itself (missing key)
 * 3. Maintains type safety for known keys while allowing dynamic strings
 *
 * Use this when you need to translate keys that may be dynamic or when you want
 * guaranteed fallback behavior for missing translations.
 *
 * @example
 * const { t, safeT } = useSafeTranslation();
 *
 * // Type-safe known key
 * t('settings');
 *
 * // Dynamic key with fallback
 * safeT(`building.${buildingId}`, buildingName);
 *
 * // User-provided key with fallback
 * safeT(userInput, 'Default Text');
 */
export function useSafeTranslation() {
  const { t, ...rest } = useTypedTranslation();

  /**
   * Safe translation with fallback
   *
   * @param key - The translation key (string, will be cast to TranslationKey)
   * @param fallback - Fallback text if translation missing or returns the key
   * @returns Translated string or fallback
   */
  const safeT = useCallback(
    (key: string, fallback: string): string => {
      // Cast to TranslationKey and attempt translation
      const translation = t(key as TranslationKey);

      // If translation returns the key itself (common i18n behavior for missing keys)
      // or is empty, return the fallback
      if (translation === key || !translation) {
        return fallback;
      }

      return translation;
    },
    [t],
  );

  return { t, safeT, ...rest };
}

export default useSafeTranslation;

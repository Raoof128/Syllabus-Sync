'use client';

import { useCallback } from 'react';
import { translations, TranslationKey } from '@/lib/i18n/translations';
import { useLanguageStore } from '@/lib/store/languageStore';

export function useTranslation() {
  const { language, setLanguage, isRTL } = useLanguageStore();

  const t = useCallback((key: TranslationKey, vars?: Record<string, string | number>): string => {
    // Fallback logic: check current language -> check English -> return key
    let text = (translations[language] as any)[key] || translations.en[key] || key;

    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }
    return text;
  }, [language]);

  return {
    t,
    language,
    setLanguage,
    isRTL,
  };
}

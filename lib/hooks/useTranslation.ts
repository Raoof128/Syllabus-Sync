// lib/hooks/useTranslation.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { translations, TranslationKey, Language } from '@/lib/i18n/translations';

export function useTranslation() {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language preference on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('language') as Language;
        if (saved && (saved === 'en' || saved === 'es' || saved === 'fa')) {
          setLanguageState(saved);
        }
      }
    } catch (error) {
      // Silently handle localStorage errors (e.g., in private browsing mode)
      console.warn('Unable to load language preference from localStorage');
    }
  }, []);

  const setLanguage = useCallback((newLanguage: Language) => {
    if (newLanguage !== language) {
      setLanguageState(newLanguage);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('language', newLanguage);
        }
      } catch (error) {
        console.warn('Unable to save language preference to localStorage');
      }
    }
  }, [language]);

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  }, [language]);

  return {
    t,
    language,
    setLanguage,
    isRTL: language === 'fa', // Persian is a right-to-left language
  };
}

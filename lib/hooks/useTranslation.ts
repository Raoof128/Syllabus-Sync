'use client';

import { useCallback, useEffect, useRef, useTransition } from 'react';
import {
  translations,
  loadTranslations,
  isLanguageLoaded,
  TranslationKey,
  Language,
} from '@/lib/i18n/translations';
import { useLanguageStore } from '@/lib/store/languageStore';

// Import English for fallback
import en from '@/locales/en/translations.json';

// Trigger hydration once on client mount
let hydrationTriggered = false;

export function useTranslation() {
  const { language, setLanguage, isRTL, _hasHydrated } = useLanguageStore();
  // Use React 18+ useTransition for non-blocking loading state
  const [isPending, startTransition] = useTransition();
  const loadedRef = useRef<Set<Language>>(new Set(['en']));

  // Trigger hydration on first client render
  useEffect(() => {
    if (!hydrationTriggered) {
      hydrationTriggered = true;
      useLanguageStore.persist.rehydrate();
    }
  }, []);

  // Load translations for the current language
  useEffect(() => {
    if (!isLanguageLoaded(language) && !loadedRef.current.has(language)) {
      loadedRef.current.add(language);
      // Use startTransition to avoid cascading render warning
      startTransition(() => {
        loadTranslations(language);
      });
    }
  }, [language]);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      // Get translation from current language, fallback to English
      const langTranslations = translations[language];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let text = (langTranslations as any)?.[key] || en[key] || key;

      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
        });
      }
      return text;
    },
    [language],
  );

  // Helper to change language with lazy loading
  const changeLanguage = useCallback(
    async (newLang: Language) => {
      if (newLang !== language) {
        await loadTranslations(newLang);
        setLanguage(newLang);
      }
    },
    [language, setLanguage],
  );

  return {
    t,
    language,
    setLanguage: changeLanguage,
    isRTL,
    hasHydrated: _hasHydrated,
    isLoadingTranslations: isPending,
  };
}

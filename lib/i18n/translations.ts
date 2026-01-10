// lib/i18n/translations.ts
// Lazy-loaded translations system
// Only the current language is loaded to reduce bundle size

import en from '@/locales/en/translations.json';

// English is always loaded (default fallback)
export type TranslationKey = keyof typeof en;
export type Language =
  | 'en'
  | 'es'
  | 'fa'
  | 'zh'
  | 'ar'
  | 'hi'
  | 'ko'
  | 'ja'
  | 'ur'
  | 'th'
  | 'vi'
  | 'ru'
  | 'ta'
  | 'bn'
  | 'id'
  | 'ms'
  | 'it'
  | 'fr'
  | 'he';

// Partial translation type - non-English languages may have missing keys
type TranslationData = Partial<typeof en>;

// Cache for loaded translations
const translationsCache: Map<Language, TranslationData> = new Map([['en', en]]);

/**
 * Lazy load translations for a specific language
 * Uses dynamic imports to reduce initial bundle size
 */
export async function loadTranslations(lang: Language): Promise<TranslationData> {
  // Return cached translations if available
  const cached = translationsCache.get(lang);
  if (cached) {
    return cached;
  }

  // Load translations dynamically
  try {
    let translations: TranslationData;

    switch (lang) {
      case 'es':
        translations = (await import('@/locales/es/translations.json')).default;
        break;
      case 'fa':
        translations = (await import('@/locales/fa/translations.json')).default;
        break;
      case 'zh':
        translations = (await import('@/locales/zh/translations.json')).default;
        break;
      case 'ar':
        translations = (await import('@/locales/ar/translations.json')).default;
        break;
      case 'hi':
        translations = (await import('@/locales/hi/translations.json')).default;
        break;
      case 'ko':
        translations = (await import('@/locales/ko/translations.json')).default;
        break;
      case 'ja':
        translations = (await import('@/locales/ja/translations.json')).default;
        break;
      case 'ur':
        translations = (await import('@/locales/ur/translations.json')).default;
        break;
      case 'th':
        translations = (await import('@/locales/th/translations.json')).default;
        break;
      case 'vi':
        translations = (await import('@/locales/vi/translations.json')).default;
        break;
      case 'ru':
        translations = (await import('@/locales/ru/translations.json')).default;
        break;
      case 'ta':
        translations = (await import('@/locales/ta/translations.json')).default;
        break;
      case 'bn':
        translations = (await import('@/locales/bn/translations.json')).default;
        break;
      case 'id':
        translations = (await import('@/locales/id/translations.json')).default;
        break;
      case 'ms':
        translations = (await import('@/locales/ms/translations.json')).default;
        break;
      case 'it':
        translations = (await import('@/locales/it/translations.json')).default;
        break;
      case 'fr':
        translations = (await import('@/locales/fr/translations.json')).default;
        break;
      case 'he':
        translations = (await import('@/locales/he/translations.json')).default;
        break;
      default:
        translations = en;
    }

    // Cache the loaded translations
    translationsCache.set(lang, translations);
    return translations;
  } catch (error) {
    console.error(`Failed to load translations for ${lang}:`, error);
    // Fall back to English on error
    return en;
  }
}

/**
 * Get cached translations synchronously
 * Returns English as fallback if the language isn't loaded yet
 */
export function getTranslations(lang: Language): TranslationData {
  return translationsCache.get(lang) || en;
}

/**
 * Check if translations for a language are loaded
 */
export function isLanguageLoaded(lang: Language): boolean {
  return translationsCache.has(lang);
}

// Legacy export for backwards compatibility
// This allows existing code to work while we migrate
export const translations: Record<Language, TranslationData> = new Proxy(
  {} as Record<Language, TranslationData>,
  {
    get(_, prop: Language) {
      return translationsCache.get(prop) || en;
    },
  },
);

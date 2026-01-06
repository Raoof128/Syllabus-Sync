// lib/i18n/translations.ts
import en from '@/locales/en/translations.json';
import es from '@/locales/es/translations.json';
import fa from '@/locales/fa/translations.json';
import zh from '@/locales/zh/translations.json';
import ar from '@/locales/ar/translations.json';
import hi from '@/locales/hi/translations.json';
import ko from '@/locales/ko/translations.json';
import ja from '@/locales/ja/translations.json';
import ur from '@/locales/ur/translations.json';
import th from '@/locales/th/translations.json';
import vi from '@/locales/vi/translations.json';
import ru from '@/locales/ru/translations.json';
import ta from '@/locales/ta/translations.json';
import bn from '@/locales/bn/translations.json';
import id from '@/locales/id/translations.json';
import ms from '@/locales/ms/translations.json';
import it from '@/locales/it/translations.json';
import fr from '@/locales/fr/translations.json';
import he from '@/locales/he/translations.json';

export const translations = {
  en,
  es,
  fa,
  zh,
  ar,
  hi,
  ko,
  ja,
  ur,
  th,
  vi,
  ru,
  ta,
  bn,
  id,
  ms,
  it,
  fr,
  he,
};

export type TranslationKey = keyof typeof translations.en;
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

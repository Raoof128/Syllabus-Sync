// lib/utils/locale.ts
// ============================================
// LOCALE UTILITIES
// ============================================
// Provides locale-related helper functions for internationalization

import { Language } from '@/lib/i18n/translations';

/**
 * Maps our app's language codes to BCP 47 locale strings used by Intl APIs
 */
const LOCALE_MAP: Record<Language, string> = {
  en: 'en-AU',
  es: 'es-ES',
  fa: 'fa-IR',
  zh: 'zh-CN',
  ar: 'ar-SA',
  hi: 'hi-IN',
  ko: 'ko-KR',
  ja: 'ja-JP',
  ur: 'ur-PK',
  th: 'th-TH',
  vi: 'vi-VN',
  ru: 'ru-RU',
  ta: 'ta-IN',
  bn: 'bn-BD',
  id: 'id-ID',
  ms: 'ms-MY',
  it: 'it-IT',
  fr: 'fr-FR',
  he: 'he-IL',
};

/**
 * RTL (Right-to-Left) languages in our app
 */
export const RTL_LANGUAGES: Language[] = ['fa', 'ar', 'ur', 'he'];

/**
 * Returns the BCP 47 locale string for a given language code
 * Falls back to 'en-AU' if the language is not found
 *
 * @param language - The app's language code
 * @returns BCP 47 locale string (e.g., 'en-AU', 'fa-IR')
 */
export function getLocaleString(language: Language): string {
  return LOCALE_MAP[language] || 'en-AU';
}

/**
 * Checks if a language is RTL (Right-to-Left)
 *
 * @param language - The app's language code
 * @returns true if the language is RTL
 */
export function isRTLLanguage(language: Language): boolean {
  return RTL_LANGUAGES.includes(language);
}

/**
 * Formats a date according to the user's selected language
 *
 * @param date - The date to format
 * @param language - The app's language code
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatLocalizedDate(
  date: Date,
  language: Language,
  options?: Intl.DateTimeFormatOptions,
): string {
  const locale = getLocaleString(language);
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Formats a number according to the user's selected language
 *
 * @param num - The number to format
 * @param language - The app's language code
 * @param options - Intl.NumberFormatOptions
 * @returns Formatted number string
 */
export function formatLocalizedNumber(
  num: number,
  language: Language,
  options?: Intl.NumberFormatOptions,
): string {
  const locale = getLocaleString(language);
  return new Intl.NumberFormat(locale, options).format(num);
}

/**
 * Returns relative time string (e.g., "2 days ago") in the user's language
 *
 * @param date - The date to compare against now
 * @param language - The app's language code
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date, language: Language): string {
  const locale = getLocaleString(language);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInSeconds = Math.round(diffInMs / 1000);
  const diffInMinutes = Math.round(diffInSeconds / 60);
  const diffInHours = Math.round(diffInMinutes / 60);
  const diffInDays = Math.round(diffInHours / 24);
  const diffInWeeks = Math.round(diffInDays / 7);
  const diffInMonths = Math.round(diffInDays / 30);
  const diffInYears = Math.round(diffInDays / 365);

  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(diffInSeconds, 'second');
  } else if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(diffInMinutes, 'minute');
  } else if (Math.abs(diffInHours) < 24) {
    return rtf.format(diffInHours, 'hour');
  } else if (Math.abs(diffInDays) < 7) {
    return rtf.format(diffInDays, 'day');
  } else if (Math.abs(diffInWeeks) < 4) {
    return rtf.format(diffInWeeks, 'week');
  } else if (Math.abs(diffInMonths) < 12) {
    return rtf.format(diffInMonths, 'month');
  } else {
    return rtf.format(diffInYears, 'year');
  }
}

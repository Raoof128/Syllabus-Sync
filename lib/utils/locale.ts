// lib/utils/locale.ts
// ============================================
// LOCALE UTILITIES
// ============================================
// Provides locale-related helper functions for internationalization

import { Language } from "@/lib/i18n/translations";

/**
 * Maps our app's language codes to BCP 47 locale strings used by Intl APIs
 */
const LOCALE_MAP: Record<Language, string> = {
  en: "en-AU",
  es: "es-ES",
  fa: "fa-IR",
  zh: "zh-CN",
  ar: "ar-SA",
  hi: "hi-IN",
  ko: "ko-KR",
  ja: "ja-JP",
  ur: "ur-PK",
  th: "th-TH",
  vi: "vi-VN",
  ru: "ru-RU",
  ta: "ta-IN",
  bn: "bn-BD",
  id: "id-ID",
  ms: "ms-MY",
  it: "it-IT",
  fr: "fr-FR",
  he: "he-IL",
  de: "de-DE",
  da: "da-DK",
  sv: "sv-SE",
  tr: "tr-TR",
  pt: "pt-PT",
  nl: "nl-NL",
  pl: "pl-PL",
  no: "nb-NO",
  fi: "fi-FI",
  el: "el-GR",
  ro: "ro-RO",
  cs: "cs-CZ",
  hu: "hu-HU",
  uk: "uk-UA",
  ne: "ne-NP",
  si: "si-LK",
};

/**
 * RTL (Right-to-Left) languages in our app
 */
export const RTL_LANGUAGES: Language[] = ["fa", "ar", "ur", "he"];

/**
 * Returns the BCP 47 locale string for a given language code
 * Falls back to 'en-AU' if the language is not found
 *
 * @param language - The app's language code
 * @returns BCP 47 locale string (e.g., 'en-AU', 'fa-IR')
 */
export function getLocaleString(language: Language): string {
  return LOCALE_MAP[language] || "en-AU";
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
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

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
    return rtf.format(diffInSeconds, "second");
  } else if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(diffInMinutes, "minute");
  } else if (Math.abs(diffInHours) < 24) {
    return rtf.format(diffInHours, "hour");
  } else if (Math.abs(diffInDays) < 7) {
    return rtf.format(diffInDays, "day");
  } else if (Math.abs(diffInWeeks) < 4) {
    return rtf.format(diffInWeeks, "week");
  } else if (Math.abs(diffInMonths) < 12) {
    return rtf.format(diffInMonths, "month");
  } else {
    return rtf.format(diffInYears, "year");
  }
}

/**
 * Formats a schedule time string (HH:MM or HH:MM:SS) to a user-friendly format
 * e.g., "09:00" -> "9:00 AM", "14:30" -> "2:30 PM"
 *
 * @param time - Time string in HH:MM or HH:MM:SS format
 * @param language - The app's language code
 * @returns Formatted time string (e.g., "9:00 AM")
 */
export function formatScheduleTime(time: string, language: Language): string {
  const parts = time.split(":");
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return time;

  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  const locale = getLocaleString(language);
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Format location from building and room
 *
 * @param building - Building code (e.g., "C5C")
 * @param room - Room identifier (e.g., "204" or "Room 204") - optional, can be empty
 * @param roomLabel - The translated "Room" label
 * @returns Formatted location string (e.g., "C5C" or "C5C Room 204")
 */
export function formatLocation(
  building: string,
  room?: string,
  roomLabel = "Room",
): string {
  // If room is empty or not provided, just return the building
  if (!room || room.trim() === "") {
    return building;
  }
  // If room already starts with "Room" (case-insensitive), don't add the prefix
  const roomWithPrefix = room.toLowerCase().startsWith("room")
    ? room
    : `${roomLabel} ${room}`;

  return `${building} ${roomWithPrefix}`;
}

import type { TranslationKey } from '@/lib/i18n/translations';

export const REMINDER_TIMING_OPTIONS = [
  { value: 15, labelKey: 'timing15min' as const },
  { value: 30, labelKey: 'timing30min' as const },
  { value: 60, labelKey: 'timing1hour' as const },
  { value: 120, labelKey: 'timing2hours' as const },
  { value: 1440, labelKey: 'timing1day' as const },
  { value: 2880, labelKey: 'timing2days' as const },
] as const;

/**
 * Settings section paths for the application.
 * Separated from client components to avoid Next.js serialization warnings.
 */
export const SETTINGS_SECTION_PATHS = [
  '/settings/general',
  '/settings/appearance',
  '/settings/security',
  '/settings/experience',
  '/settings/about',
] as const;

export type SettingsSectionPath = (typeof SETTINGS_SECTION_PATHS)[number];

/**
 * Quick action links for settings navigation.
 * Icons are referenced by string key and mapped in the component.
 */
export const QUICK_ACTION_LINKS: {
  href: string;
  labelKey: TranslationKey;
  iconKey: 'Home' | 'Calendar' | 'Newspaper' | 'Map' | 'Users';
}[] = [
  { href: '/home', labelKey: 'homeDashboard', iconKey: 'Home' },
  { href: '/calendar', labelKey: 'calendarView', iconKey: 'Calendar' },
  { href: '/feed', labelKey: 'eventsFeed', iconKey: 'Newspaper' },
  { href: '/map', labelKey: 'campusMap', iconKey: 'Map' },
  { href: '/manage-profiles', labelKey: 'manageProfiles', iconKey: 'Users' },
];


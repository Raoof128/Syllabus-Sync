/**
 * University/Organization Configuration
 */
export const UNIVERSITY_CONFIG = {
  name: 'Macquarie University',
  shortName: 'Macquarie University',
  website: 'https://www.mq.edu.au',
  /**
   * Support contact for this application.
   *
   * This was `support@mq.edu.au` until 2026-08-17. That is a real Macquarie
   * University service desk which has never agreed to receive mail about
   * Syllabus Sync, so every user who hit "Feedback" or looked for help was
   * being pointed at a team that knows nothing about the product. Raised by
   * the external security and privacy review (Q15).
   *
   * Until the university makes a decision on branding and support ownership,
   * this must resolve to a mailbox the maintainers actually read. Set
   * NEXT_PUBLIC_SUPPORT_EMAIL to move it (e.g. to support@syllabus-sync.app
   * once that mailbox exists) without a code change; the literal below is the
   * fallback and must stay a working address.
   */
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'raoof.r12@gmail.com',
} as const;

/**
 * App Configuration
 */
export const APP_CONFIG = {
  name: 'Syllabus Sync',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  description: 'Campus navigation and schedule management',
  fullDescription: `Campus navigation and schedule management for ${UNIVERSITY_CONFIG.name}`,
  version: '1.0.0',
} as const;

/**
 * Default User Configuration
 */
export const DEMO_USER = {
  name: 'Student',
  email: '',
} as const;

/**
 * MQ Brand Colors
 */
export const BRAND_COLORS = {
  primary: '#A6192E', // Macquarie Red
  secondary: '#002A45', // Macquarie Blue
  accent: '#FFB81C', // Macquarie Gold
} as const;

/**
 * Unit Color Palette
 */
export const UNIT_COLORS = [
  { name: 'Red', value: '#A6192E', translationKey: 'colorUniversityRed' },
  { name: 'Blue', value: '#1E5AA8', translationKey: 'colorUniversityBlue' },
  { name: 'Gold', value: '#FFB81C', translationKey: 'colorUniversityGold' },
  { name: 'Green', value: '#10b981', translationKey: 'colorGreen' },
  { name: 'Purple', value: '#a855f7', translationKey: 'colorPurple' },
  { name: 'Orange', value: '#f97316', translationKey: 'colorOrange' },
  { name: 'Pink', value: '#ec4899', translationKey: 'colorPink' },
  { name: 'Cyan', value: '#06b6d4', translationKey: 'colorCyan' },
] as const;

export { buildings as CAMPUS_BUILDINGS } from '@/features/map/lib/buildings';

/**
 * Feature Flags
 */
export const FEATURES = {
  showComingSoonBadges: true,
  mapEnabled: true,
  calendarEnabled: true,
  notificationsEnabled: true,
  userSettingsEnabled: true,
} as const;

export const HOME_STYLE_VARIANT = 'solid';

/**
 * Social Links
 */
export const SOCIAL_LINKS = {
  twitter: 'https://x.com/macquarieuni',
  facebook: 'https://facebook.com/macquarieuniversity',
  instagram: 'https://instagram.com/macquarieuni',
  linkedin: 'https://linkedin.com/school/macquarie-university',
} as const;

/**
 * External Links
 */
export const EXTERNAL_LINKS = {
  documentation: UNIVERSITY_CONFIG.website,
  feedback: 'mailto:support@mq.edu.au?subject=Syllabus Sync Feedback',
  privacy: '/privacy',
  terms: '/terms',
} as const;

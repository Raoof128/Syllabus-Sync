// lib/config.ts
// ============================================
// PERSONALIZATION FILE
// ============================================
// Edit this file to customize the app for your university/organization
// All configuration values used throughout the app are defined here

/**
 * University/Organization Configuration
 * Change these values to customize the app branding
 */
export const UNIVERSITY_CONFIG = {
  // Full name of the university
  name: 'Macquarie University',
  // Short name for display in tight spaces
  shortName: 'Macquarie University',
  // University website
  website: 'https://www.mq.edu.au',
  // Support email
  supportEmail: 'support@mq.edu.au',
} as const;

/**
 * App Configuration
 * Customize the app name and description
 */
export const APP_CONFIG = {
  // App name displayed in header and title
  name: 'The Syllabus Sync',
  // App tagline/description
  description: 'Campus navigation and schedule management',
  // Full description for metadata
  fullDescription: `Campus navigation and schedule management for ${UNIVERSITY_CONFIG.name}`,
  // Version number
  version: '0.5.72',
} as const;

/**
 * Demo User Configuration
 * Customize the demo user profile shown in the header
 */
export const DEMO_USER = {
  // Display name
  name: 'Student',
  // Student ID (optional, for display)
  studentId: '',
  // Email
  email: '',
} as const;

/**
 * Brand Colors
 * Primary colors used throughout the app
 * These should match your university's brand guidelines
 */
export const BRAND_COLORS = {
  // Primary brand color (used for accents, user avatar, etc.)
  primary: '#A6192E', // Macquarie Red
  // Secondary brand color
  secondary: '#002A45', // Macquarie Blue
  // Accent color
  accent: '#FFB81C', // Macquarie Gold
} as const;

/**
 * Unit Color Palette
 * Colors available for users to assign to their units/courses
 */
export const UNIT_COLORS = [
  { name: 'University Red', value: '#A6192E', translationKey: 'colorUniversityRed' },
  { name: 'University Blue', value: '#002A45', translationKey: 'colorUniversityBlue' },
  { name: 'University Gold', value: '#FFB81C', translationKey: 'colorUniversityGold' },
  { name: 'Green', value: '#10b981', translationKey: 'colorGreen' },
  { name: 'Purple', value: '#a855f7', translationKey: 'colorPurple' },
  { name: 'Orange', value: '#f97316', translationKey: 'colorOrange' },
  { name: 'Pink', value: '#ec4899', translationKey: 'colorPink' },
  { name: 'Cyan', value: '#06b6d4', translationKey: 'colorCyan' },
] as const;

/**
 * Campus Buildings
 * List of buildings on campus for location selection
 * Add or modify buildings for your campus
 */
export const CAMPUS_BUILDINGS = [
  { code: 'C5C', name: 'Computer Science Building', translationKey: 'building_C5C_name' },
  { code: 'C3C', name: 'Library', translationKey: 'building_C3C_name' },
  { code: 'C7A', name: 'Campus Hub', translationKey: 'building_C7A_name' },
  { code: 'W6A', name: 'Wallumattagal Building', translationKey: 'building_W6A_name' },
  { code: 'E7A', name: 'Engineering Building', translationKey: 'building_E7A_name' },
  { code: 'E7B', name: 'Engineering Building B', translationKey: 'building_E7B_name' },
  { code: 'W3A', name: 'Careers & Employment', translationKey: 'building_W3A_name' },
  { code: '12WW', name: "12 Wally's Walk", translationKey: 'building_12WW_name' },
  { code: '4WW', name: "4 Wally's Walk", translationKey: 'building_4WW_name' },
  { code: 'LIB', name: 'Library', translationKey: 'building_LIB_name' },
  { code: 'Sports', name: 'Sports Precinct', translationKey: 'building_Sports_name' },
] as const;

/**
 * Feature Flags
 * Enable or disable features for demo
 */
export const FEATURES = {
  // Show "Coming Soon" badges on incomplete features
  showComingSoonBadges: true,
  // Enable map feature
  mapEnabled: true,
  // Enable calendar feature
  calendarEnabled: true,
  // Enable notifications
  notificationsEnabled: true,
  // Enable user settings
  settingsEnabled: true,
} as const;

/**
 * Social Links
 * Links to university social media (optional)
 */
export const SOCIAL_LINKS = {
  twitter: 'https://x.com/macquarieuni',
  facebook: 'https://facebook.com/macquarieuniversity',
  instagram: 'https://instagram.com/macquarieuni',
  linkedin: 'https://linkedin.com/school/macquarie-university',
} as const;

/**
 * External Links
 * Links to documentation, feedback, and support
 */
export const EXTERNAL_LINKS = {
  documentation: 'https://github.com/syllabus-sync/syllabus-sync#readme',
  feedback: 'mailto:support@mq.edu.au?subject=Syllabus Sync Feedback',
  privacy: 'https://www.mq.edu.au/privacy',
  terms: 'https://www.mq.edu.au/terms',
} as const;

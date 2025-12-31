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
  shortName: 'Macquarie',
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
  version: '0.3.0',
} as const;

/**
 * Demo User Configuration
 * Customize the demo user profile shown in the header
 */
export const DEMO_USER = {
  // Display name
  name: 'Alex Chen',
  // Student ID (optional, for display)
  studentId: '46892315',
  // Email
  email: 'alex.chen@students.mq.edu.au',
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
  { name: 'University Red', value: '#A6192E' },
  { name: 'University Blue', value: '#002A45' },
  { name: 'University Gold', value: '#FFB81C' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
] as const;

/**
 * Campus Buildings
 * List of buildings on campus for location selection
 * Add or modify buildings for your campus
 */
export const CAMPUS_BUILDINGS = [
  { code: 'C5C', name: 'Computer Science Building' },
  { code: 'W6A', name: 'Wallumattagal Building' },
  { code: 'E7A', name: 'Engineering Building' },
  { code: 'E7B', name: 'Engineering Building B' },
  { code: 'W3A', name: 'Careers & Employment' },
  { code: '12WW', name: '12 Wally\'s Walk' },
  { code: '4WW', name: '4 Wally\'s Walk' },
  { code: 'LIB', name: 'Library' },
] as const;

/**
 * Feature Flags
 * Enable or disable features for the demo
 */
export const FEATURES = {
  // Show "Coming Soon" badges on incomplete features
  showComingSoonBadges: true,
  // Enable the map feature
  mapEnabled: false,
  // Enable the calendar feature
  calendarEnabled: false,
  // Enable notifications
  notificationsEnabled: false,
  // Enable user settings
  settingsEnabled: false,
} as const;

/**
 * Social Links
 * Links to university social media (optional)
 */
export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/macquarieuni',
  facebook: 'https://facebook.com/macquarieuniversity',
  instagram: 'https://instagram.com/macquarieuni',
  linkedin: 'https://linkedin.com/school/macquarie-university',
} as const;


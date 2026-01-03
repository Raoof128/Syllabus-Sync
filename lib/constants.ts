// lib/constants.ts

// Re-export app configuration from config.ts to maintain single source of truth
export { APP_CONFIG, UNIT_COLORS } from './config';

// Derive APP_NAME and APP_DESCRIPTION from config for backward compatibility
import { APP_CONFIG, UNIVERSITY_CONFIG } from './config';
import type { DayOfWeek, Deadline, Event } from './types';
export const APP_NAME = APP_CONFIG.name;
export const APP_DESCRIPTION = `${APP_CONFIG.description} for ${UNIVERSITY_CONFIG.name}`;

// Routes
export const ROUTES = {
  HOME: '/home',
  MAP: '/map',
  CALENDAR: '/calendar',
  FEED: '/feed',
  SETTINGS: '/settings',
} as const;

// Days of the week
export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const DAY_SHORT: Record<DayOfWeek, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

// Priority levels
export const PRIORITY_LEVELS = ['Low', 'Medium', 'High', 'Urgent'] as const;

// Deadline types
export const DEADLINE_TYPES = ['Assignment', 'Exam', 'Quiz', 'Presentation'] as const;

// Event categories
export const EVENT_CATEGORIES = ['Career', 'Social', 'Academic', 'Free Food'] as const;


// Priority colors for badges
export const PRIORITY_COLORS: Record<Deadline['priority'], string> = {
  Low: 'bg-mq-success/10 text-mq-success border border-mq-success/20',
  Medium: 'bg-mq-warning/10 text-mq-warning border border-mq-warning/20',
  High: 'bg-mq-warning/10 text-mq-warning border border-mq-warning/20',
  Urgent: 'bg-mq-error/10 text-mq-error border border-mq-error/20',
};

// Category colors for events
export const CATEGORY_COLORS: Record<Event['category'], string> = {
  Career: 'bg-mq-info/10 text-mq-info border border-mq-info/20',
  Social: 'bg-mq-purple/10 text-mq-purple border border-mq-purple/20',
  Academic: 'bg-mq-success/10 text-mq-success border border-mq-success/20',
  'Free Food': 'bg-mq-warning/10 text-mq-warning border border-mq-warning/20',
};

// Time format options
export const TIME_FORMAT = {
  HOUR_12: 'h:mm a',
  HOUR_24: 'HH:mm',
} as const;

// Date format options
export const DATE_FORMAT = {
  SHORT: 'MMM d',
  MEDIUM: 'MMM d, yyyy',
  LONG: 'MMMM d, yyyy',
  FULL: 'EEEE, MMMM d, yyyy',
} as const;

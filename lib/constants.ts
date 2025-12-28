// lib/constants.ts

// App configuration
export const APP_NAME = 'Syllabus Sync';
export const APP_DESCRIPTION = 'Campus navigation and schedule management for Macquarie University';

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

export const DAY_SHORT: Record<string, string> = {
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

// Color palette for units
export const UNIT_COLORS = [
    { name: 'Macquarie Red', value: '#A6192E' },
    { name: 'Macquarie Blue', value: '#002A45' },
    { name: 'Macquarie Gold', value: '#FFB81C' },
    { name: 'Green', value: '#10b981' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Cyan', value: '#06b6d4' },
] as const;

// Priority colors for badges
export const PRIORITY_COLORS: Record<string, string> = {
    Low: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-orange-100 text-orange-800',
    Urgent: 'bg-red-100 text-red-800',
};

// Category colors for events
export const CATEGORY_COLORS: Record<string, string> = {
    Career: 'bg-blue-100 text-blue-800',
    Social: 'bg-purple-100 text-purple-800',
    Academic: 'bg-green-100 text-green-800',
    'Free Food': 'bg-orange-100 text-orange-800',
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


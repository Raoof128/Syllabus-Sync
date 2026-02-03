// lib/types/index.ts

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface Unit {
  id: string;
  code: string; // "COMP2310"
  name: string; // "Networking"
  color: string; // "#A6192E"
  location: {
    building: string; // "C5C"
    room: string; // "204"
  };
  schedule: ClassTime[];
  notificationEnabled?: boolean; // Whether notifications are enabled for this unit
  createdAt: Date;
}

export type ClassTime = {
  id: string;
  day: DayOfWeek;
  startTime: string; // "09:00"
  endTime: string; // "11:00"
};

export type Deadline = {
  id: string;
  title: string; // "Assignment 1"
  unitCode: string; // "COMP2310"
  unitId?: string; // Reference to Unit.id for color inheritance
  color?: string; // Custom color override (defaults to unit color)
  building?: string; // Building code for exams (e.g., "C5C")
  room?: string; // Room number for exams (e.g., "204")
  dueDate: Date;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  type: 'Assignment' | 'Exam' | 'Quiz' | 'Presentation';
  completed: boolean;
  notificationEnabled?: boolean; // Whether notifications are enabled for this deadline
  createdAt: Date;
};

export type Event = {
  id: string;
  userId?: string | null; // null for public/campus events, user ID for personal events
  title: string;
  description: string;
  building?: string; // Building code (e.g., "C5C") - optional for map navigation
  room?: string; // Room number (e.g., "204") - optional
  location?: string; // Legacy: combined "Building Room" string for backward compatibility
  category: 'Career' | 'Social' | 'Academic' | 'Free Food';
  color?: string; // Optional custom color (hex value like "#A6192E")
  imageUrl?: string;
  translationKey?: string;
  descriptionKey?: string;
  notificationEnabled?: boolean; // Whether notifications are enabled for this event
  // Time fields - startAt is the source of truth
  startAt: Date; // Full timestamp for event start (required)
  endAt?: Date; // Full timestamp for event end (optional)
  allDay: boolean; // true for all-day events
  // Computed fields for backward compatibility in UI (derived from startAt)
  date: Date; // Same as startAt (for UI compatibility)
  time: string; // Formatted time string ("2:00 PM") or empty for all-day
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'deadline' | 'event' | 'class' | 'system';
  read: boolean;
  createdAt: Date;
  link?: string; // Navigation link
  relatedId?: string; // Related deadline/event/unit ID
};

export type StressLevel = 'Low' | 'Busy' | 'High';

// To-Do List types
export type TodoPriority = 'Low' | 'Medium' | 'High';

export type Todo = {
  id: string;
  title: string;
  description?: string;
  priority: TodoPriority;
  completed: boolean;
  dueDate?: Date; // Optional due date
  notificationEnabled?: boolean; // Whether notifications are enabled for this todo
  createdAt: Date;
  completedAt?: Date; // When the task was completed
};

// Error handling types
export type AppError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  context?: string;
};

export type ValidationError = {
  field: string;
  message: string;
  code?: string;
};

export type FormErrors = {
  [key: string]: string;
};

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Settings types
export type SessionInfo = {
  id: string;
  device: string;
  lastActive: string;
  current: boolean;
};

export type NotificationPreferences = {
  deadlines: boolean;
  classes: boolean;
  events: boolean;
};

// Password strength levels
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export type PasswordStrengthResult = {
  strength: PasswordStrength;
  score: number; // 0-4
  feedback: string[];
};

// ============================================================================
// GAMIFICATION TYPES
// ============================================================================

/**
 * User's gamification profile with XP, level, and streak tracking
 */
export interface GamificationProfile {
  xp: number;
  level: number;
  streakDays: number;
  longestStreak: number;
  lastActivityDate: string | null;
  xpToNextLevel: number;
  xpForCurrentLevel: number;
  levelProgress: number; // 0-100 percentage
}

/**
 * XP event types that can trigger XP awards
 */
export type XPEventType =
  | 'deadline_completed'
  | 'deadline_early'
  | 'daily_login'
  | 'streak_bonus'
  | 'unit_added'
  | 'event_attended'
  | 'profile_completed'
  | 'first_deadline'
  | 'weekly_goal'
  | 'level_up_bonus';

/**
 * XP event record for audit logging
 */
export interface XPEvent {
  id: string;
  eventType: XPEventType | string;
  xpAmount: number;
  referenceId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

/**
 * Level tier for badge coloring
 */
export type LevelTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';

/**
 * Get the tier for a given level
 */
export function getLevelTier(level: number): LevelTier {
  if (level <= 5) return 'bronze';
  if (level <= 10) return 'silver';
  if (level <= 20) return 'gold';
  if (level <= 35) return 'platinum';
  if (level <= 50) return 'diamond';
  return 'master';
}

/**
 * Gamification settings preferences
 */
export interface GamificationSettings {
  showXPNotifications: boolean;
  showLevelUpNotifications: boolean;
  showStreakReminders: boolean;
  displayOnProfile: boolean;
}

/**
 * Default gamification settings
 */
export const DEFAULT_GAMIFICATION_SETTINGS: GamificationSettings = {
  showXPNotifications: true,
  showLevelUpNotifications: true,
  showStreakReminders: true,
  displayOnProfile: true,
};

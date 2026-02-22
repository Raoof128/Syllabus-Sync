// API Route Type Definitions for Next.js 16
// Centralized type definitions for consistent API responses and requests

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
  requestId: string;
}

// Profile types
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  student_id?: string;
  course?: string;
  year?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}

// Academic types
export interface Unit {
  id: string;
  user_id: string;
  code: string;
  name: string;
  color: string;
  description?: string;
  location?: {
    building: string;
    room: string;
  };
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ClassTime {
  id: string;
  unit_id: string;
  day:
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";
  start_time: string; // "09:00" format
  end_time: string; // "11:00" format
  created_at: string;
}

export interface Deadline {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  unit_code: string;
  unit_id?: string;
  due_date: string; // ISO string
  priority: "Low" | "Medium" | "High" | "Urgent";
  type: "Assignment" | "Exam" | "Quiz" | "Presentation";
  completed: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Event {
  id: string;
  user_id?: string; // null for public events
  title: string;
  description: string;
  start_at: string; // ISO string
  end_at?: string; // ISO string
  all_day: boolean;
  location: string;
  building?: string;
  category: "Career" | "Social" | "Academic" | "Free Food";
  image_url?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// Gamification types
export interface GamificationProfile {
  id: string;
  user_id: string;
  xp: number;
  streak_days: number;
  longest_streak: number;
  last_activity_date?: string; // ISO date string
  created_at: string;
  updated_at: string;
}

export interface XPEvent {
  id: string;
  user_id: string;
  event_type:
    | "deadline_completed"
    | "deadline_early"
    | "daily_login"
    | "streak_bonus"
    | "unit_added"
    | "event_attended"
    | "profile_completed"
    | "first_deadline"
    | "weekly_goal"
    | "level_up_bonus";
  xp_amount: number;
  reference_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  xp: number;
  streak_days: number;
  level: number;
  rank: number;
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "deadline" | "event" | "class" | "system";
  read: boolean;
  link?: string;
  related_id?: string;
  created_at: string;
  deleted_at?: string;
}

// Request types for different operations
export interface CreateUnitRequest {
  code: string;
  name: string;
  color?: string;
  description?: string;
  location?: {
    building: string;
    room: string;
  };
}

export interface UpdateUnitRequest {
  code?: string;
  name?: string;
  color?: string;
  description?: string;
  location?: {
    building: string;
    room: string;
  };
}

export interface CreateDeadlineRequest {
  title: string;
  description?: string;
  unit_code: string;
  unit_id?: string;
  due_date: string; // ISO string
  priority?: "Low" | "Medium" | "High" | "Urgent";
  type?: "Assignment" | "Exam" | "Quiz" | "Presentation";
}

export interface UpdateDeadlineRequest {
  title?: string;
  description?: string;
  unit_code?: string;
  unit_id?: string;
  due_date?: string; // ISO string
  priority?: "Low" | "Medium" | "High" | "Urgent";
  type?: "Assignment" | "Exam" | "Quiz" | "Presentation";
  completed?: boolean;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  start_at: string; // ISO string
  end_at?: string; // ISO string
  all_day?: boolean;
  location: string;
  building?: string;
  category?: "Career" | "Social" | "Academic" | "Free Food";
  image_url?: string;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  start_at?: string; // ISO string
  end_at?: string; // ISO string
  all_day?: boolean;
  location?: string;
  building?: string;
  category?: "Career" | "Social" | "Academic" | "Free Food";
  image_url?: string;
}

// Query parameters and pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface FilterParams {
  search?: string;
  category?: string;
  status?: string;
  priority?: string;
  type?: string;
  date_from?: string;
  date_to?: string;
}

export interface SortParams {
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// Combined query parameters
export interface ApiQueryParams
  extends PaginationParams, FilterParams, SortParams {}

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface FormErrorResponse {
  success: false;
  errors: ValidationError[];
  message: string;
}

// Analytics types
export interface DeadlineAnalytics {
  user_id: string;
  total_deadlines: number;
  completed_count: number;
  pending_count: number;
  overdue_count: number;
  next_deadline_date?: string;
}

export interface UserActivitySummary {
  user_id: string;
  last_activity_date?: string;
  streak_days: number;
  longest_streak: number;
  total_actions: number;
  last_action_at?: string;
}

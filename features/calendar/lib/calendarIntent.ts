export type CalendarIntentTarget = 'unit' | 'assignment' | 'exam' | 'event' | 'reminder';

export interface PendingCalendarIntent {
  requestId: string;
  target: CalendarIntentTarget;
  highlight: boolean;
  autoOpenForm: boolean;
  requestedAt: number;
}

export const CALENDAR_WIDGET_IDS: Record<CalendarIntentTarget, string> = {
  unit: 'calendar-widget-unit',
  assignment: 'calendar-widget-assignment',
  exam: 'calendar-widget-exam',
  event: 'calendar-widget-event',
  reminder: 'calendar-widget-reminder',
};

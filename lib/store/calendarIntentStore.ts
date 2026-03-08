import { create } from 'zustand';
import type {
  CalendarIntentTarget,
  PendingCalendarIntent,
} from '@/features/calendar/lib/calendarIntent';

interface QueueCalendarIntentInput {
  target: CalendarIntentTarget;
  highlight?: boolean;
  autoOpenForm?: boolean;
}

interface CalendarIntentState {
  pendingIntent: PendingCalendarIntent | null;
  queueCalendarIntent: (input: QueueCalendarIntentInput) => PendingCalendarIntent;
  clearPendingIntent: (requestId?: string) => void;
}

const createRequestId = () => {
  return `calendar-intent-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const useCalendarIntentStore = create<CalendarIntentState>()((set) => ({
  pendingIntent: null,
  queueCalendarIntent: ({ target, highlight = true, autoOpenForm = true }) => {
    const intent: PendingCalendarIntent = {
      requestId: createRequestId(),
      target,
      highlight,
      autoOpenForm,
      requestedAt: Date.now(),
    };

    set({ pendingIntent: intent });
    return intent;
  },
  clearPendingIntent: (requestId) =>
    set((state) => {
      if (!state.pendingIntent) {
        return state;
      }

      if (requestId && state.pendingIntent.requestId !== requestId) {
        return state;
      }

      return { pendingIntent: null };
    }),
}));

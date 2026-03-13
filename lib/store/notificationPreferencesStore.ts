// lib/store/notificationPreferencesStore.ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  notificationService,
  NotificationPermissionStatus,
} from '@/lib/services/notificationService';
import { useNotificationsStore } from '@/lib/store/notificationsStore';
import { apiRequest } from '@/lib/utils/api';
import { logger } from '@/lib/logger';

export interface NotificationPreferences {
  // Permission status
  permissionStatus: NotificationPermissionStatus;

  // Notification type toggles
  deadlinesEnabled: boolean;
  classesEnabled: boolean;
  eventsEnabled: boolean;

  // Reminder timing (minutes before)
  deadlineReminderTiming: number; // e.g., 1440 = 24 hours, 60 = 1 hour
  classReminderTiming: number; // e.g., 15 = 15 minutes before
  eventReminderTiming: number; // e.g., 60 = 1 hour before

  // Push notifications master toggle
  pushEnabled: boolean;

  // Scheduled reminder IDs (to prevent duplicates)
  scheduledReminders: Record<string, number>; // id -> setTimeout handle

  // Pending reminder metadata for re-scheduling across reloads
  pendingReminders: Record<
    string,
    {
      type: 'deadline' | 'class' | 'event';
      payload: Record<string, string | number>;
      triggerAt: number;
    }
  >;
}

interface NotificationPreferencesState extends NotificationPreferences {
  // Actions
  initialize: () => Promise<void>;
  requestPermission: () => Promise<NotificationPermissionStatus>;
  setDeadlinesEnabled: (enabled: boolean) => void;
  setClassesEnabled: (enabled: boolean) => void;
  setEventsEnabled: (enabled: boolean) => void;
  setPushEnabled: (enabled: boolean) => Promise<boolean>;
  setDeadlineReminderTiming: (minutes: number) => void;
  setClassReminderTiming: (minutes: number) => void;
  setEventReminderTiming: (minutes: number) => void;
  reschedulePending: () => void;
  scheduleDeadlineReminder: (
    deadlineId: string,
    title: string,
    unitCode: string,
    dueDate: Date,
  ) => void;
  scheduleClassReminder: (
    unitCode: string,
    unitName: string,
    building: string,
    room: string,
    classTime: Date,
  ) => void;
  scheduleEventReminder: (
    eventId: string,
    title: string,
    location: string,
    eventTime: Date,
  ) => void;
  cancelReminder: (id: string) => void;
  clearAllReminders: () => void;
  reset: () => void;
}

type ServerNotificationPreferences = {
  push_notifications?: boolean | null;
  deadline_notifications_enabled?: boolean | null;
  class_notifications_enabled?: boolean | null;
  event_notifications_enabled?: boolean | null;
  deadline_reminder_timing_minutes?: number | null;
  class_reminder_timing_minutes?: number | null;
  event_reminder_timing_minutes?: number | null;
};

function isAuthPreferenceError(error: unknown): boolean {
  return (
    error instanceof Error && (error.message.startsWith('401:') || error.message.startsWith('403:'))
  );
}

async function loadServerNotificationPreferences(): Promise<ServerNotificationPreferences | null> {
  try {
    return await apiRequest<ServerNotificationPreferences>('/api/user-preferences', {
      method: 'GET',
      noRetry: true,
    });
  } catch (error) {
    if (!isAuthPreferenceError(error)) {
      logger.warn('Failed to load notification preferences from server', error);
    }
    return null;
  }
}

async function persistServerNotificationPreferences(
  updates: ServerNotificationPreferences,
): Promise<void> {
  try {
    await apiRequest('/api/user-preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
      noRetry: true,
    });
  } catch (error) {
    if (!isAuthPreferenceError(error)) {
      logger.warn('Failed to persist notification preferences to server', error);
    }
  }
}

export const useNotificationPreferencesStore = create<NotificationPreferencesState>()(
  persist(
    (set, get) => ({
      // Default state
      permissionStatus: 'default',
      deadlinesEnabled: true,
      classesEnabled: true,
      eventsEnabled: true,
      deadlineReminderTiming: 1440, // 24 hours
      classReminderTiming: 15, // 15 minutes
      eventReminderTiming: 60, // 1 hour
      pushEnabled: true,
      scheduledReminders: {},
      pendingReminders: {},

      initialize: async () => {
        const status = notificationService.getPermissionStatus();
        const deadlinesEnabled = notificationService.isNotificationTypeEnabled('deadlines');
        const classesEnabled = notificationService.isNotificationTypeEnabled('classes');
        const eventsEnabled = notificationService.isNotificationTypeEnabled('events');

        set({ permissionStatus: status, deadlinesEnabled, classesEnabled, eventsEnabled });

        const serverPreferences = await loadServerNotificationPreferences();
        if (serverPreferences) {
          set((state) => ({
            pushEnabled: serverPreferences.push_notifications ?? state.pushEnabled,
            deadlinesEnabled:
              serverPreferences.deadline_notifications_enabled ?? state.deadlinesEnabled,
            classesEnabled: serverPreferences.class_notifications_enabled ?? state.classesEnabled,
            eventsEnabled: serverPreferences.event_notifications_enabled ?? state.eventsEnabled,
            deadlineReminderTiming:
              serverPreferences.deadline_reminder_timing_minutes ?? state.deadlineReminderTiming,
            classReminderTiming:
              serverPreferences.class_reminder_timing_minutes ?? state.classReminderTiming,
            eventReminderTiming:
              serverPreferences.event_reminder_timing_minutes ?? state.eventReminderTiming,
          }));
        }

        if (status === 'granted' && get().pushEnabled) {
          void notificationService.subscribeToPush();
        }

        // Reschedule any pending reminders that survived persistence
        get().reschedulePending();
      },

      requestPermission: async () => {
        const status = await notificationService.requestPermission();
        set({ permissionStatus: status });
        if (status === 'granted' && get().pushEnabled) {
          void notificationService.subscribeToPush();
        }
        return status;
      },

      setDeadlinesEnabled: (enabled: boolean) => {
        notificationService.setNotificationTypeEnabled('deadlines', enabled);
        set({ deadlinesEnabled: enabled });
        void persistServerNotificationPreferences({
          deadline_notifications_enabled: enabled,
        });
      },

      setClassesEnabled: (enabled: boolean) => {
        notificationService.setNotificationTypeEnabled('classes', enabled);
        set({ classesEnabled: enabled });
        void persistServerNotificationPreferences({
          class_notifications_enabled: enabled,
        });
      },

      setEventsEnabled: (enabled: boolean) => {
        notificationService.setNotificationTypeEnabled('events', enabled);
        set({ eventsEnabled: enabled });
        void persistServerNotificationPreferences({
          event_notifications_enabled: enabled,
        });
      },

      setPushEnabled: async (enabled: boolean) => {
        if (!enabled) {
          await notificationService.unsubscribeFromPush();
          set({ pushEnabled: false });
          get().clearAllReminders();
          void persistServerNotificationPreferences({
            push_notifications: false,
          });
          return true;
        }

        let status = get().permissionStatus;
        if (status !== 'granted') {
          status = await notificationService.requestPermission();
          set({ permissionStatus: status });
        }

        if (status !== 'granted') {
          set({ pushEnabled: false });
          void persistServerNotificationPreferences({
            push_notifications: false,
          });
          return false;
        }

        const subscribed = await notificationService.subscribeToPush();
        if (!subscribed && notificationService.isPushSupported()) {
          logger.warn('Browser granted notifications but push subscription could not be created');
        }

        set({ pushEnabled: true });
        void persistServerNotificationPreferences({
          push_notifications: true,
        });
        get().reschedulePending();
        return subscribed || !notificationService.isPushSupported();
      },

      setDeadlineReminderTiming: (minutes: number) => {
        set({ deadlineReminderTiming: minutes });
        void persistServerNotificationPreferences({
          deadline_reminder_timing_minutes: minutes,
        });
      },

      setClassReminderTiming: (minutes: number) => {
        set({ classReminderTiming: minutes });
        void persistServerNotificationPreferences({
          class_reminder_timing_minutes: minutes,
        });
      },

      setEventReminderTiming: (minutes: number) => {
        set({ eventReminderTiming: minutes });
        void persistServerNotificationPreferences({
          event_reminder_timing_minutes: minutes,
        });
      },

      scheduleDeadlineReminder: (
        deadlineId: string,
        title: string,
        unitCode: string,
        dueDate: Date,
      ) => {
        if (typeof window === 'undefined') return;

        const state = get();
        if (!state.pushEnabled || !state.deadlinesEnabled) return;
        if (state.permissionStatus !== 'granted') return;

        // Cancel existing reminder for this deadline
        if (state.scheduledReminders[deadlineId]) {
          clearTimeout(state.scheduledReminders[deadlineId]);
        }

        const now = new Date();
        const reminderTime = new Date(dueDate.getTime() - state.deadlineReminderTiming * 60 * 1000);
        const delay = reminderTime.getTime() - now.getTime();

        // Only schedule if reminder time is in the future
        if (delay > 0) {
          set((s) => ({
            pendingReminders: {
              ...s.pendingReminders,
              [deadlineId]: {
                type: 'deadline',
                payload: {
                  title,
                  unitCode,
                  dueDate: dueDate.getTime(),
                },
                triggerAt: reminderTime.getTime(),
              },
            },
          }));

          const timeoutId = window.setTimeout(() => {
            notificationService.sendDeadlineReminder(title, unitCode, dueDate, deadlineId);
            // Add to bell icon notification list (persisted to DB)
            try {
              useNotificationsStore.getState().addNotification({
                title: `Deadline Reminder: ${title}`,
                message: `${unitCode} — due ${dueDate.toLocaleDateString()}`,
                type: 'deadline',
                read: false,
                link: '/calendar',
              });
            } catch {
              /* ignore if store unavailable */
            }
            // Remove from scheduled after sending
            set((s) => {
              const { [deadlineId]: _removed, ...rest } = s.scheduledReminders;
              void _removed; // Silence unused variable warning
              return { scheduledReminders: rest };
            });
          }, delay);

          set((s) => ({
            scheduledReminders: {
              ...s.scheduledReminders,
              [deadlineId]: timeoutId,
            },
          }));
        } else if (delay > -state.deadlineReminderTiming * 60 * 1000) {
          // If we're past the reminder time but before the due date, send immediately
          notificationService.sendDeadlineReminder(title, unitCode, dueDate, deadlineId);
          // Add to bell icon notification list
          try {
            useNotificationsStore.getState().addNotification({
              title: `Deadline Reminder: ${title}`,
              message: `${unitCode} — due ${dueDate.toLocaleDateString()}`,
              type: 'deadline',
              read: false,
              link: '/calendar',
            });
          } catch {
            /* ignore if store unavailable */
          }
          set((s) => {
            const { [deadlineId]: _removed, ...rest } = s.pendingReminders;
            void _removed;
            return { pendingReminders: rest };
          });
        }
      },

      scheduleClassReminder: (
        unitCode: string,
        unitName: string,
        building: string,
        room: string,
        classTime: Date,
      ) => {
        if (typeof window === 'undefined') return;

        const state = get();
        if (!state.pushEnabled || !state.classesEnabled) return;
        if (state.permissionStatus !== 'granted') return;

        const reminderId = `class-${unitCode}-${classTime.getTime()}`;

        // Cancel existing reminder
        if (state.scheduledReminders[reminderId]) {
          clearTimeout(state.scheduledReminders[reminderId]);
        }

        const now = new Date();
        const reminderTime = new Date(classTime.getTime() - state.classReminderTiming * 60 * 1000);
        const delay = reminderTime.getTime() - now.getTime();

        if (delay > 0) {
          set((s) => ({
            pendingReminders: {
              ...s.pendingReminders,
              [reminderId]: {
                type: 'class',
                payload: {
                  unitCode,
                  unitName,
                  building,
                  room,
                  classTime: classTime.getTime(),
                },
                triggerAt: reminderTime.getTime(),
              },
            },
          }));

          const timeoutId = window.setTimeout(() => {
            const timeStr = classTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            notificationService.sendClassReminder(unitCode, unitName, building, room, timeStr);
            // Add to bell icon notification list (persisted to DB)
            try {
              useNotificationsStore.getState().addNotification({
                title: `Class Reminder: ${unitCode}`,
                message: `${unitName} at ${timeStr} in ${building} ${room}`,
                type: 'class',
                read: false,
                link: '/calendar',
              });
            } catch {
              /* ignore if store unavailable */
            }
            set((s) => {
              const { [reminderId]: _removed, ...rest } = s.scheduledReminders;
              void _removed; // Silence unused variable warning
              return {
                scheduledReminders: rest,
                pendingReminders: Object.fromEntries(
                  Object.entries(s.pendingReminders).filter(([key]) => key !== reminderId),
                ),
              };
            });
          }, delay);

          set((s) => ({
            scheduledReminders: {
              ...s.scheduledReminders,
              [reminderId]: timeoutId,
            },
          }));
        }
      },

      scheduleEventReminder: (
        eventId: string,
        title: string,
        location: string,
        eventTime: Date,
      ) => {
        if (typeof window === 'undefined') return;

        const state = get();
        if (!state.pushEnabled || !state.eventsEnabled) return;
        if (state.permissionStatus !== 'granted') return;

        // Cancel existing reminder
        if (state.scheduledReminders[eventId]) {
          clearTimeout(state.scheduledReminders[eventId]);
        }

        const now = new Date();
        const reminderTime = new Date(eventTime.getTime() - state.eventReminderTiming * 60 * 1000);
        const delay = reminderTime.getTime() - now.getTime();

        if (delay > 0) {
          set((s) => ({
            pendingReminders: {
              ...s.pendingReminders,
              [eventId]: {
                type: 'event',
                payload: {
                  title,
                  location,
                  eventTime: eventTime.getTime(),
                },
                triggerAt: reminderTime.getTime(),
              },
            },
          }));

          const timeoutId = window.setTimeout(() => {
            const timeStr = eventTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            notificationService.sendEventReminder(title, location, timeStr, eventId);
            // Add to bell icon notification list (persisted to DB)
            try {
              useNotificationsStore.getState().addNotification({
                title: `Event Reminder: ${title}`,
                message: `${title} at ${timeStr}${location ? ` — ${location}` : ''}`,
                type: 'event',
                read: false,
                link: '/calendar',
              });
            } catch {
              /* ignore if store unavailable */
            }
            set((s) => {
              const { [eventId]: _removed, ...rest } = s.scheduledReminders;
              void _removed; // Silence unused variable warning
              return {
                scheduledReminders: rest,
                pendingReminders: Object.fromEntries(
                  Object.entries(s.pendingReminders).filter(([key]) => key !== eventId),
                ),
              };
            });
          }, delay);

          set((s) => ({
            scheduledReminders: {
              ...s.scheduledReminders,
              [eventId]: timeoutId,
            },
          }));
        }
      },

      cancelReminder: (id: string) => {
        const state = get();
        if (state.scheduledReminders[id]) {
          clearTimeout(state.scheduledReminders[id]);
          set((s) => {
            const { [id]: _removed, ...rest } = s.scheduledReminders;
            void _removed; // Silence unused variable warning
            const { [id]: _removedPending, ...restPending } = s.pendingReminders;
            void _removedPending;
            return {
              scheduledReminders: rest,
              pendingReminders: restPending,
            };
          });
        }
      },

      clearAllReminders: () => {
        Object.values(get().scheduledReminders).forEach((id) => {
          if (typeof window !== 'undefined') clearTimeout(id);
        });
        set({ scheduledReminders: {}, pendingReminders: {} });
      },

      reschedulePending: () => {
        if (typeof window === 'undefined') return;

        const state = get();
        if (!state.pushEnabled || state.permissionStatus !== 'granted') return;

        const now = Date.now();
        Object.entries(state.pendingReminders).forEach(([id, reminder]) => {
          const delay = reminder.triggerAt - now;
          if (delay <= 0) {
            // Skip expired reminders
            set((s) => {
              const { [id]: _removed, ...rest } = s.pendingReminders;
              void _removed;
              return { pendingReminders: rest };
            });
            return;
          }

          if (state.scheduledReminders[id]) {
            clearTimeout(state.scheduledReminders[id]);
          }

          const timeoutId = window.setTimeout(() => {
            if (reminder.type === 'deadline') {
              notificationService.sendDeadlineReminder(
                reminder.payload.title as string,
                reminder.payload.unitCode as string,
                new Date(reminder.payload.dueDate as number),
                id,
              );
              try {
                useNotificationsStore.getState().addNotification({
                  title: `Deadline Reminder: ${reminder.payload.title as string}`,
                  message: `${reminder.payload.unitCode as string} — due ${new Date(reminder.payload.dueDate as number).toLocaleDateString()}`,
                  type: 'deadline',
                  read: false,
                  link: '/calendar',
                });
              } catch {
                /* ignore */
              }
            } else if (reminder.type === 'class') {
              const classTime = new Date(reminder.payload.classTime as number);
              const timeStr = classTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              notificationService.sendClassReminder(
                reminder.payload.unitCode as string,
                reminder.payload.unitName as string,
                reminder.payload.building as string,
                reminder.payload.room as string,
                timeStr,
              );
              try {
                useNotificationsStore.getState().addNotification({
                  title: `Class Reminder: ${reminder.payload.unitCode as string}`,
                  message: `${reminder.payload.unitName as string} at ${timeStr} in ${reminder.payload.building as string} ${reminder.payload.room as string}`,
                  type: 'class',
                  read: false,
                  link: '/calendar',
                });
              } catch {
                /* ignore */
              }
            } else if (reminder.type === 'event') {
              const eventTime = new Date(reminder.payload.eventTime as number);
              const timeStr = eventTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              notificationService.sendEventReminder(
                reminder.payload.title as string,
                reminder.payload.location as string,
                timeStr,
                id,
              );
              try {
                useNotificationsStore.getState().addNotification({
                  title: `Event Reminder: ${reminder.payload.title as string}`,
                  message: `${reminder.payload.title as string} at ${timeStr}${reminder.payload.location ? ` — ${reminder.payload.location as string}` : ''}`,
                  type: 'event',
                  read: false,
                  link: '/calendar',
                });
              } catch {
                /* ignore */
              }
            }

            set((s) => {
              const { [id]: _removed, ...rest } = s.pendingReminders;
              void _removed;
              const { [id]: _timeout, ...restTimeouts } = s.scheduledReminders;
              void _timeout;
              return {
                pendingReminders: rest,
                scheduledReminders: restTimeouts,
              };
            });
          }, delay);

          set((s) => ({
            scheduledReminders: { ...s.scheduledReminders, [id]: timeoutId },
          }));
        });
      },

      reset: () => {
        // Clear timeouts first
        Object.values(get().scheduledReminders).forEach((id) => {
          if (typeof window !== 'undefined') clearTimeout(id);
        });

        set({
          permissionStatus: 'default',
          deadlinesEnabled: true,
          classesEnabled: true,
          eventsEnabled: true,
          deadlineReminderTiming: 1440,
          classReminderTiming: 15,
          eventReminderTiming: 60,
          pushEnabled: true,
          scheduledReminders: {},
          pendingReminders: {},
        });
      },
    }),
    {
      name: 'notification-prefs',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        deadlinesEnabled: state.deadlinesEnabled,
        classesEnabled: state.classesEnabled,
        eventsEnabled: state.eventsEnabled,
        deadlineReminderTiming: state.deadlineReminderTiming,
        classReminderTiming: state.classReminderTiming,
        eventReminderTiming: state.eventReminderTiming,
        pushEnabled: state.pushEnabled,
        pendingReminders: state.pendingReminders,
      }),
    },
  ),
);

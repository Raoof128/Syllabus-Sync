// lib/hooks/useReminderChecker.ts
'use client';

import { useEffect, useRef } from 'react';
import {
  useRemindersStore,
  calculateReminderDate,
  type ReminderItemType,
} from '@/lib/store/remindersStore';
import { notificationService } from '@/lib/services/notificationService';
import { useNotificationPreferencesStore } from '@/lib/store/notificationPreferencesStore';
import { useNotificationsStore } from '@/lib/store/notificationsStore';
import { toastUtils } from '@/lib/utils/toast';
import type { Notification } from '@/lib/types';

const CHECK_INTERVAL_MS = 15_000; // Check every 15 seconds for faster detection

// Accept reminders that are up to 24 hours late (handles background tabs, sleep, etc.)
const MAX_LATE_MS = 24 * 60 * 60 * 1000;

/** Map reminder item type to notification type */
function mapItemTypeToNotificationType(itemType: ReminderItemType): Notification['type'] {
  switch (itemType) {
    case 'unit':
      return 'class';
    case 'exam':
    case 'assignment':
    case 'todo':
      return 'deadline';
    case 'event':
      return 'event';
    default:
      return 'system';
  }
}

/**
 * Fire a reminder: add to bell icon list FIRST, then send browser notification.
 * Bell notification is prioritised because it's the most reliable channel.
 * A toast is also shown as a visible fallback in case the bell badge isn't noticed.
 */
function fireReminder(reminder: { id: string; itemTitle: string; itemType: ReminderItemType }) {
  const title = `Reminder: ${reminder.itemTitle}`;
  const body = `Your reminder for "${reminder.itemTitle}" is now`;

  // 1. BELL — always add to bell icon notification list (persisted to DB).
  //    This runs first so the bell badge updates even if the browser
  //    notification throws or is blocked.
  try {
    useNotificationsStore.getState().addNotification({
      title,
      message: body,
      type: mapItemTypeToNotificationType(reminder.itemType),
      read: false,
      link: '/calendar',
      relatedId: undefined,
    });
  } catch {
    /* store unavailable — continue to toast fallback */
  }

  // 2. TOAST — always show an in-app toast so the user sees the reminder
  //    even if they don't notice the bell badge change.
  try {
    toastUtils.info(title, body);
  } catch {
    /* toast unavailable */
  }

  // 3. BROWSER NOTIFICATION — attempt if permission is granted.
  //    The user explicitly set this reminder, so honour it even when the
  //    global "push" toggle is off (push controls server-sent pushes).
  try {
    const { permissionStatus } = useNotificationPreferencesStore.getState();
    if (permissionStatus === 'granted') {
      notificationService.sendNotification({
        title,
        body,
        tag: `reminder-${reminder.id}`,
        data: { type: 'reminder', id: reminder.id },
        onClick: () => {
          window.location.href = '/calendar';
        },
      });
    }
  } catch {
    /* browser notification failed — bell + toast already handled */
  }
}

/**
 * Hook that periodically checks pending reminders and fires browser notifications.
 * Should be mounted once at the app level (e.g., in ClientLayout).
 */
export function useReminderChecker() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const checkReminders = () => {
      const { reminders, markAsNotified } = useRemindersStore.getState();

      const now = new Date();

      reminders.forEach((reminder) => {
        // Skip disabled or already-notified reminders
        if (!reminder.enabled || reminder.notifiedAt) return;

        let triggerDate: Date | null = null;

        if (reminder.timing === 'custom') {
          // Custom timing: use stored custom date/time
          if (reminder.customDate) {
            const [year, month, day] = reminder.customDate.split('-').map(Number);
            if (reminder.customTime) {
              const [hours, minutes] = reminder.customTime.split(':').map(Number);
              triggerDate = new Date(year, month - 1, day, hours, minutes);
            } else {
              triggerDate = new Date(year, month - 1, day, 9, 0);
            }
          }
        } else if (reminder.itemDate) {
          // Preset timing: calculate from item date
          const itemDate = new Date(reminder.itemDate);
          triggerDate = calculateReminderDate(itemDate, reminder.timing);
        }

        if (!triggerDate) return;

        const timeDiff = now.getTime() - triggerDate.getTime();

        if (timeDiff >= 0 && timeDiff < MAX_LATE_MS) {
          // Trigger time has passed but within the grace window — fire now.
          // This covers background-tab throttling, device sleep, page reloads.
          fireReminder(reminder);
          markAsNotified(reminder.id);
        } else if (timeDiff >= MAX_LATE_MS) {
          // Trigger time was more than 24 hours ago — silently expire
          markAsNotified(reminder.id);
        }
        // timeDiff < 0 means trigger is still in the future — do nothing yet
      });
    };

    // Run immediately on mount
    checkReminders();

    // Set up interval
    intervalRef.current = setInterval(checkReminders, CHECK_INTERVAL_MS);

    // Also check when the tab regains focus (handles sleep / background suspension)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkReminders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}

export default useReminderChecker;

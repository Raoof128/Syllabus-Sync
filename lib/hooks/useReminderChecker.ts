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
import type { Notification } from '@/lib/types';

const CHECK_INTERVAL_MS = 30_000; // Check every 30 seconds

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
 * Hook that periodically checks pending reminders and fires browser notifications.
 * Should be mounted once at the app level (e.g., in ClientLayout).
 */
export function useReminderChecker() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const checkReminders = () => {
      const { reminders, markAsNotified } = useRemindersStore.getState();
      const { permissionStatus, pushEnabled } = useNotificationPreferencesStore.getState();

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

        // Fire if trigger time has passed (within last 5 minutes to avoid missing)
        const timeDiff = now.getTime() - triggerDate.getTime();
        if (timeDiff >= 0 && timeDiff < 5 * 60 * 1000) {
          const title = `Reminder: ${reminder.itemTitle}`;
          const body = `Your reminder for "${reminder.itemTitle}" is now`;

          // Send browser push notification (only if permission granted)
          if (permissionStatus === 'granted' && pushEnabled) {
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

          // Always add to bell icon notification list (persisted to DB)
          useNotificationsStore.getState().addNotification({
            title,
            message: body,
            type: mapItemTypeToNotificationType(reminder.itemType),
            read: false,
            link: '/calendar',
            relatedId: undefined,
          });

          // Mark as notified so it won't fire again
          markAsNotified(reminder.id);
        } else if (timeDiff >= 5 * 60 * 1000) {
          // Trigger time was more than 5 minutes ago - mark as notified to clean up
          markAsNotified(reminder.id);
        }
      });
    };

    // Run immediately on mount
    checkReminders();

    // Set up interval
    intervalRef.current = setInterval(checkReminders, CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}

export default useReminderChecker;

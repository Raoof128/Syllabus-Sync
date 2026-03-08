// lib/hooks/useReminderChecker.ts
'use client';

import { useEffect, useRef } from 'react';
import { useRemindersStore, calculateReminderDate } from '@/lib/store/remindersStore';
import { notificationService } from '@/lib/services/notificationService';
import { useNotificationPreferencesStore } from '@/lib/store/notificationPreferencesStore';

const CHECK_INTERVAL_MS = 30_000; // Check every 30 seconds

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

      // Don't check if notifications aren't enabled
      if (permissionStatus !== 'granted' || !pushEnabled) return;

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
          // Send browser notification
          notificationService.sendNotification({
            title: `Reminder: ${reminder.itemTitle}`,
            body: `Your reminder for "${reminder.itemTitle}" is now`,
            tag: `reminder-${reminder.id}`,
            data: { type: 'reminder', id: reminder.id },
            onClick: () => {
              window.location.href = '/calendar';
            },
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

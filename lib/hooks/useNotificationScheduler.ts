// lib/hooks/useNotificationScheduler.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useNotificationPreferencesStore } from '@/lib/store/notificationPreferencesStore';

/**
 * Hook that automatically schedules notifications for upcoming deadlines and classes
 * Should be used once at the app level (e.g., in ClientLayout)
 */
export function useNotificationScheduler() {
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const units = useUnitsStore((state) => state.units);

  // Use individual selectors to prevent infinite re-renders
  const permissionStatus = useNotificationPreferencesStore((state) => state.permissionStatus);
  const pushEnabled = useNotificationPreferencesStore((state) => state.pushEnabled);
  const deadlinesEnabled = useNotificationPreferencesStore((state) => state.deadlinesEnabled);
  const classesEnabled = useNotificationPreferencesStore((state) => state.classesEnabled);
  const scheduleDeadlineReminder = useNotificationPreferencesStore(
    (state) => state.scheduleDeadlineReminder,
  );
  const scheduleClassReminder = useNotificationPreferencesStore(
    (state) => state.scheduleClassReminder,
  );
  const clearAllReminders = useNotificationPreferencesStore((state) => state.clearAllReminders);
  const deadlineReminderTiming = useNotificationPreferencesStore(
    (state) => state.deadlineReminderTiming,
  );
  const classReminderTiming = useNotificationPreferencesStore((state) => state.classReminderTiming);

  // Track if we've initialized to avoid re-scheduling on every render
  const initializedRef = useRef(false);
  const lastDeadlinesRef = useRef<string>('');
  const lastUnitsRef = useRef<string>('');
  const clearAllRemindersRef = useRef(clearAllReminders);

  // Keep ref updated with latest function
  useEffect(() => {
    clearAllRemindersRef.current = clearAllReminders;
  }, [clearAllReminders]);

  // Memoize the schedule function to prevent dependency array changes
  const scheduleDeadlines = useCallback(() => {
    if (permissionStatus !== 'granted' || !pushEnabled || !deadlinesEnabled) {
      return;
    }

    // Create a signature of current deadlines and timing to detect changes
    const deadlinesSignature = JSON.stringify({
      deadlines: deadlines.map((d) => ({
        id: d.id,
        dueDate: d.dueDate,
        completed: d.completed,
      })),
      timing: deadlineReminderTiming,
    });

    // Skip if deadlines and timing haven't changed
    if (deadlinesSignature === lastDeadlinesRef.current) {
      return;
    }
    lastDeadlinesRef.current = deadlinesSignature;

    // Schedule reminders for upcoming incomplete deadlines
    // Note: scheduleDeadlineReminder already cancels existing reminders for each deadline
    const now = new Date();
    deadlines.forEach((deadline) => {
      if (deadline.completed) return;

      const dueDate = new Date(deadline.dueDate);
      if (dueDate <= now) return; // Skip past deadlines

      scheduleDeadlineReminder(deadline.id, deadline.title, deadline.unitCode, dueDate);
    });
  }, [
    deadlines,
    permissionStatus,
    pushEnabled,
    deadlinesEnabled,
    scheduleDeadlineReminder,
    deadlineReminderTiming,
  ]);

  // Schedule deadline reminders when deadlines or timing changes
  useEffect(() => {
    scheduleDeadlines();
  }, [scheduleDeadlines]);

  // Memoize the schedule function to prevent dependency array changes
  const scheduleClasses = useCallback(() => {
    if (permissionStatus !== 'granted' || !pushEnabled || !classesEnabled) {
      return;
    }

    // Create a signature of current units and timing to detect changes
    const unitsSignature = JSON.stringify({
      units: units.map((u) => ({ code: u.code, schedule: u.schedule })),
      timing: classReminderTiming,
    });

    // Skip if units and timing haven't changed
    if (unitsSignature === lastUnitsRef.current) {
      return;
    }
    lastUnitsRef.current = unitsSignature;

    // Schedule reminders for upcoming classes (next 7 days)
    const now = new Date();
    const daysOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    // Schedule for today and next 6 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + dayOffset);
      targetDate.setHours(0, 0, 0, 0);

      const dayOfWeek = daysOfWeek[targetDate.getDay()];

      units.forEach((unit) => {
        unit.schedule.forEach((classTime) => {
          if (classTime.day !== dayOfWeek) return;

          // Parse the start time
          const [hours, minutes] = classTime.startTime.split(':').map(Number);
          const classDateTime = new Date(targetDate);
          classDateTime.setHours(hours, minutes, 0, 0);

          // Only schedule if class is in the future
          if (classDateTime <= now) return;

          scheduleClassReminder(
            unit.code,
            unit.name,
            unit.location.building,
            unit.location.room,
            classDateTime,
          );
        });
      });
    }
  }, [
    units,
    permissionStatus,
    pushEnabled,
    classesEnabled,
    scheduleClassReminder,
    classReminderTiming,
  ]);

  // Schedule class reminders when units or timing changes
  useEffect(() => {
    scheduleClasses();
  }, [scheduleClasses]);

  // Memoize clear function to prevent dependency array changes
  const handleClearReminders = useCallback(() => {
    if (!pushEnabled || permissionStatus !== 'granted') {
      clearAllReminders();
    }
  }, [pushEnabled, permissionStatus, clearAllReminders]);

  // Clear reminders when notifications are disabled
  useEffect(() => {
    handleClearReminders();
  }, [handleClearReminders]);

  // Initialize on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      useNotificationPreferencesStore.getState().initialize();
    }
  }, []);

  // Cleanup on unmount - clear all scheduled reminders
  useEffect(() => {
    return () => {
      clearAllRemindersRef.current();
    };
  }, []);
}

export default useNotificationScheduler;

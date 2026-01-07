// lib/hooks/useNotificationScheduler.ts
'use client';

import { useEffect, useRef } from 'react';
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

  const {
    permissionStatus,
    pushEnabled,
    deadlinesEnabled,
    classesEnabled,
    scheduleDeadlineReminder,
    scheduleClassReminder,
    clearAllReminders,
  } = useNotificationPreferencesStore();

  // Track if we've initialized to avoid re-scheduling on every render
  const initializedRef = useRef(false);
  const lastDeadlinesRef = useRef<string>('');
  const lastUnitsRef = useRef<string>('');

  // Schedule deadline reminders when deadlines change
  useEffect(() => {
    if (permissionStatus !== 'granted' || !pushEnabled || !deadlinesEnabled) {
      return;
    }

    // Create a signature of current deadlines to detect changes
    const deadlinesSignature = JSON.stringify(
      deadlines.map((d) => ({ id: d.id, dueDate: d.dueDate, completed: d.completed })),
    );

    // Skip if deadlines haven't changed
    if (deadlinesSignature === lastDeadlinesRef.current) {
      return;
    }
    lastDeadlinesRef.current = deadlinesSignature;

    // Schedule reminders for upcoming incomplete deadlines
    const now = new Date();
    deadlines.forEach((deadline) => {
      if (deadline.completed) return;

      const dueDate = new Date(deadline.dueDate);
      if (dueDate <= now) return; // Skip past deadlines

      scheduleDeadlineReminder(deadline.id, deadline.title, deadline.unitCode, dueDate);
    });
  }, [deadlines, permissionStatus, pushEnabled, deadlinesEnabled, scheduleDeadlineReminder]);

  // Schedule class reminders when units change
  useEffect(() => {
    if (permissionStatus !== 'granted' || !pushEnabled || !classesEnabled) {
      return;
    }

    // Create a signature of current units to detect changes
    const unitsSignature = JSON.stringify(
      units.map((u) => ({ code: u.code, schedule: u.schedule })),
    );

    // Skip if units haven't changed
    if (unitsSignature === lastUnitsRef.current) {
      return;
    }
    lastUnitsRef.current = unitsSignature;

    // Schedule reminders for today's classes
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

    units.forEach((unit) => {
      unit.schedule.forEach((classTime) => {
        if (classTime.day !== dayOfWeek) return;

        // Parse the start time
        const [hours, minutes] = classTime.startTime.split(':').map(Number);
        const classDateTime = new Date(now);
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
  }, [units, permissionStatus, pushEnabled, classesEnabled, scheduleClassReminder]);

  // Clear reminders when notifications are disabled
  useEffect(() => {
    if (!pushEnabled || permissionStatus !== 'granted') {
      clearAllReminders();
    }
  }, [pushEnabled, permissionStatus, clearAllReminders]);

  // Initialize on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      useNotificationPreferencesStore.getState().initialize();
    }
  }, []);
}

export default useNotificationScheduler;

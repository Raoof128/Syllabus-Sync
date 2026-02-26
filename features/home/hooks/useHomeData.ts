import { useEffect, useMemo, useRef } from 'react';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useTodosStore } from '@/lib/store/todosStore';
import { useEventsStore } from '@/lib/store/eventsStore';
import { useHydration } from '@/lib/hooks';
import { createBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export function useHomeData() {
  const hasHydrated = useHydration();
  const initialLoadDone = useRef(false);

  const units = useUnitsStore((state) => state.units);
  const forceRefreshUnits = useUnitsStore((state) => state.forceRefresh);

  const forceRefreshDeadlines = useDeadlinesStore((state) => state.forceRefresh);
  const forceRefreshTodos = useTodosStore((state) => state.forceRefresh);
  const forceRefreshEvents = useEventsStore((state) => state.forceRefresh);

  // Load data from database on mount
  useEffect(() => {
    if (hasHydrated && !initialLoadDone.current) {
      initialLoadDone.current = true;
      // Use forceRefresh on first load to ensure fresh data
      forceRefreshUnits();
      forceRefreshDeadlines();
      forceRefreshTodos();
      forceRefreshEvents();
    }
  }, [hasHydrated, forceRefreshUnits, forceRefreshDeadlines, forceRefreshTodos, forceRefreshEvents]);

  // Listen for auth state changes and refresh data on sign-in
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_IN') {
        // Force refresh all data after sign-in
        forceRefreshUnits();
        forceRefreshDeadlines();
        forceRefreshTodos();
        forceRefreshEvents();
      }
    });

    return () => subscription.unsubscribe();
  }, [forceRefreshUnits, forceRefreshDeadlines, forceRefreshTodos, forceRefreshEvents]);

  const hasUnits = units.length > 0;

  // Memoized unit stats calculation for better performance
  const unitStats = useMemo(() => {
    try {
      const totalClasses = units.reduce((acc, u) => acc + (u.schedule?.length || 0), 0);
      const totalStudyHours = units.reduce((acc, u) => {
        if (!u.schedule) return acc;
        return (
          acc +
          u.schedule.reduce((hours, s) => {
            try {
              const [startH, startM] = s.startTime.split(':').map(Number);
              const [endH, endM] = s.endTime.split(':').map(Number);

              // Validate time values
              if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
                return hours;
              }

              // Ensure valid time ranges
              if (startH < 0 || startH > 23 || endH < 0 || endH > 23) {
                return hours;
              }

              return hours + Math.max(0, endH - startH + (endM - startM) / 60);
            } catch {
              return hours;
            }
          }, 0)
        );
      }, 0);

      return {
        unitCount: units.length,
        totalClasses,
        studyHours: Math.max(0, Math.round(totalStudyHours)),
      };
    } catch {
      return {
        unitCount: units.length,
        totalClasses: 0,
        studyHours: 0,
      };
    }
  }, [units]);

  return {
    units,
    hasUnits,
    unitStats,
  };
}

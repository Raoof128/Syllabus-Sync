import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { CalendarView } from '@/lib/types';
import { START_HOUR, HOUR_HEIGHT } from '@/lib/calendar-utils';

dayjs.extend(isoWeek);

/** Per-view navigation state so each view remembers its own position. */
interface ViewNavState {
  weekStart: Date;
  dayIndex: number; // 0–6, index into the week (used primarily by Day view)
}

function getInitialWeekStart(): Date {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    if (dateParam) {
      const parsed = dayjs(dateParam);
      if (parsed.isValid()) {
        return parsed.startOf('isoWeek').toDate();
      }
    }
  }
  return dayjs().startOf('isoWeek').toDate();
}

function getInitialDayIndex(): number {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    if (dateParam) {
      const parsed = dayjs(dateParam);
      if (parsed.isValid()) {
        const weekStart = parsed.startOf('isoWeek');
        return parsed.diff(weekStart, 'day');
      }
    }
  }
  const today = dayjs();
  const weekStart = dayjs().startOf('isoWeek');
  return today.diff(weekStart, 'day');
}

function buildInitialNavState(): ViewNavState {
  return { weekStart: getInitialWeekStart(), dayIndex: getInitialDayIndex() };
}

export function useCalendarView() {
  const searchParams = useSearchParams();

  // URL Date
  const urlDate = useMemo(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const parsed = dayjs(dateParam);
      if (parsed.isValid()) {
        return parsed;
      }
    }
    return null;
  }, [searchParams]);

  // URL View
  const urlView = useMemo(() => {
    const viewParam = searchParams.get('view');
    if (viewParam && ['day', 'week', 'agenda'].includes(viewParam)) {
      return viewParam as CalendarView;
    }
    return null;
  }, [searchParams]);

  // View State - default to 'day' view, but can be initialized from URL
  const [view, setView] = useState<CalendarView>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (viewParam && ['day', 'week', 'agenda'].includes(viewParam)) {
        return viewParam as CalendarView;
      }
    }
    return 'day';
  });

  // ── Per-view independent navigation state ──────────────────────────
  const [dayNav, setDayNav] = useState<ViewNavState>(buildInitialNavState);
  const [weekNav, setWeekNav] = useState<ViewNavState>(buildInitialNavState);
  const [agendaNav, setAgendaNav] = useState<ViewNavState>(buildInitialNavState);

  // Helper: get the nav state & setter for the currently active view
  const navFor = useCallback(
    (v: CalendarView): [ViewNavState, React.Dispatch<React.SetStateAction<ViewNavState>>] => {
      switch (v) {
        case 'day':
          return [dayNav, setDayNav];
        case 'week':
          return [weekNav, setWeekNav];
        case 'agenda':
          return [agendaNav, setAgendaNav];
      }
    },
    [dayNav, weekNav, agendaNav],
  );

  // Active view's state (exposed to consumers)
  const [activeNav, setActiveNav] = navFor(view);
  const currentWeekStart = activeNav.weekStart;
  const mobileSelectedDayIndex = activeNav.dayIndex;

  // Setters that only touch the active view
  const setCurrentWeekStart = useCallback(
    (d: Date) => setActiveNav((prev) => ({ ...prev, weekStart: d })),
    [setActiveNav],
  );
  const setMobileSelectedDayIndex = useCallback(
    (idx: number | ((prev: number) => number)) =>
      setActiveNav((prev) => ({
        ...prev,
        dayIndex: typeof idx === 'function' ? idx(prev.dayIndex) : idx,
      })),
    [setActiveNav],
  );

  // Effect: Update from URL Date — applies to the currently active view only
  useEffect(() => {
    if (urlDate) {
      const newWeekStart = urlDate.startOf('isoWeek').toDate();
      const dayIndex = urlDate.diff(urlDate.startOf('isoWeek'), 'day');
      setActiveNav((prev) => ({ ...prev, weekStart: newWeekStart, dayIndex }));

      const clearTimer = setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('date');
        window.history.replaceState({}, '', url.toString());
      }, 1000);

      return () => clearTimeout(clearTimer);
    }
  }, [urlDate, setActiveNav]);

  // Effect: Sync view from URL and clean up the param
  useEffect(() => {
    if (urlView) {
      const clearTimer = setTimeout(() => {
        setView(urlView);
        const url = new URL(window.location.href);
        url.searchParams.delete('view');
        window.history.replaceState({}, '', url.toString());
      }, 0);

      return () => clearTimeout(clearTimer);
    }
  }, [urlView]);

  // Derived: Week Days (from active view)
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => dayjs(currentWeekStart).add(index, 'day').toDate()),
    [currentWeekStart],
  );

  // Derived: Mobile Selected Day
  const mobileSelectedDay = weekDays[mobileSelectedDayIndex] || weekDays[0];

  // Check if currently viewing current week
  const isCurrentWeek = useMemo(() => {
    const today = dayjs();
    const currentWeekStartDay = dayjs(currentWeekStart);
    return today.startOf('isoWeek').isSame(currentWeekStartDay, 'day');
  }, [currentWeekStart]);

  // Check if currently viewing today (for day view)
  const isToday = useMemo(() => {
    const today = dayjs();
    const selectedDay = weekDays[mobileSelectedDayIndex];
    return selectedDay ? dayjs(selectedDay).isSame(today, 'day') : false;
  }, [weekDays, mobileSelectedDayIndex]);

  // Navigation Handlers — always affect only the active view's state
  const goToPreviousWeek = useCallback(
    () => setCurrentWeekStart(dayjs(currentWeekStart).subtract(1, 'week').toDate()),
    [currentWeekStart, setCurrentWeekStart],
  );
  const goToNextWeek = useCallback(
    () => setCurrentWeekStart(dayjs(currentWeekStart).add(1, 'week').toDate()),
    [currentWeekStart, setCurrentWeekStart],
  );

  // Go to today (for day view - navigates to today's date)
  const goToToday = useCallback(() => {
    const today = dayjs();
    const weekStart = today.startOf('isoWeek');
    setActiveNav((prev) => ({
      ...prev,
      weekStart: weekStart.toDate(),
      dayIndex: today.diff(weekStart, 'day'),
    }));
  }, [setActiveNav]);

  // Go to this week (for week/agenda views - navigates to current week)
  const goToThisWeek = useCallback(() => {
    const today = dayjs();
    const weekStart = today.startOf('isoWeek');
    setActiveNav((prev) => ({
      ...prev,
      weekStart: weekStart.toDate(),
      dayIndex: today.diff(weekStart, 'day'),
    }));
  }, [setActiveNav]);

  const goToPreviousDay = useCallback(() => {
    setActiveNav((prev) => {
      if (prev.dayIndex > 0) {
        return { ...prev, dayIndex: prev.dayIndex - 1 };
      }
      return {
        weekStart: dayjs(prev.weekStart).subtract(1, 'week').toDate(),
        dayIndex: 6,
      };
    });
  }, [setActiveNav]);

  const goToNextDay = useCallback(() => {
    setActiveNav((prev) => {
      if (prev.dayIndex < 6) {
        return { ...prev, dayIndex: prev.dayIndex + 1 };
      }
      return {
        weekStart: dayjs(prev.weekStart).add(1, 'week').toDate(),
        dayIndex: 0,
      };
    });
  }, [setActiveNav]);

  const handleDateChange = useCallback(
    (date: Date) => {
      setCurrentWeekStart(dayjs(date).startOf('isoWeek').toDate());
    },
    [setCurrentWeekStart],
  );

  const handleViewChange = useCallback((newView: CalendarView) => {
    setView(newView);
    const url = new URL(window.location.href);
    url.searchParams.set('view', newView);
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Keyboard Navigation — context-aware per active view
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]');

      if (isInputField) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (view === 'day') {
          goToPreviousDay();
        } else {
          goToPreviousWeek();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (view === 'day') {
          goToNextDay();
        } else {
          goToNextWeek();
        }
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        if (view === 'day') {
          goToToday();
        } else {
          goToThisWeek();
        }
      }
    },
    [view, goToPreviousDay, goToNextDay, goToPreviousWeek, goToNextWeek, goToToday, goToThisWeek],
  );

  // Red Line Position
  const computeCurrentTimePosition = () => {
    const now = dayjs();
    const hours = now.hour();
    const minutes = now.minute();
    if (hours < START_HOUR || hours >= 24) return null;
    return (hours - START_HOUR) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
  };

  const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setCurrentTimePosition(computeCurrentTimePosition());
    update();
    const intervalId = window.setInterval(update, 60_000);
    return () => clearInterval(intervalId);
  }, []);

  return {
    view,
    setView,
    currentWeekStart,
    weekDays,
    mobileSelectedDayIndex,
    mobileSelectedDay,
    currentTimePosition,
    isCurrentWeek,
    isToday,
    handleViewChange,
    handleDateChange,
    goToNextWeek,
    goToPreviousWeek,
    goToToday,
    goToThisWeek,
    goToNextDay,
    goToPreviousDay,
    handleKeyDown,
    setMobileSelectedDayIndex,
  };
}

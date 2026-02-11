import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { CalendarView } from '@/features/calendar/components/CalendarHeader';
import { START_HOUR, HOUR_HEIGHT } from '@/lib/calendar-utils';

dayjs.extend(isoWeek);

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

  // View State
  const [view, setView] = useState<CalendarView>('week');

  // Current Week Start
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
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
  });

  // Mobile Selected Day
  const [mobileSelectedDayIndex, setMobileSelectedDayIndex] = useState(() => {
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
  });

  // Effect: Update from URL Date
  useEffect(() => {
    if (urlDate) {
      const newWeekStart = urlDate.startOf('isoWeek').toDate();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentWeekStart(newWeekStart);

      const dayIndex = urlDate.diff(urlDate.startOf('isoWeek'), 'day');
      setMobileSelectedDayIndex(dayIndex);

      const clearTimer = setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('date');
        window.history.replaceState({}, '', url.toString());
      }, 1000);

      return () => clearTimeout(clearTimer);
    }
  }, [urlDate]);

  // Derived: Week Days
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => dayjs(currentWeekStart).add(index, 'day').toDate()),
    [currentWeekStart],
  );

  // Derived: Mobile Selected Day
  const mobileSelectedDay = weekDays[mobileSelectedDayIndex] || weekDays[0];

  // Navigation Handlers
  const goToPreviousWeek = () =>
    setCurrentWeekStart(dayjs(currentWeekStart).subtract(1, 'week').toDate());
  const goToNextWeek = () => setCurrentWeekStart(dayjs(currentWeekStart).add(1, 'week').toDate());
  const goToToday = () => {
    setCurrentWeekStart(dayjs().startOf('isoWeek').toDate());
    const today = dayjs();
    const weekStart = dayjs().startOf('isoWeek');
    setMobileSelectedDayIndex(today.diff(weekStart, 'day'));
  };

  const goToPreviousDay = () => {
    if (mobileSelectedDayIndex > 0) {
      setMobileSelectedDayIndex(mobileSelectedDayIndex - 1);
    } else {
      setCurrentWeekStart(dayjs(currentWeekStart).subtract(1, 'week').toDate());
      setMobileSelectedDayIndex(6);
    }
  };
  const goToNextDay = () => {
    if (mobileSelectedDayIndex < 6) {
      setMobileSelectedDayIndex(mobileSelectedDayIndex + 1);
    } else {
      setCurrentWeekStart(dayjs(currentWeekStart).add(1, 'week').toDate());
      setMobileSelectedDayIndex(0);
    }
  };

  const handleDateChange = (date: Date) => {
    setCurrentWeekStart(dayjs(date).startOf('isoWeek').toDate());
  };

  const handleViewChange = (newView: CalendarView) => {
    setView(newView);
    const url = new URL(window.location.href);
    url.searchParams.set('view', newView);
    window.history.replaceState({}, '', url.toString());
  };

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isInputField =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      target.closest('[contenteditable="true"]');

    if (isInputField) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPreviousWeek();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNextWeek();
    } else if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      goToToday();
    }
  };

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
    handleViewChange,
    handleDateChange,
    goToNextWeek,
    goToPreviousWeek,
    goToToday,
    goToNextDay,
    goToPreviousDay,
    handleKeyDown,
    setMobileSelectedDayIndex,
  };
}

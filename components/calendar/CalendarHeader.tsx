'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { format } from 'date-fns';

export type CalendarView = 'week' | 'day' | 'agenda';

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onDateChange: (date: Date) => void;
  onToday: () => void;
  onToggleFilters: () => void;
  isFiltersOpen: boolean;
}

export default function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onDateChange,
  onToday,
  onToggleFilters,
  isFiltersOpen,
}: CalendarHeaderProps) {
  const { t } = useTranslation();

  // Navigation handlers
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    onDateChange(newDate);
  };

  // Date Label formatting
  const dateLabel = React.useMemo(() => {
    if (view === 'week') {
      return format(currentDate, 'MMMM yyyy');
    }
    return format(currentDate, 'MMMM d, yyyy');
  }, [currentDate, view]);

  return (
    <header className="sticky top-0 z-30 bg-mq-background/80 backdrop-blur-md border-b border-mq-border px-4 py-3 shadow-sm transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Navigation & Date */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-mq-surface rounded-md border border-mq-border p-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="px-3 h-7 text-xs font-semibold"
              onClick={onToday}
            >
              {t('today')}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <h1 className="text-xl font-bold text-mq-content min-w-[200px]">{dateLabel}</h1>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* View Switcher */}
          <div className="flex items-center p-1 bg-mq-surface border border-mq-border rounded-lg mr-2">
            <button
              onClick={() => onViewChange('week')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                view === 'week'
                  ? 'bg-mq-background shadow-sm text-mq-content'
                  : 'text-mq-content-secondary hover:text-mq-content',
              )}
            >
              Week
            </button>
            <button
              onClick={() => onViewChange('day')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                view === 'day'
                  ? 'bg-mq-background shadow-sm text-mq-content'
                  : 'text-mq-content-secondary hover:text-mq-content',
              )}
            >
              Day
            </button>
            <button
              onClick={() => onViewChange('agenda')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                view === 'agenda'
                  ? 'bg-mq-background shadow-sm text-mq-content'
                  : 'text-mq-content-secondary hover:text-mq-content',
              )}
            >
              Agenda
            </button>
          </div>

          <div className="h-6 w-px bg-mq-border mx-1" />

          {/* Filters button only - "Now" button removed per user request */}
          <Button
            variant={isFiltersOpen ? 'secondary' : 'outline'}
            size="sm"
            className="gap-2"
            onClick={onToggleFilters}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

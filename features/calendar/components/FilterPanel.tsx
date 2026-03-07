'use client';

import React from 'react';
import { Switch } from '@/components/ui/mq/switch';
import { Button } from '@/components/ui/mq/button';
import {
  Check,
  BookOpen,
  AlertCircle,
  Calendar as CalendarIcon,
  GraduationCap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { MQProgram, PROGRAM_LABELS, PROGRAM_STYLES } from '@/data/mqKeyDates';
import { cn } from '@/lib/utils';

export interface CalendarFilters {
  showUnits: boolean;
  showDeadlines: boolean;
  showEvents: boolean;
  showCompleted: boolean;
  showMQKeyDates: boolean;
  mqPrograms: MQProgram[];
}

// All available MQ programs
export const ALL_MQ_PROGRAMS: MQProgram[] = [
  'general',
  'business-school',
  'college',
  'global-mba',
  'fmhhs',
  'oua',
  'exchange',
  'online-degree',
  'muic',
  'elc',
];

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CalendarFilters;
  onFilterChange: (filters: CalendarFilters) => void;
}

export default function FilterPanel({
  isOpen,
  onClose,
  filters,
  onFilterChange,
}: FilterPanelProps) {
  const { t } = useTypedTranslation();

  const toggleFilter = (key: keyof Omit<CalendarFilters, 'mqPrograms'>) => {
    onFilterChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  const toggleProgram = (program: MQProgram) => {
    const currentPrograms = filters.mqPrograms || ALL_MQ_PROGRAMS;
    const newPrograms = currentPrograms.includes(program)
      ? currentPrograms.filter((p) => p !== program)
      : [...currentPrograms, program];
    onFilterChange({
      ...filters,
      mqPrograms: newPrograms,
    });
  };

  const selectAllPrograms = () => {
    onFilterChange({
      ...filters,
      mqPrograms: [...ALL_MQ_PROGRAMS],
    });
  };

  const clearAllPrograms = () => {
    onFilterChange({
      ...filters,
      mqPrograms: [],
    });
  };

  const resetFilters = () => {
    onFilterChange({
      showUnits: true,
      showDeadlines: true,
      showEvents: true,
      showCompleted: false,
      showMQKeyDates: true,
      mqPrograms: [...ALL_MQ_PROGRAMS],
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-mq-card-background border-b border-mq-border overflow-hidden"
        >
          <div className="p-4 space-y-4">
            {/* Main filters row */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-start">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-mq-content-secondary uppercase tracking-wider">
                  {t('filter_viewOptions')}
                </span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={filters.showUnits}
                    onCheckedChange={() => toggleFilter('showUnits')}
                    id="filter-units"
                  />
                  <label
                    htmlFor="filter-units"
                    className="text-sm font-medium flex items-center gap-2 cursor-pointer select-none"
                  >
                    <BookOpen className="w-4 h-4 text-mq-primary" /> {t('filter_unitsAndClasses')}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={filters.showDeadlines}
                    onCheckedChange={() => toggleFilter('showDeadlines')}
                    id="filter-deadlines"
                  />
                  <label
                    htmlFor="filter-deadlines"
                    className="text-sm font-medium flex items-center gap-2 cursor-pointer select-none"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500" /> {t('filter_assessment')}
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-mq-content-secondary uppercase tracking-wider opacity-0 md:opacity-100">
                  {t('filter_additional')}
                </span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={filters.showEvents}
                    onCheckedChange={() => toggleFilter('showEvents')}
                    id="filter-events"
                  />
                  <label
                    htmlFor="filter-events"
                    className="text-sm font-medium flex items-center gap-2 cursor-pointer select-none"
                  >
                    <CalendarIcon className="w-4 h-4 text-green-500" /> {t('events')}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={filters.showCompleted}
                    onCheckedChange={() => toggleFilter('showCompleted')}
                    id="filter-completed"
                  />
                  <label
                    htmlFor="filter-completed"
                    className="text-sm font-medium flex items-center gap-2 cursor-pointer select-none"
                  >
                    <Check className="w-4 h-4 text-gray-500" /> {t('filter_showCompleted')}
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-mq-content-secondary uppercase tracking-wider">
                  {t('mqKeyDates')}
                </span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={filters.showMQKeyDates}
                    onCheckedChange={() => toggleFilter('showMQKeyDates')}
                    id="filter-mq-dates"
                  />
                  <label
                    htmlFor="filter-mq-dates"
                    className="text-sm font-medium flex items-center gap-2 cursor-pointer select-none"
                  >
                    <GraduationCap className="w-4 h-4 text-mq-primary" /> {t('mqKeyDates')}
                  </label>
                </div>
              </div>

              <div className="flex h-full items-end justify-start md:justify-end">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
                    {t('reset')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                    {t('close')}
                  </Button>
                </div>
              </div>
            </div>

            {/* MQ Program filters - collapsible section */}
            {filters.showMQKeyDates && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-mq-border pt-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-mq-content-secondary uppercase tracking-wider">
                    {t('filterByProgramCalendar')}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllPrograms}
                      className="text-xs h-6 px-2"
                    >
                      {t('all')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllPrograms}
                      className="text-xs h-6 px-2"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ALL_MQ_PROGRAMS.map((program) => {
                    const style = PROGRAM_STYLES[program];
                    const isActive = (filters.mqPrograms || ALL_MQ_PROGRAMS).includes(program);
                    return (
                      <button
                        key={program}
                        onClick={() => toggleProgram(program)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border-l-4 transition-all',
                          isActive
                            ? cn(style.bgLight, style.border, style.text)
                            : 'bg-mq-background-secondary/50 border-gray-300 text-mq-content-tertiary opacity-60',
                        )}
                      >
                        <span className="text-sm" aria-hidden="true">
                          {style.icon}
                        </span>
                        <span>{PROGRAM_LABELS[program]}</span>
                        {isActive && <Check className="w-3 h-3 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

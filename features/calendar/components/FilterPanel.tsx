'use client';

import React from 'react';
import { Switch } from '@/components/ui/mq/switch';
import { Button } from '@/components/ui/mq/button';
import { Check, BookOpen, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CalendarFilters {
  showUnits: boolean;
  showDeadlines: boolean;
  showEvents: boolean;
  showCompleted: boolean;
}

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
  // Removed unused translation hook

  const toggleFilter = (key: keyof CalendarFilters) => {
    onFilterChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  const resetFilters = () => {
    onFilterChange({
      showUnits: true,
      showDeadlines: true,
      showEvents: true,
      showCompleted: false,
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
          <div className="p-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-center">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-mq-content-secondary uppercase tracking-wider">
                View Options
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
                  <BookOpen className="w-4 h-4 text-mq-primary" /> Units & Classes
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
                  <AlertCircle className="w-4 h-4 text-red-500" /> Assessment
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-mq-content-secondary uppercase tracking-wider opacity-0 md:opacity-100">
                Additional
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
                  <CalendarIcon className="w-4 h-4 text-green-500" /> Events
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
                  <Check className="w-4 h-4 text-gray-500" /> Show Completed
                </label>
              </div>
            </div>

            <div className="col-span-1 flex h-full items-end justify-start md:col-span-2 md:justify-end lg:col-span-4 xl:col-span-2">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
                  Reset
                </Button>
                <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';

import React, { useMemo, useEffect } from 'react';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { CardSolid } from '@/features/home/components/HomeCard';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { useHydration } from '@/lib/hooks';
import { BookOpen, Clock, TrendingUp } from 'lucide-react';
import { formatDistanceToNow, isValid } from 'date-fns';
import { enAU } from 'date-fns/locale';

export default function HomeKpiStrip() {
  const { t } = useTypedTranslation();
  const isHydrated = useHydration();

  const units = useUnitsStore((state) => state.units);
  const loadUnits = useUnitsStore((state) => state.loadUnits);
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const loadDeadlines = useDeadlinesStore((state) => state.loadDeadlines);
  const getStressLevel = useDeadlinesStore((state) => state.getStressLevel);

  // Load data from database on mount
  useEffect(() => {
    if (isHydrated) {
      loadUnits();
      loadDeadlines();
    }
  }, [isHydrated, loadUnits, loadDeadlines]);

  // 1. Classes Today Count
  const todayClassesCount = useMemo(() => {
    if (!isHydrated) return 0;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayLabel = days[new Date().getDay()];

    return units.reduce((count, unit) => {
      const classesToday = unit.schedule?.filter((s) => s.day === todayLabel) || [];
      return count + classesToday.length;
    }, 0);
  }, [units, isHydrated]);

  // 2. Next Deadline
  const nextDeadline = useMemo(() => {
    if (!isHydrated) return null;
    const now = new Date();
    const validUpcoming = deadlines
      .filter((d) => !d.completed && isValid(new Date(d.dueDate)) && new Date(d.dueDate) > now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return validUpcoming[0] || null;
  }, [deadlines, isHydrated]);

  const timeToDeadline = nextDeadline
    ? formatDistanceToNow(new Date(nextDeadline.dueDate), { addSuffix: true, locale: enAU })
    : t('noUpcomingDeadlines');

  // 3. Stress Level
  const stressLevel = useMemo(() => {
    if (!isHydrated) return 'Low';
    try {
      return getStressLevel();
    } catch {
      return 'Low';
    }
  }, [isHydrated, getStressLevel]);

  const stressConfig = {
    Low: { color: 'text-emerald-600', bg: 'bg-emerald-100/50', label: t('stressLow') },
    Busy: { color: 'text-amber-600', bg: 'bg-amber-100/50', label: t('stressBusy') },
    High: { color: 'text-red-600', bg: 'bg-red-100/50', label: t('stressHigh') },
  };

  const currentStress = stressConfig[stressLevel as keyof typeof stressConfig] || stressConfig.Low;

  if (!isHydrated) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <CardSolid key={i} className="p-4 h-24 animate-pulse flex items-center">
            <div className="h-10 w-10 bg-mq-background-tertiary rounded-full mr-4" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-mq-background-tertiary rounded w-1/2" />
              <div className="h-6 bg-mq-background-tertiary rounded w-3/4" />
            </div>
          </CardSolid>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" aria-label={t('atAGlance')}>
      {/* Classes Today */}
      <CardSolid className="p-4 flex items-center gap-4 relative overflow-hidden group">
        <div className="p-3 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-mq-content-secondary font-medium">{t('classesToday')}</p>
          <p className="text-2xl font-bold text-mq-content">
            {todayClassesCount}
            <span className="text-sm font-normal text-mq-content-tertiary ml-1">
              {t('scheduled')}
            </span>
          </p>
        </div>
      </CardSolid>

      {/* Next Deadline */}
      <CardSolid className="p-4 flex items-center gap-4 relative overflow-hidden group">
        <div className="p-3 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
          <Clock className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-mq-content-secondary font-medium">{t('nextDeadline')}</p>
          <p
            className="text-lg font-bold text-mq-content truncate"
            title={nextDeadline?.title || ''}
          >
            {nextDeadline ? timeToDeadline : t('allCaughtUp')}
          </p>
          {nextDeadline && (
            <p className="text-xs text-mq-content-tertiary truncate">{nextDeadline.title}</p>
          )}
        </div>
      </CardSolid>

      {/* Stress Level */}
      <CardSolid className="p-4 flex items-center gap-4 relative overflow-hidden group">
        <div
          className={`p-3 rounded-full ${currentStress.bg} ${currentStress.color} group-hover:scale-110 transition-transform duration-300`}
        >
          <TrendingUp className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-mq-content-secondary font-medium">{t('workload')}</p>
          <p className={`text-2xl font-bold ${currentStress.color}`}>{currentStress.label}</p>
        </div>
      </CardSolid>
    </div>
  );
}

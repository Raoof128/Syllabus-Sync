'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import TodaySchedule from '@/components/home/TodaySchedule';
import NextDeadline from '@/components/home/NextDeadline';
import EventsFeed from '@/components/home/EventsFeed';
import UnitCard from '@/components/units/UnitCard';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { ScrollReveal, revealChildVariants } from '@/components/ui/ScrollReveal';
import { motion } from 'framer-motion';

// Dynamically import forms for better code splitting
const UnitForm = dynamic(() => import('@/components/units/UnitForm'), {
  loading: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { t } = useTranslation();
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-mq-content">{t('loading')}</p>
      </div>
    );
  },
});
const DeadlineForm = dynamic(() => import('@/components/deadlines/DeadlineForm'), {
  loading: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { t } = useTranslation();
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-mq-content">{t('loading')}</p>
      </div>
    );
  },
});
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { sampleUnits, sampleDeadlines } from '@/data/sampleUnits';
import { DEMO_USER } from '@/lib/config';
import { Info, Plus, BookOpen, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { toastUtils } from '@/lib/utils/toast';
import { errorHandler } from '@/lib/utils/errorHandling';
import { Badge } from '@/components/ui/mq/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { useHydration } from '@/lib/hooks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Unit, Deadline } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


export default function HomeClient() {
  const { t } = useTranslation();
  // Global error boundary for home page
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Error recovery function
  const handleErrorRecovery = () => {
    setHasError(false);
    setErrorMessage(null);
    // Force a re-render by updating a state
    window.location.reload();
  };

  // Catch any unhandled errors in child components
  useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      console.error('Unhandled error in home page:', event.error);
      setHasError(true);
      setErrorMessage(event.error?.message || 'An unexpected error occurred');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection in home page:', event.reason);
      setHasError(true);
      setErrorMessage(event.reason?.message || 'An unexpected error occurred');
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // If there's an error, show error UI
  if (hasError) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-mq-content mb-4">{t('somethingWentWrong')}</h1>
          <p className="text-mq-content-secondary mb-6 max-w-md mx-auto">
            {errorMessage || t('unexpectedError')}
          </p>
          <div className="space-y-3">
            <Button onClick={handleErrorRecovery} className="mr-3">
              {t('tryAgain')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.href = '/'}
            >
              {t('goHome')}
            </Button>
          </div>
        </div>
      </div>
    );
  }
  const units = useUnitsStore((state) => state.units);
  const addUnit = useUnitsStore((state) => state.addUnit);
  const removeUnit = useUnitsStore((state) => state.removeUnit);
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const addDeadline = useDeadlinesStore((state) => state.addDeadline);
  const getStressLevel = useDeadlinesStore((state) => state.getStressLevel);
  const hasHydrated = useHydration();
  const [seedDisabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('seed-disabled') === 'true';
    } catch (error) {
      console.warn('Unable to access localStorage for seed settings:', error);
      return false;
    }
  });
  const hasSeededRef = useRef(false);
  const [unitFormOpen, setUnitFormOpen] = useState(false);
  const [deadlineFormOpen, setDeadlineFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [deleteUnitConfirm, setDeleteUnitConfirm] = useState<Unit | null>(null);

  // Live region for screen reader announcements
  const [announcements, setAnnouncements] = useState<string[]>([]);

  // Function to announce actions to screen readers
  const announceToScreenReader = (message: string) => {
    setAnnouncements(prev => [...prev, `${Date.now()}: ${message}`]);
    // Clear old announcements after 5 seconds
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(ann => !ann.startsWith(`${Date.now() - 5000}:`)));
    }, 5000);
  };

  // Load sample data on first visit with comprehensive validation
  useEffect(() => {
    if (!hasHydrated || hasSeededRef.current || seedDisabled) {
      return;
    }

    const unitsSeededKey = 'units-seeded';
    const deadlinesSeededKey = 'deadlines-seeded';

    try {
      const unitsSeeded = localStorage.getItem(unitsSeededKey) === 'true';
      const deadlinesSeeded = localStorage.getItem(deadlinesSeededKey) === 'true';

      // Validate sample data before adding
      const validUnits = sampleUnits.filter(unit => {
        return unit &&
          typeof unit.code === 'string' &&
          typeof unit.name === 'string' &&
          typeof unit.color === 'string' &&
          Array.isArray(unit.schedule) &&
          unit.schedule.length > 0;
      });

      const validDeadlines = sampleDeadlines.filter(deadline => {
        return deadline &&
          typeof deadline.title === 'string' &&
          typeof deadline.unitCode === 'string' &&
          typeof deadline.priority === 'string' &&
          deadline.dueDate &&
          !isNaN(new Date(deadline.dueDate).getTime());
      });

      if (!unitsSeeded && validUnits.length > 0) {
        validUnits.forEach(addUnit);
        localStorage.setItem(unitsSeededKey, 'true');
        console.log(`Loaded ${validUnits.length} sample units`);
      }

      if (!deadlinesSeeded && validDeadlines.length > 0) {
        validDeadlines.forEach(addDeadline);
        localStorage.setItem(deadlinesSeededKey, 'true');
        console.log(`Loaded ${validDeadlines.length} sample deadlines`);
      }
    } catch (error) {
      console.warn('Failed to load sample data, falling back to direct addition:', error);
      try {
        // Fallback: add data without localStorage
        const validUnits = sampleUnits.filter(unit =>
          unit && unit.code && unit.name && unit.color && Array.isArray(unit.schedule)
        );
        const validDeadlines = sampleDeadlines.filter(deadline =>
          deadline && deadline.title && deadline.unitCode && deadline.dueDate
        );

        validUnits.forEach(addUnit);
        validDeadlines.forEach(addDeadline);
        console.log('Fallback: loaded sample data without localStorage persistence');
      } catch (fallbackError) {
        console.error('Critical error: Could not load sample data:', fallbackError);
      }
    }
    hasSeededRef.current = true;
  }, [addDeadline, addUnit, hasHydrated, seedDisabled]);

  // Listen for custom events from child components and keyboard shortcuts
  useEffect(() => {
    const handleAddUnitEvent = () => {
      setEditingUnit(null);
      setUnitFormOpen(true);
    };

    const handleAddDeadlineEvent = () => {
      setEditingDeadline(null);
      setDeadlineFormOpen(true);
    };

    // Keyboard shortcuts for power users
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger shortcuts when not typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + U for Add Unit
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        handleAddUnitEvent();
      }

      // Ctrl/Cmd + D for Add Deadline
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        handleAddDeadlineEvent();
      }
    };

    window.addEventListener('add-unit', handleAddUnitEvent);
    window.addEventListener('add-deadline', handleAddDeadlineEvent);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('add-unit', handleAddUnitEvent);
      window.removeEventListener('add-deadline', handleAddDeadlineEvent);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const hasUnits = units.length > 0;
  const stressLevel = useMemo(() => {
    if (!hasHydrated) return 'Low';
    try {
      return getStressLevel();
    } catch (error) {
      console.warn('Error calculating stress level:', error);
      return 'Low';
    }
  }, [hasHydrated, getStressLevel]);

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

              return hours + Math.max(0, (endH - startH) + (endM - startM) / 60);
            } catch (error) {
              console.warn('Error calculating hours for schedule:', s, error);
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
    } catch (error) {
      console.error('Error calculating unit stats:', error);
      return {
        unitCount: units.length,
        totalClasses: 0,
        studyHours: 0,
      };
    }
  }, [units]);

  const stressColors = {
    Low: 'bg-mq-success/10 text-mq-success border border-mq-success/20',
    Busy: 'bg-mq-warning/10 text-mq-warning border border-mq-warning/20',
    High: 'bg-mq-error/10 text-mq-error border border-mq-error/20',
  };

  const stressEmoji = {
    Low: '😊',
    Busy: '😅',
    High: '😰',
  };

  const handleAddUnit = () => {
    setEditingUnit(null);
    setUnitFormOpen(true);
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setUnitFormOpen(true);
  };

  const handleDeleteUnit = (unit: Unit) => {
    setDeleteUnitConfirm(unit);
  };

  const confirmDeleteUnit = () => {
    if (deleteUnitConfirm) {
      try {
        removeUnit(deleteUnitConfirm.id);
        const successMessage = `${deleteUnitConfirm.code} - ${deleteUnitConfirm.name} ${t('unitDeletedMsg')}`;
        toastUtils.success(t('unitDeleted'), successMessage);
        announceToScreenReader(successMessage);
      } catch (error) {
        const errorMessage = t('deleteFailedMsg');
        errorHandler.logError(
          error instanceof Error ? error : new Error('Failed to delete unit'),
          'Home Delete Unit',
          'medium'
        );
        toastUtils.error(t('deleteFailed'), errorMessage);
        announceToScreenReader(errorMessage);
      }
      setDeleteUnitConfirm(null);
    }
  };

  const handleAddDeadline = () => {
    setEditingDeadline(null);
    setDeadlineFormOpen(true);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcements.map((announcement, index) => (
          <div key={index}>{announcement.split(': ').slice(1).join(': ')}</div>
        ))}
      </div>

      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-mq-primary focus:text-white focus:rounded-md focus:shadow-lg"
      >
        {t('skipToMain')}
      </a>

      {/* Header */}
      <ScrollReveal>
        <header className="mb-8 flex items-center justify-between flex-wrap gap-4" role="banner">
          <div className="flex-1 min-w-0">
            <h1 className="text-mq-3xl font-bold text-mq-content mb-2">
              {t('welcome')}, {DEMO_USER.name}!
            </h1>
            <p className="text-mq-content-secondary">{t('dayAtGlance')}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Stress Level Indicator */}
            {hasHydrated && deadlines.length > 0 && (
              <>
                <div className="flex sm:hidden items-center gap-1 px-2 py-1 bg-mq-background rounded-mq border border-mq-border">
                  <TrendingUp className="h-3 w-3 text-mq-content-secondary" />
                  <Badge
                    className={`${stressColors[stressLevel]} text-mq-xs px-1.5 py-0.5`}
                    aria-label={`${t('currentWorkloadLevel')}: ${stressLevel}`}
                    title={`${t('workload')}: ${stressLevel}`}
                  >
                    {stressEmoji[stressLevel]}
                  </Badge>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-mq-background rounded-mq-lg border border-mq-border">
                  <TrendingUp className="h-4 w-4 text-mq-content-secondary" />
                  <span className="text-mq-sm text-mq-content">{t('workload')}</span>
                  <Badge
                    className={stressColors[stressLevel]}
                    aria-label={`${t('currentWorkloadLevel')}: ${stressLevel}`}
                  >
                    {stressEmoji[stressLevel]} {stressLevel}
                  </Badge>
                </div>
              </>
            )}
          </div>
        </header>
      </ScrollReveal>

      {/* Get Started Banner */}
      {!hasUnits && (
        <ScrollReveal delay={0.1}>
          <section className="mb-6 p-4 bg-mq-info/10 border border-mq-info/20 rounded-mq-lg flex items-start gap-3" aria-labelledby="get-started-heading">
            <Info className="h-5 w-5 text-mq-info flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <h2 id="get-started-heading" className="sr-only">{t('gettingStartedGuide')}</h2>
              <p className="text-mq-sm text-mq-info">
                <strong>{t('getStarted')}</strong> {t('addUnitsToSync')}
              </p>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Main Dashboard Grid */}
      <section id="main-content" className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6" role="main" aria-label={t('dashboardOverview')}>
        <ScrollReveal delay={0.1}>
          <TodaySchedule />
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <NextDeadline />
        </ScrollReveal>
      </section>

      {/* My Units Section */}
      <ScrollReveal delay={0.3} staggerChildren={0.1}>
        <section aria-labelledby="units-section-heading">
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle id="units-section-heading" className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" aria-hidden="true" />
                {t('myUnits')}
              </CardTitle>

            </CardHeader>
            <CardContent>
              {!hasHydrated ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="animate-pulse space-y-3 w-full max-w-md">
                    <div className="h-4 bg-mq-background-tertiary rounded w-3/4 mx-auto" />
                    <div className="h-4 bg-mq-background-tertiary rounded w-1/2 mx-auto" />
                  </div>
                </div>
              ) : units.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-mq-content-tertiary mx-auto mb-4" />
                  <h3 className="text-mq-lg font-semibold text-mq-content mb-2">{t('noUnitsYet')}</h3>
                  <p className="text-mq-content-secondary mb-4 max-w-md mx-auto">
                    {t('addFirstUnitDesc')}
                  </p>
                  <Button onClick={handleAddUnit} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('addYourFirstUnit')}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Unit Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-mq-background-secondary rounded-mq-lg mb-6 border border-mq-border">
                    <div className="text-center">
                      <p className="text-mq-2xl font-bold text-mq-content">{unitStats.unitCount}</p>
                      <p className="text-mq-xs text-mq-content-secondary">{t('units')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-mq-2xl font-bold text-mq-content">{unitStats.totalClasses}</p>
                      <p className="text-mq-xs text-mq-content-secondary">{t('classesPerWeek')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-mq-2xl font-bold text-mq-content">{unitStats.studyHours}h</p>
                      <p className="text-mq-xs text-mq-content-secondary">{t('studyHours')}</p>
                    </div>
                  </div>

                  {/* Units Grid */}
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
                    variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                  >
                    {units.map((unit) => (
                      <motion.div key={unit.id} variants={revealChildVariants}>
                        <UnitCard
                          unit={unit}
                          onEdit={handleEditUnit}
                          onDelete={handleDeleteUnit}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      </ScrollReveal>

      {/* Events Section */}
      <ScrollReveal delay={0.4}>
        <section aria-labelledby="events-section-heading" className="mb-8">
          <h2 id="events-section-heading" className="sr-only">{t('todaysEvents')}</h2>
          <EventsFeed />
        </section>
      </ScrollReveal>

      {/* Unit Form Dialog */}
      <UnitForm open={unitFormOpen} onOpenChange={setUnitFormOpen} editUnit={editingUnit} />

      {/* Deadline Form Dialog */}
      <DeadlineForm
        open={deadlineFormOpen}
        onOpenChange={setDeadlineFormOpen}
        editDeadline={editingDeadline}
      />

      {/* Delete Unit Confirmation Dialog */}
      <Dialog open={!!deleteUnitConfirm} onOpenChange={() => setDeleteUnitConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('deleteUnit')}</DialogTitle>
            <DialogDescription>
              {t('deleteUnitConfirm')}{' '}
              <strong>
                {deleteUnitConfirm?.code} - {deleteUnitConfirm?.name}
              </strong>
              ? {t('deleteUnitConfirmEnd')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="secondary" onClick={() => setDeleteUnitConfirm(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmDeleteUnit}>
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

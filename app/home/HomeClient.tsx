'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import TodaySchedule from '@/components/home/TodaySchedule';
import NextDeadline from '@/components/home/NextDeadline';
import EventsFeed from '@/components/home/EventsFeed';
import { WelcomeHeader } from '@/components/home/WelcomeHeader';
import UnitCard from '@/components/units/UnitCard';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { ScrollReveal, revealChildVariants } from '@/components/ui/ScrollReveal';
import { motion } from 'framer-motion';

import { useUnitsStore } from '@/lib/store/unitsStore';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useProfilesStore } from '@/lib/store/profilesStore';
import { sampleUnits, sampleDeadlines } from '@/data/sampleUnits';
import { DEMO_USER } from '@/lib/config';
import { Info, Plus, BookOpen, TrendingUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { useHydration } from '@/lib/hooks';
import Link from 'next/link';
import { MagicCard } from '@/components/ui/MagicCard';
import { createBrowserClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface HomeClientProps {
  initialUser: User | null;
}

export default function HomeClient({ initialUser }: HomeClientProps) {
  const { t } = useTranslation();
  const router = useRouter();

  // -- HOOKS MUST BE DECLARED BEFORE ANY RETURNS --
  // Global error boundary for home page
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // User state from Supabase - initialized from server prop
  const [user, setUser] = useState<User | null>(initialUser);
  const supabase = useMemo(() => createBrowserClient(), []);

  // FAB state
  const [fabOpen, setFabOpen] = useState(false);

  const units = useUnitsStore((state) => state.units);
  const addUnit = useUnitsStore((state) => state.addUnit);
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const addDeadline = useDeadlinesStore((state) => state.addDeadline);
  const getStressLevel = useDeadlinesStore((state) => state.getStressLevel);
  const getCurrentProfile = useProfilesStore((state) => state.getCurrentProfile);
  const profiles = useProfilesStore((state) => state.profiles);
  const currentProfileId = useProfilesStore((state) => state.currentProfileId);
  const setCurrentProfile = useProfilesStore((state) => state.setCurrentProfile);
  const currentProfile = getCurrentProfile();
  const hasHydrated = useHydration();

  // Listen for auth changes (sign out, etc)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Get display name for welcome message: profile name > user metadata > email extraction > fallback
  const displayName = (() => {
    if (currentProfile?.name) return currentProfile.name;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.user_metadata?.name) return user.user_metadata.name;
    // Extract name from email prefix and capitalize it
    if (user?.email) {
      const emailPrefix = user.email.split('@')[0];
      // Remove numbers from the end of the email prefix (e.g., "pouyaalavi1378" -> "pouyaalavi")
      const nameWithoutNumbers = emailPrefix.replace(/\d+$/, '');
      // Capitalize first letter
      if (nameWithoutNumbers.length > 0) {
        return (
          nameWithoutNumbers.charAt(0).toUpperCase() + nameWithoutNumbers.slice(1).toLowerCase()
        );
      }
    }
    return null;
  })();

  // Auto-select first profile if profiles exist but none is selected (migration for existing users)
  useEffect(() => {
    if (hasHydrated && profiles.length > 0 && !currentProfileId) {
      setCurrentProfile(profiles[0].id);
    }
  }, [hasHydrated, profiles, currentProfileId, setCurrentProfile]);

  const [seedDisabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('seed-disabled') === 'true';
    } catch {
      return false;
    }
  });

  const hasSeededRef = useRef(false);

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
      const validUnits = sampleUnits.filter((unit) => {
        return (
          unit &&
          unit.code &&
          unit.name &&
          unit.color &&
          Array.isArray(unit.schedule) &&
          unit.schedule.length > 0
        );
      });

      const validDeadlines = sampleDeadlines.filter((deadline) => {
        return (
          deadline &&
          deadline.title &&
          deadline.unitCode &&
          deadline.priority &&
          deadline.dueDate &&
          !isNaN(new Date(deadline.dueDate).getTime())
        );
      });

      if (!unitsSeeded && validUnits.length > 0) {
        validUnits.forEach(addUnit);
        localStorage.setItem(unitsSeededKey, 'true');
      }

      if (!deadlinesSeeded && validDeadlines.length > 0) {
        validDeadlines.forEach(addDeadline);
        localStorage.setItem(deadlinesSeededKey, 'true');
      }
    } catch (error) {
      console.warn('Failed to load sample data, falling back to direct addition:', error);
      try {
        // Fallback: add data without localStorage
        const validUnits = sampleUnits.filter(
          (unit) => unit && unit.code && unit.name && unit.color && Array.isArray(unit.schedule),
        );
        const validDeadlines = sampleDeadlines.filter(
          (deadline) => deadline && deadline.title && deadline.unitCode && deadline.dueDate,
        );

        validUnits.forEach(addUnit);
        validDeadlines.forEach(addDeadline);
      } catch (fallbackError) {
        console.error('Critical error: Could not load sample data:', fallbackError);
      }
    }
    hasSeededRef.current = true;
  }, [addDeadline, addUnit, hasHydrated, seedDisabled]);

  // Listen for custom events from child components and keyboard shortcuts
  useEffect(() => {
    const handleAddUnitEvent = () => {
      // Navigate to calendar page where units can be managed
      router.push('/calendar');
    };

    const handleAddDeadlineEvent = () => {
      // Navigate to calendar page where deadline can be added
      router.push('/calendar');
    };

    // Keyboard shortcuts for power users
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger shortcuts when not typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + U for Add Unit - navigate to calendar
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        handleAddUnitEvent();
      }

      // Ctrl/Cmd + D for Add Deadline - navigate to calendar
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
  }, [router]);

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

              return hours + Math.max(0, endH - startH + (endM - startM) / 60);
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

  // Error recovery function
  const handleErrorRecovery = () => {
    setHasError(false);
    setErrorMessage(null);
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
      <div className="container mx-auto p-6 max-w-7xl home-page">
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
            <Button variant="secondary" onClick={() => (window.location.href = '/')}>
              {t('goHome')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

  // Get aria-label for stress level
  const getStressAriaLabel = (level: 'Low' | 'Busy' | 'High') => {
    const labels = {
      Low: t('stressLevelLow'),
      Busy: t('stressLevelBusy'),
      High: t('stressLevelHigh'),
    };
    return labels[level];
  };

  return (
    <div className="home-page">
      {/* Header */}
      <ScrollReveal>
        <header className="mb-8 flex items-center justify-between flex-wrap gap-4" role="banner">
          <WelcomeHeader name={displayName} fallbackName={DEMO_USER.name} />
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Stress Level Indicator */}
            {hasHydrated && deadlines.length > 0 && (
              <>
                <div className="flex sm:hidden items-center gap-1 px-2 py-1 bg-mq-background rounded-mq border border-mq-border">
                  <TrendingUp className="h-3 w-3 text-mq-content-secondary" />
                  <Badge
                    className={`${stressColors[stressLevel]} text-mq-xs px-1.5 py-0.5`}
                    aria-label={getStressAriaLabel(stressLevel)}
                    title={getStressAriaLabel(stressLevel)}
                  >
                    <span aria-hidden="true">{stressEmoji[stressLevel]}</span>
                  </Badge>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-mq-background rounded-mq-lg border border-mq-border">
                  <TrendingUp className="h-4 w-4 text-mq-content-secondary" />
                  <span className="text-mq-sm text-mq-content">{t('workload')}</span>
                  <Badge
                    className={stressColors[stressLevel]}
                    aria-label={getStressAriaLabel(stressLevel)}
                  >
                    <span aria-hidden="true">{stressEmoji[stressLevel]}</span> {stressLevel}
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
          <section
            className="mb-6 p-4 bg-mq-info/10 border border-mq-info/20 rounded-mq-lg flex items-start gap-3"
            aria-labelledby="get-started-heading"
          >
            <Info className="h-5 w-5 text-mq-info flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <h2 id="get-started-heading" className="sr-only">
                {t('gettingStartedGuide')}
              </h2>
              <p className="text-mq-sm text-mq-info">
                <strong>{t('getStarted')}</strong> {t('addUnitsToSync')}
              </p>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Main Dashboard Grid (rendered inside page-level main) */}
      <section
        className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 2xl:max-w-[1600px] 2xl:mx-auto"
        aria-label={t('dashboardOverview')}
      >
        <ScrollReveal delay={0.1}>
          <TodaySchedule />
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <NextDeadline />
        </ScrollReveal>
      </section>

      {/* My Units Section - READ ONLY on Home page */}
      <ScrollReveal delay={0.3} staggerChildren={0.1}>
        <section aria-labelledby="units-section-heading" className="mb-6">
          <MagicCard isLiquidEnhanced>
            <div className="mq-magic-card-content">
              <Card className="border-0 shadow-none bg-transparent">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle id="units-section-heading" className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" aria-hidden="true" />
                    {t('myUnits')}
                  </CardTitle>
                  <Button size="sm" variant="outline" className="gap-1" asChild>
                    <Link href="/calendar" aria-label={t('viewAll')}>
                      <ExternalLink className="h-4 w-4" />
                      {t('viewAll')}
                    </Link>
                  </Button>
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
                      <h3 className="text-mq-lg font-semibold text-mq-content mb-2">
                        {t('noUnitsYet')}
                      </h3>
                      <p className="text-mq-content-secondary mb-4 max-w-md mx-auto">
                        {t('addFirstUnitDesc')}
                      </p>
                      <Button asChild className="gap-2">
                        <Link href="/calendar">
                          <Plus className="h-4 w-4" />
                          {t('addYourFirstUnit')}
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Unit Stats */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-mq-background-secondary rounded-mq-lg mb-6 border border-mq-border">
                        <div className="text-center">
                          <p className="text-mq-2xl font-bold text-mq-content">
                            {unitStats.unitCount}
                          </p>
                          <p className="text-mq-xs text-mq-content-secondary">{t('units')}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-mq-2xl font-bold text-mq-content">
                            {unitStats.totalClasses}
                          </p>
                          <p className="text-mq-xs text-mq-content-secondary">
                            {t('classesPerWeek')}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-mq-2xl font-bold text-mq-content">
                            {unitStats.studyHours}h
                          </p>
                          <p className="text-mq-xs text-mq-content-secondary">{t('studyHours')}</p>
                        </div>
                      </div>

                      {/* Units Grid - READ ONLY (no edit/delete) */}
                      <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 auto-rows-fr"
                        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                      >
                        {units.map((unit) => (
                          <motion.div
                            key={unit.id}
                            variants={revealChildVariants}
                            className="relative z-0 hover:z-50 focus-within:z-50 h-full"
                          >
                            <UnitCard unit={unit} showActions={false} />
                          </motion.div>
                        ))}
                      </motion.div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </MagicCard>
        </section>
      </ScrollReveal>

      {/* Events Section */}
      <ScrollReveal delay={0.4}>
        <section aria-labelledby="events-section-heading" className="mb-8">
          <h2 id="events-section-heading" className="sr-only">
            {t('todaysEvents')}
          </h2>
          <EventsFeed />
        </section>
      </ScrollReveal>

      {/* Floating Action Button (FAB) for Quick Actions */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        <div className="relative">
          {/* FAB Menu */}
          {fabOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="absolute bottom-16 right-0 flex flex-col gap-2 items-end"
            >
              <Button
                size="sm"
                variant="secondary"
                className="shadow-lg flex items-center gap-2 whitespace-nowrap"
                onClick={() => {
                  router.push('/calendar?action=add-unit');
                  setFabOpen(false);
                }}
              >
                <BookOpen className="h-4 w-4" />
                {t('addUnit')}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="shadow-lg flex items-center gap-2 whitespace-nowrap"
                onClick={() => {
                  router.push('/calendar?action=add-deadline');
                  setFabOpen(false);
                }}
              >
                <Plus className="h-4 w-4" />
                {t('addDeadline')}
              </Button>
            </motion.div>
          )}

          {/* Main FAB Button */}
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg p-0"
            onClick={() => setFabOpen(!fabOpen)}
            aria-expanded={fabOpen}
            aria-label={t('quickActions')}
          >
            <motion.div animate={{ rotate: fabOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
              <Plus className="h-6 w-6" />
            </motion.div>
          </Button>
        </div>
      </div>
    </div>
  );
}

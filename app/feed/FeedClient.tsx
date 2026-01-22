// app/feed/FeedClient.tsx
'use client';

import { useState, memo, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Button } from '@/components/ui/mq/button';
import {
  Calendar,
  MapPin,
  Clock,
  Filter,
  TrendingUp,
  Users,
  Megaphone,
  Info,
  Navigation,
  Rss,
  Bell,
  Check,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
// Events are now loaded from Supabase via eventsStore (no more sampleEvents import)
import { UNIVERSITY_CONFIG } from '@/lib/config';
import Link from 'next/link';
import { useTranslation } from '@/lib/hooks/useTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { MagicCard } from '@/components/ui/MagicCard';
import { toastUtils } from '@/lib/utils/toast';
import { useGamificationStore, showXPEarnedNotification } from '@/components/gamification';
import { useNotificationsStore } from '@/lib/store/notificationsStore';
import { useNotificationPreferencesStore } from '@/lib/store/notificationPreferencesStore';
import { useEventsStore } from '@/lib/store/eventsStore';
import { apiRequest } from '@/lib/utils/api';
import { Event } from '@/lib/types';
import dynamic from 'next/dynamic';

// Dynamically import EventForm for code splitting
import LoadingPlaceholder from '@/components/ui/LoadingPlaceholder';

const EventForm = dynamic(() => import('@/components/events/EventForm'), {
  loading: () => <LoadingPlaceholder />,
});

const categoryColors: Record<string, string> = {
  Career: 'bg-mq-info/10 text-mq-info',
  Social: 'bg-mq-purple/10 text-mq-purple',
  Academic: 'bg-mq-success/10 text-mq-success',
  'Free Food': 'bg-mq-warning/10 text-mq-warning',
};

const REMINDER_TIMING_OPTIONS: { labelKey: TranslationKey; value: number }[] = [
  { labelKey: 'timing15min', value: 15 },
  { labelKey: 'timing30min', value: 30 },
  { labelKey: 'timing1hour', value: 60 },
  { labelKey: 'timing2hours', value: 120 },
  { labelKey: 'timing1day', value: 1440 },
  { labelKey: 'timing2days', value: 2880 },
];

type FilterType = 'All' | 'Academic' | 'Career' | 'Social' | 'Free Food';

const FeedClient = memo(() => {
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const highlightEventId = searchParams.get('highlight');

  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [remindedEvents, setRemindedEvents] = useState<Set<string>>(new Set());
  const [loadingEvents, setLoadingEvents] = useState<Set<string>>(new Set());
  const [highlightedEvent, setHighlightedEvent] = useState<string | null>(highlightEventId);

  // Event form state
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  // Ref for scrolling to highlighted event
  const eventRefs = useRef<Map<string, HTMLElement>>(new Map());
  const highlightAttemptsRef = useRef(0);

  // Events store - get all events from Supabase
  const storeEvents = useEventsStore((state) => state.events);
  const removeEvent = useEventsStore((state) => state.removeEvent);

  // Gamification store - use individual selectors to prevent re-renders
  const isDemo = useGamificationStore((state) => state.isDemo);
  const refreshProfile = useGamificationStore((state) => state.refreshProfile);
  const settings = useGamificationStore((state) => state.settings);

  // Notifications store
  const addNotification = useNotificationsStore((state) => state.addNotification);

  // Notification preferences store - use individual selectors to prevent infinite re-renders
  const eventReminderTiming = useNotificationPreferencesStore((state) => state.eventReminderTiming);
  const eventsEnabled = useNotificationPreferencesStore((state) => state.eventsEnabled);
  const permissionStatus = useNotificationPreferencesStore((state) => state.permissionStatus);
  const pushEnabled = useNotificationPreferencesStore((state) => state.pushEnabled);
  const requestPermission = useNotificationPreferencesStore((state) => state.requestPermission);
  const scheduleEventReminder = useNotificationPreferencesStore(
    (state) => state.scheduleEventReminder,
  );
  const cancelReminder = useNotificationPreferencesStore((state) => state.cancelReminder);

  // User events store - load events for potential future use
  useEventsStore((state) => state.events);

  // Scroll to and highlight the event when component mounts or highlight changes
  useEffect(() => {
    if (highlightEventId) {
      setHighlightedEvent(highlightEventId);

      highlightAttemptsRef.current = 0;

      const scrollToHighlight = () => {
        const eventElement = eventRefs.current.get(highlightEventId);
        if (eventElement) {
          eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            setHighlightedEvent(null);
          }, 5000);
          return;
        }
        if (highlightAttemptsRef.current < 3) {
          highlightAttemptsRef.current += 1;
          setTimeout(scrollToHighlight, 200);
        }
      };

      const timer = setTimeout(scrollToHighlight, 300);
      return () => clearTimeout(timer);
    }
  }, [highlightEventId]);

  // Handle "Remind Me" button click - awards XP for event attendance and creates notification
  const handleRemindMe = useCallback(
    async (eventId: string, eventTitle: string, eventStartAt: Date, eventLocation: string) => {
      const isAlreadyReminded = remindedEvents.has(eventId);

      // Toggle off if already reminded
      if (isAlreadyReminded) {
        setLoadingEvents((prev) => new Set(prev).add(eventId));
        try {
          cancelReminder(eventId);
          setRemindedEvents((prev) => {
            const next = new Set(prev);
            next.delete(eventId);
            return next;
          });
        } finally {
          setLoadingEvents((prev) => {
            const next = new Set(prev);
            next.delete(eventId);
            return next;
          });
        }
        return;
      }

      // Already reminded for this event
      if (remindedEvents.has(eventId)) {
        toastUtils.info(t('eventReminderAlreadyTitle'), t('eventReminderAlreadyMsg'));
        return;
      }

      if (!pushEnabled || !eventsEnabled) {
        toastUtils.info(t('eventRemindersDisabledTitle'), t('eventRemindersDisabledMsg'));
        return;
      }

      const resolvedPermission =
        permissionStatus === 'default' ? await requestPermission() : permissionStatus;
      if (resolvedPermission !== 'granted') {
        toastUtils.error(t('permissionDenied'), t('permissionDeniedMsg'));
        return;
      }

      const timingOption = REMINDER_TIMING_OPTIONS.find(
        (option) => option.value === eventReminderTiming,
      );
      const timingLabel = timingOption
        ? t(timingOption.labelKey)
        : t('timingMinutes', { minutes: eventReminderTiming });

      // Mark as loading
      setLoadingEvents((prev) => new Set(prev).add(eventId));

      try {
        scheduleEventReminder(eventId, eventTitle, eventLocation, eventStartAt);

        // Create notification - don't provide id (let API generate UUID)
        // Convert relative link to absolute URL for validation (schema requires full URL)
        const notificationLink =
          typeof window !== 'undefined'
            ? `${window.location.origin}/feed?highlight=${encodeURIComponent(eventId)}`
            : undefined;

        // Only include relatedId if eventId is a valid UUID format (sample events use 'event-1' format)
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          eventId,
        );

        await addNotification({
          title: t('reminderTimingUpdated'),
          message: t('reminderTimingUpdatedMsg', { timing: timingLabel }),
          type: 'event',
          read: false,
          ...(notificationLink && { link: notificationLink }),
          ...(isValidUUID && { relatedId: eventId }),
        });

        // If user is authenticated (not demo mode), award XP
        if (!isDemo) {
          try {
            const response = await apiRequest<{
              message: string;
              result: { xpAwarded: number; leveledUp: boolean; newLevel: number };
            }>('/api/gamification/award-xp', {
              method: 'POST',
              body: JSON.stringify({
                eventType: 'event_attended',
                referenceId: null, // Use null since sample events don't have UUID IDs
                metadata: { eventId, title: eventTitle },
              }),
            });

            // Show XP notification if enabled
            if (settings.showXPNotifications) {
              showXPEarnedNotification(
                response.result.xpAwarded,
                t('eventReminderSetTitle'),
                language,
              );
            }

            // Refresh profile to update XP display
            await refreshProfile();
          } catch {
            // XP error is not critical, continue with reminder
          }
        }

        // Mark event as reminded (works for both demo and authenticated users)
        setRemindedEvents((prev) => new Set(prev).add(eventId));
        toastUtils.success(
          t('reminderTimingUpdated'),
          t('reminderTimingUpdatedMsg', { timing: timingLabel }),
        );
      } catch (error) {
        // Check if it's a "already awarded" error (409 conflict)
        if (error instanceof Error && error.message.includes('already awarded')) {
          setRemindedEvents((prev) => new Set(prev).add(eventId));
          toastUtils.info(t('eventReminderAlreadyTitle'), t('eventReminderAlreadyMsg'));
        } else {
          toastUtils.error(t('eventReminderFailedTitle'), t('eventReminderFailedMsg'));
        }
      } finally {
        setLoadingEvents((prev) => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
      }
    },
    [
      eventReminderTiming,
      eventsEnabled,
      isDemo,
      permissionStatus,
      pushEnabled,
      cancelReminder,
      requestPermission,
      remindedEvents,
      refreshProfile,
      scheduleEventReminder,
      settings.showXPNotifications,
      language,
      t,
      addNotification,
    ],
  );

  // Get locale string for date formatting
  const getLocaleString = useMemo(() => {
    const localeMap: Record<string, string> = {
      en: 'en-AU',
      es: 'es-ES',
      fa: 'fa-IR',
      zh: 'zh-CN',
      ar: 'ar-SA',
      hi: 'hi-IN',
      ko: 'ko-KR',
      ja: 'ja-JP',
    };
    return localeMap[language] || 'en-AU';
  }, [language]);

  // Filter events based on selected category
  const filteredEvents = useMemo(
    () =>
      activeFilter === 'All'
        ? storeEvents
        : storeEvents.filter((event) => event.category === activeFilter),
    [activeFilter, storeEvents],
  );

  // Calculate stats
  const stats = useMemo(() => {
    const thisWeeksEvents = storeEvents.filter((event) => {
      const eventDate = new Date(event.date);
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return eventDate >= now && eventDate <= weekFromNow;
    });

    const freeFoodEvents = storeEvents.filter((event) => event.category === 'Free Food');

    return {
      total: storeEvents.length,
      thisWeek: thisWeeksEvents.length,
      freeFood: freeFoodEvents.length,
    };
  }, [storeEvents]);

  const filters: FilterType[] = ['All', 'Academic', 'Career', 'Social', 'Free Food'];

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl feed-page">
      {/* Header */}
      <ScrollReveal>
        <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-mq-3xl font-bold text-mq-content mb-2">{t('campusFeed')}</h1>
            <p className="text-mq-content-secondary">
              {t('campusFeedDesc', { uniName: UNIVERSITY_CONFIG.name })}
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingEvent(null);
              setEventFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('addEvent')}
          </Button>
        </header>
      </ScrollReveal>

      {/* Info Banner */}
      <ScrollReveal delay={0.1}>
        <div
          className="mb-6 p-4 bg-mq-background-secondary border border-mq-border rounded-mq-lg flex items-start gap-3 stay-connected-banner"
          role="region"
          aria-label={t('stayConnected')}
        >
          <Info
            className="h-5 w-5 text-mq-content-secondary flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="flex-1">
            <p className="text-mq-sm text-mq-content">
              <strong>{t('stayConnected')}</strong> {t('stayConnectedDesc')}
            </p>
          </div>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filter Tabs */}
          <ScrollReveal delay={0.15}>
            <MagicCard isLiquidEnhanced>
              <div className="mq-magic-card-content p-0">
                <Card className="border-0 shadow-none bg-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" aria-hidden="true" />
                      {t('filterEvents')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="flex flex-wrap gap-2"
                      role="group"
                      aria-label={t('filterEvents')}
                    >
                      {filters.map((filter) => {
                        const isActive = activeFilter === filter;
                        return (
                          <Button
                            key={filter}
                            variant={isActive ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setActiveFilter(filter)}
                            aria-pressed={isActive}
                            aria-label={
                              isActive
                                ? `${t(`filter_${filter.replace(/ /g, '')}` as Parameters<typeof t>[0])} - ${t('currentlySelected')}`
                                : t(`filter_${filter.replace(/ /g, '')}` as Parameters<typeof t>[0])
                            }
                          >
                            {t(`filter_${filter.replace(/ /g, '')}` as Parameters<typeof t>[0])}
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </MagicCard>
          </ScrollReveal>

          {/* Events List */}
          <ScrollReveal delay={0.2}>
            <MagicCard isLiquidEnhanced>
              <div className="mq-magic-card-content p-0">
                <Card className="border-0 shadow-none bg-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" aria-hidden="true" />
                        {activeFilter === 'All'
                          ? t('allEvents')
                          : t('categoryEvents', {
                              category: t(
                                `category_${activeFilter.replace(/ /g, '')}` as Parameters<
                                  typeof t
                                >[0],
                              ),
                            })}
                      </span>
                      <Badge variant="neutral">
                        {t('eventsCount', { count: filteredEvents.length })}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="space-y-4"
                      role="feed"
                      aria-label={t('allEvents')}
                      aria-busy="false"
                    >
                      {filteredEvents.length > 0 ? (
                        filteredEvents.map((event, index) => {
                          const isReminded = remindedEvents.has(event.id);
                          const isLoading = loadingEvents.has(event.id);
                          const isHighlighted = highlightedEvent === event.id;

                          return (
                            <article
                              key={event.id}
                              ref={(el) => {
                                if (el) eventRefs.current.set(event.id, el);
                              }}
                              className={`p-4 bg-mq-background-secondary rounded-mq-lg border transition-all duration-mq-fast ${
                                isHighlighted
                                  ? 'border-mq-primary ring-2 ring-mq-primary/50 shadow-lg shadow-mq-primary/20'
                                  : 'border-mq-border hover:border-mq-border-secondary hover:shadow-mq-sm'
                              }`}
                              aria-posinset={index + 1}
                              aria-setsize={filteredEvents.length}
                            >
                              {/* Event Header */}
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <h3 className="font-semibold text-mq-content text-mq-lg">
                                  {t(
                                    (event.translationKey || event.title) as Parameters<
                                      typeof t
                                    >[0],
                                  )}
                                </h3>
                                <Badge
                                  className={`${categoryColors[event.category as keyof typeof categoryColors]} flex-shrink-0`}
                                >
                                  {t(
                                    `category_${event.category.replace(/ /g, '')}` as Parameters<
                                      typeof t
                                    >[0],
                                  )}
                                </Badge>
                              </div>

                              {/* Event Description */}
                              <p className="text-mq-sm text-mq-content-secondary mb-3">
                                {t(
                                  (event.descriptionKey || event.description) as Parameters<
                                    typeof t
                                  >[0],
                                )}
                              </p>

                              {/* Event Details */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-mq-sm text-mq-content-secondary">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-4 w-4" aria-hidden="true" />
                                  <time dateTime={new Date(event.date).toISOString()}>
                                    {new Date(event.date).toLocaleDateString(getLocaleString, {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </time>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4" aria-hidden="true" />
                                  <span>{event.time}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-4 w-4" aria-hidden="true" />
                                  <span>{event.location}</span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="mt-4 pt-3 border-t border-mq-border flex gap-2 flex-wrap">
                                <Button
                                  variant={isReminded ? 'primary' : 'secondary'}
                                  size="sm"
                                  onClick={() =>
                                    handleRemindMe(
                                      event.id,
                                      t(
                                        (event.translationKey || event.title) as Parameters<
                                          typeof t
                                        >[0],
                                      ),
                                      event.startAt,
                                      event.location || '',
                                    )
                                  }
                                  disabled={isLoading}
                                  aria-label={
                                    isReminded ? t('reminderTimingUpdated') : t('remindMe')
                                  }
                                >
                                  {isLoading ? (
                                    <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-1.5" />
                                  ) : isReminded ? (
                                    <Check className="h-4 w-4 mr-1.5" aria-hidden="true" />
                                  ) : (
                                    <Bell className="h-4 w-4 mr-1.5" aria-hidden="true" />
                                  )}
                                  {isReminded ? t('reminderTimingUpdated') : t('remindMe')}
                                </Button>
                                {event.building && (
                                  <Button
                                    asChild
                                    variant="ghost"
                                    size="icon"
                                    className="p-1 inline-flex items-center justify-center hover:bg-mq-hover-background rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-[44px] min-w-[44px]"
                                  >
                                    <Link
                                      href={`/map?building=${encodeURIComponent(event.building)}&autonav=true`}
                                      aria-label={t('navigateToBuildingAria', {
                                        building: event.building,
                                      })}
                                    >
                                      <Navigation
                                        className="h-4 w-4 text-mq-content-secondary"
                                        aria-hidden="true"
                                      />
                                    </Link>
                                  </Button>
                                )}
                                {/* Edit button */}
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setEditingEvent(event);
                                    setEventFormOpen(true);
                                  }}
                                  aria-label={t('edit') || 'Edit'}
                                >
                                  <Pencil className="h-4 w-4 mr-1.5" aria-hidden="true" />
                                  {t('edit') || 'Edit'}
                                </Button>
                                {/* Delete button */}
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setEventToDelete(event);
                                    setDeleteConfirmOpen(true);
                                  }}
                                  aria-label={t('delete') || 'Delete'}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                >
                                  <Trash2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
                                  {t('delete') || 'Delete'}
                                </Button>
                              </div>
                            </article>
                          );
                        })
                      ) : (
                        <div className="text-center py-12">
                          <Rss
                            className="h-12 w-12 mx-auto mb-4 text-mq-content-tertiary"
                            aria-hidden="true"
                          />
                          <h3 className="text-mq-lg font-semibold text-mq-content mb-2">
                            {t('noEventsFound')}
                          </h3>
                          <p className="text-mq-content-secondary text-sm max-w-md mx-auto">
                            {t('noEventsFoundDesc')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </MagicCard>
          </ScrollReveal>
        </div>

        {/* Sidebar - 1 column */}
        <aside className="space-y-6" aria-label="Event statistics and announcements">
          {/* Quick Stats */}
          <ScrollReveal delay={0.25}>
            <MagicCard isLiquidEnhanced>
              <div className="mq-magic-card-content p-0">
                <Card className="border-0 shadow-none bg-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" aria-hidden="true" />
                      {t('thisWeek')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-mq-info/10 rounded-mq-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-mq-info" aria-hidden="true" />
                        <span className="text-mq-sm font-medium text-mq-content">
                          {t('totalEvents')}
                        </span>
                      </div>
                      <span
                        className="text-mq-lg font-bold text-mq-info"
                        aria-label={`${stats.total} ${t('totalEvents')}`}
                      >
                        {stats.total}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-mq-purple/10 rounded-mq-lg">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-mq-purple" aria-hidden="true" />
                        <span className="text-mq-sm font-medium text-mq-content">
                          {t('thisWeek')}
                        </span>
                      </div>
                      <span
                        className="text-mq-lg font-bold text-mq-purple"
                        aria-label={`${stats.thisWeek} ${t('thisWeek')}`}
                      >
                        {stats.thisWeek}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-mq-warning/10 rounded-mq-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-mq-warning" aria-hidden="true">
                          🍕
                        </span>
                        <span className="text-mq-sm font-medium text-mq-content">
                          {t('freeFood')}
                        </span>
                      </div>
                      <span
                        className="text-mq-lg font-bold text-mq-warning"
                        aria-label={`${stats.freeFood} ${t('freeFood')}`}
                      >
                        {stats.freeFood}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </MagicCard>
          </ScrollReveal>

          {/* Announcements */}
          <ScrollReveal delay={0.3}>
            <MagicCard isLiquidEnhanced>
              <div className="mq-magic-card-content p-0">
                <Card className="border-0 shadow-none bg-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Megaphone className="h-5 w-5" aria-hidden="true" />
                      {t('announcements')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <article className="p-3 bg-mq-success/10 rounded-mq-lg border border-mq-success/20">
                      <div className="flex items-start gap-2">
                        <Badge className="bg-mq-success text-white flex-shrink-0">{t('new')}</Badge>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-mq-content text-mq-sm">
                            {t('phase2Updates')}
                          </h4>
                          <p className="text-mq-xs text-mq-content-secondary mt-1">
                            {t('phase2UpdatesDesc')}
                          </p>
                        </div>
                      </div>
                    </article>
                    <article className="p-3 bg-mq-warning/10 rounded-mq-lg border border-mq-warning/20">
                      <div className="flex items-start gap-2">
                        <Badge className="bg-mq-warning text-white flex-shrink-0">
                          {t('info')}
                        </Badge>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-mq-content text-mq-sm">
                            {t('welcomeToApp', { appName: 'Syllabus Sync' })}
                          </h4>
                          <p className="text-mq-xs text-mq-content-secondary mt-1">
                            {t('appCompanionDesc')}
                          </p>
                        </div>
                      </div>
                    </article>
                  </CardContent>
                </Card>
              </div>
            </MagicCard>
          </ScrollReveal>

          {/* Event Categories Legend */}
          <ScrollReveal delay={0.35}>
            <MagicCard isLiquidEnhanced>
              <div className="mq-magic-card-content p-0">
                <Card className="border-0 shadow-none bg-transparent">
                  <CardHeader>
                    <CardTitle>{t('eventCategories')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-3">
                      <div className="flex items-center justify-between">
                        <dt>
                          <Badge className="bg-mq-success/10 text-mq-success">
                            {t('category_Academic')}
                          </Badge>
                        </dt>
                        <dd className="text-mq-sm text-mq-content-secondary">
                          {t('workshopsStudy')}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>
                          <Badge className="bg-mq-info/10 text-mq-info">
                            {t('category_Career')}
                          </Badge>
                        </dt>
                        <dd className="text-mq-sm text-mq-content-secondary">
                          {t('jobInternship')}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>
                          <Badge className="bg-mq-purple/10 text-mq-purple">
                            {t('category_Social')}
                          </Badge>
                        </dt>
                        <dd className="text-mq-sm text-mq-content-secondary">
                          {t('meetupsNetworking')}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>
                          <Badge className="bg-mq-warning/10 text-mq-warning">
                            {t('category_FreeFood')}
                          </Badge>
                        </dt>
                        <dd className="text-mq-sm text-mq-content-secondary">{t('mealsSnacks')}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </div>
            </MagicCard>
          </ScrollReveal>
        </aside>
      </div>

      {/* Event Form Dialog */}
      <EventForm open={eventFormOpen} onOpenChange={setEventFormOpen} editEvent={editingEvent} />

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-mq-surface border border-mq-border rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-mq-content">
                  {t('deleteEventConfirm') || 'Delete Event?'}
                </h3>
                <p className="text-sm text-mq-content-secondary">{eventToDelete.title}</p>
              </div>
            </div>
            <p className="text-sm text-mq-content-secondary mb-6">
              {t('deleteEventConfirmDesc') ||
                'This action cannot be undone. Are you sure you want to delete this event?'}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setEventToDelete(null);
                }}
              >
                {t('cancelAction') || 'Cancel'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (eventToDelete) {
                    removeEvent(eventToDelete.id);
                    setDeleteConfirmOpen(false);
                    setEventToDelete(null);
                    toastUtils.success(
                      t('eventDeleted' as TranslationKey) || 'Event deleted',
                      t('eventDeletedDesc' as TranslationKey) || 'The event has been removed.',
                    );
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {t('confirmDelete') || 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

FeedClient.displayName = 'FeedClient';

export default FeedClient;

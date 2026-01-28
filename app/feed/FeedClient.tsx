'use client';

import { useState, memo, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/mq/button';
import { Plus, Trash2, Rss, Info } from 'lucide-react';
import { UNIVERSITY_CONFIG } from '@/lib/config';
import { useTranslation } from '@/lib/hooks/useTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { toastUtils } from '@/lib/utils/toast';
import { useGamificationStore, showXPEarnedNotification } from '@/components/gamification';
import { useNotificationsStore } from '@/lib/store/notificationsStore';
import { useNotificationPreferencesStore } from '@/lib/store/notificationPreferencesStore';
import { useEventsStore } from '@/lib/store/eventsStore';
import { apiRequest } from '@/lib/utils/api';
import { Event } from '@/lib/types';
import dynamic from 'next/dynamic';
import LoadingPlaceholder from '@/components/ui/LoadingPlaceholder';
import { FeedFilters, TimeRange, SortMode, CategoryFilter } from '@/components/feed/FeedFilters';
import { FeedEventCard } from '@/components/feed/FeedEventCard';
import { FeedSidebar } from '@/components/feed/FeedSidebar';

// Dynamically import EventForm for code splitting
const EventForm = dynamic(() => import('@/components/events/EventForm'), {
  loading: () => <LoadingPlaceholder />,
});

const REMINDER_TIMING_OPTIONS: { labelKey: TranslationKey; value: number }[] = [
  { labelKey: 'timing15min', value: 15 },
  { labelKey: 'timing30min', value: 30 },
  { labelKey: 'timing1hour', value: 60 },
  { labelKey: 'timing2hours', value: 120 },
  { labelKey: 'timing1day', value: 1440 },
  { labelKey: 'timing2days', value: 2880 },
];

const FeedClient = memo(() => {
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const highlightEventId = searchParams.get('highlight');

  // Filters State
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('upcoming');
  const [sortMode, setSortMode] = useState<SortMode>('soonest');

  // Interactive State
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
      setTimeRange('upcoming'); // Ensure we can see it if it's upcoming (or maybe 'all'?)

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

  // Handle "Remind Me" button click
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

  // Filter & Sort Logic
  const filteredEvents = useMemo(() => {
    let result = storeEvents;
    const now = new Date();

    // 1. Time Range
    if (timeRange === 'today') {
      result = result.filter((e) => {
        const d = new Date(e.date);
        return d.toDateString() === now.toDateString();
      });
    } else if (timeRange === 'week') {
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      result = result.filter((e) => {
        const d = new Date(e.date);
        return d >= now && d <= weekFromNow;
      });
    } else if (timeRange === 'upcoming') {
      result = result.filter((e) => new Date(e.date) >= now);
    }

    // 2. Category
    if (activeFilter !== 'All') {
      result = result.filter((event) => event.category === activeFilter);
    }

    // 3. Search (Client-side simple match)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          (e.location && e.location.toLowerCase().includes(q)) ||
          (e.building && e.building.toLowerCase().includes(q)),
      );
    }

    // 4. Sort
    result = [...result].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      if (sortMode === 'soonest') return dateA - dateB;
      if (sortMode === 'newest') return dateB - dateA; // Approximation, using event date. Ideally "created_at"
      // if (sortMode === 'popular') ... future
      return 0;
    });

    return result;
  }, [storeEvents, activeFilter, timeRange, searchQuery, sortMode]);

  // Filter Counts for Chips
  const filterCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      All: 0,
      Academic: 0,
      Career: 0,
      Social: 0,
      'Free Food': 0,
    };

    // Calculate counts based on current timeRange (but ignoring category filter)
    const timeFiltered = storeEvents.filter((e) => {
      const now = new Date();
      const d = new Date(e.date);
      if (timeRange === 'today') return d.toDateString() === now.toDateString();
      if (timeRange === 'week') return d >= now && d <= new Date(now.getTime() + 7 * 86400000);
      if (timeRange === 'upcoming') return d >= now;
      return true;
    });

    counts.All = timeFiltered.length;
    timeFiltered.forEach((e) => {
      if (counts[e.category as CategoryFilter] !== undefined) {
        counts[e.category as CategoryFilter]++;
      }
    });

    return counts;
  }, [storeEvents, timeRange]);

  // Stats for Sidebar
  const stats = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const thisWeeksEvents = storeEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate >= now && eventDate <= weekFromNow;
    });

    const freeFoodEvents = storeEvents.filter((event) => event.category === 'Free Food');

    return {
      total: storeEvents.length,
      thisWeek: thisWeeksEvents.length,
      freeFood: freeFoodEvents.length,
    };
  }, [storeEvents]);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        {/* Main Feed - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <FeedFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            sortMode={sortMode}
            onSortModeChange={setSortMode}
            counts={filterCounts}
          />

          {/* Events Grid/List */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event, index) => (
                <article
                  key={event.id}
                  className="sticky z-0 transition-transform duration-300"
                  style={{
                    // Stacking effect calculation
                    top: `${140 + index * 10}px`,
                    // Add slight margin bottom to create spacing when stacked
                    marginBottom: '2rem',
                  }}
                  ref={(el) => {
                    if (el) eventRefs.current.set(event.id, el);
                  }}
                >
                  <ScrollReveal delay={0.1}>
                    <FeedEventCard
                      event={event}
                      isReminded={remindedEvents.has(event.id)}
                      isLoading={loadingEvents.has(event.id)}
                      isHighlighted={highlightedEvent === event.id}
                      onRemind={() =>
                        handleRemindMe(
                          event.id,
                          t((event.translationKey || event.title) as TranslationKey),
                          event.startAt,
                          event.location || '',
                        )
                      }
                      onEdit={() => {
                        setEditingEvent(event);
                        setEventFormOpen(true);
                      }}
                      onDelete={() => {
                        setEventToDelete(event);
                        setDeleteConfirmOpen(true);
                      }}
                      getLocaleString={getLocaleString}
                    />
                  </ScrollReveal>
                </article>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-mq-surface rounded-2xl border border-mq-border border-dashed">
                <Rss className="h-12 w-12 mx-auto mb-4 text-mq-content-tertiary" />
                <h3 className="text-lg font-semibold text-mq-content mb-2">{t('noEventsFound')}</h3>
                <p className="text-sm text-mq-content-secondary max-w-sm mx-auto mb-6">
                  {t('noEventsFoundDesc') ||
                    "Try adjusting your filters or search query to find what you're looking for."}
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveFilter('All');
                      setSearchQuery('');
                      setTimeRange('upcoming');
                    }}
                  >
                    {t('clearFilters') || 'Clear filters'}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingEvent(null);
                      setEventFormOpen(true);
                    }}
                  >
                    {t('createFirstEvent') || 'Create event'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <FeedSidebar stats={stats} />
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
                <h3 className="text-lg font-semibold text-mq-content">{t('deleteEventConfirm')}</h3>
                <p className="text-sm text-mq-content-secondary">{eventToDelete.title}</p>
              </div>
            </div>
            <p className="text-sm text-mq-content-secondary mb-6">{t('deleteEventConfirmDesc')}</p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setEventToDelete(null);
                }}
              >
                {t('cancelAction')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (eventToDelete) {
                    removeEvent(eventToDelete.id);
                    setDeleteConfirmOpen(false);
                    setEventToDelete(null);
                    toastUtils.success(t('eventDeleted'), t('eventDeletedDesc'));
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {t('confirmDelete')}
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

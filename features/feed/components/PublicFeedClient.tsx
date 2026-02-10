'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { usePublicEventsStore } from '@/lib/store/publicEventsStore';
import { PublicEvent } from '@/lib/types/publicEvents';
import { toastUtils } from '@/lib/utils/toast';

// Components
import { FeaturedEventsBanner } from './FeaturedEventsBanner';
import { PublicEventCard } from './PublicEventCard';
import { EventDetailModal } from './EventDetailModal';
import { AnnouncementsSection } from './AnnouncementsSection';
import { QuickStats } from './QuickStats';
import { FeedSkeletons } from './FeedSkeletons';
import { MagicCard } from '@/components/ui/MagicCard';

type CategoryFilter = 'All' | 'Career' | 'Social' | 'Academic' | 'Free Food';
type TimeFilter = 'all' | 'today' | 'week' | 'month';
type SortOption = 'date' | 'priority' | 'category';

const categoryFilters: { value: CategoryFilter; icon: string }[] = [
  { value: 'All', icon: '📋' },
  { value: 'Academic', icon: '📚' },
  { value: 'Career', icon: '💼' },
  { value: 'Social', icon: '🎉' },
  { value: 'Free Food', icon: '🍕' },
];

export default function PublicFeedClient() {
  const { t, language } = useTypedTranslation();
  const locale = language === 'en' ? 'en-AU' : language;
  const categoryLabelByValue: Record<CategoryFilter, string> = {
    All: t('all'),
    Academic: t('academic'),
    Career: t('career'),
    Social: t('social'),
    'Free Food': t('freeFood'),
  };

  // Store
  const {
    events,
    featuredEvents,
    isLoading,
    isAddingToCalendar,
    addedToCalendar,
    error,
    fetchPublicEvents,
    addToCalendar,
  } = usePublicEventsStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date');
  const [selectedEvent, setSelectedEvent] = useState<PublicEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch events on mount
  useEffect(() => {
    fetchPublicEvents();
  }, [fetchPublicEvents]);

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query) ||
          e.location.toLowerCase().includes(query) ||
          (e.building && e.building.toLowerCase().includes(query)),
      );
    }

    // Category filter
    if (categoryFilter !== 'All') {
      result = result.filter((e) => e.category === categoryFilter);
    }

    // Time filter
    const now = new Date();
    if (timeFilter === 'today') {
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      result = result.filter((e) => e.startAt <= endOfDay);
    } else if (timeFilter === 'week') {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + 7);
      result = result.filter((e) => e.startAt <= endOfWeek);
    } else if (timeFilter === 'month') {
      const endOfMonth = new Date(now);
      endOfMonth.setMonth(now.getMonth() + 1);
      result = result.filter((e) => e.startAt <= endOfMonth);
    }

    // Sort
    if (sortOption === 'date') {
      result.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    } else if (sortOption === 'priority') {
      result.sort((a, b) => b.priority - a.priority);
    } else if (sortOption === 'category') {
      result.sort((a, b) => a.category.localeCompare(b.category));
    }

    return result;
  }, [events, searchQuery, categoryFilter, timeFilter, sortOption]);

  // Non-featured events for the grid
  const gridEvents = useMemo(() => {
    const featuredIds = new Set(featuredEvents.map((e) => e.id));
    return filteredEvents.filter((e) => !featuredIds.has(e.id));
  }, [filteredEvents, featuredEvents]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      All: events.length,
      Career: 0,
      Social: 0,
      Academic: 0,
      'Free Food': 0,
    };
    events.forEach((e) => {
      if (e.category in counts) {
        counts[e.category as Exclude<CategoryFilter, 'All'>]++;
      }
    });
    return counts;
  }, [events]);

  // Handle add to calendar
  const handleAddToCalendar = useCallback(
    async (eventId: string) => {
      const result = await addToCalendar(eventId);

      if (result.success) {
        if (result.alreadyAdded) {
          toastUtils.info(t('alreadyAdded'), t('eventAlreadyInCalendar'));
        } else {
          toastUtils.success(t('addedToCalendar'), t('eventAddedSuccess'));
        }
      } else {
        toastUtils.error(t('error'), t('failedToAddEvent'));
      }
    },
    [addToCalendar, t],
  );

  // Handle event click
  const handleEventClick = useCallback((event: PublicEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedEvent(null), 200);
  }, []);

  return (
    <section className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-mq-content">{t('eventFeed')}</h1>
            <p className="text-mq-content-secondary mt-1">{t('feedDescription')}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Events */}
          <div className="flex-1 min-w-0">
            {/* Loading State */}
            {isLoading && <FeedSkeletons />}

            {/* Error State */}
            {error && !isLoading && (
              <MagicCard className="p-8 text-center">
                <p className="text-mq-error mb-4">{error}</p>
                <Button onClick={() => fetchPublicEvents()}>{t('tryAgain')}</Button>
              </MagicCard>
            )}

            {/* Content */}
            {!isLoading && !error && (
              <>
                {/* Featured Events Banner */}
                {featuredEvents.length > 0 && (
                  <FeaturedEventsBanner events={featuredEvents} onEventClick={handleEventClick} />
                )}

                {/* Search and Filters */}
                <MagicCard isLiquidEnhanced className="mb-6">
                  <div className="p-4 space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mq-content-tertiary" />
                      <Input
                        type="search"
                        placeholder={t('searchEventsPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Category Pills */}
                      <div className="flex flex-wrap gap-2">
                        {categoryFilters.map((cat) => (
                          <Button
                            key={cat.value}
                            variant={categoryFilter === cat.value ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setCategoryFilter(cat.value)}
                            className="gap-1.5"
                          >
                            <span>{cat.icon}</span>
                            {categoryLabelByValue[cat.value]}
                            {cat.value !== 'All' && (
                              <Badge
                                variant="secondary"
                                className={cn(
                                  'ml-1 text-[10px] min-w-4.5 h-4.5 flex items-center justify-center',
                                  categoryFilter === cat.value
                                    ? 'bg-white/20 text-white'
                                    : 'bg-mq-background-secondary',
                                )}
                              >
                                {categoryCounts[cat.value]}
                              </Badge>
                            )}
                          </Button>
                        ))}
                      </div>

                      {/* Sort & Time Filter */}
                      <div className="flex items-center gap-2 ml-auto">
                        <Select
                          value={timeFilter}
                          onValueChange={(v) => setTimeFilter(v as TimeFilter)}
                        >
                          <SelectTrigger className="w-30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('allTime')}</SelectItem>
                            <SelectItem value="today">{t('today')}</SelectItem>
                            <SelectItem value="week">{t('thisWeek')}</SelectItem>
                            <SelectItem value="month">{t('thisMonth')}</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          value={sortOption}
                          onValueChange={(v) => setSortOption(v as SortOption)}
                        >
                          <SelectTrigger className="w-32.5">
                            <SlidersHorizontal className="h-4 w-4 mr-2" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date">{t('sortByDate')}</SelectItem>
                            <SelectItem value="priority">{t('sortByPriority')}</SelectItem>
                            <SelectItem value="category">{t('sortByCategory')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </MagicCard>

                {/* Events Grid */}
                {gridEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {gridEvents.map((event) => (
                      <PublicEventCard
                        key={event.id}
                        event={event}
                        isAdded={addedToCalendar.has(event.id)}
                        isAdding={isAddingToCalendar.has(event.id)}
                        onAddToCalendar={() => handleAddToCalendar(event.id)}
                        onClick={() => handleEventClick(event)}
                        locale={locale}
                      />
                    ))}
                  </div>
                ) : (
                  <MagicCard className="p-12 text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-lg font-semibold text-mq-content mb-2">
                      {t('noEventsFound')}
                    </h3>
                    <p className="text-mq-content-secondary">{t('tryDifferentFilters')}</p>
                  </MagicCard>
                )}
              </>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="w-full lg:w-80 shrink-0 space-y-6">
            {/* Quick Stats */}
            <MagicCard isLiquidEnhanced>
              <div className="p-4">
                <QuickStats events={events} />
              </div>
            </MagicCard>

            {/* Announcements */}
            <MagicCard isLiquidEnhanced>
              <div className="p-4">
                <AnnouncementsSection />
              </div>
            </MagicCard>
          </aside>
        </div>

        {/* Event Detail Modal */}
        <EventDetailModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          isAdded={selectedEvent ? addedToCalendar.has(selectedEvent.id) : false}
          isAdding={selectedEvent ? isAddingToCalendar.has(selectedEvent.id) : false}
          onAddToCalendar={() => selectedEvent && handleAddToCalendar(selectedEvent.id)}
          locale={locale}
        />
      </div>
    </section>
  );
}

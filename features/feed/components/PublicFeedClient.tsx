'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/mq/button';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { PublicEvent } from '@/lib/types/publicEvents';
import { MagicCard } from '@/components/ui/MagicCard';
import { useHydration } from '@/lib/hooks';

// Components
import { FeaturedEventsBanner } from './FeaturedEventsBanner';
import { PublicEventCard } from './PublicEventCard';
import { EventDetailModal } from './EventDetailModal';
import { AnnouncementsSection } from './AnnouncementsSection';
import { QuickStats } from './QuickStats';
import { FeedSkeletons } from './FeedSkeletons';
import { PublicFeedFilters } from './PublicFeedFilters';

// Hooks
import { usePublicFeed } from '../hooks/usePublicFeed';

export default function PublicFeedClient() {
  const { t, language } = useTypedTranslation();
  const locale = language === 'en' ? 'en-AU' : language;
  const isHydrated = useHydration();

  // Custom hook for feed logic
  const {
    events,
    featuredEvents,
    gridEvents,
    isLoading,
    error,
    isAddingToCalendar,
    addedToCalendar,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    timeFilter,
    setTimeFilter,
    sortOption,
    setSortOption,
    categoryCounts,
    handleAddToCalendar,
    fetchPublicEvents,
  } = usePublicFeed();

  // Local state for modal
  const [selectedEvent, setSelectedEvent] = useState<PublicEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle event click - only if event is valid
  const handleEventClick = useCallback((event: PublicEvent) => {
    if (event && event.id) {
      setSelectedEvent(event);
      setIsModalOpen(true);
    }
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
            {/* Loading State - show during initial load or before hydration */}
            {(!isHydrated || isLoading) && <FeedSkeletons />}

            {/* Error State */}
            {isHydrated && error && !isLoading && (
              <MagicCard className="p-8 text-center">
                <p className="text-mq-error mb-4">{error}</p>
                <Button onClick={() => fetchPublicEvents()}>{t('tryAgain')}</Button>
              </MagicCard>
            )}

            {/* Content - only render after hydration */}
            {isHydrated && !isLoading && !error && (
              <>
                {/* Featured Events Banner - only render if we have valid featured events */}
                {featuredEvents && featuredEvents.length > 0 && featuredEvents[0]?.category && (
                  <FeaturedEventsBanner events={featuredEvents} onEventClick={handleEventClick} />
                )}

                {/* Search and Filters */}
                <PublicFeedFilters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  categoryFilter={categoryFilter}
                  onCategoryChange={setCategoryFilter}
                  timeFilter={timeFilter}
                  onTimeChange={setTimeFilter}
                  sortOption={sortOption}
                  onSortChange={setSortOption}
                  categoryCounts={categoryCounts}
                />

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

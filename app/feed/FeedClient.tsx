// app/feed/FeedClient.tsx
'use client';

import { useState, memo } from 'react';
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
} from 'lucide-react';
import { sampleEvents } from '@/data/sampleEvents';
import { UNIVERSITY_CONFIG } from '@/lib/config';
import Link from 'next/link';
import { useTranslation } from '@/lib/hooks/useTranslation';

const categoryColors: Record<string, string> = {
  Career: 'bg-mq-info/10 text-mq-info',
  Social: 'bg-mq-purple/10 text-mq-purple',
  Academic: 'bg-mq-success/10 text-mq-success',
  'Free Food': 'bg-mq-warning/10 text-mq-warning',
};

type FilterType = 'All' | 'Academic' | 'Career' | 'Social' | 'Free Food';

const FeedClient = memo(() => {
  const { t, language } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  // Filter events based on selected category
  const filteredEvents =
    activeFilter === 'All'
      ? sampleEvents
      : sampleEvents.filter((event) => event.category === activeFilter);

  // Calculate stats
  const thisWeeksEvents = sampleEvents.filter((event) => {
    const eventDate = new Date(event.date);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventDate >= now && eventDate <= weekFromNow;
  });

  const freeFoodEvents = sampleEvents.filter((event) => event.category === 'Free Food');

  const filters: FilterType[] = ['All', 'Academic', 'Career', 'Social', 'Free Food'];

  return (
    <div className="container mx-auto p-6 max-w-7xl feed-page">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-mq-3xl font-bold text-mq-content mb-2">{t('campusFeed')}</h1>
          <p className="text-mq-content-secondary">
            {t('campusFeedDesc', { uniName: UNIVERSITY_CONFIG.name })}
          </p>
        </div>
      </header>

      {/* Info Banner */}
      <div
        className="mb-6 p-4 bg-mq-background-secondary border border-mq-border rounded-mq-lg flex items-start gap-3 stay-connected-banner"
        style={{ color: 'var(--mq-content)' }}
      >
        <Info className="h-5 w-5 text-mq-content-secondary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-mq-sm text-mq-content" style={{ color: 'var(--mq-content)' }}>
            <strong>{t('stayConnected')}</strong> {t('stayConnectedDesc')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filter Tabs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {t('filterEvents')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => {
                  const isActive = activeFilter === filter;
                  return (
                    <Button
                      key={filter}
                      variant={isActive ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setActiveFilter(filter)}
                      aria-pressed={isActive}
                    >
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {t(`filter_${filter.replace(/ /g, '')}` as any)}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {activeFilter === 'All'
                    ? t('allEvents')
                    : t('categoryEvents', {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        category: t(`category_${activeFilter.replace(/ /g, '')}` as any),
                      })}
                </span>
                <Badge variant="neutral">
                  {t('eventsCount', { count: filteredEvents.length })}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <div key={event.id} className="mq-magic-card">
                      <div
                        className="mq-magic-card-content p-4 alabaster-readable"
                        style={{
                          color: 'var(--mq-content)',
                          WebkitTextFillColor: 'var(--mq-content)',
                          opacity: 1,
                          mixBlendMode: 'normal',
                        }}
                      >
                        {/* Event Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h3 className="font-semibold text-mq-content text-mq-lg">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {t((event.translationKey || event.title) as any)}
                          </h3>
                          <Badge
                            className={`${categoryColors[event.category as keyof typeof categoryColors]} alabaster-readable`}
                          >
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {t(`category_${event.category.replace(/ /g, '')}` as any)}
                          </Badge>
                        </div>

                        {/* Event Description */}
                        <p className="text-mq-sm text-mq-content-secondary mb-3">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {t((event.descriptionKey || event.description) as any)}
                        </p>

                        {/* Event Details */}
                        <div className="flex flex-wrap items-center gap-4 text-mq-sm text-mq-content-secondary">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(event.date).toLocaleDateString(
                              language === 'fa' ? 'fa-IR' : language === 'es' ? 'es-ES' : 'en-AU',
                              {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              },
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {event.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="mt-3 pt-3 border-t border-mq-border flex gap-2 flex-wrap">
                          <Button variant="secondary" size="sm">
                            {t('remindMe')}
                          </Button>
                          <Button asChild variant="secondary" size="sm">
                            <Link href={`/map?building=${event.building}`}>
                              <Navigation className="h-4 w-4 mr-2" />
                              {t('navigate')}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-mq-content-secondary">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-mq-content-tertiary" />
                    <p>{t('noEventsFound')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="mq-magic-card">
            <Card className="mq-magic-card-content">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t('thisWeek')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className="flex items-center justify-between p-3 bg-mq-info/10 rounded-mq-lg alabaster-readable"
                  style={{ color: 'var(--mq-content)', WebkitTextFillColor: 'var(--mq-content)' }}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-mq-info" />
                    <span className="text-mq-sm font-medium text-mq-content">
                      {t('totalEvents')}
                    </span>
                  </div>
                  <span className="text-mq-lg font-bold text-mq-info">{sampleEvents.length}</span>
                </div>
                <div
                  className="flex items-center justify-between p-3 bg-mq-purple/10 rounded-mq-lg alabaster-readable"
                  style={{ color: 'var(--mq-content)', WebkitTextFillColor: 'var(--mq-content)' }}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-mq-purple" />
                    <span className="text-mq-sm font-medium text-mq-content">{t('thisWeek')}</span>
                  </div>
                  <span className="text-mq-lg font-bold text-mq-purple">
                    {thisWeeksEvents.length}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between p-3 bg-mq-warning/10 rounded-mq-lg alabaster-readable"
                  style={{ color: 'var(--mq-content)', WebkitTextFillColor: 'var(--mq-content)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-mq-warning">🍕</span>
                    <span className="text-mq-sm font-medium text-mq-content">{t('freeFood')}</span>
                  </div>
                  <span className="text-mq-lg font-bold text-mq-warning">
                    {freeFoodEvents.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Announcements */}
          <div className="mq-magic-card">
            <Card className="mq-magic-card-content">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  {t('announcements')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-mq-success/10 rounded-mq-lg border border-mq-success/20">
                  <div className="flex items-start gap-2">
                    <Badge className="bg-mq-success text-white">{t('new')}</Badge>
                    <div>
                      <h4 className="font-semibold text-mq-content text-mq-sm">
                        {t('phase2Updates')}
                      </h4>
                      <p className="text-mq-xs text-mq-content-secondary mt-1">
                        {t('phase2UpdatesDesc')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-mq-warning/10 rounded-mq-lg border border-mq-warning/20">
                  <div className="flex items-start gap-2">
                    <Badge className="bg-mq-warning text-white">{t('info')}</Badge>
                    <div>
                      <h4 className="font-semibold text-mq-content text-mq-sm">
                        {t('welcomeToApp', { appName: 'MQ Sync' })}
                      </h4>
                      <p className="text-mq-xs text-mq-content-secondary mt-1">
                        {t('appCompanionDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Event Categories */}
          <div className="mq-magic-card">
            <Card className="mq-magic-card-content">
              <CardHeader>
                <CardTitle>{t('eventCategories')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className="flex items-center justify-between alabaster-readable"
                  style={{ color: 'var(--mq-content)', WebkitTextFillColor: 'var(--mq-content)' }}
                >
                  <Badge
                    className="bg-mq-success/10 text-mq-success alabaster-readable"
                    style={{ color: 'var(--mq-content)', WebkitTextFillColor: 'var(--mq-content)' }}
                  >
                    {t('category_Academic')}
                  </Badge>
                  <span className="text-mq-sm text-mq-content-secondary">Workshops & Study</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge
                    className="bg-mq-info/10 text-mq-info alabaster-readable"
                    style={{ color: 'var(--mq-content)', WebkitTextFillColor: 'var(--mq-content)' }}
                  >
                    {t('category_Career')}
                  </Badge>
                  <span className="text-mq-sm text-mq-content-secondary">Job & Internship</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge
                    className="bg-mq-purple/10 text-mq-purple alabaster-readable"
                    style={{ color: 'var(--mq-content)', WebkitTextFillColor: 'var(--mq-content)' }}
                  >
                    {t('category_Social')}
                  </Badge>
                  <span className="text-mq-sm text-mq-content-secondary">Meetups & Networking</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge
                    className="bg-mq-warning/10 text-mq-warning alabaster-readable"
                    style={{ color: 'var(--mq-content)', WebkitTextFillColor: 'var(--mq-content)' }}
                  >
                    {t('category_FreeFood')}
                  </Badge>
                  <span className="text-mq-sm text-mq-content-secondary">Meals & Snacks</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
});

FeedClient.displayName = 'FeedClient';

export default FeedClient;

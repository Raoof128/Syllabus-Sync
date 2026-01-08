// app/feed/FeedClient.tsx
'use client';

import { useState, memo, useMemo } from 'react';
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
} from 'lucide-react';
import { sampleEvents } from '@/data/sampleEvents';
import { UNIVERSITY_CONFIG } from '@/lib/config';
import Link from 'next/link';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

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
        ? sampleEvents
        : sampleEvents.filter((event) => event.category === activeFilter),
    [activeFilter],
  );

  // Calculate stats
  const stats = useMemo(() => {
    const thisWeeksEvents = sampleEvents.filter((event) => {
      const eventDate = new Date(event.date);
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return eventDate >= now && eventDate <= weekFromNow;
    });

    const freeFoodEvents = sampleEvents.filter((event) => event.category === 'Free Food');

    return {
      total: sampleEvents.length,
      thisWeek: thisWeeksEvents.length,
      freeFood: freeFoodEvents.length,
    };
  }, []);

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
            <div className="mq-magic-card mq-liquid-enhanced">
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
            </div>
          </ScrollReveal>

          {/* Events List */}
          <ScrollReveal delay={0.2}>
            <div className="mq-magic-card mq-liquid-enhanced">
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
                        filteredEvents.map((event, index) => (
                          <article
                            key={event.id}
                            className="p-4 bg-mq-background-secondary rounded-mq-lg border border-mq-border hover:border-mq-border-secondary hover:shadow-mq-sm transition-all duration-mq-fast"
                            aria-posinset={index + 1}
                            aria-setsize={filteredEvents.length}
                          >
                            {/* Event Header */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <h3 className="font-semibold text-mq-content text-mq-lg">
                                {t(
                                  (event.translationKey || event.title) as Parameters<typeof t>[0],
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
                              <Button variant="secondary" size="sm">
                                {t('remindMe')}
                              </Button>
                              <Button asChild variant="secondary" size="sm">
                                <Link
                                  href={`/map?building=${event.building}`}
                                  aria-label={t('navigateToBuildingAria', {
                                    building: event.location,
                                  })}
                                >
                                  <Navigation className="h-4 w-4 mr-1.5" aria-hidden="true" />
                                  {t('navigate')}
                                </Link>
                              </Button>
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <Rss
                            className="h-12 w-12 mx-auto mb-4 text-mq-content-tertiary"
                            aria-hidden="true"
                          />
                          <h3 className="text-mq-lg font-semibold text-mq-content mb-2">
                            {t('noEventsFound')}
                          </h3>
                          <p className="text-mq-content-secondary max-w-md mx-auto">
                            {t('noEventsFound')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Sidebar - 1 column */}
        <aside className="space-y-6" aria-label="Event statistics and announcements">
          {/* Quick Stats */}
          <ScrollReveal delay={0.25}>
            <div className="mq-magic-card mq-liquid-enhanced">
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
            </div>
          </ScrollReveal>

          {/* Announcements */}
          <ScrollReveal delay={0.3}>
            <div className="mq-magic-card mq-liquid-enhanced">
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
                            {t('welcomeToApp', { appName: 'MQ Sync' })}
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
            </div>
          </ScrollReveal>

          {/* Event Categories Legend */}
          <ScrollReveal delay={0.35}>
            <div className="mq-magic-card mq-liquid-enhanced">
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
            </div>
          </ScrollReveal>
        </aside>
      </div>
    </div>
  );
});

FeedClient.displayName = 'FeedClient';

export default FeedClient;

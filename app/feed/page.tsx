// app/feed/page.tsx
'use client';

import { useState } from 'react';
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

const categoryColors: Record<string, string> = {
  Career: 'bg-mq-info/10 text-mq-info',
  Social: 'bg-mq-purple/10 text-mq-purple',
  Academic: 'bg-mq-success/10 text-mq-success',
  'Free Food': 'bg-mq-warning/10 text-mq-warning',
};

type FilterType = 'All' | 'Academic' | 'Career' | 'Social' | 'Free Food';

export default function FeedPage() {
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
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-mq-3xl font-bold text-mq-content mb-2">Campus Feed</h1>
          <p className="text-mq-content-secondary">
            Stay updated with campus events, announcements, and opportunities at{' '}
            {UNIVERSITY_CONFIG.name}.
          </p>
        </div>
      </header>

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-mq-slate-100 border border-mq-slate-300 rounded-mq-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-mq-navy-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-mq-sm text-mq-navy-900">
            <strong>Stay connected:</strong> Discover workshops, career fairs, social events, and
            free food opportunities happening on campus.
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
                Filter Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <Button
                    key={filter}
                    variant={activeFilter === filter ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {activeFilter === 'All' ? 'All Events' : `${activeFilter} Events`}
                </span>
                <Badge variant="neutral">{filteredEvents.length} events</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 bg-mq-card-background rounded-mq-lg hover:bg-mq-hover-background transition-all duration-mq-fast ease-mq-snap hover:shadow-mq border border-mq-border hover:border-mq-border-secondary"
                    >
                      {/* Event Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="font-semibold text-mq-content text-mq-lg">
                          {event.title}
                        </h3>
                        <Badge
                          className={categoryColors[event.category as keyof typeof categoryColors]}
                        >
                          {event.category}
                        </Badge>
                      </div>

                      {/* Event Description */}
                      <p className="text-mq-sm text-mq-content-secondary mb-3">
                        {event.description}
                      </p>

                      {/* Event Details */}
                      <div className="flex flex-wrap items-center gap-4 text-mq-sm text-mq-content-secondary">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(event.date).toLocaleDateString('en-AU', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
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
                          Remind Me
                        </Button>
                        <Button asChild variant="secondary" size="sm">
                          <Link href={`/map?building=${event.building}`}>
                            <Navigation className="h-4 w-4 mr-2" />
                            Navigate
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-mq-content-secondary">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-mq-content-tertiary" />
                    <p>No events found for this category.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-mq-info/10 rounded-mq-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-mq-info" />
                  <span className="text-mq-sm font-medium text-mq-content">
                    Total Events
                  </span>
                </div>
                <span className="text-mq-lg font-bold text-mq-info">
                  {sampleEvents.length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-mq-purple/10 rounded-mq-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-mq-purple" />
                  <span className="text-mq-sm font-medium text-mq-content">
                    This Week
                  </span>
                </div>
                <span className="text-mq-lg font-bold text-mq-purple">
                  {thisWeeksEvents.length}
                </span>
               </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-mq-lg">
                <div className="flex items-center gap-2">
                  <span className="text-orange-600">🍕</span>
                  <span className="text-mq-sm font-medium text-mq-content">
                    Free Food
                  </span>
                </div>
                <span className="text-mq-lg font-bold text-orange-600">
                  {freeFoodEvents.length}
                </span>
               </div>
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-mq-success/10 rounded-mq-lg border border-mq-success/20">
                <div className="flex items-start gap-2">
                  <Badge className="bg-mq-success text-white">New</Badge>
                  <div>
                    <h4 className="font-semibold text-mq-content text-mq-sm">
                      Phase 2 Updates
                    </h4>
                    <p className="text-mq-xs text-mq-content-secondary mt-1">
                      Calendar and map features coming soon!
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-mq-warning/10 rounded-mq-lg border border-mq-warning/20">
                <div className="flex items-start gap-2">
                  <Badge className="bg-mq-warning text-white">Info</Badge>
                  <div>
                    <h4 className="font-semibold text-mq-content text-mq-sm">
                      Welcome to MQ Sync
                    </h4>
                    <p className="text-mq-xs text-mq-content-secondary mt-1">
                      Your Macquarie University companion app.
                    </p>
                  </div>
               </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories Legend */}
          <Card>
            <CardHeader>
              <CardTitle>Event Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={categoryColors.Academic}>
                  Academic
                </Badge>
                <span className="text-mq-sm text-mq-content-secondary">Workshops & Study</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={categoryColors.Career}>
                  Career
                </Badge>
                <span className="text-mq-sm text-mq-content-secondary">Job & Internship</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={categoryColors.Social}>
                  Social
                </Badge>
                <span className="text-mq-sm text-mq-content-secondary">
                  Meetups & Networking
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={categoryColors['Free Food']}>
                  Free Food
                </Badge>
                <span className="text-mq-sm text-mq-content-secondary">Meals & Snacks</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

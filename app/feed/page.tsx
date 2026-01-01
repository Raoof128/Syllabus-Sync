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
  Career: 'bg-mq-navy-100 text-mq-navy-800',
  Social: 'bg-mq-purple text-white',
  Academic: 'bg-green-100 text-green-800',
  'Free Food': 'bg-orange-100 text-orange-800',
};

type FilterType = 'All' | 'Academic' | 'Career' | 'Social' | 'Free Food';

export default function FeedPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  // Filter events based on selected category
  const filteredEvents =
    activeFilter === 'All'
      ? sampleEvents
      : sampleEvents.filter((event) => event.category === activeFilter);

  const filters: FilterType[] = ['All', 'Academic', 'Career', 'Social', 'Free Food'];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Campus Feed</h1>
          <p className="text-gray-600">
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
                      className="p-4 bg-mq-background-secondary rounded-mq-lg hover:bg-mq-background-tertiary transition-all duration-mq-fast ease-mq-snap hover:shadow-mq border border-mq-border hover:border-mq-border-secondary"
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
                      <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2 flex-wrap">
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
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
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
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    Total Events
                  </span>
                </div>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {sampleEvents.length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    Social Events
                  </span>
                </div>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {sampleEvents.filter((e) => e.category === 'Social').length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-orange-600 dark:text-orange-400">🍕</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    Free Food
                  </span>
                </div>
                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {sampleEvents.filter((e) => e.category === 'Free Food').length}
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
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-2">
                  <Badge className="bg-green-600 dark:bg-green-700 text-white">New</Badge>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-slate-100 text-sm">
                      Phase 2 Updates
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                      Calendar and map features coming soon!
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <Badge className="bg-yellow-600 dark:bg-yellow-700 text-white">Info</Badge>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-slate-100 text-sm">
                      Demo Preparation
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                      Getting ready for MQU admin demo in Phase 3.
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
                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                  Academic
                </Badge>
                <span className="text-sm text-gray-600 dark:text-slate-400">Workshops & Study</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                  Career
                </Badge>
                <span className="text-sm text-gray-600 dark:text-slate-400">Job & Internship</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                  Social
                </Badge>
                <span className="text-sm text-gray-600 dark:text-slate-400">
                  Meetups & Networking
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                  Free Food
                </Badge>
                <span className="text-sm text-gray-600 dark:text-slate-400">Meals & Snacks</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

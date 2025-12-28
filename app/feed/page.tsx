// app/feed/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    MapPin,
    Clock,
    Filter,
    Bell,
    TrendingUp,
    Users,
    Megaphone,
    Info
} from "lucide-react";
import { sampleEvents } from "@/data/sampleEvents";

const categoryColors = {
    Career: 'bg-blue-100 text-blue-800',
    Social: 'bg-purple-100 text-purple-800',
    Academic: 'bg-green-100 text-green-800',
    'Free Food': 'bg-orange-100 text-orange-800',
};

type FilterType = 'All' | 'Academic' | 'Career' | 'Social' | 'Free Food';

export default function FeedPage() {
    const [activeFilter, setActiveFilter] = useState<FilterType>('All');

    // Filter events based on selected category
    const filteredEvents = activeFilter === 'All'
        ? sampleEvents
        : sampleEvents.filter(event => event.category === activeFilter);

    const filters: FilterType[] = ['All', 'Academic', 'Career', 'Social', 'Free Food'];

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Campus Feed
                </h1>
                <p className="text-gray-600">
                    Stay updated with campus events, announcements, and opportunities at Macquarie University.
                </p>
            </div>

            {/* Info Banner */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="text-sm text-blue-900">
                        <strong>Stay connected:</strong> Discover workshops, career fairs, social events, and free food opportunities happening on campus.
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
                                        variant={activeFilter === filter ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setActiveFilter(filter)}
                                        className={activeFilter === filter ? "bg-blue-600 hover:bg-blue-700" : ""}
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
                                <Badge variant="outline">{filteredEvents.length} events</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {filteredEvents.length > 0 ? (
                                    filteredEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all hover:shadow-md cursor-pointer border border-transparent hover:border-gray-200"
                                        >
                                            {/* Event Header */}
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <h3 className="font-semibold text-gray-900 text-lg">
                                                    {event.title}
                                                </h3>
                                                <Badge className={categoryColors[event.category as keyof typeof categoryColors]}>
                                                    {event.category}
                                                </Badge>
                                            </div>

                                            {/* Event Description */}
                                            <p className="text-sm text-gray-600 mb-3">
                                                {event.description}
                                            </p>

                                            {/* Event Details */}
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {event.date instanceof Date
                                                        ? event.date.toLocaleDateString('en-AU', {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })
                                                        : new Date(event.date).toLocaleDateString('en-AU', {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })
                                                    }
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
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                                    <Bell className="h-4 w-4 mr-2" />
                                                    Remind Me
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
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium text-gray-900">Total Events</span>
                                </div>
                                <span className="text-lg font-bold text-blue-600">{sampleEvents.length}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-medium text-gray-900">Social Events</span>
                                </div>
                                <span className="text-lg font-bold text-purple-600">
                                    {sampleEvents.filter(e => e.category === 'Social').length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className="text-orange-600">🍕</span>
                                    <span className="text-sm font-medium text-gray-900">Free Food</span>
                                </div>
                                <span className="text-lg font-bold text-orange-600">
                                    {sampleEvents.filter(e => e.category === 'Free Food').length}
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
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-start gap-2">
                                    <Badge className="bg-green-600 text-white">New</Badge>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-sm">Phase 2 Updates</h4>
                                        <p className="text-xs text-gray-600 mt-1">
                                            Calendar and map features coming soon!
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="flex items-start gap-2">
                                    <Badge className="bg-yellow-600 text-white">Info</Badge>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-sm">Demo Preparation</h4>
                                        <p className="text-xs text-gray-600 mt-1">
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
                                <Badge className="bg-green-100 text-green-800">Academic</Badge>
                                <span className="text-sm text-gray-600">Workshops & Study</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-blue-100 text-blue-800">Career</Badge>
                                <span className="text-sm text-gray-600">Job & Internship</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-purple-100 text-purple-800">Social</Badge>
                                <span className="text-sm text-gray-600">Meetups & Networking</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-orange-100 text-orange-800">Free Food</Badge>
                                <span className="text-sm text-gray-600">Meals & Snacks</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}


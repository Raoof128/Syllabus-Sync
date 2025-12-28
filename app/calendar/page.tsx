// app/calendar/page.tsx
'use client';

import { Calendar, Filter, Clock, Bell, Grid3x3, List, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CalendarPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
        <p className="text-gray-600">
          View and manage your academic schedule, assignments, and important dates.
        </p>
      </div>

      {/* Development Notice */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-blue-900">
            <strong>Coming soon:</strong> Interactive calendar with classes, assignments, and events
            is under development by Kit.
          </p>
        </div>
      </div>

      {/* Calendar Placeholder */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 h-96 rounded-lg flex flex-col items-center justify-center">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">Calendar grid coming soon...</p>
            <Badge className="mt-4 bg-yellow-100 text-yellow-800">Phase 2</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Feature Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Views */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid3x3 className="h-5 w-5" />
              Multiple Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900">Month/Week/Day</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Switch between different calendar views to see your schedule at various levels of
                  detail.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Coming in Phase 2</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Filtering */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Event Filtering
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900">Filter by Unit</h4>
                <p className="text-sm text-gray-600 mt-1">
                  View events for specific units or categories to focus on what matters most.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Coming in Phase 2</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Smart Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900">Never Miss a Deadline</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Get timely notifications for upcoming assignments and exam schedules.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Coming in Phase 2</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Features */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Planned Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                📅
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Interactive Calendar Grid</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Drag-and-drop event management with month, week, and day views.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                🎯
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Assignment Tracking</h4>
                <p className="text-sm text-gray-600 mt-1">
                  See all deadlines and exam schedules synced with your units.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                🔔
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Custom Reminders</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Set personalized alerts for important events and deadlines.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                ⏰
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Class Schedule</h4>
                <p className="text-sm text-gray-600 mt-1">
                  View your weekly class timetable with room locations.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Developer Info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Assigned to: <span className="font-medium text-gray-700">Kit</span>
      </div>
    </div>
  );
}

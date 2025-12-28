// app/map/page.tsx
'use client';

import { MapPin, Navigation, Building2, Clock, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MapPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Campus Map</h1>
        <p className="text-gray-600">Navigate Macquarie University campus with ease.</p>
      </div>

      {/* Development Notice */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-blue-900">
            <strong>Coming soon:</strong> Interactive campus map with building locations and
            navigation is under development.
          </p>
        </div>
      </div>

      {/* Map Placeholder */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Interactive Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 h-80 rounded-lg flex flex-col items-center justify-center">
            <MapPin className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">Map view coming soon...</p>
            <Badge className="mt-4 bg-yellow-100 text-yellow-800">Week 6</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Feature Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Building Markers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Building Markers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900">Campus Buildings</h4>
                <p className="text-sm text-gray-600 mt-1">
                  View all campus buildings with names, codes, and room information.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Coming in Week 6</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Turn-by-Turn Navigation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900">Walking Directions</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Get directions between buildings with estimated walking time.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Coming in Week 6</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Live Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900">Real-time Tracking</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Track your current location on campus in real-time.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Coming in Week 6</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

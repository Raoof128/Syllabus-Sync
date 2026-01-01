// app/map/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { MapPin, Navigation, Building2, Clock, Info, ExternalLink, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UNIVERSITY_CONFIG, CAMPUS_BUILDINGS } from '@/lib/config';
import Link from 'next/link';

export default function MapPage() {
  const searchParams = useSearchParams();
  const selectedBuilding = searchParams.get('building');

  // Find building details if one is selected
  const buildingDetails = selectedBuilding
    ? CAMPUS_BUILDINGS.find((b) => b.code === selectedBuilding)
    : null;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Campus Map</h1>
          <p className="text-gray-600">Navigate {UNIVERSITY_CONFIG.name} campus with ease.</p>
        </div>
      </header>

      {/* Selected Building Banner */}
      {selectedBuilding && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Navigation className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">
                Navigating to: <strong>{buildingDetails?.name || selectedBuilding}</strong>
              </p>
              <p className="text-xs text-green-700">Building {selectedBuilding}</p>
            </div>
          </div>
          <Link href="/map">
            <Button variant="outline" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Clear
            </Button>
          </Link>
        </div>
      )}

      {/* Development Notice */}
      {!selectedBuilding && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Preview:</strong> View the campus on Google Maps below. Interactive building
              markers and navigation coming soon!
            </p>
          </div>
        </div>
      )}

      {/* Map with Google Maps Embed */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Campus Overview</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://www.google.com/maps/place/Macquarie+University/@-33.7738,151.1126,16z"
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Google Maps
            </a>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3316.0!2d151.1126!3d-33.7738!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6b12a5f0c1b3f0e5%3A0x8e0c3f8f0e0f0e0f!2sMacquarie%20University!5e0!3m2!1sen!2sau!4v1640000000000"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Macquarie University Campus Map"
            />
          </div>
        </CardContent>
      </Card>

      {/* Campus Buildings Quick Reference */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Campus Buildings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CAMPUS_BUILDINGS.map((building) => {
              const isSelected = selectedBuilding === building.code;
              return (
                <Link
                  key={building.code}
                  href={`/map?building=${building.code}`}
                  aria-current={isSelected ? 'page' : undefined}
                  className={`p-3 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-green-100 border-2 border-green-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">{building.code}</div>
                    {isSelected && (
                      <Badge className="bg-green-500 text-white text-xs">Selected</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{building.name}</div>
                </Link>
              );
            })}
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
                <span>Coming Soon</span>
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
                <span>Coming Soon</span>
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
                <span>Coming Soon</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// app/map/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import MapClient from './MapClient';

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Campus Map`,
  description:
    'Navigate the campus with an interactive map featuring building locations and directions.',
  openGraph: {
    title: `${APP_CONFIG.name} - Campus Map`,
    description:
      'Navigate the campus with an interactive map featuring building locations and directions.',
    type: 'website',
    images: [
      {
        url: `${UNIVERSITY_CONFIG.website}/MQ_Logo_Final.png`,
        alt: `${APP_CONFIG.name} logo`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [`${UNIVERSITY_CONFIG.website}/MQ_Logo_Final.png`],
  },
};

// Skeleton loader for map page - mimics map layout
function MapSkeleton() {
  return (
    <div className="container mx-auto p-4 max-w-7xl animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-10 bg-mq-background-secondary rounded-mq w-48 mb-2" />
        <div className="h-5 bg-mq-background-secondary rounded-mq w-72" />
      </div>

      {/* Search skeleton */}
      <div className="mb-4 space-y-4">
        <div className="h-10 bg-mq-background-secondary rounded-mq-lg border border-mq-border" />
        <div className="h-24 bg-mq-info/10 rounded-mq-lg border border-mq-info/20" />
      </div>

      {/* Map skeleton with fixed dimensions to prevent CLS */}
      <div className="bg-mq-card-background rounded-mq-lg border border-mq-border p-4 mb-6">
        <div className="h-8 bg-mq-background-secondary rounded-mq w-48 mb-4" />
        <div className="h-96 md:h-[500px] bg-mq-background-secondary rounded-mq-lg flex items-center justify-center">
          <div className="text-mq-content-tertiary">Loading map...</div>
        </div>
      </div>

      {/* Building grid skeleton */}
      <div className="bg-mq-card-background rounded-mq-lg border border-mq-border p-4">
        <div className="h-8 bg-mq-background-secondary rounded-mq w-48 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-20 bg-mq-background-secondary rounded-mq-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <section className="container mx-auto p-4 max-w-7xl map-page" aria-label="Campus Map">
        <MapClient />
      </section>
    </Suspense>
  );
}

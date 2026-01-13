// app/calendar/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import CalendarClient from './CalendarClient';

export const metadata: Metadata = {
  title: 'Calendar',
  description: 'View and manage upcoming deadlines, assignments, and events in one calendar.',
  alternates: {
    canonical: '/calendar',
  },
  openGraph: {
    title: `${APP_CONFIG.name} - Calendar`,
    description: 'View and manage upcoming deadlines, assignments, and events in one calendar.',
    type: 'website',
    url: '/calendar',
    images: [
      {
        url: `${UNIVERSITY_CONFIG.website}/MQ_Logo_Final.png`,
        alt: `${APP_CONFIG.name} logo`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_CONFIG.name} - Calendar`,
    description: 'View and manage upcoming deadlines, assignments, and events in one calendar.',
    images: [`${UNIVERSITY_CONFIG.website}/MQ_Logo_Final.png`],
  },
};

// Skeleton loader for calendar page
function CalendarSkeleton() {
  return (
    <div className="container mx-auto p-6 max-w-7xl animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-10 bg-mq-background-secondary rounded-mq w-48 mb-2" />
        <div className="h-5 bg-mq-background-secondary rounded-mq w-80" />
      </div>

      {/* Calendar card skeleton */}
      <div className="mq-magic-card">
        <div className="mq-magic-card-content p-6">
          <div className="h-8 bg-mq-background-secondary rounded-mq w-56 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 bg-mq-background-secondary rounded-mq border border-mq-border"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <section className="container mx-auto p-6 max-w-7xl calendar-page" aria-label="Calendar">
        <CalendarClient />
      </section>
    </Suspense>
  );
}

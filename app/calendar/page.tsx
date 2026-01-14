// app/calendar/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import CalendarClient from './CalendarClient';

export const metadata: Metadata = {
  title: 'Calendar | Syllabus Sync',
  description:
    'Track your Macquarie University assignments, exams, and campus events in one integrated calendar.',
  alternates: {
    canonical: '/calendar',
  },
  openGraph: {
    title: `${APP_CONFIG.name} - Calendar`,
    description:
      'Track your Macquarie University assignments, exams, and campus events in one integrated calendar.',
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
    description:
      'Track your Macquarie University assignments, exams, and campus events in one integrated calendar.',
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
      <main id="main-content" className="container mx-auto p-6 max-w-7xl calendar-page" role="main">
        {/* Structured Data for Calendar (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EventCalendar',
              name: 'Syllabus Sync - Macquarie University Calendar',
              description:
                'View and manage upcoming deadlines, assignments, and events in one calendar.',
              url: 'https://syllabus-sync.vercel.app/calendar',
            }),
          }}
        />
        {/* Structured Data for Key Events (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'Event',
                name: 'Career Fair 2026',
                description: 'Annual career fair for Macquarie University students',
                startDate: '2026-01-15T10:00:00+11:00',
                endDate: '2026-01-15T16:00:00+11:00',
                location: {
                  '@type': 'Place',
                  name: 'Macquarie University Campus',
                  address: 'Balaclava Rd, Macquarie Park NSW 2109, Australia',
                },
                organizer: {
                  '@type': 'Organization',
                  name: 'Macquarie University',
                },
              },
              {
                '@context': 'https://schema.org',
                '@type': 'Event',
                name: 'Free Pizza Friday',
                description: 'Weekly free pizza event for students',
                startDate: '2026-01-17T12:00:00+11:00',
                endDate: '2026-01-17T14:00:00+11:00',
                location: {
                  '@type': 'Place',
                  name: 'Macquarie University Campus',
                  address: 'Balaclava Rd, Macquarie Park NSW 2109, Australia',
                },
                organizer: {
                  '@type': 'Organization',
                  name: 'Macquarie University',
                },
              },
            ]),
          }}
        />
        <CalendarClient />
      </main>
    </Suspense>
  );
}

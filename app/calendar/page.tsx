// app/calendar/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import CalendarClient from './CalendarClient';

// Generate dynamic event dates based on current date
function getUpcomingEventDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Career fair: next Wednesday
  const careerFairDate = new Date(year, month, now.getDate());
  careerFairDate.setDate(careerFairDate.getDate() + ((3 - careerFairDate.getDay() + 7) % 7 || 7));

  // Pizza Friday: next Friday
  const pizzaDate = new Date(year, month, now.getDate());
  pizzaDate.setDate(pizzaDate.getDate() + ((5 - pizzaDate.getDay() + 7) % 7 || 7));

  const careerFairDateStr = careerFairDate.toISOString().split('T')[0];
  const pizzaDateStr = pizzaDate.toISOString().split('T')[0];

  return {
    careerFair: {
      start: `${careerFairDateStr}T10:00:00+11:00`,
      end: `${careerFairDateStr}T16:00:00+11:00`,
    },
    pizza: {
      start: `${pizzaDateStr}T12:00:00+11:00`,
      end: `${pizzaDateStr}T14:00:00+11:00`,
    },
  };
}

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
  const eventDates = getUpcomingEventDates();

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
                name: 'Career Fair',
                description: 'Annual career fair for Macquarie University students',
                startDate: eventDates.careerFair.start,
                endDate: eventDates.careerFair.end,
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
                startDate: eventDates.pizza.start,
                endDate: eventDates.pizza.end,
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

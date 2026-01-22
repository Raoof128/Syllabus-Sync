// app/calendar/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import dayjs from 'dayjs';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import { getTranslations, type TranslationKey } from '@/lib/i18n/translations';
import CalendarClient from './CalendarClient';

// Format a date in local time with timezone offset (e.g., 2026-01-17T10:00:00+11:00)
function formatLocalISO(date: dayjs.Dayjs) {
  return date.format('YYYY-MM-DDTHH:mm:ssZ');
}

// Generate dynamic event dates based on current date (local time + correct offset)
function getUpcomingEventDates() {
  const base = dayjs().startOf('day');

  const getNextDay = (targetDay: number) => {
    const delta = (targetDay - base.day() + 7) % 7 || 7;
    return base.add(delta, 'day');
  };

  const careerFairDay = getNextDay(3); // Wednesday
  const pizzaDay = getNextDay(5); // Friday

  const careerFairStart = careerFairDay.hour(10).minute(0).second(0).millisecond(0);
  const careerFairEnd = careerFairDay.hour(16).minute(0).second(0).millisecond(0);

  const pizzaStart = pizzaDay.hour(12).minute(0).second(0).millisecond(0);
  const pizzaEnd = pizzaDay.hour(14).minute(0).second(0).millisecond(0);

  return {
    careerFair: {
      start: formatLocalISO(careerFairStart),
      end: formatLocalISO(careerFairEnd),
    },
    pizza: {
      start: formatLocalISO(pizzaStart),
      end: formatLocalISO(pizzaEnd),
    },
  };
}

const translations = getTranslations('en');
const translate = (key: TranslationKey, vars?: Record<string, string | number>) => {
  let text =
    (translations as Record<string, string> | undefined)?.[key] ?? (key as unknown as string);

  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    });
  }

  return text;
};

const siteUrl = UNIVERSITY_CONFIG.website || 'https://syllabus-sync.vercel.app';
const metaTitle = translate('calendarMetaTitle', { appName: APP_CONFIG.name });
const metaDescription = translate('calendarMetaDescription', {
  universityName: UNIVERSITY_CONFIG.name,
});
const metaOpenGraphTitle = translate('calendarMetaOpenGraphTitle', { appName: APP_CONFIG.name });

export const metadata: Metadata = {
  title: metaTitle,
  description: metaDescription,
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/calendar',
  },
  openGraph: {
    title: metaOpenGraphTitle,
    description: metaDescription,
    type: 'website',
    url: '/calendar',
    images: [
      {
        url: `${siteUrl}/MQ_Logo_Final.png`,
        alt: translate('mqLogoAlt'),
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: metaOpenGraphTitle,
    description: metaDescription,
    images: [`${siteUrl}/MQ_Logo_Final.png`],
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

// Helper to safely stringify JSON for script tags (prevents XSS via </script>)
function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/<\/script>/g, '<\\/script>');
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
            __html: safeJsonLd({
              '@context': 'https://schema.org',
              '@type': 'EventCalendar',
              name: translate('calendarJsonLdName', {
                appName: APP_CONFIG.name,
                universityName: UNIVERSITY_CONFIG.name,
              }),
              description: translate('calendarJsonLdDescription'),
              url: new URL('/calendar', siteUrl).toString(),
            }),
          }}
        />
        {/* Structured Data for Key Events (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd([
              {
                '@context': 'https://schema.org',
                '@type': 'Event',
                name: translate('calendarJsonLdCareerFairName'),
                description: translate('calendarJsonLdCareerFairDescription', {
                  universityName: UNIVERSITY_CONFIG.name,
                }),
                startDate: eventDates.careerFair.start,
                endDate: eventDates.careerFair.end,
                location: {
                  '@type': 'Place',
                  name: translate('calendarJsonLdLocationName', {
                    universityName: UNIVERSITY_CONFIG.name,
                  }),
                  address: translate('calendarJsonLdLocationAddress'),
                },
                organizer: {
                  '@type': 'Organization',
                  name: translate('calendarJsonLdOrganizerName', {
                    universityName: UNIVERSITY_CONFIG.name,
                  }),
                },
              },
              {
                '@context': 'https://schema.org',
                '@type': 'Event',
                name: translate('calendarJsonLdFreePizzaName'),
                description: translate('calendarJsonLdFreePizzaDescription'),
                startDate: eventDates.pizza.start,
                endDate: eventDates.pizza.end,
                location: {
                  '@type': 'Place',
                  name: translate('calendarJsonLdLocationName', {
                    universityName: UNIVERSITY_CONFIG.name,
                  }),
                  address: translate('calendarJsonLdLocationAddress'),
                },
                organizer: {
                  '@type': 'Organization',
                  name: translate('calendarJsonLdOrganizerName', {
                    universityName: UNIVERSITY_CONFIG.name,
                  }),
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

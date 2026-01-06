// app/home/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Home`,
  description: "Dashboard overview for units, deadlines, and today's schedule.",
  openGraph: {
    title: `${APP_CONFIG.name} - Home`,
    description: "Dashboard overview for units, deadlines, and today's schedule.",
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

// Skeleton loader for home page - provides meaningful first paint
function HomeSkeleton() {
  return (
    <div className="container mx-auto p-6 max-w-7xl animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div
          className="h-10 bg-mq-background-secondary rounded-mq w-64 mb-2"
          style={{ color: 'var(--mq-content)' }}
        />
        <div
          className="h-5 bg-mq-background-secondary rounded-mq w-96"
          style={{ color: 'var(--mq-content)' }}
        />
      </div>

      {/* Widget grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 bg-mq-background-secondary rounded-mq-lg border border-mq-border"
          />
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="h-64 bg-mq-background-secondary rounded-mq-lg border border-mq-border" />
        </div>
        <div className="space-y-4">
          <div className="h-40 bg-mq-background-secondary rounded-mq-lg border border-mq-border" />
          <div className="h-40 bg-mq-background-secondary rounded-mq-lg border border-mq-border" />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-mq-primary focus:text-white focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>
      <main
        id="main-content"
        className="container mx-auto p-6 max-w-7xl"
        role="main"
        aria-label="Dashboard overview"
      >
        <HomeClient />
      </main>
    </Suspense>
  );
}

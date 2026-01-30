// app/feed/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import FeedClient from './FeedClient';

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Campus Feed`,
  description: 'Stay updated with the latest campus events, announcements, and activities.',
  openGraph: {
    title: `${APP_CONFIG.name} - Campus Feed`,
    description: 'Stay updated with the latest campus events, announcements, and activities.',
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

// Skeleton loader for feed page
function FeedSkeleton() {
  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div
          className="h-10 bg-mq-background-secondary rounded-mq w-56 mb-2"
          style={{ color: 'var(--mq-content)' }}
        />
        <div
          className="h-5 bg-mq-background-secondary rounded-mq w-96"
          style={{ color: 'var(--mq-content)' }}
        />
      </div>

      {/* Filter skeleton */}
      <div className="mb-6 flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 bg-mq-background-secondary rounded-mq w-20" />
        ))}
      </div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 bg-mq-background-secondary rounded-mq-lg border border-mq-border"
            />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-48 bg-mq-background-secondary rounded-mq-lg border border-mq-border" />
          <div className="h-48 bg-mq-background-secondary rounded-mq-lg border border-mq-border" />
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <section className="container mx-auto p-6 max-w-7xl feed-page" aria-label="Campus Feed">
        <FeedClient />
      </section>
    </Suspense>
  );
}

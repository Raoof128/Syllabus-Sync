import { Metadata } from 'next';
import { Suspense } from 'react';
import { APP_CONFIG } from '@/lib/config';
import TermsClient from './terms-client';

export const metadata: Metadata = {
  title: `Terms of Service — ${APP_CONFIG.name}`,
  description: `Read the Terms of Service for ${APP_CONFIG.name}. Understand your rights and responsibilities when using our platform.`,
  openGraph: {
    title: `Terms of Service — ${APP_CONFIG.name}`,
    description: `Read the Terms of Service for ${APP_CONFIG.name}.`,
    type: 'website',
  },
};

function TermsSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading terms of service"
      className="min-h-screen bg-mq-background"
    >
      <div className="h-40 bg-mq-primary/20 animate-pulse" />
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-5 w-48 bg-mq-border rounded animate-pulse" />
            <div className="h-4 w-full bg-mq-border/60 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-mq-border/60 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={<TermsSkeleton />}>
      <TermsClient />
    </Suspense>
  );
}

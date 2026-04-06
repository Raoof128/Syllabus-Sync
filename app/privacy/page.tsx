import { Metadata } from 'next';
import { Suspense } from 'react';
import { APP_CONFIG } from '@/lib/config';
import PrivacyPolicyClient from './privacy-client';

export const metadata: Metadata = {
  title: `Privacy Policy — ${APP_CONFIG.name}`,
  description: `Read the Privacy Policy for ${APP_CONFIG.name}. Learn how we collect, use, and protect your personal information in accordance with the Australian Privacy Act.`,
  openGraph: {
    title: `Privacy Policy — ${APP_CONFIG.name}`,
    description: `Read the Privacy Policy for ${APP_CONFIG.name}. Learn how we collect, use, and protect your personal information.`,
    type: 'website',
  },
};

function PrivacySkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading privacy policy"
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

export default function PrivacyPage() {
  return (
    <Suspense fallback={<PrivacySkeleton />}>
      <PrivacyPolicyClient />
    </Suspense>
  );
}

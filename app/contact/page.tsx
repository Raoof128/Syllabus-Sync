import { Metadata } from 'next';
import { Suspense } from 'react';
import { APP_CONFIG } from '@/lib/config';
import ContactClient from './contact-client';

export const metadata: Metadata = {
  title: `Contact — ${APP_CONFIG.name}`,
  description: `Get in touch with the ${APP_CONFIG.name} team. Send feedback, report bugs, or ask questions.`,
  openGraph: {
    title: `Contact — ${APP_CONFIG.name}`,
    description: `Get in touch with the ${APP_CONFIG.name} team. Send feedback, report bugs, or ask questions.`,
    type: 'website',
  },
};

function ContactSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading contact page"
      className="min-h-screen bg-mq-background"
    >
      <div className="h-48 bg-mq-primary/20 animate-pulse" />
      <div className="mx-auto max-w-6xl px-4 py-14 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-mq-border rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="lg:col-span-2 h-80 bg-mq-border rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<ContactSkeleton />}>
      <ContactClient />
    </Suspense>
  );
}

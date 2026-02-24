import { Metadata } from 'next';
import { Suspense } from 'react';
import { APP_CONFIG } from '@/lib/config';
import ResetPasswordClient from './reset-password-client';

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Reset Password`,
  description: 'Reset your password to access your account.',
  openGraph: {
    title: `${APP_CONFIG.name} - Reset Password`,
    description: 'Reset your password to access your account.',
    type: 'website',
  },
  robots: {
    index: false,
    follow: false,
  },
};

function ResetPasswordSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mq-background p-4">
      <div className="w-full max-w-md p-6 rounded-2xl border border-mq-border bg-mq-card-background">
        <div className="h-7 w-44 bg-mq-border rounded animate-pulse mb-3" />
        <div className="h-4 w-64 bg-mq-border rounded animate-pulse mb-8" />
        <div className="space-y-4">
          <div className="h-12 bg-mq-border rounded animate-pulse" />
          <div className="h-12 bg-mq-primary/30 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordSkeleton />}>
      <ResetPasswordClient />
    </Suspense>
  );
}

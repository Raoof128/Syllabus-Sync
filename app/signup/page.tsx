// app/signup/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { APP_CONFIG } from '@/lib/config';
import SignupClient from './SignupClient';

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Sign Up`,
  description: 'Create your Syllabus Sync account.',
  robots: {
    index: false,
    follow: false,
  },
};

// V3.1: Loading skeleton for signup page
function SignupSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mq-background">
      <div className="w-full max-w-md p-8">
        {/* Logo skeleton */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-full bg-mq-border animate-pulse" />
        </div>
        {/* Title skeleton */}
        <div className="h-8 w-48 mx-auto bg-mq-border rounded animate-pulse mb-4" />
        {/* Subtitle skeleton */}
        <div className="h-4 w-64 mx-auto bg-mq-border rounded animate-pulse mb-8" />
        {/* Form skeleton */}
        <div className="space-y-4">
          <div className="h-12 bg-mq-border rounded animate-pulse" />
          <div className="h-12 bg-mq-border rounded animate-pulse" />
          <div className="h-12 bg-mq-border rounded animate-pulse" />
          <div className="h-12 bg-mq-primary/30 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupSkeleton />}>
      <SignupClient />
    </Suspense>
  );
}

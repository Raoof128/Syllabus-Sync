// app/login/page.tsx
import { Metadata } from "next";
import { Suspense } from "react";
import { APP_CONFIG } from "@/lib/config";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Login`,
  description: "Sign in to access your Syllabus Sync account.",
  openGraph: {
    title: `${APP_CONFIG.name} - Login`,
    description: "Sign in to access your Syllabus Sync account.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
};

// V3.1: Loading skeleton for login page
function LoginSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mq-background">
      <div className="w-full max-w-md p-4 sm:p-8">
        {/* Logo skeleton */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-mq-border animate-pulse" />
        </div>
        {/* Title skeleton */}
        <div className="h-8 w-48 mx-auto bg-mq-border rounded animate-pulse mb-4" />
        {/* Subtitle skeleton */}
        <div className="h-4 w-64 mx-auto bg-mq-border rounded animate-pulse mb-8" />
        {/* Form skeleton */}
        <div className="space-y-4">
          <div className="h-12 bg-mq-border rounded animate-pulse" />
          <div className="h-12 bg-mq-border rounded animate-pulse" />
          <div className="h-12 bg-mq-primary/30 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginClient />
    </Suspense>
  );
}

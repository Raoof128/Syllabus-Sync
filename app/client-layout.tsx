// app/client-layout.tsx
'use client';

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ThemeProvider from '@/components/theme/ThemeProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { errorHandler } from '@/lib/utils/errorHandling';
import { registerServiceWorker } from '@/lib/utils/serviceWorker';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // Set up global error handlers
  React.useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorHandler.logError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        'UnhandledPromiseRejection',
        'high',
      );
    };

    // Handle uncaught errors
    const handleError = (event: ErrorEvent) => {
      errorHandler.logError(event.error || new Error(event.message), 'UncaughtError', 'critical');
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Register service worker for offline support
    registerServiceWorker();

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <ThemeProvider>
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-mq-primary text-white px-4 py-2 rounded-mq z-50 focus:outline-none focus:ring-2 focus:ring-mq-focus focus:ring-offset-2"
      >
        Skip to main content
      </a>

      <div className="flex h-screen bg-mq-background">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
          <Header />
          <main id="main-content" className="flex-1 overflow-y-auto pt-16 md:pt-0" role="main">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}

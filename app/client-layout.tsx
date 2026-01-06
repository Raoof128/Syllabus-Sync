// app/client-layout.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ThemeProvider from '@/components/theme/ThemeProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { errorHandler } from '@/lib/utils/errorHandling';
import { registerServiceWorker } from '@/lib/utils/serviceWorker';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useNotificationsStore } from '@/lib/store/notificationsStore';
import { createBrowserClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createBrowserClient(), []);

  // Use stable selectors to reduce subscription overhead
  const loadUnits = useUnitsStore((state) => state.loadUnits);
  const loadDeadlines = useDeadlinesStore((state) => state.loadDeadlines);
  const loadNotifications = useNotificationsStore((state) => state.loadNotifications);

  // Auth routes that don't require authentication
  const authRoutes = ['/login', '/signup', '/reset-password'];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Protected routes that require authentication
  const protectedRoutes = ['/home', '/calendar', '/feed', '/map', '/settings', '/manage-profiles'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const authenticated = !!session;
        setIsAuthenticated(authenticated);

        // Handle redirects based on auth status
        if (authenticated && isAuthRoute) {
          // Redirect authenticated users away from auth pages
          router.push('/home');
        } else if (!authenticated && isProtectedRoute) {
          // Redirect unauthenticated users to login
          router.push(`/login?redirectTo=${pathname}`);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: string, session: { user?: { id: string; email?: string } } | null) => {
        const authenticated = !!session;
        setIsAuthenticated(authenticated);

        /* 
         Raouf: Disabled auto-redirect for auth routes in the listener to prevent
         interrupting the fingerprint login animation. 
         LoginClient handles its own redirect after the animation completes.
      */
        if (!authenticated && isProtectedRoute) {
          router.push(`/login?redirectTo=${pathname}`);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth, router, pathname, isAuthRoute, isProtectedRoute]);

  // Set up global error handlers
  useEffect(() => {
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

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      void loadUnits();
      void loadDeadlines();
      void loadNotifications();
    }
  }, [isAuthenticated, loadUnits, loadDeadlines, loadNotifications]);

  // Show loading state while checking authentication — keep the main landmark present to avoid test flakiness
  if (isAuthenticated === null) {
    return (
      <ThemeProvider>
        <div className="flex min-h-screen bg-mq-background">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden md:ml-12">
            <Header />
            <main id="main-content" className="flex-1 overflow-y-auto pt-16 md:pt-0" role="main">
              <div className="min-h-[60vh] flex items-center justify-center">
                <div
                  className="animate-pulse text-mq-content alabaster-readable"
                  style={{
                    color: 'var(--mq-content)',
                    WebkitTextFillColor: 'var(--mq-content)',
                    opacity: 1,
                    mixBlendMode: 'normal',
                  }}
                >
                  {t('loading')}
                </div>
              </div>
            </main>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Don't render layout for auth routes
  if (isAuthRoute) {
    return (
      <ThemeProvider>
        <ErrorBoundary>{children}</ErrorBoundary>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Render full layout for authenticated routes
  return (
    <ThemeProvider>
      <div className="layout-shell flex min-h-screen bg-mq-background">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content - offset by sidebar trigger width (48px = w-12) on desktop */}
        <div className="layout-main flex-1 flex flex-col overflow-hidden md:ml-12">
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

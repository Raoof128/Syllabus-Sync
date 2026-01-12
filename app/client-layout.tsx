// app/client-layout.tsx
'use client';

import React, { useEffect, useState, useMemo, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ThemeProvider from '@/components/theme/ThemeProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { errorHandler } from '@/lib/utils/errorHandling';
import { registerServiceWorker } from '@/lib/utils/serviceWorker';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useNotificationsStore } from '@/lib/store/notificationsStore';
import { createBrowserClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useNotificationScheduler } from '@/lib/hooks/useNotificationScheduler';
import { useLanguageStore } from '@/lib/store/languageStore';
import { LevelUpNotificationProvider } from '@/components/gamification/LevelUpNotification';

// V3.1: Performance optimization - move constant arrays outside component
// Prevents recreation on every render
const AUTH_ROUTES = ['/login', '/signup', '/reset-password'] as const;
const PROTECTED_ROUTES = [
  '/home',
  '/calendar',
  '/feed',
  '/map',
  '/settings',
  '/manage-profiles',
] as const;

// V3.1: Performance optimization - run console.error override once at module load
// Instead of checking on every error call
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error.bind(console);
  const NEXT_KEY_WARNING = 'Each child in a list should have a unique "key" prop';
  const OUTER_LAYOUT_ROUTER = 'OuterLayoutRouter';

  console.error = (...args: unknown[]) => {
    // Filter out the OuterLayoutRouter key warning - this is a Next.js 16 Turbopack internal issue
    const firstArg = args[0];
    if (
      typeof firstArg === 'string' &&
      firstArg.includes(NEXT_KEY_WARNING) &&
      args.some((arg) => typeof arg === 'string' && arg.includes(OUTER_LAYOUT_ROUTER))
    ) {
      return; // Silently ignore this specific warning
    }
    originalConsoleError(...args);
  };
}

// V3.1: Wrapped with React.memo to prevent unnecessary re-renders
// Using named function for better debugging in React DevTools
function ClientLayoutComponent({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const language = useLanguageStore((state) => state.language);

  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createBrowserClient(), []);

  // Use stable selectors to reduce subscription overhead
  const loadUnits = useUnitsStore((state) => state.loadUnits);
  const loadDeadlines = useDeadlinesStore((state) => state.loadDeadlines);
  const loadNotifications = useNotificationsStore((state) => state.loadNotifications);

  // V3.1: Performance optimization - use pre-defined constant arrays
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

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

  // Initialize notification scheduler for push notifications
  useNotificationScheduler();

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
      {/* Level-up notifications for gamification */}
      <LevelUpNotificationProvider locale={language}>
        {/* Global SVG filters for liquid glass effects - REMOVED (Redundant: using static filters from layout.tsx) */}
        {/* Mesh background now rendered in layout.tsx as CSS-only for performance */}

        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-mq-primary focus:text-white focus:rounded-mq focus:shadow-mq-lg focus:outline-none"
        >
          {t('skipToContent')}
        </a>
        <div className="layout-shell flex min-h-screen flex-col">
          <div className="flex flex-1">
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
          {/* Footer landmark for accessibility - screen reader only */}
          <footer role="contentinfo" className="sr-only" aria-label="Footer">
            <p>&copy; {new Date().getFullYear()} Syllabus Sync - Macquarie University</p>
          </footer>
        </div>
        <Toaster />
        <OfflineIndicator />
      </LevelUpNotificationProvider>
    </ThemeProvider>
  );
}

// V3.1: Export the memoized component
const ClientLayout = memo(ClientLayoutComponent);
ClientLayout.displayName = 'ClientLayout';
export default ClientLayout;

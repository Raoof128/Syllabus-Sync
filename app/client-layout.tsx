// app/client-layout.tsx
'use client';

import React, { useEffect, useState, memo } from 'react';
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
import { useEventsStore } from '@/lib/store/eventsStore';
import { useTodosStore } from '@/lib/store/todosStore';
import { apiRequest } from '@/lib/utils/api';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useNotificationScheduler } from '@/lib/hooks/useNotificationScheduler';
import { useLanguageStore } from '@/lib/store/languageStore';
import { LevelUpNotificationProvider } from '@/components/gamification/LevelUpNotification';
import { isSupabaseConfigured } from '@/lib/supabase/client';

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

const scheduleIdleTask = (callback: () => void) => {
  if (typeof window === 'undefined') return;
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => callback());
  } else {
    setTimeout(callback, 200);
  }
};

// V3.1: Wrapped with React.memo to prevent unnecessary re-renders
// Using named function for better debugging in React DevTools
function ClientLayoutComponent({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const language = useLanguageStore((state) => state.language);

  // Use stable selectors to reduce subscription overhead
  const loadUnits = useUnitsStore((state) => state.loadUnits);
  const loadDeadlines = useDeadlinesStore((state) => state.loadDeadlines);
  const loadNotifications = useNotificationsStore((state) => state.loadNotifications);
  const loadEvents = useEventsStore((state) => state.loadEvents);
  const loadTodos = useTodosStore((state) => state.loadTodos);

  // V3.1: Performance optimization - use pre-defined constant arrays
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  useEffect(() => {
    let isActive = true;
    const supabaseConfigured = isSupabaseConfigured();

    const checkAuth = async () => {
      try {
        if (!supabaseConfigured) {
          setIsAuthenticated(true);
          return;
        }

        const data = await apiRequest<{ user?: { id: string } }>('/api/auth/user', {
          noRetry: true,
        });
        if (!isActive) return;
        const authenticated = Boolean(data?.user?.id);
        setIsAuthenticated(authenticated);

        if (authenticated && isAuthRoute) {
          router.push('/home');
        }
      } catch {
        if (!isActive) return;
        setIsAuthenticated(true);
      }
    };

    checkAuth();

    const handleFocus = () => {
      void checkAuth();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      isActive = false;
      window.removeEventListener('focus', handleFocus);
    };
  }, [router, pathname, isAuthRoute, isProtectedRoute]);

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
    scheduleIdleTask(() => {
      void registerServiceWorker();
    });

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      scheduleIdleTask(() => {
        void loadUnits();
        void loadDeadlines();
        void loadNotifications();
        void loadEvents();
        void loadTodos();
      });
    }
  }, [isAuthenticated, loadUnits, loadDeadlines, loadNotifications, loadEvents, loadTodos]);

  // Initialize notification scheduler for push notifications
  useNotificationScheduler();

  // Show loading state while checking authentication — keep the main landmark present to avoid test flakiness
  if (isAuthenticated === null) {
    return (
      <ThemeProvider>
        <div className="flex h-screen h-[100dvh] overflow-hidden bg-mq-background layout-shell">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto md:ml-12 layout-main relative">
            <Header />
            <main id="main-content" className="flex-1" role="main">
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

  // Authenticated state
  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <div className="flex min-h-screen bg-mq-background">
          <main className="flex-1" role="main">
            {children}
          </main>
          <Toaster />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <LevelUpNotificationProvider locale={language}>
        <a href="#main-content" className="skip-link">
          {t('skipToContent')}
        </a>
        <div className="flex h-screen h-[100dvh] overflow-hidden bg-mq-background layout-shell">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto md:ml-12 layout-main relative">
            <Header />
            <main id="main-content" className="flex-1" role="main" aria-label={t('mainContent')}>
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
            <footer role="contentinfo" className="sr-only" aria-label={t('footer')}>
              <p>{t('copyright', { year: new Date().getFullYear() })}</p>
            </footer>
            <OfflineIndicator />
            <Toaster />
          </div>
        </div>
      </LevelUpNotificationProvider>
    </ThemeProvider>
  );
}

// V3.1: Export the memoized component
const ClientLayout = memo(ClientLayoutComponent);
ClientLayout.displayName = 'ClientLayout';
export default ClientLayout;

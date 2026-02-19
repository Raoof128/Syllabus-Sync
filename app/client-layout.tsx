// app/client-layout.tsx
'use client';

import React, { useEffect, useState, memo, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ThemeProvider from '@/components/theme/ThemeProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { errorHandler } from '@/lib/utils/errorHandling';
import { registerServiceWorker } from '@/lib/utils/serviceWorker';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { useNotificationScheduler } from '@/lib/hooks/useNotificationScheduler';
import { useInactivityLogout } from '@/lib/hooks/useInactivityLogout';
import { useLanguageStore } from '@/lib/store/languageStore';
import { LevelUpNotificationProvider } from '@/features/gamification/components/LevelUpNotification';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getBrowserAuthSnapshot } from '@/lib/supabase/browserSession';
import { clearAllClientStorage, resetAllStores } from '@/lib/utils/clientStorage';
import { apiRequest } from '@/lib/utils/api';
import { API_ROUTES } from '@/lib/constants/config';

// V3.1: Performance optimization - move constant arrays outside component
const AUTH_ROUTES = ['/login', '/signup', '/reset-password'] as const;
const PUBLIC_ROUTES = ['/terms', '/privacy', '/verify'] as const;
// Post-auth routes: render without sidebar/header but never redirect away if authenticated
const POST_AUTH_ROUTES = ['/onboarding'] as const;

// V3.1: Performance optimization - run console.error override once at module load
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error.bind(console);
  const NEXT_KEY_WARNING = 'Each child in a list should have a unique "key" prop';
  const OUTER_LAYOUT_ROUTER = 'OuterLayoutRouter';

  console.error = (...args: unknown[]) => {
    const firstArg = args[0];
    if (
      typeof firstArg === 'string' &&
      firstArg.includes(NEXT_KEY_WARNING) &&
      args.some((arg) => typeof arg === 'string' && arg.includes(OUTER_LAYOUT_ROUTER))
    ) {
      return;
    }
    originalConsoleError(...args);
  };

  // eslint-disable-next-line no-console
  const originalConsoleInfo = console.info.bind(console);
  const REACT_DEVTOOLS_MSG = 'Download the React DevTools';

  // eslint-disable-next-line no-console
  console.info = (...args: unknown[]) => {
    const firstArg = args[0];
    if (typeof firstArg === 'string' && firstArg.includes(REACT_DEVTOOLS_MSG)) {
      return;
    }
    originalConsoleInfo(...args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || '';
    if (
      message.includes('message channel closed') ||
      message.includes('Frame with ID 0 was removed')
    ) {
      event.preventDefault();
    }
  });
}

const scheduleIdleTask = (callback: () => void) => {
  if (typeof window === 'undefined') return;
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => callback());
  } else {
    setTimeout(callback, 200);
  }
};

// V4: Optimistic rendering — render immediately, check auth in background.
// The proxy already handles auth redirects for protected routes, so the
// client-side check is only needed for UI state (sidebar, header, etc.)
function ClientLayoutComponent({ children }: { children: React.ReactNode }) {
  const { t } = useTypedTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const language = useLanguageStore((state) => state.language);

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isPostAuthRoute = POST_AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const inactivityLogoutInProgressRef = useRef(false);
  // Start optimistically as authenticated for app pages only.
  // Auth routes (/login, /signup, /reset-password) must always render the unauth layout
  // to avoid "blink" (sidebar/header flashing) and lost toast rendering during navigation.
  // Public routes (/terms, /privacy) and post-auth routes (/onboarding) also render
  // without auth check to avoid redirects.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => !isAuthRoute && !isPublicRoute && !isPostAuthRoute,
  );

  // Non-blocking auth check — updates UI state without blocking render
  const checkAuth = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    // Skip auth redirect for public routes - they should be accessible to everyone
    if (isPublicRoute) return;
    // Skip auth check for post-auth routes (/onboarding) — user is authenticated but
    // should not be redirected away; they must complete onboarding first
    if (isPostAuthRoute) return;
    // Skip auth check for reset-password - it must be fully public for recovery flow
    if (pathname.startsWith('/reset-password')) return;

    try {
      const { user, resolution } = await getBrowserAuthSnapshot();
      if (resolution === 'unknown') {
        return;
      }
      const authenticated = Boolean(user?.id);
      setIsAuthenticated(authenticated);

      // Proxy handles redirecting authenticated users away from /login.
      // However, when /login is being used as an MFA upgrade step (`?mfa=1`),
      // we must not push the user away or we'll cause redirect flapping.
      // Similarly, /reset-password with a `code` param means the user just
      // exchanged a recovery code for a session and needs to set a new password.
      const searchParams =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const isMfaUpgradeUrl = searchParams?.get('mfa') === '1';
      const isPasswordResetFlow =
        pathname.startsWith('/reset-password') && searchParams?.has('code');

      if (authenticated && isAuthRoute && !isMfaUpgradeUrl && !isPasswordResetFlow) {
        router.push('/home');
      }
    } catch {
      // On error, keep optimistic state — proxy handles protection
    }
  }, [router, isAuthRoute, isPublicRoute, isPostAuthRoute, pathname]);

  // Run auth check in background (non-blocking)
  useEffect(() => {
    // Use idle callback so auth check doesn't compete with initial render
    scheduleIdleTask(() => {
      void checkAuth();
    });

    const handleFocus = () => {
      void checkAuth();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkAuth]);

  // Set up global error handlers
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorHandler.logError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        'UnhandledPromiseRejection',
        'high',
      );
    };

    const handleError = (event: ErrorEvent) => {
      errorHandler.logError(event.error || new Error(event.message), 'UncaughtError', 'critical');
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    scheduleIdleTask(() => {
      void registerServiceWorker();
    });

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Initialize notification scheduler for push notifications
  useNotificationScheduler();

  const handleInactivityLogout = useCallback(async () => {
    if (inactivityLogoutInProgressRef.current) return;
    inactivityLogoutInProgressRef.current = true;

    try {
      await resetAllStores();
      clearAllClientStorage();
      await apiRequest(API_ROUTES.AUTH.LOGOUT, {
        method: 'POST',
        noRetry: true,
      });
    } catch {
      // Best-effort cleanup; always redirect to enforce logout UX.
    } finally {
      router.replace('/login?reason=inactive');
    }
  }, [router]);

  useInactivityLogout({
    enabled: isAuthenticated && !isAuthRoute && !isPublicRoute && !isPostAuthRoute,
    timeoutMs: 5 * 60 * 1000,
    onTimeout: () => {
      void handleInactivityLogout();
    },
  });

  // Unauthenticated layout (login/signup pages + post-auth steps like /onboarding)
  if (isAuthRoute || isPostAuthRoute || !isAuthenticated) {
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

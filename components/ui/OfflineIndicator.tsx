// components/ui/OfflineIndicator.tsx
'use client';

import { useState, useSyncExternalStore, useRef } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { useHydration } from '@/lib/hooks';
import { cn } from '@/lib/utils';

/**
 * Custom hook to track online/offline status with transition notifications.
 * Uses useSyncExternalStore for proper synchronization with browser state.
 */
function useNetworkStatus() {
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);
  const previousOnlineRef = useRef<boolean | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subscribe = (callback: () => void) => {
    const handleOnline = () => {
      // Show "back online" message when transitioning from offline to online
      if (previousOnlineRef.current === false) {
        setShowOnlineMessage(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setShowOnlineMessage(false), 3000);
      }
      previousOnlineRef.current = true;
      callback();
    };

    const handleOffline = () => {
      previousOnlineRef.current = false;
      setShowOnlineMessage(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      callback();
    };

    // Initialize previous state
    previousOnlineRef.current = navigator.onLine;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  };

  const getSnapshot = () => navigator.onLine;
  const getServerSnapshot = () => true; // Assume online during SSR

  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return { isOnline, showOnlineMessage };
}

/**
 * OfflineIndicator - Shows a banner when the user loses network connectivity
 * and a brief notification when they come back online.
 */
export function OfflineIndicator() {
  const { t } = useTypedTranslation();
  const { isOnline, showOnlineMessage } = useNetworkStatus();
  // Use the existing hydration hook from lib/hooks
  const isHydrated = useHydration();

  // Don't render anything during SSR or before hydration
  if (!isHydrated) return null;

  // User is online and no message to show
  if (isOnline && !showOnlineMessage) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-mq-lg shadow-mq-lg border flex items-center gap-3 transition-all duration-300 ease-mq-ease mq-liquid-glass',
        'animate-in slide-in-from-bottom-4 fade-in',
        isOnline
          ? 'bg-mq-success/10 border-mq-success text-mq-success'
          : 'bg-mq-error/10 border-mq-error text-mq-error',
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm font-medium">{t('backOnline')}</span>
        </>
      ) : (
        <>
          <WifiOff className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm font-medium">{t('youAreOffline')}</span>
        </>
      )}
    </div>
  );
}

export default OfflineIndicator;

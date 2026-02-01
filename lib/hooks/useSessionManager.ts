import { useState, useCallback } from 'react';
import { API_ROUTES } from '@/lib/constants/config';
import { toastUtils } from '@/lib/utils/toast';
import { errorHandler } from '@/lib/utils/errorHandling';
import type { SessionInfo } from '@/lib/types';
import type { TranslationKey } from '@/lib/i18n/translations';

type UseSessionManagerProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

export function useSessionManager({ t }: UseSessionManagerProps) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const response = await fetch(API_ROUTES.AUTH.SESSIONS);
      const result = await response.json();

      if (!response.ok || !result?.data?.sessions) {
        toastUtils.error(t('settingsError'), t('preferenceError'));
        setIsLoadingSessions(false);
        return;
      }

      setSessions(result.data.sessions as SessionInfo[]);
    } catch (error) {
      errorHandler.logError(error as Error, 'Fetch sessions', 'medium');
      toastUtils.error(t('settingsError'), t('preferenceError'));
    } finally {
      setIsLoadingSessions(false);
    }
  }, [t]);

  const endSession = useCallback(
    async (session: SessionInfo) => {
      try {
        const response = await fetch(API_ROUTES.AUTH.SESSIONS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scope: session.current ? 'local' : 'others' }),
        });

        if (!response.ok) {
          toastUtils.error(t('settingsError'), t('preferenceError'));
          return;
        }

        toastUtils.success(t('manageSessions'), t('preferenceUpdated'));

        if (session.current) {
          window.location.href = '/login';
          return;
        }

        fetchSessions();
      } catch (error) {
        errorHandler.logError(error as Error, 'End session', 'medium');
        toastUtils.error(t('settingsError'), t('preferenceError'));
      }
    },
    [fetchSessions, t],
  );

  const endAllSessions = useCallback(async () => {
    try {
      const response = await fetch(API_ROUTES.AUTH.SESSIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'global' }),
      });

      if (!response.ok) {
        toastUtils.error(t('settingsError'), t('preferenceError'));
        return;
      }

      toastUtils.success(t('manageSessions'), t('preferenceUpdated'));
      window.location.href = '/login';
    } catch (error) {
      errorHandler.logError(error as Error, 'End all sessions', 'medium');
      toastUtils.error(t('settingsError'), t('preferenceError'));
    }
  }, [t]);

  return {
    sessions,
    isLoadingSessions,
    fetchSessions,
    endSession,
    endAllSessions,
  };
}

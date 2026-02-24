'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/mq/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSessionManager } from '@/lib/hooks/useSessionManager';
import type { TranslationKey } from '@/lib/i18n/translations';

type SessionsListProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

export function SessionsList({ open, onOpenChange, t }: SessionsListProps) {
  const { sessions, isLoadingSessions, fetchSessions, endSession, endAllSessions } =
    useSessionManager({ t });

  useEffect(() => {
    if (open) {
      fetchSessions();
    }
  }, [open, fetchSessions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-testid="sessions-dialog">
        <DialogHeader>
          <DialogTitle>{t('manageSessions')}</DialogTitle>
          <DialogDescription>{t('manageSessionsDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3" role="list" aria-label={t('manageSessions')}>
          {isLoadingSessions ? (
            <p className="text-mq-sm text-mq-content-secondary">{t('loading')}</p>
          ) : sessions.length === 0 ? (
            <p className="text-mq-sm text-mq-content-secondary">{t('noSessions')}</p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-mq-lg border border-mq-border bg-mq-card-background px-3 py-2"
                role="listitem"
                data-testid={`session-${session.id}`}
              >
                <div>
                  <p className="font-semibold text-mq-content flex items-center gap-2">
                    {session.device}
                    {session.current && (
                      <span className="text-xs font-normal px-1.5 py-0.5 bg-mq-success/10 text-mq-success rounded-mq">
                        {t('current')}
                      </span>
                    )}
                  </p>
                  <p className="text-mq-xs text-mq-content-tertiary">
                    {t('lastActive')} {new Date(session.lastActive).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                  disabled={session.current}
                  onClick={() => endSession(session)}
                  aria-label={`${t('signOut')} ${session.device}`}
                  data-testid={`end-session-${session.id}`}
                >
                  {t('signOut')}
                </Button>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            size="sm"
            disabled={sessions.length === 0}
            onClick={endAllSessions}
            data-testid="end-all-sessions-button"
          >
            {t('signOutAllSessions')}
          </Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

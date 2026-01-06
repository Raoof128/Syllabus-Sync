'use client';

import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Shield, Download } from 'lucide-react';
import { APP_CONFIG, EXTERNAL_LINKS } from '@/lib/config';
import { errorHandler } from '@/lib/utils/errorHandling';
import { toastUtils } from '@/lib/utils/toast';
import type { Unit, Deadline } from '@/lib/types';
import type { TranslationKey } from '@/lib/i18n/translations';

type SessionInfo = {
  id: string;
  device: string;
  lastActive: string;
  current: boolean;
};

type PrivacySettingsProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  sessions: SessionInfo[];
  setSessions: React.Dispatch<React.SetStateAction<SessionInfo[]>>;
  units: Unit[];
  deadlines: Deadline[];
  theme: string;
  language: string;
  notifications: { deadlines: boolean; classes: boolean; events: boolean };
};

const PrivacySettings = memo(
  ({
    t,
    sessions,
    setSessions,
    units,
    deadlines,
    theme,
    language,
    notifications,
  }: PrivacySettingsProps) => {
    const [showSessionsDialog, setShowSessionsDialog] = useState(false);
    const [showExportDialog, setShowExportDialog] = useState(false);

    const openSessions = useCallback(() => {
      if (typeof window !== 'undefined') {
        setShowSessionsDialog(true);
      }
    }, []);

    const endSession = useCallback(
      (id: string) => {
        try {
          setSessions((prev) => {
            const remaining = prev.filter((session) => session.id !== id || session.current);
            if (typeof window !== 'undefined') {
              window.localStorage.setItem('mq-sessions', JSON.stringify(remaining));
            }
            return remaining;
          });
          toastUtils.success(t('manageSessions'), t('preferenceUpdated'));
        } catch (error) {
          errorHandler.logError(error as Error, 'End session', 'medium');
          toastUtils.error(t('settingsError'), t('preferenceError'));
        }
      },
      [setSessions, t],
    );

    const endAllSessions = useCallback(() => {
      try {
        const currentOnly = sessions.filter((s) => s.current);
        setSessions(currentOnly);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('mq-sessions', JSON.stringify(currentOnly));
        }
        toastUtils.success(t('manageSessions'), t('preferenceUpdated'));
      } catch (error) {
        errorHandler.logError(error as Error, 'End all sessions', 'medium');
        toastUtils.error(t('settingsError'), t('preferenceError'));
      }
    }, [sessions, setSessions, t]);

    const handleExportData = useCallback(() => {
      try {
        const data = {
          units,
          deadlines,
          preferences: {
            theme,
            language,
            notifications,
          },
          exportedAt: new Date().toISOString(),
          version: '1.0',
          appVersion: APP_CONFIG.version,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `syllabus-sync-data-${new Date().toISOString().split('T')[0]}.json`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowExportDialog(false);
        toastUtils.success(t('exportComplete'), t('exportCompleteMsg'));
      } catch (error) {
        errorHandler.logError(
          error instanceof Error ? error : new Error('Failed to export data'),
          'Settings Export Data',
          'medium',
        );
        toastUtils.error(t('exportFailed'), t('exportFailedMsg'));
      }
    }, [units, deadlines, theme, language, notifications, t]);

    const openExportDialog = useCallback(() => {
      setShowExportDialog(true);
    }, []);

    return (
      <>
        <div className="mq-magic-card">
          <Card className="mq-magic-card-content">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('privacySecurity')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Change Password */}
              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-mq-content">{t('changePassword')}</h4>
                    <p className="text-mq-sm text-mq-content-secondary">
                      {t('changePasswordDesc')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                    onClick={() => toastUtils.info(t('changePassword'), t('comingSoon'))}
                  >
                    {t('changePassword')}
                  </Button>
                </div>
              </div>

              {/* Manage Sessions */}
              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-mq-content">{t('manageSessions')}</h4>
                    <p className="text-mq-sm text-mq-content-secondary">
                      {t('manageSessionsDesc')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                    onClick={openSessions}
                  >
                    {t('manageSessions')}
                  </Button>
                </div>
              </div>

              {/* Privacy Policy */}
              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-mq-content">{t('privacyPolicy')}</h4>
                    <p className="text-mq-sm text-mq-content-secondary">{t('privacyPolicy')}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                    onClick={() =>
                      window.open(EXTERNAL_LINKS.privacy, '_blank', 'noopener,noreferrer')
                    }
                  >
                    {t('view')}
                  </Button>
                </div>
              </div>

              {/* Export Data */}
              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-mq-content">{t('exportData')}</h4>
                    <p className="text-mq-sm text-mq-content-secondary">{t('exportDataDesc')}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                    onClick={openExportDialog}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('export')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions Dialog */}
        <Dialog open={showSessionsDialog} onOpenChange={setShowSessionsDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('manageSessions')}</DialogTitle>
              <DialogDescription>{t('manageSessionsDesc')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {sessions.length === 0 ? (
                <p className="text-mq-sm text-mq-content-secondary">{t('noSessions')}</p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-mq-lg border border-mq-border bg-mq-card-background px-3 py-2"
                  >
                    <div>
                      <p className="font-semibold text-mq-content">
                        {session.current ? t('current') : t('manageSessions')}
                      </p>
                      <p className="text-mq-sm text-mq-content-secondary">{session.device}</p>
                      <p className="text-mq-xs text-mq-content-tertiary">
                        {t('lastActive')} {new Date(session.lastActive).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                      disabled={session.current}
                      onClick={() => endSession(session.id)}
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
              >
                {t('signOutAllSessions')}
              </Button>
              <Button variant="secondary" onClick={() => setShowSessionsDialog(false)}>
                {t('close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Confirmation Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('confirmExport')}</DialogTitle>
              <DialogDescription>{t('confirmExportDesc')}</DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowExportDialog(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                {t('proceedExport')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
);

PrivacySettings.displayName = 'PrivacySettings';

export default PrivacySettings;

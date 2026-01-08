'use client';

import { memo, useCallback, useState, useMemo } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Shield, Download, Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';
import { APP_CONFIG, EXTERNAL_LINKS } from '@/lib/config';
import { STORAGE_KEYS } from '@/lib/constants';
import { errorHandler } from '@/lib/utils/errorHandling';
import { toastUtils } from '@/lib/utils/toast';
import type { Unit, Deadline, SessionInfo, PasswordStrength } from '@/lib/types';
import type { TranslationKey } from '@/lib/i18n/translations';
import { MagicCard } from '@/components/ui/MagicCard';

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

// Password strength calculation
// Note: feedback messages should be added to translations.ts for full i18n support
function calculatePasswordStrength(password: string): {
  strength: PasswordStrength;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters');
  }

  if (password.length >= 12) {
    score += 1;
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include uppercase and lowercase letters');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include at least one number');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include a special character');
  }

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid repeated characters');
  }

  let strength: PasswordStrength;
  if (score <= 1) {
    strength = 'weak';
  } else if (score === 2) {
    strength = 'fair';
  } else if (score === 3) {
    strength = 'good';
  } else {
    strength = 'strong';
  }

  return { strength, score: Math.min(score, 4), feedback };
}

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
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Password strength indicator
    const passwordStrength = useMemo(() => {
      if (!newPassword) return null;
      return calculatePasswordStrength(newPassword);
    }, [newPassword]);

    const strengthColors: Record<PasswordStrength, string> = {
      weak: 'bg-mq-error',
      fair: 'bg-mq-warning',
      good: 'bg-mq-info',
      strong: 'bg-mq-success',
    };

    const strengthLabels: Record<PasswordStrength, TranslationKey> = {
      weak: 'passwordWeak',
      fair: 'passwordFair',
      good: 'passwordGood',
      strong: 'passwordStrong',
    };

    const openPasswordDialog = useCallback(() => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordDialog(true);
    }, []);

    const handleChangePassword = useCallback(
      async (e?: React.FormEvent) => {
        if (e) {
          e.preventDefault();
        }

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
          toastUtils.error(t('settingsError'), t('allFieldsRequired'));
          return;
        }

        if (newPassword.length < 6) {
          toastUtils.error(t('settingsError'), t('passwordTooShort'));
          return;
        }

        if (newPassword !== confirmPassword) {
          toastUtils.error(t('settingsError'), t('passwordsDoNotMatch'));
          return;
        }

        setIsChangingPassword(true);

        try {
          // Use server-side password verification and change API
          const response = await fetch('/api/auth/password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              currentPassword,
              newPassword,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            if (response.status === 429) {
              toastUtils.error(t('settingsError'), t('tooManyAttempts'));
            } else if (result.error?.message) {
              toastUtils.error(t('settingsError'), result.error.message);
            } else {
              toastUtils.error(t('settingsError'), t('preferenceError'));
            }
            setIsChangingPassword(false);
            return;
          }

          toastUtils.success(t('changePassword'), t('passwordChangedSuccess'));
          setShowPasswordDialog(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } catch (error) {
          errorHandler.logError(error as Error, 'Change Password', 'medium');
          toastUtils.error(t('settingsError'), t('preferenceError'));
        } finally {
          setIsChangingPassword(false);
        }
      },
      [currentPassword, newPassword, confirmPassword, t],
    );

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
              window.localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(remaining));
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
          window.localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(currentOnly));
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
        {/* Security Shield Liquid Glass Variant */}
        <MagicCard data-testid="privacy-settings" isLiquidEnhanced>
          <Card className="mq-magic-card-content mq-liquid-glass mq-liquid-glass-security">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 security-indicator" aria-hidden="true" />
                <span id="privacy-security-heading">{t('privacySecurity')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent
              className="space-y-3"
              role="region"
              aria-labelledby="privacy-security-heading"
            >
              {/* Change Password */}
              <div className="p-3 bg-mq-card-background/50 backdrop-blur-sm rounded-mq-lg border border-mq-border hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-mq-content">{t('changePassword')}</h3>
                    <p className="text-mq-sm text-mq-content-secondary">
                      {t('changePasswordDesc')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                    onClick={openPasswordDialog}
                    data-testid="change-password-button"
                  >
                    {t('changePassword')}
                  </Button>
                </div>
              </div>

              {/* Manage Sessions */}
              <div className="p-3 bg-mq-card-background/50 backdrop-blur-sm rounded-mq-lg border border-mq-border hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-mq-content">{t('manageSessions')}</h3>
                    <p className="text-mq-sm text-mq-content-secondary">
                      {t('manageSessionsDesc')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                    onClick={openSessions}
                    data-testid="manage-sessions-button"
                  >
                    {t('manageSessions')}
                  </Button>
                </div>
              </div>

              {/* Privacy Policy */}
              <div className="p-3 bg-mq-card-background/50 backdrop-blur-sm rounded-mq-lg border border-mq-border hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-mq-content">{t('privacyPolicy')}</h3>
                    <p className="text-mq-sm text-mq-content-secondary">{t('privacyPolicyDesc')}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                    onClick={() =>
                      window.open(EXTERNAL_LINKS.privacy, '_blank', 'noopener,noreferrer')
                    }
                    data-testid="privacy-policy-button"
                  >
                    {t('view')}
                  </Button>
                </div>
              </div>

              {/* Export Data */}
              <div className="p-3 bg-mq-card-background/50 backdrop-blur-sm rounded-mq-lg border border-mq-border hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-mq-content">{t('exportData')}</h3>
                    <p className="text-mq-sm text-mq-content-secondary">{t('exportDataDesc')}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                    onClick={openExportDialog}
                    data-testid="export-data-button"
                  >
                    <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                    {t('export')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </MagicCard>

        {/* Sessions Dialog */}
        <Dialog open={showSessionsDialog} onOpenChange={setShowSessionsDialog}>
          <DialogContent className="sm:max-w-lg" data-testid="sessions-dialog">
            <DialogHeader>
              <DialogTitle>{t('manageSessions')}</DialogTitle>
              <DialogDescription>{t('manageSessionsDesc')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-3" role="list" aria-label={t('manageSessions')}>
              {sessions.length === 0 ? (
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
                      onClick={() => endSession(session.id)}
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
              <Button variant="secondary" onClick={() => setShowSessionsDialog(false)}>
                {t('close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Confirmation Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="sm:max-w-md" data-testid="export-dialog">
            <DialogHeader>
              <DialogTitle>{t('confirmExport')}</DialogTitle>
              <DialogDescription>{t('confirmExportDesc')}</DialogDescription>
            </DialogHeader>

            {/* Warning about sensitive data */}
            <div className="flex items-start gap-3 p-3 bg-mq-warning/10 border border-mq-warning/20 rounded-mq-lg">
              <AlertTriangle
                className="h-5 w-5 text-mq-warning flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="text-mq-sm text-mq-content-secondary">{t('exportWarning')}</p>
            </div>

            <DialogFooter className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowExportDialog(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleExportData} data-testid="confirm-export-button">
                <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                {t('proceedExport')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent className="sm:max-w-md" data-testid="password-dialog">
            <DialogHeader>
              <DialogTitle>{t('changePasswordTitle')}</DialogTitle>
              <DialogDescription>{t('changePasswordDialogDesc')}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleChangePassword} className="space-y-4 py-4">
              {/* Current Password */}
              <div className="space-y-2">
                <label htmlFor="current-password" className="text-sm font-medium text-mq-content">
                  {t('currentPassword')}
                </label>
                <div className="relative">
                  <input
                    id="current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-mq border border-mq-border bg-mq-background text-mq-content focus:outline-none focus:ring-2 focus:ring-mq-primary"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    data-testid="current-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mq-content-tertiary hover:text-mq-content"
                    aria-label={showCurrentPassword ? t('hidePassword') : t('showPassword')}
                    data-testid="toggle-current-password"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium text-mq-content">
                  {t('newPassword')}
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-mq border border-mq-border bg-mq-background text-mq-content focus:outline-none focus:ring-2 focus:ring-mq-primary"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    data-testid="new-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mq-content-tertiary hover:text-mq-content"
                    aria-label={showNewPassword ? t('hidePassword') : t('showPassword')}
                    data-testid="toggle-new-password"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordStrength && (
                  <div className="space-y-1" data-testid="password-strength">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((index) => (
                        <div
                          key={index}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            index < passwordStrength.score
                              ? strengthColors[passwordStrength.strength]
                              : 'bg-mq-border'
                          }`}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-mq-xs ${
                        passwordStrength.strength === 'weak'
                          ? 'text-mq-error'
                          : passwordStrength.strength === 'fair'
                            ? 'text-mq-warning'
                            : passwordStrength.strength === 'good'
                              ? 'text-mq-info'
                              : 'text-mq-success'
                      }`}
                    >
                      {t(strengthLabels[passwordStrength.strength])}
                    </p>
                    {passwordStrength.feedback.length > 0 &&
                      passwordStrength.strength !== 'strong' && (
                        <ul className="text-mq-xs text-mq-content-secondary list-disc list-inside">
                          {passwordStrength.feedback.slice(0, 2).map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      )}
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium text-mq-content">
                  {t('confirmNewPassword')}
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-3 py-2 pr-10 rounded-mq border bg-mq-background text-mq-content focus:outline-none focus:ring-2 focus:ring-mq-primary ${
                      confirmPassword && newPassword !== confirmPassword
                        ? 'border-mq-error'
                        : 'border-mq-border'
                    }`}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    data-testid="confirm-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mq-content-tertiary hover:text-mq-content"
                    aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
                    data-testid="toggle-confirm-password"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-mq-xs text-mq-error">{t('passwordsDoNotMatch')}</p>
                )}
              </div>

              <DialogFooter className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowPasswordDialog(false)}
                  disabled={isChangingPassword}
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isChangingPassword ||
                    (confirmPassword !== '' && newPassword !== confirmPassword)
                  }
                  data-testid="submit-password-change"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                      {t('loading')}
                    </>
                  ) : (
                    t('changePassword')
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </>
    );
  },
);

PrivacySettings.displayName = 'PrivacySettings';

export default PrivacySettings;

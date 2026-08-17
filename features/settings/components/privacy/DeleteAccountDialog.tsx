'use client';

/**
 * Account deletion dialog.
 *
 * Q3/Q4 (external security and privacy review, 2026-08-17). The strings
 * `deleteAccount`, `deleteAccountDesc` ("Permanently delete your account and
 * all data") and `deleteAccountWarning` have existed in all 34 locale files
 * since the settings screen was first translated, with no component rendering
 * them, while the privacy policy told users they could delete their account
 * from settings. This is the control those strings were written for.
 *
 * Deliberately composed from translation keys that already exist. Adding a new
 * user-facing string means editing 35 locale files (AGENT.md), and shipping
 * English placeholders into 34 of them to satisfy a review would be worse than
 * reusing `currentPassword`, `emailAddress`, `cancel` and `delete`, which are
 * already correctly translated everywhere.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/mq/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { toastUtils } from '@/lib/utils/toast';
import { errorHandler } from '@/lib/utils/errorHandling';
import { clearAllApplicationData } from '@/lib/utils/clientStorage';
import type { TranslationKey } from '@/lib/i18n/translations';

type DeleteAccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  /**
   * Address of the signed-in account. Present for OAuth-only accounts, which
   * have no password to re-enter and confirm by typing this instead.
   */
  accountEmail?: string | null;
  /** True when the account holds an email/password identity. */
  hasPassword: boolean;
};

export function DeleteAccountDialog({
  open,
  onOpenChange,
  t,
  accountEmail,
  hasPassword,
}: DeleteAccountDialogProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const canSubmit = hasPassword
    ? password.length > 0
    : confirmEmail.trim().toLowerCase() === (accountEmail ?? '').toLowerCase() &&
      confirmEmail.length > 0;

  const handleDelete = useCallback(async () => {
    if (!canSubmit) return;
    setIsDeleting(true);

    try {
      const response = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(hasPassword ? { password } : { confirmEmail }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        toastUtils.error(t('error'), json?.error?.message ?? t('settingsError'));
        return;
      }

      // The account is gone. Clear every local trace before leaving, so the
      // next person to use this browser does not find cached academic data
      // belonging to a deleted account.
      clearAllApplicationData();

      onOpenChange(false);
      toastUtils.success(t('success'), t('deleteAccountDesc'));

      // Full reload rather than router.push: the session is invalid and every
      // store needs to be reconstructed from nothing.
      window.location.href = '/';
    } catch (error) {
      errorHandler.logError(
        error instanceof Error ? error : new Error('Failed to delete account'),
        'Settings Delete Account',
        'high',
      );
      toastUtils.error(t('error'), t('settingsError'));
    } finally {
      setIsDeleting(false);
    }
  }, [canSubmit, hasPassword, password, confirmEmail, t, onOpenChange, router]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setPassword('');
      setConfirmEmail('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="delete-account-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-mq-error">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            {t('deleteAccount')}
          </DialogTitle>
          <DialogDescription>{t('deleteAccountDesc')}</DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 p-3 bg-mq-error/10 border border-mq-error/20 rounded-mq-lg">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-mq-sm font-medium text-mq-error">{t('warning')}</p>
            <p className="text-mq-sm text-mq-content-secondary">{t('deleteAccountWarning')}</p>
          </div>
        </div>

        {hasPassword ? (
          <div className="space-y-2">
            <label
              htmlFor="delete-account-password"
              className="text-sm font-medium text-mq-content"
            >
              {t('currentPassword')}
            </label>
            <input
              id="delete-account-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-mq border border-mq-border bg-mq-background text-mq-content focus:outline-none focus:ring-2 focus:ring-mq-error"
              autoComplete="current-password"
              data-testid="delete-account-password-input"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <label htmlFor="delete-account-email" className="text-sm font-medium text-mq-content">
              {t('emailAddress')}
            </label>
            <input
              id="delete-account-email"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-mq border border-mq-border bg-mq-background text-mq-content focus:outline-none focus:ring-2 focus:ring-mq-error"
              placeholder={accountEmail ?? ''}
              autoComplete="off"
              data-testid="delete-account-email-input"
            />
          </div>
        )}

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => handleOpenChange(false)} disabled={isDeleting}>
            {t('cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !canSubmit}
            data-testid="confirm-delete-account-button"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                {t('loading')}
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                {t('delete')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

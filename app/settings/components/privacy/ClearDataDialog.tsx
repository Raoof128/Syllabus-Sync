'use client';

import { useState, useCallback } from 'react';
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
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import type { TranslationKey } from '@/lib/i18n/translations';

type ClearDataDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

// Internal component to handle store subscriptions only when dialog is open
function ClearDataInfo({
  t,
}: {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}) {
  const units = useUnitsStore((state) => state.units);
  const deadlines = useDeadlinesStore((state) => state.deadlines);

  return (
    <div className="flex items-start gap-3 p-3 bg-mq-error/10 border border-mq-error/20 rounded-mq-lg">
      <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-mq-sm font-medium text-mq-error">{t('warning')}</p>
        <p className="text-mq-sm text-mq-content-secondary">
          {t('clearDataSummary', {
            units: units.length,
            deadlines: deadlines.length,
          })}
        </p>
      </div>
    </div>
  );
}

export function ClearDataDialog({ open, onOpenChange, t }: ClearDataDialogProps) {
  const [clearDataConfirmation, setClearDataConfirmation] = useState('');
  const [isClearingData, setIsClearingData] = useState(false);

  const handleClearAllData = useCallback(async () => {
    if (clearDataConfirmation !== t('clearConfirm')) {
      toastUtils.error(t('settingsError'), t('clearDataConfirmRequired'));
      return;
    }

    setIsClearingData(true);

    try {
      // Clear all client-side storage
      clearAllApplicationData();

      // Close dialog and show success
      onOpenChange(false);
      setClearDataConfirmation('');
      toastUtils.success(t('clearAllData'), t('preferenceUpdated'));

      // Reload the page to reset all stores
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      errorHandler.logError(
        error instanceof Error ? error : new Error('Failed to clear data'),
        'Settings Clear Data',
        'high',
      );
      toastUtils.error(t('settingsError'), t('preferenceError'));
    } finally {
      setIsClearingData(false);
    }
  }, [clearDataConfirmation, t, onOpenChange]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setClearDataConfirmation('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="clear-data-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-mq-error">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            {t('clearAllDataTitle')}
          </DialogTitle>
          <DialogDescription>{t('clearAllDataDialogDesc')}</DialogDescription>
        </DialogHeader>

        {/* Warning about data loss - Subscribes to store only when rendered */}
        <ClearDataInfo t={t} />

        {/* Confirmation input */}
        <div className="space-y-2">
          <label htmlFor="clear-data-confirm" className="text-sm font-medium text-mq-content">
            {t('clearDataConfirmPlaceholder')}
          </label>
          <input
            id="clear-data-confirm"
            type="text"
            value={clearDataConfirmation}
            onChange={(e) => setClearDataConfirmation(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 rounded-mq border border-mq-border bg-mq-background text-mq-content focus:outline-none focus:ring-2 focus:ring-mq-error"
            placeholder={t('clearConfirm')}
            autoComplete="off"
            data-testid="clear-data-confirm-input"
          />
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => handleOpenChange(false)}
            disabled={isClearingData}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleClearAllData}
            disabled={isClearingData || clearDataConfirmation !== t('clearConfirm')}
            data-testid="confirm-clear-data-button"
          >
            {isClearingData ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                {t('loading')}
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                {t('clearData')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { Button } from '@/components/ui/mq/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Download } from 'lucide-react';
import { useDataExport } from '@/lib/hooks/useDataExport';
import type { TranslationKey } from '@/lib/i18n/translations';

type ExportDataDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  language: string;
};

export function ExportDataDialog({ open, onOpenChange, t, language }: ExportDataDialogProps) {
  const { exportData } = useDataExport({ t, language });

  const handleExport = () => {
    exportData();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="export-dialog">
        <DialogHeader>
          <DialogTitle>{t('confirmExport')}</DialogTitle>
          <DialogDescription>{t('confirmExportDesc')}</DialogDescription>
        </DialogHeader>

        {/* Warning about sensitive data */}
        <div className="flex items-start gap-3 p-3 bg-mq-warning/10 border border-mq-warning/20 rounded-mq-lg">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-mq-sm text-mq-content-secondary">{t('exportWarning')}</p>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleExport} data-testid="confirm-export-button">
            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            {t('proceedExport')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

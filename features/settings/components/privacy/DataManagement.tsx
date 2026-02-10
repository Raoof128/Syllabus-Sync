'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Download, Trash2 } from 'lucide-react';
import { ExportDataDialog } from './ExportDataDialog';
import { ClearDataDialog } from './ClearDataDialog';
import type { TranslationKey } from '@/lib/i18n/translations';

type DataManagementProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  language: string;
};

export function DataManagement({ t, language }: DataManagementProps) {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);

  return (
    <>
      {/* Export Data */}
      <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-mq-content">{t('exportData')}</h3>
            <p className="text-mq-sm text-mq-content-secondary">{t('exportDataDesc')}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
            onClick={() => setShowExportDialog(true)}
            data-testid="export-data-button"
          >
            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            {t('export')}
          </Button>
        </div>
      </div>

      {/* Clear All Data */}
      <div className="p-3 bg-mq-error/5 rounded-mq-lg border border-mq-error/20 hover:border-mq-error/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)] transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-mq-content">{t('clearAllData')}</h3>
            <p className="text-mq-sm text-mq-content-secondary">{t('clearAllDataDesc')}</p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowClearDataDialog(true)}
            data-testid="clear-data-button"
          >
            <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
            {t('clearData')}
          </Button>
        </div>
      </div>

      <ExportDataDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        t={t}
        language={language}
      />

      <ClearDataDialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog} t={t} />
    </>
  );
}

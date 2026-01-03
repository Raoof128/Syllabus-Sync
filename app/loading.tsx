// app/loading.tsx
'use client';

import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function Loading() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-mq-primary mx-auto mb-4" />
        <p className="text-mq-content-secondary">{t('loading')}</p>
      </div>
    </div>
  );
}

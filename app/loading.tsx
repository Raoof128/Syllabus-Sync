// app/loading.tsx
// Server Component - CSS-only skeleton for zero-JS first paint

import { getTranslations } from '@/lib/i18n/translations';

export default function Loading() {
  const t = getTranslations('en');

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center" role="status" aria-live="polite">
        {/* CSS-only spinner - no client JS needed */}
        <div className="h-8 w-8 mx-auto mb-4 rounded-full border-4 border-mq-border border-t-mq-primary animate-spin" />
        <p className="text-mq-content-secondary text-sm">{t.loading}</p>
        <span className="sr-only">{t.loadingContentPleaseWait}</span>
      </div>
    </div>
  );
}

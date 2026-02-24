// app/offline/page.tsx
'use client';

import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';

export default function OfflinePage() {
  const { t } = useTypedTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-mq-background px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mq-error/10 border border-mq-error/20">
          <svg
            className="h-8 w-8 text-mq-error"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-mq-content">{t('youAreOffline')}</h1>
          <p className="text-mq-content-secondary text-sm leading-relaxed">
            {t('youAreOfflineDesc')}
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-mq-md bg-mq-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mq-primary/90 focus:outline-none focus:ring-2 focus:ring-mq-primary/50 focus:ring-offset-2 focus:ring-offset-mq-background"
        >
          {t('tryAgain')}
        </button>
      </div>
    </div>
  );
}

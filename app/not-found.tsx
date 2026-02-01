// app/not-found.tsx
'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';

export default function NotFound() {
  const { t } = useTypedTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-mq-content mb-4">404</h1>
        <h2 className="text-mq-2xl font-semibold text-mq-content-secondary mb-2">
          {t('pageNotFound')}
        </h2>
        <p className="text-mq-content-tertiary mb-8 max-w-md">{t('pageNotFoundDescription')}</p>

        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/home" className="gap-2">
              <Home className="h-4 w-4" />
              {t('goHome')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

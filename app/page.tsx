import { Suspense } from 'react';
import AuthRedirectHandler from './AuthRedirectHandler';
import { Loader2 } from 'lucide-react';
import { getTranslations } from '@/lib/i18n/translations';

function LoadingFallback() {
  const t = getTranslations('en');

  return (
    <div className="min-h-screen flex items-center justify-center bg-mq-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-mq-primary" />
        <p className="mt-4 text-mq-content-secondary">{t.loading}</p>
      </div>
    </div>
  );
}

export default function RootPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthRedirectHandler fallbackRedirect="/home" />
    </Suspense>
  );
}

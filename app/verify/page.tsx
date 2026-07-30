'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { API_ROUTES } from '@/lib/constants/config';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';

type VerifyState = 'loading' | 'success' | 'error' | 'pending';

export default function VerifyPage() {
  const { t } = useTypedTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token');
  const isValidFormat = useMemo(() => !!token && /^[0-9a-f]{64}$/.test(token), [token]);

  // The middleware's email-verification gate sends signed-in-but-unconfirmed
  // users here as /verify?reason=unverified — no token at all. That is not a
  // broken link, so it must not render the "invalid link" error: show a
  // check-your-inbox state and point at /login, where resend lives.
  const isGateRedirect = !token;

  const [state, setState] = useState<VerifyState>(
    isValidFormat ? 'loading' : isGateRedirect ? 'pending' : 'error',
  );

  useEffect(() => {
    if (!isValidFormat || !token) return;

    const verify = async () => {
      try {
        const res = await fetch(API_ROUTES.AUTH.EMAIL_VERIFY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        setState(data?.data?.verified ? 'success' : 'error');
      } catch {
        setState('error');
      }
    };

    verify();
  }, [isValidFormat, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-mq-background p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        {state === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-mq-primary mx-auto" />
            <h1 className="text-xl font-bold text-mq-content">{t('verifyingEmail')}</h1>
            <p className="text-sm text-mq-content-secondary">{t('pleaseWaitMoment')}</p>
          </>
        )}

        {state === 'success' && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-xl font-bold text-mq-content">{t('emailVerified')}</h1>
            <p className="text-sm text-mq-content-secondary">{t('emailVerifiedSuccess')}</p>
            <Button onClick={() => router.push('/login')} className="w-full">
              {t('goToLogin')}
            </Button>
          </>
        )}

        {state === 'pending' && (
          <>
            <MailCheck className="h-12 w-12 text-mq-primary mx-auto" aria-hidden="true" />
            <h1 className="text-xl font-bold text-mq-content">{t('verifyEmail')}</h1>
            <p className="text-sm text-mq-content-secondary">{t('verificationEmailSent')}</p>
            <Button onClick={() => router.push('/login')} className="w-full">
              {t('goToLogin')}
            </Button>
          </>
        )}

        {state === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="text-xl font-bold text-mq-content">{t('verificationFailed')}</h1>
            <p className="text-sm text-mq-content-secondary">{t('invalidVerificationLink')}</p>
            <Button onClick={() => router.push('/login')} variant="ghost" className="w-full">
              {t('backToLogin')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

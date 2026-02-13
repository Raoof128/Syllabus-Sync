'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { API_ROUTES } from '@/lib/constants/config';

type VerifyState = 'loading' | 'success' | 'error';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token');
  const isValidFormat = useMemo(
    () => !!token && /^[0-9a-f]{64}$/.test(token),
    [token],
  );

  // If token format is invalid, start in error state (no effect needed)
  const [state, setState] = useState<VerifyState>(isValidFormat ? 'loading' : 'error');

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
            <h1 className="text-xl font-bold text-mq-content">Verifying your email...</h1>
            <p className="text-sm text-mq-content-secondary">Please wait a moment.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-xl font-bold text-mq-content">Email Verified</h1>
            <p className="text-sm text-mq-content-secondary">
              Your email has been verified successfully. You can now sign in.
            </p>
            <Button onClick={() => router.push('/login')} className="w-full">
              Go to Login
            </Button>
          </>
        )}

        {state === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="text-xl font-bold text-mq-content">Verification Failed</h1>
            <p className="text-sm text-mq-content-secondary">
              Invalid or expired verification link. Please request a new one.
            </p>
            <Button onClick={() => router.push('/login')} variant="ghost" className="w-full">
              Back to Login
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

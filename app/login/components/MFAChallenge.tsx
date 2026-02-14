'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Input } from '@/components/ui/mq/input';
import { Shield, Loader2, AlertTriangle, Smartphone, ArrowLeft } from 'lucide-react';
import type { TranslationKey } from '@/lib/i18n/translations';
import { toastUtils } from '@/lib/utils/toast';
import { API_ROUTES } from '@/lib/constants/config';

export interface MFAFactorInfo {
  id: string;
  type: 'totp' | 'phone';
  name?: string;
  phone?: string;
}

interface MFAChallengeProps {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  factors: MFAFactorInfo[];
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * MFA Challenge component shown during login flow.
 * Handles both TOTP and SMS verification via Supabase MFA API.
 */
export function MFAChallenge({ t, factors, onSuccess, onCancel }: MFAChallengeProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFactor, setSelectedFactor] = useState<MFAFactorInfo | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  // Auto-select the first TOTP factor, or fall back to phone
  useEffect(() => {
    const totpFactor = factors.find((f) => f.type === 'totp');
    const phoneFactor = factors.find((f) => f.type === 'phone');
    setSelectedFactor(totpFactor || phoneFactor || null);
  }, [factors]);

  const handleVerify = useCallback(async () => {
    if (!selectedFactor || code.length !== 6) return;

    if (attemptsLeft <= 0) {
      setError('Too many attempts. Please try again later.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // SECURITY: Route through server-side API to enforce server-side rate
      // limiting (5 attempts / 15 min) instead of calling Supabase MFA API
      // directly from the browser which bypasses our rate limiter.
      const res = await fetch(API_ROUTES.AUTH.MFA_CHALLENGE_VERIFY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factorId: selectedFactor.id,
          code: code.trim(),
        }),
      });

      const result = await res.json();

      if (!res.ok || !result?.data?.verified) {
        setAttemptsLeft((prev) => prev - 1);
        if (attemptsLeft <= 1) {
          setError('Too many failed attempts. Please sign in again.');
          setTimeout(onCancel, 2000);
        } else {
          setError(
            result?.error?.message ??
              `Invalid code. ${attemptsLeft - 1} attempt${attemptsLeft - 1 === 1 ? '' : 's'} remaining.`,
          );
        }
        return;
      }

      // Success — session upgraded to aal2 via server-side cookies
      toastUtils.success(t('welcomeBack'), 'Identity verified.');
      onSuccess();
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFactor, code, attemptsLeft, t, onSuccess, onCancel]);

  const switchFactor = useCallback(
    (type: 'totp' | 'phone') => {
      const factor = factors.find((f) => f.type === type);
      if (factor) {
        setSelectedFactor(factor);
        setCode('');
        setError(null);
      }
    },
    [factors],
  );

  const handleResendSMS = useCallback(async () => {
    if (!selectedFactor || selectedFactor.type !== 'phone' || resendCooldown > 0) return;

    try {
      // Use server-side challenge-verify endpoint to trigger SMS resend
      // by creating a new challenge for the phone factor
      const res = await fetch(API_ROUTES.AUTH.MFA_CHALLENGE_VERIFY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factorId: selectedFactor.id, code: '000000' }),
      });
      // We expect this to fail (wrong code), but it triggers the SMS send
      // via the challenge creation step. The error is expected.
      if (res.status !== 429) {
        toastUtils.success(t('security'), 'New code sent!');
      } else {
        setError('Too many attempts. Please wait before retrying.');
      }

      // Start cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError('Failed to resend code.');
    }
  }, [selectedFactor, resendCooldown, t]);

  const hasMultipleFactorTypes =
    factors.some((f) => f.type === 'totp') && factors.some((f) => f.type === 'phone');

  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-sm mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="p-2.5 sm:p-3 bg-mq-primary/10 rounded-full">
            <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-mq-primary" />
          </div>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-mq-content">Two-Step Verification</h2>
        <p className="text-xs sm:text-sm text-mq-content-secondary">
          {selectedFactor?.type === 'totp'
            ? 'Enter the 6-digit code from your authenticator app.'
            : `Enter the code sent to ****${selectedFactor?.phone?.slice(-4) ?? ''}.`}
        </p>
      </div>

      {/* Code Input */}
      <div className="space-y-3">
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
            setCode(val);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && code.length === 6) handleVerify();
          }}
          className="text-center text-2xl sm:text-3xl tracking-[0.35em] sm:tracking-[0.5em] font-mono h-14 sm:h-16"
          autoFocus
          autoComplete="one-time-code"
          disabled={isLoading || attemptsLeft <= 0}
        />

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-xs sm:text-sm justify-center text-center">
            <AlertTriangle className="h-4 w-4" />
            <span className="break-words">{error}</span>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleVerify}
        disabled={isLoading || code.length !== 6 || attemptsLeft <= 0}
        className="w-full h-12 font-bold"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Verifying...
          </>
        ) : (
          'Verify'
        )}
      </Button>

      {/* SMS Resend */}
      {selectedFactor?.type === 'phone' && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResendSMS}
            disabled={resendCooldown > 0}
            className="text-xs"
          >
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
          </Button>
        </div>
      )}

      {/* Factor Switcher */}
      {hasMultipleFactorTypes && (
        <div className="border-t border-mq-border pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-mq-content-secondary"
            onClick={() => switchFactor(selectedFactor?.type === 'totp' ? 'phone' : 'totp')}
          >
            <Smartphone className="h-3 w-3 mr-1" />
            {selectedFactor?.type === 'totp' ? 'Use SMS instead' : 'Use authenticator app instead'}
          </Button>
        </div>
      )}

      {/* Back Button */}
      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-xs text-mq-content-secondary"
        >
          <ArrowLeft className="h-3 w-3 mr-1" />
          {t('backToLogin')}
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Input } from '@/components/ui/mq/input';
import { Shield, Loader2, AlertTriangle, Smartphone, ArrowLeft } from 'lucide-react';
import type { TranslationKey } from '@/lib/i18n/translations';
import { toastUtils } from '@/lib/utils/toast';
import { createBrowserClient } from '@/lib/supabase/client';

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
      const supabase = createBrowserClient();

      // Create challenge
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: selectedFactor.id,
      });

      if (challengeError || !challenge) {
        setError('Failed to create verification challenge. Please try again.');
        return;
      }

      // Verify code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: selectedFactor.id,
        challengeId: challenge.id,
        code: code.trim(),
      });

      if (verifyError) {
        setAttemptsLeft((prev) => prev - 1);
        if (attemptsLeft <= 1) {
          setError('Too many failed attempts. Please sign in again.');
          setTimeout(onCancel, 2000);
        } else {
          setError(
            `Invalid code. ${attemptsLeft - 1} attempt${attemptsLeft - 1 === 1 ? '' : 's'} remaining.`,
          );
        }
        return;
      }

      // Success — session upgraded to aal2
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
      const supabase = createBrowserClient();
      await supabase.auth.mfa.challenge({ factorId: selectedFactor.id });
      toastUtils.success(t('security'), 'New code sent!');

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
    <div className="space-y-6 w-full max-w-sm mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="p-3 bg-mq-primary/10 rounded-full">
            <Shield className="h-8 w-8 text-mq-primary" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-mq-content">Two-Step Verification</h2>
        <p className="text-sm text-mq-content-secondary">
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
          className="text-center text-3xl tracking-[0.5em] font-mono h-16"
          autoFocus
          autoComplete="one-time-code"
          disabled={isLoading || attemptsLeft <= 0}
        />

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm justify-center">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
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

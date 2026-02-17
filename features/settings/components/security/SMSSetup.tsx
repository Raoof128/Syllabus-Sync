'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';
import { Input } from '@/components/ui/mq/input';
import {
  Smartphone,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TranslationKey } from '@/lib/i18n/translations';
import { toastUtils } from '@/lib/utils/toast';
import { API_ROUTES } from '@/lib/constants/config';
import type { MFAFactor } from '@/lib/security/mfa';

interface SMSSetupProps {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  factors: MFAFactor[];
  onStatusChange: () => void;
}

type SetupStep = 'idle' | 'phone' | 'verify' | 'success';

export function SMSSetup({ t, factors, onStatusChange }: SMSSetupProps) {
  const [step, setStep] = useState<SetupStep>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disableFactorId, setDisableFactorId] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const phoneFactors = factors.filter(
    (f) => f.type === 'phone' && f.status === 'verified',
  );
  const isEnabled = phoneFactors.length > 0;

  const handleStartSetup = useCallback(() => {
    setStep('phone');
    setPhone('');
    setVerifyError(null);
  }, []);

  const handleEnrollPhone = useCallback(async () => {
    if (!phone || !/^\+[1-9]\d{6,14}$/.test(phone.trim())) {
      setVerifyError('Enter a valid phone number (e.g., +61412345678)');
      return;
    }

    setIsLoading(true);
    setVerifyError(null);
    try {
      const res = await fetch(API_ROUTES.AUTH.MFA_SMS_ENROLL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const result = await res.json();

      if (!res.ok || !result?.data?.factorId || !result?.data?.challengeId) {
        setVerifyError(
          result?.error?.message ||
            'Failed to send SMS. Check your phone number.',
        );
        return;
      }

      setFactorId(result.data.factorId);
      setChallengeId(result.data.challengeId);
      setStep('verify');

      // Start resend cooldown
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
      setVerifyError('Failed to send SMS');
    } finally {
      setIsLoading(false);
    }
  }, [phone]);

  const handleVerify = useCallback(async () => {
    if (!factorId || !challengeId || verifyCode.length !== 6) return;

    setIsLoading(true);
    setVerifyError(null);
    try {
      const res = await fetch(API_ROUTES.AUTH.MFA_SMS_VERIFY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factorId, challengeId, code: verifyCode }),
      });
      const result = await res.json();

      if (!res.ok || !result?.data?.verified) {
        setVerifyError(result?.error?.message || 'Invalid code');
        return;
      }

      setStep('success');
      toastUtils.success(t('security'), 'SMS verification enabled!');
      onStatusChange();
    } catch {
      setVerifyError('Verification failed');
    } finally {
      setIsLoading(false);
    }
  }, [factorId, challengeId, verifyCode, t, onStatusChange]);

  const handleResend = useCallback(async () => {
    if (!factorId || resendCooldown > 0) return;
    setIsLoading(true);
    setVerifyError(null);
    try {
      const res = await fetch(API_ROUTES.AUTH.MFA_CHALLENGE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factorId }),
      });
      const result = await res.json();
      if (!res.ok || !result?.data?.challengeId) {
        setVerifyError(result?.error?.message || 'Failed to resend code');
        return;
      }
      setChallengeId(result.data.challengeId);
      setVerifyCode('');

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
      setVerifyError('Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  }, [factorId, resendCooldown]);

  const handleDisable = useCallback(async () => {
    if (!disableFactorId) return;

    setIsLoading(true);
    try {
      const res = await fetch(API_ROUTES.AUTH.MFA_UNENROLL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factorId: disableFactorId }),
      });

      if (!res.ok) {
        const result = await res.json();
        toastUtils.error(
          t('error'),
          result?.error?.message || 'Failed to disable SMS 2FA',
        );
        return;
      }

      setShowDisableDialog(false);
      setDisableFactorId(null);
      toastUtils.success(t('security'), 'SMS verification disabled.');
      onStatusChange();
    } catch {
      toastUtils.error(t('error'), t('tryAgainLater'));
    } finally {
      setIsLoading(false);
    }
  }, [disableFactorId, t, onStatusChange]);

  const resetSetup = useCallback(() => {
    setStep('idle');
    setPhone('');
    setFactorId(null);
    setChallengeId(null);
    setVerifyCode('');
    setVerifyError(null);
  }, []);

  return (
    <>
      <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-mq-info/10 rounded-full">
              <Smartphone className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-mq-content">
                  SMS Verification (Fallback)
                </h3>
                {isEnabled ? (
                  <Badge className="bg-mq-success/20 text-mq-success">
                    {t('enabled')}
                  </Badge>
                ) : (
                  <Badge className="bg-mq-content-secondary/20 text-mq-content-secondary">
                    {t('disabled')}
                  </Badge>
                )}
              </div>
              <p className="text-mq-sm text-mq-content-secondary">
                Receive a verification code via SMS as a backup method.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (isEnabled) {
                setDisableFactorId(phoneFactors[0]?.id ?? null);
                setShowDisableDialog(true);
              } else {
                handleStartSetup();
              }
            }}
            disabled={isLoading}
            className={`px-3 py-1 text-xs ${
              isEnabled
                ? 'text-red-500 hover:bg-red-500/10'
                : 'text-mq-primary hover:bg-mq-primary/10'
            }`}
            data-testid="toggle-sms"
          >
            {isEnabled ? t('disable') : t('enable')}
          </Button>
        </div>

        {isEnabled && phoneFactors.length > 0 && (
          <div className="mt-3 pt-3 border-t border-mq-border">
            <div className="flex items-center gap-2 text-mq-sm text-mq-content-secondary">
              <CheckCircle className="h-4 w-4 text-mq-success" />
              <span>
                Phone ending in {phoneFactors[0].phone?.slice(-4) ?? '****'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Phone Entry Dialog */}
      <Dialog
        open={step === 'phone' || step === 'verify'}
        onOpenChange={(open) => {
          if (!open) resetSetup();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              {step === 'phone'
                ? 'Set Up SMS Verification'
                : 'Enter Verification Code'}
            </DialogTitle>
            <DialogDescription>
              {step === 'phone'
                ? 'Enter your phone number to receive verification codes via SMS.'
                : 'Enter the 6-digit code sent to your phone.'}
            </DialogDescription>
          </DialogHeader>

          {step === 'phone' && (
            <div className="py-4 space-y-4">
              <Input
                type="tel"
                placeholder="+61412345678"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setVerifyError(null);
                }}
                className="h-12 text-lg"
                autoFocus
              />
              {verifyError && (
                <div className="flex items-center gap-2 text-red-500 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{verifyError}</span>
                </div>
              )}
              <div className="flex items-start gap-2 p-3 bg-mq-info/10 rounded-lg">
                <Info className="h-4 w-4 text-mq-info flex-shrink-0 mt-0.5" />
                <p className="text-xs text-mq-content-secondary">
                  Standard SMS rates may apply. Use E.164 format with country
                  code (e.g., +61 for Australia).
                </p>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="py-4 space-y-4">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerifyCode(val);
                  setVerifyError(null);
                }}
                className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                autoFocus
                autoComplete="one-time-code"
              />
              {verifyError && (
                <div className="flex items-center gap-2 text-red-500 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{verifyError}</span>
                </div>
              )}
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={resendCooldown > 0}
                  onClick={handleResend}
                  className="text-xs"
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend Code'}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={resetSetup}
              disabled={isLoading}
            >
              {t('cancel')}
            </Button>
            {step === 'phone' && (
              <Button
                onClick={handleEnrollPhone}
                disabled={isLoading || !phone}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  'Send Code'
                )}
              </Button>
            )}
            {step === 'verify' && (
              <Button
                onClick={handleVerify}
                disabled={isLoading || !challengeId || verifyCode.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Enable'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog
        open={step === 'success'}
        onOpenChange={(open) => {
          if (!open) resetSetup();
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-mq-success">
              <CheckCircle className="h-5 w-5" />
              SMS Verification Enabled!
            </DialogTitle>
            <DialogDescription>
              You can now use SMS as a backup verification method when signing
              in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={resetSetup}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Disable SMS Verification?
            </DialogTitle>
            <DialogDescription>
              This will remove SMS as a backup verification method.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDisableDialog(false)}
              disabled={isLoading}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('processing')}
                </>
              ) : (
                'Disable SMS'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

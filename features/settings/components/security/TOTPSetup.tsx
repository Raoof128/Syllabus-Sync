'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';
import { Input } from '@/components/ui/mq/input';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Loader2,
  Copy,
  CheckCircle,
  AlertTriangle,
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

interface TOTPSetupProps {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  factors: MFAFactor[];
  onStatusChange: () => void;
}

type SetupStep = 'idle' | 'qr' | 'verify' | 'success';

export function TOTPSetup({ t, factors, onStatusChange }: TOTPSetupProps) {
  const [step, setStep] = useState<SetupStep>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);
  const [disableFactorId, setDisableFactorId] = useState<string | null>(null);

  const totpFactors = factors.filter(
    (f) => f.type === 'totp' && f.status === 'verified',
  );
  const isEnabled = totpFactors.length > 0;

  const handleStartSetup = useCallback(async () => {
    setIsLoading(true);
    setVerifyError(null);
    try {
      const res = await fetch(API_ROUTES.AUTH.MFA_ENROLL, { method: 'POST' });
      const result = await res.json();

      if (!res.ok || !result?.data) {
        toastUtils.error(
          t('error'),
          result?.error?.message || 'Failed to start setup',
        );
        return;
      }

      setFactorId(result.data.factorId);
      setQrCode(result.data.qrCode);
      setSecret(result.data.secret);
      setStep('qr');
    } catch {
      toastUtils.error(t('error'), t('tryAgainLater'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const handleVerify = useCallback(async () => {
    if (!factorId || verifyCode.length !== 6) return;

    setIsLoading(true);
    setVerifyError(null);
    try {
      const res = await fetch(API_ROUTES.AUTH.MFA_VERIFY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factorId, code: verifyCode }),
      });
      const result = await res.json();

      if (!res.ok || !result?.data?.verified) {
        setVerifyError(
          result?.error?.message || 'Invalid code. Please try again.',
        );
        return;
      }

      setStep('success');
      toastUtils.success(t('security'), 'Two-factor authentication enabled!');
      onStatusChange();
    } catch {
      setVerifyError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [factorId, verifyCode, t, onStatusChange]);

  const handleDisable = useCallback(async () => {
    if (!disableFactorId) return;

    setIsLoading(true);
    try {
      const res = await fetch(API_ROUTES.AUTH.MFA_UNENROLL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factorId: disableFactorId }),
      });
      const result = await res.json();

      if (!res.ok) {
        toastUtils.error(
          t('error'),
          result?.error?.message || 'Failed to disable 2FA',
        );
        return;
      }

      setShowDisableDialog(false);
      setDisableFactorId(null);
      toastUtils.success(t('security'), 'Two-factor authentication disabled.');
      onStatusChange();
    } catch {
      toastUtils.error(t('error'), t('tryAgainLater'));
    } finally {
      setIsLoading(false);
    }
  }, [disableFactorId, t, onStatusChange]);

  const copySecret = useCallback(() => {
    navigator.clipboard.writeText(secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  }, [secret]);

  const resetSetup = useCallback(() => {
    setStep('idle');
    setFactorId(null);
    setQrCode('');
    setSecret('');
    setVerifyCode('');
    setVerifyError(null);
  }, []);

  return (
    <>
      <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-mq-primary/10 rounded-full">
              <Shield className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-mq-content">
                  Authenticator App (TOTP)
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
                Use an authenticator app like Google Authenticator or Authy for
                two-step verification.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (isEnabled) {
                setDisableFactorId(totpFactors[0]?.id ?? null);
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
            data-testid="toggle-totp"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isEnabled ? (
              t('disable')
            ) : (
              t('enable')
            )}
          </Button>
        </div>

        {isEnabled && totpFactors.length > 0 && (
          <div className="mt-3 pt-3 border-t border-mq-border">
            <div className="flex items-center gap-2 text-mq-sm text-mq-success">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>
                Active since{' '}
                {new Date(totpFactors[0].createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Setup Dialog - QR Code Step */}
      <Dialog
        open={step === 'qr' || step === 'verify'}
        onOpenChange={(open) => {
          if (!open) resetSetup();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {step === 'qr'
                ? 'Set Up Authenticator App'
                : 'Verify Setup'}
            </DialogTitle>
            <DialogDescription>
              {step === 'qr'
                ? 'Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)'
                : 'Enter the 6-digit code from your authenticator app to confirm setup.'}
            </DialogDescription>
          </DialogHeader>

          {step === 'qr' && (
            <div className="py-4 space-y-4">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCode}
                    alt={t('totpQrCodeAlt')}
                    width={200}
                    height={200}
                    className="w-[200px] h-[200px]"
                  />
                </div>
              </div>

              {/* Manual Secret */}
              <div className="space-y-2">
                <p className="text-xs text-mq-content-secondary text-center">
                  Can&apos;t scan? Enter this code manually:
                </p>
                <div className="flex items-center gap-2 justify-center">
                  <code className="text-xs bg-mq-card-background px-3 py-1.5 rounded border border-mq-border font-mono tracking-wider select-all">
                    {secret}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copySecret}
                    className="p-1 h-auto"
                    aria-label={t('copySecret')}
                  >
                    {secretCopied ? (
                      <CheckCircle className="h-4 w-4 text-mq-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
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
            {step === 'qr' && (
              <Button onClick={() => setStep('verify')}>
                Continue
              </Button>
            )}
            {step === 'verify' && (
              <Button
                onClick={handleVerify}
                disabled={isLoading || verifyCode.length !== 6}
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
              <ShieldCheck className="h-5 w-5" />
              2FA Enabled!
            </DialogTitle>
            <DialogDescription>
              Your account is now protected with two-factor authentication. You
              will need your authenticator app each time you sign in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={resetSetup}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation Dialog */}
      <Dialog
        open={showDisableDialog}
        onOpenChange={setShowDisableDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-red-500" />
              Disable Two-Factor Authentication?
            </DialogTitle>
            <DialogDescription>
              This will remove the authenticator app requirement from your
              account. Your account will be less secure.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="flex items-start gap-3 p-3 bg-red-500/10 rounded-mq-lg border border-red-500/20">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-mq-sm text-mq-content-secondary">
                Without 2FA, anyone with your password can access your account.
                This action requires current session verification.
              </p>
            </div>
          </div>
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
                'Disable 2FA'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

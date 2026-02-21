'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/mq/button';
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
import { ToggleControl } from '../ToggleControl';

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

  const totpFactors = factors.filter((f) => f.type === 'totp' && f.status === 'verified');
  const isEnabled = totpFactors.length > 0;

  const handleStartSetup = useCallback(async () => {
    setIsLoading(true);
    setVerifyError(null);
    try {
      // SECURITY: Fresh enrollment on every start to avoid stale factors
      const res = await fetch(API_ROUTES.AUTH.MFA_ENROLL, {
        method: 'POST',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const result = await res.json();

      if (!res.ok || !result?.data) {
        toastUtils.error(t('error'), result?.error?.message || 'Failed to start setup. Please try again.');
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

      if (!res.ok) {
        setVerifyError(result?.error?.message || 'Verification failed. Please check your code.');
        return;
      }

      if (!result?.data?.verified) {
        setVerifyError('Invalid code. Please try again.');
        return;
      }

      setStep('success');
      toastUtils.success(t('security'), 'Two-factor authentication enabled!');
      onStatusChange();
    } catch {
      setVerifyError('Network error. Please check your connection and try again.');
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
        toastUtils.error(t('error'), result?.error?.message || 'Failed to disable 2FA');
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Shield className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-mq-sm font-medium text-mq-content">{t('authenticatorApp')}</p>
              <p className="text-mq-xs text-mq-content-secondary mt-0.5">
                Google Authenticator, Authy, or Microsoft Authenticator
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:flex-shrink-0">
            <ToggleControl
              checked={isEnabled}
              onToggle={() => {
                if (isLoading) return;
                if (isEnabled) {
                  setDisableFactorId(totpFactors[0]?.id ?? null);
                  setShowDisableDialog(true);
                } else {
                  handleStartSetup();
                }
              }}
              label={t('authenticatorApp')}
              testId="toggle-totp"
            />
            <span className="text-mq-xs text-mq-content-secondary">
              {isEnabled ? t('enabled') : t('disabled')}
            </span>
          </div>
        </div>

        {isEnabled && totpFactors.length > 0 && (
          <div className="mt-3 pt-3 border-t border-mq-border">
            <div className="flex items-center gap-2 text-mq-sm text-mq-success">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>
                {t('activeSince', { date: new Date(totpFactors[0].createdAt).toLocaleDateString() })}
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
              {step === 'qr' ? t('setUpAuthenticator') : t('verifySetup')}
            </DialogTitle>
            <DialogDescription>
              {step === 'qr' ? t('scanQrCode') : t('enterTotpCode')}
            </DialogDescription>
          </DialogHeader>

          {step === 'qr' && (
            <div className="py-4 space-y-4">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg shadow-sm border border-mq-border/50">
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
              <div className="space-y-3 pt-2">
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-mq-content">
                    {t('cantScanEnterManually')}
                  </p>
                  <p className="text-xs text-mq-content-secondary">
                    Type this code into your app to link it manually.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 justify-center">
                  <code className="max-w-full break-all text-sm bg-mq-card-background px-4 py-2 rounded-lg border border-mq-border font-mono font-bold tracking-widest text-mq-primary shadow-inner select-all">
                    {secret}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copySecret}
                    className="p-2 h-auto hover:bg-mq-primary/10"
                    aria-label={t('copySecret')}
                  >
                    {secretCopied ? (
                      <CheckCircle className="h-5 w-5 text-mq-success" />
                    ) : (
                      <Copy className="h-5 w-5" />
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
            <Button variant="ghost" onClick={resetSetup} disabled={isLoading}>
              {t('cancel')}
            </Button>
            {step === 'qr' && <Button onClick={() => setStep('verify')}>{t('continue')}</Button>}
            {step === 'verify' && (
              <Button onClick={handleVerify} disabled={isLoading || verifyCode.length !== 6}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t('verifying')}
                  </>
                ) : (
                  t('verifyAndEnable')
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
              {t('mfaEnabledTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('mfaEnabledDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={resetSetup}>{t('done')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-red-500" />
              {t('disableMfaTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('disableMfaDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="flex items-start gap-3 p-3 bg-red-500/10 rounded-mq-lg border border-red-500/20">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-mq-sm text-mq-content-secondary">
                {t('mfaSecurityWarning')}
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
            <Button variant="destructive" onClick={handleDisable} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('processing')}
                </>
              ) : (
                t('disableMfaAction')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

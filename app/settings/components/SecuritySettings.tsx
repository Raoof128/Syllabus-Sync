'use client';

import { memo, useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Shield, Fingerprint, Smartphone, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { toastUtils } from '@/lib/utils/toast';
import { errorHandler } from '@/lib/utils/errorHandling';
import { MagicCard } from '@/components/ui/MagicCard';
import type { TranslationKey } from '@/lib/i18n/translations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type SecuritySettingsProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

// Check if WebAuthn/biometric authentication is available
function isBiometricAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.PublicKeyCredential;
}

// Check if platform authenticator (Touch ID, Face ID, Windows Hello) is available
async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;

  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

const SecuritySettings = memo(({ t }: SecuritySettingsProps) => {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [platformAuthAvailable, setPlatformAuthAvailable] = useState(false);
  const [showEnableDialog, setShowEnableDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStatusLoading, setIsStatusLoading] = useState(true);

  const base64UrlToUint8Array = useCallback((value: string) => {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/');
    const base64 = padded.padEnd(Math.ceil(padded.length / 4) * 4, '=');
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }, []);

  const bufferToBase64Url = useCallback((buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    const base64 = window.btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }, []);

  // Check biometric availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      setBiometricAvailable(isBiometricAvailable());
      const platformAuth = await isPlatformAuthenticatorAvailable();
      setPlatformAuthAvailable(platformAuth);

      try {
        const response = await fetch('/api/auth/biometric');
        const result = await response.json();

        if (response.ok && result?.data) {
          setBiometricEnabled(Boolean(result.data.enabled) && platformAuth);
        }
      } catch (error) {
        errorHandler.logError(error as Error, 'Biometric status', 'low');
      } finally {
        setIsStatusLoading(false);
      }
    };

    checkAvailability();
  }, []);

  const handleEnableBiometric = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!platformAuthAvailable || typeof window === 'undefined') {
        toastUtils.error(t('biometricSetupFailed'), t('biometricSetupFailedMsg'));
        return;
      }

      const optionsResponse = await fetch('/api/auth/passkey/register-options', {
        method: 'POST',
      });
      const optionsResult = await optionsResponse.json();
      const options = optionsResult?.data?.options;

      if (!optionsResponse.ok || !options) {
        toastUtils.error(t('biometricSetupFailed'), t('biometricSetupFailedMsg'));
        return;
      }

      const publicKey: PublicKeyCredentialCreationOptions = {
        ...options,
        challenge: base64UrlToUint8Array(options.challenge),
        user: {
          ...options.user,
          id: base64UrlToUint8Array(options.user.id),
        },
        excludeCredentials: (options.excludeCredentials || []).map(
          (credential: { id: string; type: PublicKeyCredentialType }) => ({
            ...credential,
            id: base64UrlToUint8Array(credential.id),
          }),
        ),
      };

      const credential = (await navigator.credentials.create({
        publicKey,
      })) as PublicKeyCredential | null;

      if (!credential) {
        toastUtils.error(t('biometricSetupFailed'), t('biometricSetupFailedMsg'));
        return;
      }

      const attestation = credential.response as AuthenticatorAttestationResponse;
      const transports = attestation.getTransports?.() ?? [];

      const credentialPayload = {
        id: credential.id,
        rawId: bufferToBase64Url(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: bufferToBase64Url(attestation.clientDataJSON),
          attestationObject: bufferToBase64Url(attestation.attestationObject),
          transports,
        },
        clientExtensionResults: credential.getClientExtensionResults(),
      };

      const saveResponse = await fetch('/api/auth/passkey/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: credentialPayload,
        }),
      });

      if (!saveResponse.ok) {
        toastUtils.error(t('biometricSetupFailed'), t('biometricSetupFailedMsg'));
        return;
      }

      setBiometricEnabled(true);
      setShowEnableDialog(false);
      toastUtils.success(t('biometricEnabled'), t('biometricEnabledMsg'));
    } catch (error) {
      errorHandler.logError(error as Error, 'Enable Biometric', 'medium');
      toastUtils.error(t('biometricSetupFailed'), t('biometricSetupFailedMsg'));
    } finally {
      setIsLoading(false);
    }
  }, [base64UrlToUint8Array, bufferToBase64Url, platformAuthAvailable, t]);

  const handleDisableBiometric = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/biometric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
      });

      if (!response.ok) {
        toastUtils.error(t('error'), t('tryAgainLater'));
        return;
      }

      if (navigator.credentials?.preventSilentAccess) {
        await navigator.credentials.preventSilentAccess();
      }

      setBiometricEnabled(false);
      setShowDisableDialog(false);
      toastUtils.success(t('biometricDisabled'), t('biometricDisabledMsg'));
    } catch (error) {
      errorHandler.logError(error as Error, 'Disable Biometric', 'medium');
      toastUtils.error(t('error'), t('tryAgainLater'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const getBiometricStatusBadge = () => {
    if (!biometricAvailable) {
      return (
        <Badge className="bg-mq-content-tertiary/20 text-mq-content-tertiary">
          {t('notSupported')}
        </Badge>
      );
    }
    if (!platformAuthAvailable) {
      return <Badge className="bg-mq-warning/20 text-mq-warning">{t('noDeviceFound')}</Badge>;
    }
    if (biometricEnabled) {
      return <Badge className="bg-mq-success/20 text-mq-success">{t('enabled')}</Badge>;
    }
    return (
      <Badge className="bg-mq-content-secondary/20 text-mq-content-secondary">
        {t('disabled')}
      </Badge>
    );
  };

  return (
    <>
      <MagicCard data-testid="security-settings">
        <Card className="mq-magic-card-content">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-mq-primary" aria-hidden="true" />
              <span id="security-heading">{t('security')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3" role="region" aria-labelledby="security-heading">
            {/* Biometric Authentication Section */}
            <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-mq-primary/10 rounded-full">
                    <Fingerprint className="h-5 w-5 text-mq-primary" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-mq-content">{t('biometricLogin')}</h3>
                      {getBiometricStatusBadge()}
                    </div>
                    <p className="text-mq-sm text-mq-content-secondary">
                      {t('biometricLoginDesc')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    biometricEnabled ? setShowDisableDialog(true) : setShowEnableDialog(true)
                  }
                  disabled={
                    !biometricAvailable || !platformAuthAvailable || isLoading || isStatusLoading
                  }
                  className={`px-3 py-1 text-xs ${
                    biometricEnabled
                      ? 'text-red-500 hover:bg-red-500/10'
                      : 'text-mq-primary hover:bg-mq-primary/10'
                  }`}
                  aria-pressed={biometricEnabled}
                  data-testid="toggle-biometric"
                >
                  {biometricEnabled ? t('disable') : t('enable')}
                </Button>
              </div>

              {/* Device Info */}
              {platformAuthAvailable && (
                <div className="mt-3 pt-3 border-t border-mq-border">
                  <div className="flex items-center gap-2 text-mq-sm text-mq-content-secondary">
                    <Smartphone className="h-4 w-4" aria-hidden="true" />
                    <span>{t('biometricDeviceReady')}</span>
                    <CheckCircle className="h-4 w-4 text-mq-success" aria-hidden="true" />
                  </div>
                </div>
              )}

              {/* Not Available Warning */}
              {!platformAuthAvailable && biometricAvailable && (
                <div className="mt-3 pt-3 border-t border-mq-border">
                  <div className="flex items-start gap-2 text-mq-sm text-mq-warning">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{t('biometricNotConfigured')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Coming Soon: More Security Features */}
            <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border opacity-60">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-mq-info/10 rounded-full">
                  <Info className="h-5 w-5 text-mq-info" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-mq-content">{t('moreSecurityFeatures')}</h3>
                  <p className="text-mq-sm text-mq-content-secondary">
                    {t('moreSecurityFeaturesDesc')}
                  </p>
                  <Badge className="mt-2 bg-mq-info/20 text-mq-info">{t('comingSoon')}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </MagicCard>

      {/* Enable Biometric Dialog */}
      <Dialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-mq-primary" />
              {t('enableBiometric')}
            </DialogTitle>
            <DialogDescription>{t('enableBiometricDesc')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start gap-3 p-3 bg-mq-info/10 rounded-mq-lg border border-mq-info/20">
              <Info className="h-5 w-5 text-mq-info flex-shrink-0 mt-0.5" />
              <p className="text-mq-sm text-mq-content-secondary">{t('biometricPrivacyNote')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEnableDialog(false)} disabled={isLoading}>
              {t('cancel')}
            </Button>
            <Button onClick={handleEnableBiometric} disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  {t('settingUp')}
                </>
              ) : (
                t('enable')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Biometric Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-mq-warning" />
              {t('disableBiometric')}
            </DialogTitle>
            <DialogDescription>{t('disableBiometricDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDisableDialog(false)}
              disabled={isLoading}
            >
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDisableBiometric} disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  {t('processing')}
                </>
              ) : (
                t('disable')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

SecuritySettings.displayName = 'SecuritySettings';

export default SecuritySettings;

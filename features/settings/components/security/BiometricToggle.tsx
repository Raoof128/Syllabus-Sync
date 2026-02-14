'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Fingerprint, Smartphone, AlertTriangle, Info } from 'lucide-react';
import type { TranslationKey } from '@/lib/i18n/translations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBiometrics } from '@/lib/hooks/useBiometrics';
import { ToggleControl } from '../ToggleControl';

type BiometricToggleProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

export function BiometricToggle({ t }: BiometricToggleProps) {
  const {
    biometricEnabled,
    biometricAvailable,
    platformAuthAvailable,
    isLoading,
    isStatusLoading,
    enableBiometric,
    disableBiometric,
  } = useBiometrics({ t });

  const [showEnableDialog, setShowEnableDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  const handleEnable = async () => {
    const success = await enableBiometric();
    if (success) {
      setShowEnableDialog(false);
    }
  };

  const handleDisable = async () => {
    const success = await disableBiometric();
    if (success) {
      setShowDisableDialog(false);
    }
  };

  const canToggle = biometricAvailable && platformAuthAvailable && !isLoading && !isStatusLoading;

  const getStatusText = () => {
    if (!biometricAvailable) return t('notSupported');
    if (!platformAuthAvailable) return t('noDeviceFound');
    return biometricEnabled ? t('enabled') : t('disabled');
  };

  return (
    <>
      <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Fingerprint className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-mq-sm font-medium text-mq-content">{t('biometricLogin')}</p>
              <p className="text-mq-xs text-mq-content-secondary mt-0.5">
                {t('biometricLoginDesc')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:flex-shrink-0">
            <ToggleControl
              checked={biometricEnabled}
              onToggle={() =>
                canToggle &&
                (biometricEnabled ? setShowDisableDialog(true) : setShowEnableDialog(true))
              }
              label={t('biometricLogin')}
              testId="toggle-biometric"
            />
            <span className="text-mq-xs text-mq-content-secondary">{getStatusText()}</span>
          </div>
        </div>

        {/* Device Info */}
        {platformAuthAvailable && (
          <div className="mt-3 pt-3 border-t border-mq-border">
            <div className="flex items-center gap-2 text-mq-sm text-mq-content-secondary">
              <Smartphone className="h-4 w-4" aria-hidden="true" />
              <span>{t('biometricDeviceReady')}</span>
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

      {/* Enable Biometric Dialog */}
      <Dialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              {t('enableBiometric')}
            </DialogTitle>
            <DialogDescription>{t('enableBiometricDesc')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start gap-3 p-3 bg-mq-info/10 rounded-mq-lg border border-mq-info/20">
              <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-mq-sm text-mq-content-secondary">{t('biometricPrivacyNote')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEnableDialog(false)} disabled={isLoading}>
              {t('cancel')}
            </Button>
            <Button onClick={handleEnable} disabled={isLoading}>
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
              <AlertTriangle className="h-5 w-5" />
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
            <Button variant="destructive" onClick={handleDisable} disabled={isLoading}>
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
}

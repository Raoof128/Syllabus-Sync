'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';
import { Fingerprint, Smartphone, AlertTriangle, CheckCircle, Info } from 'lucide-react';
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
      <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-mq-primary/10 rounded-full">
              <Fingerprint className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-mq-content">{t('biometricLogin')}</h3>
                {getBiometricStatusBadge()}
              </div>
              <p className="text-mq-sm text-mq-content-secondary">{t('biometricLoginDesc')}</p>
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
              <CheckCircle className="h-4 w-4" aria-hidden="true" />
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
            <Button variant="ghost" onClick={() => setShowDisableDialog(false)} disabled={isLoading}>
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

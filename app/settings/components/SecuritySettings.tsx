'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Shield, Loader2 } from 'lucide-react';
import { MagicCard } from '@/components/ui/MagicCard';
import type { TranslationKey } from '@/lib/i18n/translations';
import { BiometricToggle } from './security/BiometricToggle';
import { TOTPSetup } from './security/TOTPSetup';
import { SMSSetup } from './security/SMSSetup';
import { PasskeyManager } from './security/PasskeyManager';
import { API_ROUTES } from '@/lib/constants/config';
import type { MFAFactor } from '@/lib/security/mfa';

type SecuritySettingsProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const SecuritySettings = memo(({ t }: SecuritySettingsProps) => {
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMFAStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(API_ROUTES.AUTH.MFA_STATUS);
      if (res.ok) {
        const json = await res.json();
        setFactors(json.data?.factors ?? []);
      }
    } catch {
      // silently fail — settings page should not crash
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMFAStatus();
  }, [fetchMFAStatus]);

  return (
    <MagicCard data-testid="security-settings">
      <Card className="mq-magic-card-content bg-mq-card-background border border-mq-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" aria-hidden="true" />
            <span id="security-heading">{t('security')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6" role="region" aria-labelledby="security-heading">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-mq-primary" />
            </div>
          ) : (
            <>
              {/* TOTP Authenticator App */}
              <TOTPSetup t={t} factors={factors} onStatusChange={fetchMFAStatus} />

              {/* SMS Verification */}
              <SMSSetup t={t} factors={factors} onStatusChange={fetchMFAStatus} />

              {/* Passkey / WebAuthn Management */}
              <PasskeyManager t={t} />

              {/* Legacy Biometric Toggle (backwards compatibility) */}
              <BiometricToggle t={t} />
            </>
          )}
        </CardContent>
      </Card>
    </MagicCard>
  );
});

SecuritySettings.displayName = 'SecuritySettings';

export default SecuritySettings;

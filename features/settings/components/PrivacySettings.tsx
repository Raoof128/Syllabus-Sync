'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Shield, Loader2, MessageSquare } from 'lucide-react';
import type { TranslationKey } from '@/lib/i18n/translations';
import { MagicCard } from '@/components/ui/MagicCard';
import { DataManagement } from './privacy/DataManagement';
import { PasskeySecuritySection } from './security/PasskeySecuritySection';
import { TOTPSetup } from './security/TOTPSetup';

import { API_ROUTES } from '@/lib/constants/config';
import type { MFAFactor } from '@/lib/security/mfa';

type PrivacySettingsProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  language: string;
};

const PrivacySettings = memo(({ t, language }: PrivacySettingsProps) => {
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [isLoadingMFA, setIsLoadingMFA] = useState(true);

  const fetchMFAStatus = useCallback(async () => {
    try {
      setIsLoadingMFA(true);
      const res = await fetch(API_ROUTES.AUTH.MFA_STATUS);
      if (res.ok) {
        const json = await res.json();
        setFactors(json.data?.factors ?? []);
      }
    } catch {
      // silently fail — settings page should not crash
    } finally {
      setIsLoadingMFA(false);
    }
  }, []);

  useEffect(() => {
    fetchMFAStatus();
  }, [fetchMFAStatus]);

  return (
    <>
      {/* Security Shield Liquid Glass Variant */}
      <MagicCard data-testid="privacy-settings" isLiquidEnhanced>
        <Card className="mq-magic-card-content bg-mq-card-background border border-mq-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 security-indicator" aria-hidden="true" />
              <span id="privacy-security-heading">{t('security')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent
            className="space-y-3"
            role="region"
            aria-labelledby="privacy-security-heading"
          >
            {/* Two-Factor Authentication & Security */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-mq-content flex items-center gap-2">
                <Shield className="h-4 w-4" aria-hidden="true" />
                {t('twoFactorAuthentication' as TranslationKey) || 'Two-Factor Authentication'}
              </h3>

              {isLoadingMFA ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-mq-primary" />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Authenticator App (TOTP) */}
                  <TOTPSetup t={t} factors={factors} onStatusChange={fetchMFAStatus} />

                  {/* Passkeys & Biometric Login */}
                  <PasskeySecuritySection t={t} />

                  {/* SMS Verification — coming soon */}
                  <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border opacity-60">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <MessageSquare className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <p className="text-mq-sm font-medium text-mq-content">{t('smsVerification')}</p>
                          <p className="text-mq-xs text-mq-content-secondary mt-0.5">
                            {t('smsVerificationDesc')}
                          </p>
                        </div>
                      </div>
                      <span className="text-mq-xs text-mq-content-secondary sm:ml-2">
                        {t('comingSoon')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Data Management (Export & Clear) */}
            <div className="pt-4 border-t border-mq-border">
              <DataManagement t={t} language={language} />
            </div>
          </CardContent>
        </Card>
      </MagicCard>
    </>
  );
});

PrivacySettings.displayName = 'PrivacySettings';

export default PrivacySettings;

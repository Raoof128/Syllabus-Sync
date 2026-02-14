'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Shield, Loader2, MessageSquare } from 'lucide-react';
import { EXTERNAL_LINKS } from '@/lib/config';
import type { TranslationKey } from '@/lib/i18n/translations';
import { MagicCard } from '@/components/ui/MagicCard';
import { ChangePasswordDialog } from './privacy/ChangePasswordDialog';
import { SessionsList } from './privacy/SessionsList';
import { DataManagement } from './privacy/DataManagement';
import { BiometricToggle } from './security/BiometricToggle';
import { TOTPSetup } from './security/TOTPSetup';

import { PasskeyManager } from './security/PasskeyManager';
import { API_ROUTES } from '@/lib/constants/config';
import type { MFAFactor } from '@/lib/security/mfa';

type PrivacySettingsProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  language: string;
};

const PrivacySettings = memo(({ t, language }: PrivacySettingsProps) => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);
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
              <span id="privacy-security-heading">{t('privacySecurity')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent
            className="space-y-3"
            role="region"
            aria-labelledby="privacy-security-heading"
          >
            {/* Change Password */}
            <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold text-mq-content">{t('changePassword')}</h3>
                  <p className="text-mq-sm text-mq-content-secondary">{t('changePasswordDesc')}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                  onClick={() => setShowPasswordDialog(true)}
                  data-testid="change-password-button"
                >
                  {t('changePassword')}
                </Button>
              </div>
            </div>

            {/* Manage Sessions */}
            <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold text-mq-content">{t('manageSessions')}</h3>
                  <p className="text-mq-sm text-mq-content-secondary">{t('manageSessionsDesc')}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                  onClick={() => setShowSessionsDialog(true)}
                  data-testid="manage-sessions-button"
                >
                  {t('manageSessions')}
                </Button>
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold text-mq-content">{t('privacyPolicy')}</h3>
                  <p className="text-mq-sm text-mq-content-secondary">{t('privacyPolicyDesc')}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                  onClick={() =>
                    window.open(EXTERNAL_LINKS.privacy, '_blank', 'noopener,noreferrer')
                  }
                  data-testid="privacy-policy-button"
                >
                  {t('view')}
                </Button>
              </div>
            </div>

            {/* Two-Factor Authentication & Security */}
            <div className="pt-4 border-t border-mq-border space-y-4">
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

                  {/* SMS Verification — coming soon */}
                  <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border opacity-60">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <MessageSquare className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <p className="text-mq-sm font-medium text-mq-content">SMS Verification</p>
                          <p className="text-mq-xs text-mq-content-secondary mt-0.5">
                            SMS verification coming soon
                          </p>
                        </div>
                      </div>
                      <span className="text-mq-xs text-mq-content-secondary sm:ml-2">
                        Coming Soon
                      </span>
                    </div>
                  </div>

                  {/* Passkey / WebAuthn */}
                  <PasskeyManager t={t} />

                  {/* Biometric Authentication */}
                  <BiometricToggle t={t} />
                </div>
              )}
            </div>

            {/* Data Management (Export & Clear) */}
            <DataManagement t={t} language={language} />
          </CardContent>
        </Card>
      </MagicCard>

      <ChangePasswordDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog} t={t} />
      <SessionsList open={showSessionsDialog} onOpenChange={setShowSessionsDialog} t={t} />
    </>
  );
});

PrivacySettings.displayName = 'PrivacySettings';

export default PrivacySettings;

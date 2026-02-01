'use client';

import { memo, useState } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Shield } from 'lucide-react';
import { EXTERNAL_LINKS } from '@/lib/config';
import type { TranslationKey } from '@/lib/i18n/translations';
import { MagicCard } from '@/components/ui/MagicCard';
import { ChangePasswordDialog } from './privacy/ChangePasswordDialog';
import { SessionsList } from './privacy/SessionsList';
import { DataManagement } from './privacy/DataManagement';

type PrivacySettingsProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  language: string;
};

const PrivacySettings = memo(({ t, language }: PrivacySettingsProps) => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);

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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-mq-content">{t('changePassword')}</h3>
                  <p className="text-mq-sm text-mq-content-secondary">{t('changePasswordDesc')}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                  onClick={() => setShowPasswordDialog(true)}
                  data-testid="change-password-button"
                >
                  {t('changePassword')}
                </Button>
              </div>
            </div>

            {/* Manage Sessions */}
            <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-mq-content">{t('manageSessions')}</h3>
                  <p className="text-mq-sm text-mq-content-secondary">{t('manageSessionsDesc')}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                  onClick={() => setShowSessionsDialog(true)}
                  data-testid="manage-sessions-button"
                >
                  {t('manageSessions')}
                </Button>
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-mq-content">{t('privacyPolicy')}</h3>
                  <p className="text-mq-sm text-mq-content-secondary">{t('privacyPolicyDesc')}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                  onClick={() =>
                    window.open(EXTERNAL_LINKS.privacy, '_blank', 'noopener,noreferrer')
                  }
                  data-testid="privacy-policy-button"
                >
                  {t('view')}
                </Button>
              </div>
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

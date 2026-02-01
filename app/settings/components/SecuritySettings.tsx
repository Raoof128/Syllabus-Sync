'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Shield, Info } from 'lucide-react';
import { MagicCard } from '@/components/ui/MagicCard';
import type { TranslationKey } from '@/lib/i18n/translations';
import { BiometricToggle } from './security/BiometricToggle';

type SecuritySettingsProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const SecuritySettings = memo(({ t }: SecuritySettingsProps) => {
  return (
    <MagicCard data-testid="security-settings">
      <Card className="mq-magic-card-content bg-mq-card-background border border-mq-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" aria-hidden="true" />
            <span id="security-heading">{t('security')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3" role="region" aria-labelledby="security-heading">
          {/* Biometric Authentication Section */}
          <BiometricToggle t={t} />

          {/* Coming Soon: More Security Features */}
          <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border opacity-60">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-mq-info/10 rounded-full">
                <Info className="h-5 w-5" aria-hidden="true" />
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
  );
});

SecuritySettings.displayName = 'SecuritySettings';

export default SecuritySettings;

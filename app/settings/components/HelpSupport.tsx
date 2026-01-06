'use client';

import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Info } from 'lucide-react';
import { APP_CONFIG, EXTERNAL_LINKS } from '@/lib/config';
import { toastUtils } from '@/lib/utils/toast';
import type { TranslationKey } from '@/lib/i18n/translations';

type HelpSupportProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const HelpSupport = memo(({ t }: HelpSupportProps) => {
  const handleViewDocumentation = useCallback(() => {
    toastUtils.info(t('viewDocumentation'), t('documentationOpening'));
    setTimeout(() => {
      window.open(EXTERNAL_LINKS.documentation, '_blank', 'noopener,noreferrer');
    }, 500);
  }, [t]);

  const handleSendFeedback = useCallback(() => {
    toastUtils.info(t('feedback'), t('feedbackPreparing'));
    setTimeout(() => {
      window.location.href = EXTERNAL_LINKS.feedback;
    }, 500);
  }, [t]);

  return (
    <div className="mq-magic-card">
      <Card className="mq-magic-card-content">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            {t('helpSupport')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* About */}
          <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border">
            <h4 className="font-semibold text-mq-content mb-1">{t('aboutTitle')}</h4>
            <p className="text-mq-sm text-mq-content-secondary">
              {t('version')} {APP_CONFIG.version} - {t('aboutDesc')}
            </p>
          </div>

          {/* Need Help */}
          <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
            <h4 className="font-semibold text-mq-content mb-1">{t('needHelp')}</h4>
            <p className="text-mq-sm text-mq-content-secondary mb-2">{t('helpDesc')}</p>
            <Button
              variant="ghost"
              size="sm"
              className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
              onClick={handleViewDocumentation}
            >
              {t('viewDocumentation')}
            </Button>
          </div>

          {/* Feedback */}
          <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
            <h4 className="font-semibold text-mq-content mb-1">{t('feedback')}</h4>
            <p className="text-mq-sm text-mq-content-secondary mb-2">{t('feedbackDesc')}</p>
            <Button
              variant="ghost"
              size="sm"
              className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
              onClick={handleSendFeedback}
            >
              {t('sendFeedback')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

HelpSupport.displayName = 'HelpSupport';

export default HelpSupport;

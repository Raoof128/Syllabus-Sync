'use client';

import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Info, ExternalLink, MessageSquare } from 'lucide-react';
import { APP_CONFIG, EXTERNAL_LINKS } from '@/lib/config';
import { toastUtils } from '@/lib/utils/toast';
import type { TranslationKey } from '@/lib/i18n/translations';

type HelpSupportProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const HelpSupport = memo(({ t }: HelpSupportProps) => {
  const handleViewDocumentation = useCallback(() => {
    toastUtils.info(t('viewDocumentation'), t('documentationOpening'));
    window.open(EXTERNAL_LINKS.documentation, '_blank', 'noopener,noreferrer');
  }, [t]);

  const handleSendFeedback = useCallback(() => {
    toastUtils.info(t('feedback'), t('feedbackPreparing'));
    window.location.href = EXTERNAL_LINKS.feedback;
  }, [t]);

  return (
    <div className="mq-magic-card" data-testid="help-support">
      <Card className="mq-magic-card-content">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" aria-hidden="true" />
            <span id="help-support-heading">{t('helpSupport')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3" role="region" aria-labelledby="help-support-heading">
          {/* About */}
          <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border">
            <h3 className="font-semibold text-mq-content mb-1">{t('aboutTitle')}</h3>
            <p className="text-mq-sm text-mq-content-secondary">
              {t('version')} {APP_CONFIG.version} - {t('aboutDesc')}
            </p>
          </div>

          {/* Need Help */}
          <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
            <h3 className="font-semibold text-mq-content mb-1">{t('needHelp')}</h3>
            <p className="text-mq-sm text-mq-content-secondary mb-2">{t('helpDesc')}</p>
            <Button
              variant="ghost"
              size="sm"
              className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
              onClick={handleViewDocumentation}
              data-testid="view-documentation-button"
            >
              <ExternalLink className="h-4 w-4 mr-2" aria-hidden="true" />
              {t('viewDocumentation')}
            </Button>
          </div>

          {/* Feedback */}
          <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
            <h3 className="font-semibold text-mq-content mb-1">{t('feedback')}</h3>
            <p className="text-mq-sm text-mq-content-secondary mb-2">{t('feedbackDesc')}</p>
            <Button
              variant="ghost"
              size="sm"
              className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
              onClick={handleSendFeedback}
              data-testid="send-feedback-button"
            >
              <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
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

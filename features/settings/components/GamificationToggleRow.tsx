'use client';

import { memo } from 'react';
import { ToggleControl } from './ToggleControl';
import type { TranslationKey } from '@/lib/i18n/translations';
import type { GamificationSettings } from '@/lib/types';

type GamificationToggleRowProps = {
  settingKey: keyof GamificationSettings;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  enabled: boolean;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  onToggle: (key: keyof GamificationSettings) => void;
  testId?: string;
};

export const GamificationToggleRow = memo(
  ({ settingKey, labelKey, descKey, enabled, t, onToggle, testId }: GamificationToggleRowProps) => (
    <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-mq-content">{t(labelKey)}</h3>
          <p className="text-mq-sm text-mq-content-secondary">{t(descKey)}</p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleControl
            checked={enabled}
            onToggle={() => onToggle(settingKey)}
            label={t(labelKey)}
            testId={testId}
          />
          <span className="text-mq-xs text-mq-content-secondary">
            {enabled ? t('enabled') : t('disabled')}
          </span>
        </div>
      </div>
    </div>
  ),
);

GamificationToggleRow.displayName = 'GamificationToggleRow';

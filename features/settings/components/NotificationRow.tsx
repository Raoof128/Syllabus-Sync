'use client';

import { memo } from 'react';
import { Clock } from 'lucide-react';
import type { TranslationKey } from '@/lib/i18n/translations';
import { REMINDER_TIMING_OPTIONS } from '../constants';
import { ToggleControl } from './ToggleControl';

type NotificationRowProps = {
  type: 'deadlines' | 'classes' | 'events';
  icon: React.ElementType;
  label: string;
  desc: string;
  timing: number;
  enabled: boolean;
  permissionGranted: boolean;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  onToggle: (type: 'deadlines' | 'classes' | 'events', enabled: boolean) => void;
  onTimingChange: (type: 'deadlines' | 'classes' | 'events', minutes: number) => void;
};

export const NotificationRow = memo(
  ({
    type,
    icon: Icon,
    label,
    desc,
    timing,
    enabled,
    permissionGranted,
    t,
    onToggle,
    onTimingChange,
  }: NotificationRowProps) => (
    <div
      className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300"
      data-testid={`notification-item-${type}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-mq-sm font-medium text-mq-content">{label}</p>
            <p className="text-mq-xs text-mq-content-secondary mt-0.5">{desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ToggleControl
            checked={enabled}
            onToggle={() => onToggle(type, !enabled)}
            label={`${label} ${t('notifications')}`}
            testId={`toggle-${type}-notifications`}
          />
          <span className="text-mq-xs text-mq-content-secondary">
            {enabled ? t('enabled') : t('disabled')}
          </span>
        </div>
      </div>

      {/* Reminder Timing Selector - only show when enabled */}
      {enabled && permissionGranted && (
        <div className="mt-3 pt-3 border-t border-mq-border">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <label htmlFor={`timing-${type}`} className="text-mq-xs text-mq-content-secondary">
              {t('remindMe')}
            </label>
            <select
              id={`timing-${type}`}
              value={timing}
              onChange={(e) => onTimingChange(type, Number(e.target.value))}
              className="text-mq-xs bg-mq-background border border-mq-border rounded-mq px-2 py-1 text-mq-content focus:outline-none focus:ring-2 focus:ring-mq-primary/50"
              aria-label={t('reminderTimingFor', { type: label })}
              data-testid={`timing-select-${type}`}
            >
              {REMINDER_TIMING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)} {t('before')}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  ),
);

NotificationRow.displayName = 'NotificationRow';

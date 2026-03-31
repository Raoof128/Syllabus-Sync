'use client';

import { memo } from 'react';
import { Clock } from 'lucide-react';
import type { TranslationKey } from '@/lib/i18n/translations';
import { REMINDER_TIMING_OPTIONS } from '../constants';
import { ToggleControl } from './ToggleControl';

export type NotificationType =
  | 'deadlines'
  | 'assignments'
  | 'exams'
  | 'classes'
  | 'events'
  | 'todos';

type NotificationRowProps = {
  type: NotificationType;
  icon: React.ElementType;
  label: string;
  desc: string;
  timing: number;
  enabled: boolean;
  permissionGranted: boolean;
  timingOptions?: readonly { readonly value: number; readonly labelKey: string }[];
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  onToggle: (type: NotificationType, enabled: boolean) => void;
  onTimingChange: (type: NotificationType, minutes: number) => void;
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
    timingOptions,
    t,
    onToggle,
    onTimingChange,
  }: NotificationRowProps) => {
    const options = timingOptions ?? REMINDER_TIMING_OPTIONS;
    return (
      <div
        className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300"
        data-testid={`notification-item-${type}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-mq-sm font-medium text-mq-content">{label}</p>
              <p className="text-mq-xs text-mq-content-secondary mt-0.5">{desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:flex-shrink-0">
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
            <div className="flex flex-wrap items-center gap-2">
              <Clock className="h-3 w-3" aria-hidden="true" />
              <label htmlFor={`timing-${type}`} className="text-mq-xs text-mq-content-secondary">
                {t('remindMe')}
              </label>
              <select
                id={`timing-${type}`}
                value={timing}
                onChange={(e) => onTimingChange(type, Number(e.target.value))}
                className="w-full sm:w-auto text-mq-xs bg-mq-background border border-mq-border rounded-mq px-2 py-1 text-mq-content focus:outline-none focus:ring-2 focus:ring-mq-primary/50"
                aria-label={t('reminderTimingFor', { type: label })}
                data-testid={`timing-select-${type}`}
              >
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey as TranslationKey)} {t('before')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    );
  },
);

NotificationRow.displayName = 'NotificationRow';

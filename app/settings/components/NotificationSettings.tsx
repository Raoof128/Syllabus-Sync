'use client';

import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Bell, Mail, Calendar, Info, CheckCircle, XCircle } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/constants';
import { errorHandler } from '@/lib/utils/errorHandling';
import { toastUtils } from '@/lib/utils/toast';
import type { TranslationKey } from '@/lib/i18n/translations';

type NotificationPreferences = {
  deadlines: boolean;
  classes: boolean;
  events: boolean;
};

type NotificationSettingsProps = {
  notifications: NotificationPreferences;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationPreferences>>;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const NotificationSettings = memo(
  ({ notifications, setNotifications, t }: NotificationSettingsProps) => {
    const handleNotificationPreference = useCallback(
      (type: keyof NotificationPreferences, enabled: boolean) => {
        try {
          setNotifications((prev) => ({ ...prev, [type]: enabled }));

          if (typeof window !== 'undefined') {
            const storageKey =
              type === 'deadlines'
                ? STORAGE_KEYS.NOTIFICATION_DEADLINES
                : type === 'classes'
                  ? STORAGE_KEYS.NOTIFICATION_CLASSES
                  : STORAGE_KEYS.NOTIFICATION_EVENTS;

            localStorage.setItem(storageKey, enabled.toString());

            const typeLabels: Record<string, string> = {
              deadlines: t('deadlineReminders'),
              classes: t('classReminders'),
              events: t('eventUpdates'),
            };

            toastUtils.success(
              t('preferenceUpdated'),
              `${typeLabels[type] || type} ${enabled ? t('enabled').toLowerCase() : t('disabled').toLowerCase()}`,
            );
          }
        } catch (error) {
          errorHandler.logError(error as Error, 'Notification Prefs', 'low');
          toastUtils.error(t('settingsError'), t('preferenceError'));
        }
      },
      [setNotifications, t],
    );

    const notificationItems = [
      {
        key: 'deadlines' as const,
        icon: Mail,
        label: t('deadlineReminders'),
        desc: t('deadlineRemindersDesc'),
      },
      {
        key: 'classes' as const,
        icon: Calendar,
        label: t('classReminders'),
        desc: t('classRemindersDesc'),
      },
      {
        key: 'events' as const,
        icon: Info,
        label: t('eventUpdates'),
        desc: t('eventUpdatesDesc'),
      },
    ];

    return (
      <div className="mq-magic-card">
        <Card className="mq-magic-card-content">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('notifications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notificationItems.map(({ key, icon: Icon, label, desc }) => (
              <div
                key={key}
                className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-mq-content-tertiary" />
                    <div>
                      <p className="text-mq-sm font-medium text-mq-content">{label}</p>
                      <p className="text-mq-sm text-mq-content-secondary mt-1">{desc}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNotificationPreference(key, !notifications[key])}
                    className={`px-3 py-1 text-xs flex items-center gap-1 transition-colors focus:ring-2 focus:ring-mq-primary/50 ${
                      notifications[key]
                        ? 'bg-mq-success text-white hover:bg-mq-success/80'
                        : 'bg-mq-error text-white hover:bg-mq-error/80'
                    }`}
                    aria-label={`${label} ${t('notifications').toLowerCase()} ${t('are')} ${notifications[key] ? t('enabled') : t('disabled')}. ${t('clickTo')} ${notifications[key] ? t('disable').toLowerCase() : t('enable').toLowerCase()}`}
                    aria-pressed={notifications[key]}
                  >
                    {notifications[key] ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        {t('enabled')}
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        {t('disabled')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  },
);

NotificationSettings.displayName = 'NotificationSettings';

export default NotificationSettings;

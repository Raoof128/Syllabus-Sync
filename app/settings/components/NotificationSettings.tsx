'use client';

import { memo, useCallback, useEffect, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import {
  Bell,
  BellOff,
  Mail,
  Calendar,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useNotificationPreferencesStore } from '@/lib/store/notificationPreferencesStore';
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

// Reminder timing options - labels will be translated at render time
const REMINDER_TIMING_OPTIONS = [
  { value: 15, labelKey: 'timing15min' as const },
  { value: 30, labelKey: 'timing30min' as const },
  { value: 60, labelKey: 'timing1hour' as const },
  { value: 120, labelKey: 'timing2hours' as const },
  { value: 1440, labelKey: 'timing1day' as const },
  { value: 2880, labelKey: 'timing2days' as const },
];

// Helper for detecting client-side rendering without setState in effect
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const NotificationSettings = memo(
  ({ notifications, setNotifications, t }: NotificationSettingsProps) => {
    // Use useSyncExternalStore to detect client without setState in effect
    const isClient = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

    // Use the notification preferences store
    const {
      permissionStatus,
      pushEnabled,
      deadlinesEnabled,
      classesEnabled,
      eventsEnabled,
      deadlineReminderTiming,
      classReminderTiming,
      eventReminderTiming,
      initialize,
      requestPermission,
      setDeadlinesEnabled,
      setClassesEnabled,
      setEventsEnabled,
      setPushEnabled,
      setDeadlineReminderTiming,
      setClassReminderTiming,
      setEventReminderTiming,
    } = useNotificationPreferencesStore();

    // Initialize on mount
    useEffect(() => {
      initialize();
    }, [initialize]);

    // Sync local state with store
    useEffect(() => {
      if (isClient) {
        setNotifications({
          deadlines: deadlinesEnabled,
          classes: classesEnabled,
          events: eventsEnabled,
        });
      }
    }, [isClient, deadlinesEnabled, classesEnabled, eventsEnabled, setNotifications]);

    const handleRequestPermission = useCallback(async () => {
      const status = await requestPermission();
      if (status === 'granted') {
        toastUtils.success(t('notificationsEnabled'), t('notificationsEnabledMsg'));
      } else if (status === 'denied') {
        toastUtils.error(t('permissionDenied'), t('permissionDeniedMsg'));
      }
    }, [requestPermission, t]);

    const handleTogglePush = useCallback(() => {
      const newValue = !pushEnabled;
      setPushEnabled(newValue);
      toastUtils.success(
        t('preferenceUpdated'),
        t('pushNotificationsToggle', {
          status: newValue ? t('enabled').toLowerCase() : t('disabled').toLowerCase(),
        }),
      );
    }, [pushEnabled, setPushEnabled, t]);

    const handleNotificationPreference = useCallback(
      (type: 'deadlines' | 'classes' | 'events', enabled: boolean) => {
        const setters = {
          deadlines: setDeadlinesEnabled,
          classes: setClassesEnabled,
          events: setEventsEnabled,
        };

        setters[type](enabled);
        setNotifications((prev) => ({ ...prev, [type]: enabled }));

        const typeLabels: Record<string, string> = {
          deadlines: t('deadlineReminders'),
          classes: t('classReminders'),
          events: t('eventUpdates'),
        };

        toastUtils.success(
          t('preferenceUpdated'),
          `${typeLabels[type]} ${enabled ? t('enabled').toLowerCase() : t('disabled').toLowerCase()}`,
        );
      },
      [setDeadlinesEnabled, setClassesEnabled, setEventsEnabled, setNotifications, t],
    );

    const handleTimingChange = useCallback(
      (type: 'deadlines' | 'classes' | 'events', minutes: number) => {
        const setters = {
          deadlines: setDeadlineReminderTiming,
          classes: setClassReminderTiming,
          events: setEventReminderTiming,
        };

        setters[type](minutes);

        const option = REMINDER_TIMING_OPTIONS.find((o) => o.value === minutes);
        const timingLabel = option ? t(option.labelKey) : `${minutes} minutes`;
        toastUtils.success(
          t('reminderTimingUpdated'),
          t('reminderTimingUpdatedMsg', { timing: timingLabel }),
        );
      },
      [setDeadlineReminderTiming, setClassReminderTiming, setEventReminderTiming, t],
    );

    const notificationItems = [
      {
        key: 'deadlines' as const,
        icon: Mail,
        label: t('deadlineReminders'),
        desc: t('deadlineRemindersDesc'),
        timing: deadlineReminderTiming,
        setTiming: (v: number) => handleTimingChange('deadlines', v),
      },
      {
        key: 'classes' as const,
        icon: Calendar,
        label: t('classReminders'),
        desc: t('classRemindersDesc'),
        timing: classReminderTiming,
        setTiming: (v: number) => handleTimingChange('classes', v),
      },
      {
        key: 'events' as const,
        icon: Info,
        label: t('eventUpdates'),
        desc: t('eventUpdatesDesc'),
        timing: eventReminderTiming,
        setTiming: (v: number) => handleTimingChange('events', v),
      },
    ];

    const isNotificationSupported =
      isClient && typeof window !== 'undefined' && 'Notification' in window;

    return (
      <div className="mq-magic-card">
        <Card className="mq-magic-card-content">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('notifications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Push Notification Permission Banner */}
            {isClient && (
              <div
                className={`p-3 rounded-mq-lg border-2 ${
                  permissionStatus === 'granted'
                    ? 'bg-mq-success/15 border-mq-success/40'
                    : permissionStatus === 'denied'
                      ? 'bg-mq-error/15 border-mq-error/40'
                      : 'bg-mq-warning/15 border-mq-warning/40'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {permissionStatus === 'granted' ? (
                      <Bell className="h-5 w-5 text-mq-success" />
                    ) : permissionStatus === 'denied' ? (
                      <BellOff className="h-5 w-5 text-mq-error" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-mq-warning" />
                    )}
                    <div>
                      <p className="text-mq-sm font-medium text-mq-content">
                        {permissionStatus === 'granted'
                          ? t('pushNotificationsActive')
                          : permissionStatus === 'denied'
                            ? t('pushNotificationsBlocked')
                            : t('enablePushNotifications')}
                      </p>
                      <p className="text-mq-xs text-mq-content-secondary">
                        {permissionStatus === 'granted'
                          ? t('pushActiveDesc')
                          : permissionStatus === 'denied'
                            ? t('pushBlockedDesc')
                            : t('pushPromptDesc')}
                      </p>
                    </div>
                  </div>
                  {permissionStatus === 'granted' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleTogglePush}
                      className={`px-3 py-1 text-xs flex items-center gap-1 border-2 rounded-md ${
                        pushEnabled
                          ? 'bg-mq-success text-white border-mq-success hover:bg-mq-success/80 hover:border-mq-success/80'
                          : 'bg-mq-error text-white border-mq-error hover:bg-mq-error/80 hover:border-mq-error/80'
                      }`}
                    >
                      {pushEnabled ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          {t('on')}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          {t('off')}
                        </>
                      )}
                    </Button>
                  ) : permissionStatus !== 'denied' && isNotificationSupported ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRequestPermission}
                      className="px-3 py-1 text-xs bg-mq-primary text-white border-2 border-mq-primary rounded-md hover:bg-mq-primary/80 hover:border-mq-primary/80"
                    >
                      {t('enable')}
                    </Button>
                  ) : null}
                </div>
              </div>
            )}

            {/* Individual Notification Types */}
            {notificationItems.map(({ key, icon: Icon, label, desc, timing, setTiming }) => (
              <div
                key={key}
                className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Icon className="h-4 w-4 text-mq-content-tertiary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-mq-sm font-medium text-mq-content">{label}</p>
                      <p className="text-mq-xs text-mq-content-secondary mt-0.5">{desc}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNotificationPreference(key, !notifications[key])}
                    className={`px-3 py-1 text-xs flex items-center gap-1 transition-colors focus:ring-2 focus:ring-mq-primary/50 flex-shrink-0 border-2 rounded-md ${
                      notifications[key]
                        ? 'bg-mq-success text-white border-mq-success hover:bg-mq-success/80 hover:border-mq-success/80'
                        : 'bg-mq-error text-white border-mq-error hover:bg-mq-error/80 hover:border-mq-error/80'
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

                {/* Reminder Timing Selector - only show when enabled */}
                {notifications[key] && permissionStatus === 'granted' && (
                  <div className="mt-3 pt-3 border-t border-mq-border/50">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-mq-content-tertiary" />
                      <span className="text-mq-xs text-mq-content-secondary">{t('remindMe')}</span>
                      <select
                        value={timing}
                        onChange={(e) => setTiming(Number(e.target.value))}
                        className="text-mq-xs bg-mq-background border border-mq-border rounded-mq px-2 py-1 text-mq-content focus:outline-none focus:ring-2 focus:ring-mq-primary/50"
                        aria-label={t('reminderTimingFor', { type: label })}
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
            ))}

            {/* Info text */}
            {isClient && permissionStatus === 'granted' && pushEnabled && (
              <p className="text-mq-xs text-mq-content-tertiary text-center pt-2">
                {t('browserNotificationInfo')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  },
);

NotificationSettings.displayName = 'NotificationSettings';

export default NotificationSettings;

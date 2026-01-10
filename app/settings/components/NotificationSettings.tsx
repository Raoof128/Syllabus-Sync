'use client';

import { memo, useCallback, useEffect, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Bell, BellOff, Mail, Calendar, Info, Clock, AlertTriangle } from 'lucide-react';
import { useNotificationPreferencesStore } from '@/lib/store/notificationPreferencesStore';
import { toastUtils } from '@/lib/utils/toast';
import type { TranslationKey } from '@/lib/i18n/translations';
import type { NotificationPreferences } from '@/lib/types';
import { MagicCard } from '@/components/ui/MagicCard';

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
] as const;

// Helper for detecting client-side rendering without setState in effect
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

type ToggleControlProps = {
  checked: boolean;
  onToggle: () => void;
  label: string;
  testId?: string;
};

const ToggleControl = ({ checked, onToggle, label, testId }: ToggleControlProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    aria-pressed={checked}
    onClick={onToggle}
    className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mq-primary ${checked ? 'bg-mq-primary border-mq-primary' : 'bg-mq-background border-mq-border'}`}
    data-testid={testId}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : 'translate-x-1'}`}
      aria-hidden="true"
    />
  </button>
);

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

    // Initialize on mount - single source of truth from store
    useEffect(() => {
      initialize();
    }, [initialize]);

    // Sync parent state with store values only once after initialization
    useEffect(() => {
      if (isClient) {
        // Only update if values differ to prevent infinite loops
        const storeState = {
          deadlines: deadlinesEnabled,
          classes: classesEnabled,
          events: eventsEnabled,
        };

        if (
          notifications.deadlines !== storeState.deadlines ||
          notifications.classes !== storeState.classes ||
          notifications.events !== storeState.events
        ) {
          setNotifications(storeState);
        }
      }
      // Only run when store values change, not when notifications changes
      // eslint-disable-next-line react-hooks/exhaustive-deps
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

        // Update store (single source of truth)
        setters[type](enabled);

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
      [setDeadlinesEnabled, setClassesEnabled, setEventsEnabled, t],
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

    // Use store values directly for rendering (single source of truth)
    const currentNotifications = {
      deadlines: deadlinesEnabled,
      classes: classesEnabled,
      events: eventsEnabled,
    };

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
      <MagicCard data-testid="notification-settings">
        <Card className="mq-magic-card-content">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" aria-hidden="true" />
              <span id="notifications-heading">{t('notifications')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" role="region" aria-labelledby="notifications-heading">
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
                data-testid="push-notification-banner"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {permissionStatus === 'granted' ? (
                      <Bell className="h-5 w-5 text-mq-success" aria-hidden="true" />
                    ) : permissionStatus === 'denied' ? (
                      <BellOff className="h-5 w-5 text-mq-error" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-mq-warning" aria-hidden="true" />
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
                    <div className="flex items-center gap-2">
                      <ToggleControl
                        checked={pushEnabled}
                        onToggle={handleTogglePush}
                        label={`${t('pushNotifications')} ${pushEnabled ? t('enabled') : t('disabled')}`}
                        testId="toggle-push-notifications"
                      />
                      <span className="text-mq-xs text-mq-content-secondary">
                        {pushEnabled ? t('on') : t('off')}
                      </span>
                    </div>
                  ) : permissionStatus !== 'denied' && isNotificationSupported ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRequestPermission}
                      className="px-3 py-1 text-xs bg-mq-primary text-white border-2 border-mq-primary rounded-md hover:bg-mq-primary/80 hover:border-mq-primary/80"
                      data-testid="enable-notifications-button"
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
                className="p-3 bg-mq-card-background/50 backdrop-blur-sm rounded-mq-lg border border-mq-border hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300"
                data-testid={`notification-item-${key}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Icon
                      className="h-4 w-4 text-mq-content-tertiary flex-shrink-0"
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-mq-sm font-medium text-mq-content">{label}</p>
                      <p className="text-mq-xs text-mq-content-secondary mt-0.5">{desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ToggleControl
                      checked={currentNotifications[key]}
                      onToggle={() => handleNotificationPreference(key, !currentNotifications[key])}
                      label={`${label} ${t('notifications')}`}
                      testId={`toggle-${key}-notifications`}
                    />
                    <span className="text-mq-xs text-mq-content-secondary">
                      {currentNotifications[key] ? t('enabled') : t('disabled')}
                    </span>
                  </div>
                </div>

                {/* Reminder Timing Selector - only show when enabled */}
                {currentNotifications[key] && permissionStatus === 'granted' && (
                  <div className="mt-3 pt-3 border-t border-mq-border/50">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-mq-content-tertiary" aria-hidden="true" />
                      <label
                        htmlFor={`timing-${key}`}
                        className="text-mq-xs text-mq-content-secondary"
                      >
                        {t('remindMe')}
                      </label>
                      <select
                        id={`timing-${key}`}
                        value={timing}
                        onChange={(e) => setTiming(Number(e.target.value))}
                        className="text-mq-xs bg-mq-background border border-mq-border rounded-mq px-2 py-1 text-mq-content focus:outline-none focus:ring-2 focus:ring-mq-primary/50"
                        aria-label={t('reminderTimingFor', { type: label })}
                        data-testid={`timing-select-${key}`}
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
      </MagicCard>
    );
  },
);

NotificationSettings.displayName = 'NotificationSettings';

export default NotificationSettings;

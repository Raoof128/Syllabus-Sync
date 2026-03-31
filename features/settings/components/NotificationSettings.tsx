'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import {
  Bell,
  BellOff,
  Mail,
  Calendar,
  Info,
  AlertTriangle,
  FileText,
  GraduationCap,
  CheckSquare,
} from 'lucide-react';
import { useNotificationPreferencesStore } from '@/lib/store/notificationPreferencesStore';
import { useProfilesStore } from '@/lib/store/profilesStore';
import { toastUtils } from '@/lib/utils/toast';
import type { TranslationKey } from '@/lib/i18n/translations';
import { MagicCard } from '@/components/ui/MagicCard';
import { REMINDER_TIMING_OPTIONS } from '../constants';
import { ToggleControl } from './ToggleControl';
import { NotificationRow } from './NotificationRow';
import type { NotificationType } from './NotificationRow';
import { useHydration } from '@/lib/hooks/useHydration';

// Class reminders only show shorter timing options (up to 2 hours)
const CLASS_TIMING_OPTIONS = REMINDER_TIMING_OPTIONS.filter((o) => o.value <= 120);

type NotificationSettingsProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const NotificationSettings = memo(({ t }: NotificationSettingsProps) => {
  const isClient = useHydration();

  // Notification preferences store (push + reminder settings)
  const permissionStatus = useNotificationPreferencesStore((state) => state.permissionStatus);
  const pushEnabled = useNotificationPreferencesStore((state) => state.pushEnabled);
  const deadlinesEnabled = useNotificationPreferencesStore((state) => state.deadlinesEnabled);
  const classesEnabled = useNotificationPreferencesStore((state) => state.classesEnabled);
  const eventsEnabled = useNotificationPreferencesStore((state) => state.eventsEnabled);
  const assignmentsEnabled = useNotificationPreferencesStore((state) => state.assignmentsEnabled);
  const examsEnabled = useNotificationPreferencesStore((state) => state.examsEnabled);
  const todosEnabled = useNotificationPreferencesStore((state) => state.todosEnabled);
  const deadlineReminderTiming = useNotificationPreferencesStore(
    (state) => state.deadlineReminderTiming,
  );
  const classReminderTiming = useNotificationPreferencesStore((state) => state.classReminderTiming);
  const eventReminderTiming = useNotificationPreferencesStore((state) => state.eventReminderTiming);
  const assignmentReminderTiming = useNotificationPreferencesStore(
    (state) => state.assignmentReminderTiming,
  );
  const examReminderTiming = useNotificationPreferencesStore((state) => state.examReminderTiming);
  const todoReminderTiming = useNotificationPreferencesStore((state) => state.todoReminderTiming);
  const initialize = useNotificationPreferencesStore((state) => state.initialize);
  const requestPermission = useNotificationPreferencesStore((state) => state.requestPermission);
  const setDeadlinesEnabled = useNotificationPreferencesStore((state) => state.setDeadlinesEnabled);
  const setClassesEnabled = useNotificationPreferencesStore((state) => state.setClassesEnabled);
  const setEventsEnabled = useNotificationPreferencesStore((state) => state.setEventsEnabled);
  const setAssignmentsEnabled = useNotificationPreferencesStore(
    (state) => state.setAssignmentsEnabled,
  );
  const setExamsEnabled = useNotificationPreferencesStore((state) => state.setExamsEnabled);
  const setTodosEnabled = useNotificationPreferencesStore((state) => state.setTodosEnabled);
  const setPushEnabled = useNotificationPreferencesStore((state) => state.setPushEnabled);
  const setDeadlineReminderTiming = useNotificationPreferencesStore(
    (state) => state.setDeadlineReminderTiming,
  );
  const setClassReminderTiming = useNotificationPreferencesStore(
    (state) => state.setClassReminderTiming,
  );
  const setEventReminderTiming = useNotificationPreferencesStore(
    (state) => state.setEventReminderTiming,
  );
  const setAssignmentReminderTiming = useNotificationPreferencesStore(
    (state) => state.setAssignmentReminderTiming,
  );
  const setExamReminderTiming = useNotificationPreferencesStore(
    (state) => state.setExamReminderTiming,
  );
  const setTodoReminderTiming = useNotificationPreferencesStore(
    (state) => state.setTodoReminderTiming,
  );

  // Profile store for email preferences
  const currentProfile = useProfilesStore((state) =>
    state.currentProfileId
      ? state.profiles.find((p) => p.id === state.currentProfileId) || null
      : null,
  );
  const updateProfile = useProfilesStore((state) => state.updateProfile);
  const fetchProfile = useProfilesStore((state) => state.fetchProfile);
  const [isTogglingEmailPref, setIsTogglingEmailPref] = useState(false);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleRequestPermission = useCallback(async () => {
    const enabled = await setPushEnabled(true);
    const status = enabled ? 'granted' : await requestPermission();
    if (status === 'granted' || enabled) {
      toastUtils.success(t('notificationsEnabled'), t('notificationsEnabledMsg'));
    } else if (status === 'denied') {
      toastUtils.error(t('permissionDenied'), t('permissionDeniedMsg'));
    }
  }, [requestPermission, setPushEnabled, t]);

  const handleTogglePush = useCallback(async () => {
    const newValue = !pushEnabled;
    const applied = await setPushEnabled(newValue);

    if (newValue && !applied) {
      toastUtils.error(t('permissionDenied'), t('permissionDeniedMsg'));
      return;
    }

    toastUtils.success(
      t('preferenceUpdated'),
      t('pushNotificationsToggle', {
        status: newValue ? t('enabled').toLowerCase() : t('disabled').toLowerCase(),
      }),
    );
  }, [pushEnabled, setPushEnabled, t]);

  const toggleEmailPreference = useCallback(
    async (key: 'notifications' | 'emailReminders') => {
      if (!currentProfile || isTogglingEmailPref) return;

      const newPreferences = {
        ...currentProfile.preferences,
        [key]: !currentProfile.preferences[key],
      };

      setIsTogglingEmailPref(true);
      try {
        const result = await updateProfile(currentProfile.id, {
          preferences: newPreferences,
        });
        if (result) {
          await fetchProfile({ force: true });
        }
        if (!result) {
          toastUtils.error(t('error'), t('failedToUpdateProfile'), {
            id: 'preference-toggle-error-toast',
          });
        }
      } catch {
        toastUtils.error(t('error'), t('failedToUpdateProfile'), {
          id: 'preference-toggle-error-toast',
        });
      } finally {
        setIsTogglingEmailPref(false);
      }
    },
    [currentProfile, isTogglingEmailPref, updateProfile, fetchProfile, t],
  );

  const handleNotificationPreference = useCallback(
    (type: NotificationType, enabled: boolean) => {
      const setters: Record<NotificationType, (enabled: boolean) => Promise<boolean>> = {
        deadlines: setDeadlinesEnabled,
        classes: setClassesEnabled,
        events: setEventsEnabled,
        assignments: setAssignmentsEnabled,
        exams: setExamsEnabled,
        todos: setTodosEnabled,
      };

      void setters[type](enabled);

      const typeLabels: Record<NotificationType, string> = {
        deadlines: t('deadlineReminders'),
        classes: t('classReminders'),
        events: t('eventReminders'),
        assignments: t('assignmentReminders' as TranslationKey),
        exams: t('examReminders' as TranslationKey),
        todos: t('todoReminders' as TranslationKey),
      };

      toastUtils.success(
        t('preferenceUpdated'),
        `${typeLabels[type]} ${enabled ? t('enabled').toLowerCase() : t('disabled').toLowerCase()}`,
      );
    },
    [
      setDeadlinesEnabled,
      setClassesEnabled,
      setEventsEnabled,
      setAssignmentsEnabled,
      setExamsEnabled,
      setTodosEnabled,
      t,
    ],
  );

  const handleTimingChange = useCallback(
    (type: NotificationType, minutes: number) => {
      const setters: Record<NotificationType, (m: number) => Promise<boolean>> = {
        deadlines: setDeadlineReminderTiming,
        classes: setClassReminderTiming,
        events: setEventReminderTiming,
        assignments: setAssignmentReminderTiming,
        exams: setExamReminderTiming,
        todos: setTodoReminderTiming,
      };

      void setters[type](minutes);

      const option = REMINDER_TIMING_OPTIONS.find((o) => o.value === minutes);
      const timingLabel = option ? t(option.labelKey) : `${minutes} minutes`;
      toastUtils.success(
        t('reminderTimingUpdated'),
        t('reminderTimingUpdatedMsg', { timing: timingLabel }),
      );
    },
    [
      setDeadlineReminderTiming,
      setClassReminderTiming,
      setEventReminderTiming,
      setAssignmentReminderTiming,
      setExamReminderTiming,
      setTodoReminderTiming,
      t,
    ],
  );

  const notificationItems: {
    key: NotificationType;
    icon: React.ElementType;
    label: string;
    desc: string;
    timing: number;
    enabled: boolean;
    timingOptions?: readonly { readonly value: number; readonly labelKey: string }[];
  }[] = [
    {
      key: 'assignments',
      icon: FileText,
      label: t('assignmentReminders' as TranslationKey),
      desc: t('assignmentRemindersDesc' as TranslationKey),
      timing: assignmentReminderTiming,
      enabled: assignmentsEnabled,
    },
    {
      key: 'exams',
      icon: GraduationCap,
      label: t('examReminders' as TranslationKey),
      desc: t('examRemindersDesc' as TranslationKey),
      timing: examReminderTiming,
      enabled: examsEnabled,
    },
    {
      key: 'deadlines',
      icon: Mail,
      label: t('deadlineReminders'),
      desc: t('deadlineRemindersDesc'),
      timing: deadlineReminderTiming,
      enabled: deadlinesEnabled,
    },
    {
      key: 'classes',
      icon: Calendar,
      label: t('classReminders'),
      desc: t('classRemindersDesc'),
      timing: classReminderTiming,
      enabled: classesEnabled,
      timingOptions: CLASS_TIMING_OPTIONS,
    },
    {
      key: 'events',
      icon: Info,
      label: t('eventReminders'),
      desc: t('eventRemindersDesc'),
      timing: eventReminderTiming,
      enabled: eventsEnabled,
    },
    {
      key: 'todos',
      icon: CheckSquare,
      label: t('todoReminders' as TranslationKey),
      desc: t('todoRemindersDesc' as TranslationKey),
      timing: todoReminderTiming,
      enabled: todosEnabled,
    },
  ];

  const isNotificationSupported =
    isClient && typeof window !== 'undefined' && 'Notification' in window;

  return (
    <MagicCard data-testid="notification-settings">
      <Card className="mq-magic-card-content bg-mq-card-background border border-mq-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span id="notifications-heading">{t('notificationPreferences' as TranslationKey)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" role="region" aria-labelledby="notifications-heading">
          {/* Push Notification Permission Banner */}
          {isClient && (
            <div
              className="p-3 rounded-mq-lg border border-mq-border bg-mq-background-secondary"
              data-testid="push-notification-banner"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  {permissionStatus === 'granted' ? (
                    <Bell className="h-5 w-5" aria-hidden="true" />
                  ) : permissionStatus === 'denied' ? (
                    <BellOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  )}
                  <div className="min-w-0">
                    <p className="text-mq-sm font-medium text-mq-content">
                      {permissionStatus === 'granted'
                        ? t('pushNotificationsActive')
                        : permissionStatus === 'denied'
                          ? t('pushNotificationsBlocked')
                          : t('enablePushNotifications')}
                    </p>
                    <p className="text-mq-xs text-mq-content-secondary mt-0.5">
                      {permissionStatus === 'granted'
                        ? t('pushNotificationsActiveDesc')
                        : permissionStatus === 'denied'
                          ? t('pushNotificationsBlockedDesc')
                          : t('enablePushNotificationsDesc')}
                    </p>
                  </div>
                </div>
                {permissionStatus !== 'granted' && isNotificationSupported && (
                  <Button
                    size="sm"
                    className="w-full sm:w-auto sm:flex-shrink-0"
                    onClick={() => void handleRequestPermission()}
                    data-testid="enable-notifications-button"
                  >
                    {t('enable')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Master Push Toggle */}
          <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Bell className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-mq-sm font-medium text-mq-content">{t('pushNotifications')}</p>
                  <p className="text-mq-xs text-mq-content-secondary mt-0.5">
                    {t('pushNotificationsDesc')}
                  </p>
                </div>
              </div>
              <ToggleControl
                checked={pushEnabled}
                onToggle={() => void handleTogglePush()}
                label={t('pushNotifications')}
                testId="toggle-push-notifications"
              />
            </div>
          </div>

          {/* Email Notification Toggles */}
          {currentProfile && (
            <>
              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Mail className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-mq-sm font-medium text-mq-content">
                        {t('emailNotifications' as TranslationKey)}
                      </p>
                      <p className="text-mq-xs text-mq-content-secondary mt-0.5">
                        {t('emailNotificationsDesc' as TranslationKey)}
                      </p>
                    </div>
                  </div>
                  <ToggleControl
                    checked={currentProfile.preferences.notifications}
                    onToggle={() => void toggleEmailPreference('notifications')}
                    label={t('emailNotifications' as TranslationKey)}
                    testId="toggle-email-notifications"
                  />
                </div>
              </div>

              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Calendar className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-mq-sm font-medium text-mq-content">
                        {t('emailReminders' as TranslationKey)}
                      </p>
                      <p className="text-mq-xs text-mq-content-secondary mt-0.5">
                        {t('emailRemindersDesc' as TranslationKey)}
                      </p>
                    </div>
                  </div>
                  <ToggleControl
                    checked={currentProfile.preferences.emailReminders}
                    onToggle={() => void toggleEmailPreference('emailReminders')}
                    label={t('emailReminders' as TranslationKey)}
                    testId="toggle-email-reminders"
                  />
                </div>
              </div>
            </>
          )}

          <div className="border-t border-mq-border my-4" />

          <h3 className="text-mq-sm font-semibold text-mq-content mb-3">
            {t('reminderSettings' as TranslationKey)}
          </h3>

          {/* Reminder Categories */}
          <div className="space-y-3">
            {notificationItems.map((item) => (
              <NotificationRow
                key={item.key}
                type={item.key}
                icon={item.icon}
                label={item.label}
                desc={item.desc}
                timing={item.timing}
                enabled={item.enabled}
                permissionGranted={permissionStatus === 'granted'}
                timingOptions={item.timingOptions}
                t={t}
                onToggle={handleNotificationPreference}
                onTimingChange={handleTimingChange}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </MagicCard>
  );
});

NotificationSettings.displayName = 'NotificationSettings';

export default NotificationSettings;

'use client';

import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { TranslationKey } from '@/lib/i18n/translations';
import { useNotificationPreferencesStore } from '@/lib/store/notificationPreferencesStore';
import { useProfilesStore, UserProfile } from '@/lib/store/profilesStore';
import { MagicCard } from '@/components/ui/MagicCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Bell, Calendar, Clock, Mail, BookOpen, GraduationCap } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toastUtils } from '@/lib/utils/toast';
import { useState } from 'react';
import { cn } from '@/lib/utils';

// Reminder timing options (in minutes)
const REMINDER_TIMINGS = [
  { value: 15, labelKey: 'timing15min' },
  { value: 30, labelKey: 'timing30min' },
  { value: 60, labelKey: 'timing1hour' },
  { value: 120, labelKey: 'timing2hours' },
  { value: 1440, labelKey: 'timing1day' },
  { value: 2880, labelKey: 'timing2days' },
];

interface ReminderSettingsProps {
  disabled: boolean;
}

export function ReminderSettings({ disabled }: ReminderSettingsProps) {
  const { t } = useTypedTranslation();

  // Profile Store for email prefs
  const currentProfile = useProfilesStore((state) =>
    state.currentProfileId
      ? state.profiles.find((p) => p.id === state.currentProfileId) || null
      : null,
  );
  const updateProfile = useProfilesStore((state) => state.updateProfile);
  const [isTogglingPreference, setIsTogglingPreference] = useState(false);

  // Notification Store for push/reminders
  const {
    deadlinesEnabled,
    classesEnabled,
    eventsEnabled,
    deadlineReminderTiming,
    classReminderTiming,
    eventReminderTiming,
    pushEnabled,
    setDeadlinesEnabled,
    setClassesEnabled,
    setEventsEnabled,
    setPushEnabled,
    setDeadlineReminderTiming,
    setClassReminderTiming,
    setEventReminderTiming,
  } = useNotificationPreferencesStore();

  const togglePreference = async (key: keyof UserProfile['preferences']) => {
    if (!currentProfile || isTogglingPreference) return;

    const newPreferences = {
      ...currentProfile.preferences,
      [key]: !currentProfile.preferences[key],
    };

    setIsTogglingPreference(true);
    try {
      const result = await updateProfile(currentProfile.id, {
        preferences: newPreferences,
      });
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
      setIsTogglingPreference(false);
    }
  };

  const ToggleSwitch = ({
    checked,
    onChange,
    ariaLabel,
    disabled: switchDisabled = false,
  }: {
    checked: boolean;
    onChange: () => void;
    ariaLabel: string;
    disabled?: boolean;
  }) => (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      disabled={switchDisabled || disabled}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-mq-primary focus:ring-offset-2',
        checked ? 'bg-mq-success' : 'bg-mq-background-tertiary',
        (switchDisabled || disabled) && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-mq-background transition-transform shadow-sm',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  );

  if (!currentProfile) return null;

  return (
    <>
      {/* Notification Preferences (Push/Email) */}
      <MagicCard isLiquidEnhanced className="mb-4 sm:mb-6">
        <div className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border">
          <Card className="border border-mq-border bg-mq-card-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('notificationPreferences')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Master Push Toggle */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 bg-mq-card-background rounded-mq border border-mq-border">
                <div className="flex items-start gap-3 min-w-0">
                  <Bell className="h-5 w-5 text-mq-content-secondary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-mq-content">{t('pushNotifications')}</p>
                    <p className="text-xs text-mq-content-tertiary break-words">
                      {t('pushNotificationsDesc')}
                    </p>
                  </div>
                </div>
                <div className="sm:flex-shrink-0">
                  <ToggleSwitch
                    checked={pushEnabled}
                    onChange={() => setPushEnabled(!pushEnabled)}
                    ariaLabel={t('pushNotifications')}
                  />
                </div>
              </div>

              {/* Email Notifications */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 bg-mq-card-background rounded-mq border border-mq-border">
                <div className="flex items-start gap-3 min-w-0">
                  <Mail className="h-5 w-5 text-mq-content-secondary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-mq-content">{t('emailNotifications')}</p>
                    <p className="text-xs text-mq-content-tertiary break-words">
                      {t('emailNotificationsDesc')}
                    </p>
                  </div>
                </div>
                <div className="sm:flex-shrink-0">
                  <ToggleSwitch
                    checked={currentProfile.preferences.notifications}
                    onChange={() => togglePreference('notifications')}
                    ariaLabel={t('emailNotifications')}
                    disabled={isTogglingPreference}
                  />
                </div>
              </div>

              {/* Email Reminders */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 bg-mq-card-background rounded-mq border border-mq-border">
                <div className="flex items-start gap-3 min-w-0">
                  <Calendar className="h-5 w-5 text-mq-content-secondary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-mq-content">{t('emailReminders')}</p>
                    <p className="text-xs text-mq-content-tertiary break-words">
                      {t('emailRemindersDesc')}
                    </p>
                  </div>
                </div>
                <div className="sm:flex-shrink-0">
                  <ToggleSwitch
                    checked={currentProfile.preferences.emailReminders}
                    onChange={() => togglePreference('emailReminders')}
                    ariaLabel={t('emailReminders')}
                    disabled={isTogglingPreference}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MagicCard>

      {/* Reminder Settings (Deadlines/Events) */}
      <MagicCard isLiquidEnhanced className="mb-4 sm:mb-6">
        <div className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border">
          <Card className="border border-mq-border bg-mq-card-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('reminderSettings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Deadline Reminders */}
              <div className="space-y-3 p-3 bg-mq-card-background rounded-mq border border-mq-border">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <BookOpen className="h-5 w-5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-mq-content">
                        {t('deadlineReminders')}
                      </p>
                      <p className="text-xs text-mq-content-tertiary break-words">
                        {t('deadlineRemindersDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="sm:flex-shrink-0">
                    <ToggleSwitch
                      checked={deadlinesEnabled}
                      onChange={() => setDeadlinesEnabled(!deadlinesEnabled)}
                      ariaLabel={t('deadlineReminders' as 'title') || 'Deadline Reminders'}
                    />
                  </div>
                </div>
                {deadlinesEnabled && (
                  <Select
                    value={deadlineReminderTiming.toString()}
                    onValueChange={(value) => setDeadlineReminderTiming(parseInt(value))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_TIMINGS.map((timing) => (
                        <SelectItem key={timing.value} value={timing.value.toString()}>
                          {t(timing.labelKey as TranslationKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Class Reminders */}
              <div className="space-y-3 p-3 bg-mq-card-background rounded-mq border border-mq-border">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <GraduationCap className="h-5 w-5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-mq-content">{t('classReminders')}</p>
                      <p className="text-xs text-mq-content-tertiary break-words">
                        {t('classRemindersDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="sm:flex-shrink-0">
                    <ToggleSwitch
                      checked={classesEnabled}
                      onChange={() => setClassesEnabled(!classesEnabled)}
                      ariaLabel={t('classReminders' as 'title') || 'Class Reminders'}
                    />
                  </div>
                </div>
                {classesEnabled && (
                  <Select
                    value={classReminderTiming.toString()}
                    onValueChange={(value) => setClassReminderTiming(parseInt(value))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_TIMINGS.filter((t) => t.value <= 120).map((timing) => (
                        <SelectItem key={timing.value} value={timing.value.toString()}>
                          {t(timing.labelKey as TranslationKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Event Reminders */}
              <div className="space-y-3 p-3 bg-mq-card-background rounded-mq border border-mq-border">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <Calendar className="h-5 w-5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-mq-content">{t('eventReminders')}</p>
                      <p className="text-xs text-mq-content-tertiary break-words">
                        {t('eventRemindersDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="sm:flex-shrink-0">
                    <ToggleSwitch
                      checked={eventsEnabled}
                      onChange={() => setEventsEnabled(!eventsEnabled)}
                      ariaLabel={t('eventReminders' as 'title') || 'Event Reminders'}
                    />
                  </div>
                </div>
                {eventsEnabled && (
                  <Select
                    value={eventReminderTiming.toString()}
                    onValueChange={(value) => setEventReminderTiming(parseInt(value))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_TIMINGS.map((timing) => (
                        <SelectItem key={timing.value} value={timing.value.toString()}>
                          {t(timing.labelKey as TranslationKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </MagicCard>
    </>
  );
}

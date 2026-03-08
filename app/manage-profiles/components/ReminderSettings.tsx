'use client';

import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { TranslationKey } from '@/lib/i18n/translations';
import { useNotificationPreferencesStore } from '@/lib/store/notificationPreferencesStore';
import { useProfilesStore, UserProfile } from '@/lib/store/profilesStore';
import { MagicCard } from '@/components/ui/MagicCard';
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
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-mq-primary focus:ring-offset-2',
        checked ? 'bg-mq-success' : 'bg-mq-background-tertiary',
        (switchDisabled || disabled) && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  );

  if (!currentProfile) return null;

  const ToggleRow = ({
    icon: Icon,
    label,
    description,
    checked,
    onToggle,
    toggleDisabled,
    ariaLabel,
  }: {
    icon: React.ElementType;
    label: string;
    description: string;
    checked: boolean;
    onToggle: () => void;
    toggleDisabled?: boolean;
    ariaLabel: string;
  }) => (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 rounded-mq border border-mq-border/60 hover:border-mq-border transition-colors">
      <div className="flex items-start gap-3 min-w-0">
        <Icon className="h-4.5 w-4.5 text-mq-content-tertiary flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-mq-content">{label}</p>
          <p className="text-xs text-mq-content-tertiary break-words leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <div className="sm:flex-shrink-0">
        <ToggleSwitch
          checked={checked}
          onChange={onToggle}
          ariaLabel={ariaLabel}
          disabled={toggleDisabled}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Notification Preferences (Push/Email) */}
      <MagicCard isLiquidEnhanced>
        <div className="mq-magic-card-content bg-mq-card-background border border-mq-border">
          {/* Section Header */}
          <div className="flex items-center gap-3 p-5 sm:p-6 pb-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10">
              <Bell className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-mq-content">
              {t('notificationPreferences')}
            </h2>
          </div>

          <div className="p-5 sm:p-6 pt-4 space-y-3">
            <ToggleRow
              icon={Bell}
              label={t('pushNotifications')}
              description={t('pushNotificationsDesc')}
              checked={pushEnabled}
              onToggle={() => setPushEnabled(!pushEnabled)}
              ariaLabel={t('pushNotifications')}
            />
            <ToggleRow
              icon={Mail}
              label={t('emailNotifications')}
              description={t('emailNotificationsDesc')}
              checked={currentProfile.preferences.notifications}
              onToggle={() => togglePreference('notifications')}
              toggleDisabled={isTogglingPreference}
              ariaLabel={t('emailNotifications')}
            />
            <ToggleRow
              icon={Calendar}
              label={t('emailReminders')}
              description={t('emailRemindersDesc')}
              checked={currentProfile.preferences.emailReminders}
              onToggle={() => togglePreference('emailReminders')}
              toggleDisabled={isTogglingPreference}
              ariaLabel={t('emailReminders')}
            />
          </div>
        </div>
      </MagicCard>

      {/* Reminder Settings (Deadlines/Events) */}
      <MagicCard isLiquidEnhanced>
        <div className="mq-magic-card-content bg-mq-card-background border border-mq-border">
          {/* Section Header */}
          <div className="flex items-center gap-3 p-5 sm:p-6 pb-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-mq-content">{t('reminderSettings')}</h2>
          </div>

          <div className="p-5 sm:p-6 pt-4 space-y-3">
            {/* Deadline Reminders */}
            <div className="space-y-2 p-3 rounded-mq border border-mq-border/60 hover:border-mq-border transition-colors">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <BookOpen className="h-4.5 w-4.5 text-mq-content-tertiary flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-mq-content">{t('deadlineReminders')}</p>
                    <p className="text-xs text-mq-content-tertiary break-words leading-relaxed">
                      {t('deadlineRemindersDesc')}
                    </p>
                  </div>
                </div>
                <div className="sm:flex-shrink-0">
                  <ToggleSwitch
                    checked={deadlinesEnabled}
                    onChange={() => setDeadlinesEnabled(!deadlinesEnabled)}
                    ariaLabel={t('deadlineReminders' as TranslationKey)}
                  />
                </div>
              </div>
              {deadlinesEnabled && (
                <Select
                  value={deadlineReminderTiming.toString()}
                  onValueChange={(value) => setDeadlineReminderTiming(parseInt(value))}
                >
                  <SelectTrigger className="mt-1">
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
            <div className="space-y-2 p-3 rounded-mq border border-mq-border/60 hover:border-mq-border transition-colors">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <GraduationCap className="h-4.5 w-4.5 text-mq-content-tertiary flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-mq-content">{t('classReminders')}</p>
                    <p className="text-xs text-mq-content-tertiary break-words leading-relaxed">
                      {t('classRemindersDesc')}
                    </p>
                  </div>
                </div>
                <div className="sm:flex-shrink-0">
                  <ToggleSwitch
                    checked={classesEnabled}
                    onChange={() => setClassesEnabled(!classesEnabled)}
                    ariaLabel={t('classReminders' as TranslationKey)}
                  />
                </div>
              </div>
              {classesEnabled && (
                <Select
                  value={classReminderTiming.toString()}
                  onValueChange={(value) => setClassReminderTiming(parseInt(value))}
                >
                  <SelectTrigger className="mt-1">
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
            <div className="space-y-2 p-3 rounded-mq border border-mq-border/60 hover:border-mq-border transition-colors">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <Calendar className="h-4.5 w-4.5 text-mq-content-tertiary flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-mq-content">{t('eventReminders')}</p>
                    <p className="text-xs text-mq-content-tertiary break-words leading-relaxed">
                      {t('eventRemindersDesc')}
                    </p>
                  </div>
                </div>
                <div className="sm:flex-shrink-0">
                  <ToggleSwitch
                    checked={eventsEnabled}
                    onChange={() => setEventsEnabled(!eventsEnabled)}
                    ariaLabel={t('eventReminders' as TranslationKey)}
                  />
                </div>
              </div>
              {eventsEnabled && (
                <Select
                  value={eventReminderTiming.toString()}
                  onValueChange={(value) => setEventReminderTiming(parseInt(value))}
                >
                  <SelectTrigger className="mt-1">
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
          </div>
        </div>
      </MagicCard>
    </>
  );
}

'use client';

import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { TranslationKey } from '@/lib/i18n/translations';
import { useNotificationPreferencesStore } from '@/lib/store/notificationPreferencesStore';
import { useProfilesStore, UserProfile } from '@/lib/store/profilesStore';
import { MagicCard } from '@/components/ui/MagicCard';
import { Bell, Calendar, Clock, Mail, FileText, GraduationCap, CheckSquare } from 'lucide-react';
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
  const fetchProfile = useProfilesStore((state) => state.fetchProfile);
  const [isTogglingPreference, setIsTogglingPreference] = useState(false);
  const [isSavingReminderSettings, setIsSavingReminderSettings] = useState(false);

  // Notification Store for push/reminders
  const {
    classesEnabled,
    eventsEnabled,
    assignmentsEnabled,
    examsEnabled,
    todosEnabled,
    classReminderTiming,
    eventReminderTiming,
    assignmentReminderTiming,
    examReminderTiming,
    todoReminderTiming,
    pushEnabled,
    setClassesEnabled,
    setEventsEnabled,
    setAssignmentsEnabled,
    setExamsEnabled,
    setTodosEnabled,
    setPushEnabled,
    setClassReminderTiming,
    setEventReminderTiming,
    setAssignmentReminderTiming,
    setExamReminderTiming,
    setTodoReminderTiming,
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
      setIsTogglingPreference(false);
    }
  };

  const saveReminderSetting = async (update: () => Promise<boolean>) => {
    if (disabled || isSavingReminderSettings) return;

    setIsSavingReminderSettings(true);
    try {
      const saved = await update();
      if (!saved) {
        toastUtils.error(t('error'), t('databaseConnectionFailed'), {
          id: 'reminder-settings-save-error-toast',
        });
      }
    } catch {
      toastUtils.error(t('error'), t('databaseConnectionFailed'), {
        id: 'reminder-settings-save-error-toast',
      });
    } finally {
      setIsSavingReminderSettings(false);
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

  const ReminderRow = ({
    icon: Icon,
    label,
    description,
    enabled,
    timing,
    onToggle,
    onTimingChange,
    timings,
    isSaving,
    disabled: rowDisabled,
    t: translate,
  }: {
    icon: React.ElementType;
    label: string;
    description: string;
    enabled: boolean;
    timing: number;
    onToggle: () => void;
    onTimingChange: (value: string) => void;
    timings: typeof REMINDER_TIMINGS;
    isSaving: boolean;
    disabled: boolean;
    t: (key: TranslationKey) => string;
  }) => (
    <div className="space-y-2 p-3 rounded-mq border border-mq-border/60 hover:border-mq-border transition-colors">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            checked={enabled}
            onChange={onToggle}
            ariaLabel={label}
            disabled={isSaving}
          />
        </div>
      </div>
      {enabled && (
        <Select
          value={timing.toString()}
          onValueChange={onTimingChange}
          disabled={isSaving || rowDisabled}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timings.map((t) => (
              <SelectItem key={t.value} value={t.value.toString()}>
                {translate(t.labelKey as TranslationKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );

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
              onToggle={() => {
                void setPushEnabled(!pushEnabled);
              }}
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

      {/* Reminder Settings (Assignments/Exams/Class/Events/Todos) */}
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
            {/* Assignment Reminders */}
            <ReminderRow
              icon={FileText}
              label={t('assignmentReminders' as TranslationKey)}
              description={t('assignmentRemindersDesc' as TranslationKey)}
              enabled={assignmentsEnabled}
              timing={assignmentReminderTiming}
              onToggle={() => {
                void saveReminderSetting(() => setAssignmentsEnabled(!assignmentsEnabled));
              }}
              onTimingChange={(value) => {
                void saveReminderSetting(() => setAssignmentReminderTiming(parseInt(value, 10)));
              }}
              timings={REMINDER_TIMINGS}
              isSaving={isSavingReminderSettings}
              disabled={disabled}
              t={t}
            />

            {/* Exam Reminders */}
            <ReminderRow
              icon={GraduationCap}
              label={t('examReminders' as TranslationKey)}
              description={t('examRemindersDesc' as TranslationKey)}
              enabled={examsEnabled}
              timing={examReminderTiming}
              onToggle={() => {
                void saveReminderSetting(() => setExamsEnabled(!examsEnabled));
              }}
              onTimingChange={(value) => {
                void saveReminderSetting(() => setExamReminderTiming(parseInt(value, 10)));
              }}
              timings={REMINDER_TIMINGS}
              isSaving={isSavingReminderSettings}
              disabled={disabled}
              t={t}
            />

            {/* Class Reminders */}
            <ReminderRow
              icon={Calendar}
              label={t('classReminders')}
              description={t('classRemindersDesc')}
              enabled={classesEnabled}
              timing={classReminderTiming}
              onToggle={() => {
                void saveReminderSetting(() => setClassesEnabled(!classesEnabled));
              }}
              onTimingChange={(value) => {
                void saveReminderSetting(() => setClassReminderTiming(parseInt(value, 10)));
              }}
              timings={REMINDER_TIMINGS.filter((t) => t.value <= 120)}
              isSaving={isSavingReminderSettings}
              disabled={disabled}
              t={t}
            />

            {/* Event Reminders */}
            <ReminderRow
              icon={Calendar}
              label={t('eventReminders')}
              description={t('eventRemindersDesc')}
              enabled={eventsEnabled}
              timing={eventReminderTiming}
              onToggle={() => {
                void saveReminderSetting(() => setEventsEnabled(!eventsEnabled));
              }}
              onTimingChange={(value) => {
                void saveReminderSetting(() => setEventReminderTiming(parseInt(value, 10)));
              }}
              timings={REMINDER_TIMINGS}
              isSaving={isSavingReminderSettings}
              disabled={disabled}
              t={t}
            />

            {/* Todo Reminders */}
            <ReminderRow
              icon={CheckSquare}
              label={t('todoReminders' as TranslationKey)}
              description={t('todoRemindersDesc' as TranslationKey)}
              enabled={todosEnabled}
              timing={todoReminderTiming}
              onToggle={() => {
                void saveReminderSetting(() => setTodosEnabled(!todosEnabled));
              }}
              onTimingChange={(value) => {
                void saveReminderSetting(() => setTodoReminderTiming(parseInt(value, 10)));
              }}
              timings={REMINDER_TIMINGS}
              isSaving={isSavingReminderSettings}
              disabled={disabled}
              t={t}
            />
          </div>
        </div>
      </MagicCard>
    </>
  );
}

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  User,
  Loader2,
  Camera,
  Mail,
  GraduationCap,
  Calendar,
  Bell,
  Clock,
  Save,
  IdCard,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Button } from '@/components/ui/mq/button';
import { useProfilesStore, UserProfile } from '@/lib/store/profilesStore';
import { useNotificationPreferencesStore } from '@/lib/store/notificationPreferencesStore';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/mq/input';
import { Label } from '@/components/ui/label';
import { toastUtils } from '@/lib/utils/toast';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { MagicCard } from '@/components/ui/MagicCard';
import { useGamificationStore, showXPEarnedNotification } from '@/components/gamification';
import { apiRequest } from '@/lib/utils/api';
import { cn } from '@/lib/utils';
import { BRAND_COLORS } from '@/lib/config';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Academic year options
const ACADEMIC_YEARS = [
  { value: '1st Year', label: '1st Year' },
  { value: '2nd Year', label: '2nd Year' },
  { value: '3rd Year', label: '3rd Year' },
  { value: '4th Year', label: '4th Year' },
  { value: '5th Year', label: '5th Year' },
  { value: 'Postgraduate', label: 'Postgraduate' },
  { value: 'PhD', label: 'PhD' },
];

// Reminder timing options (in minutes)
const REMINDER_TIMINGS = [
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
  { value: 2880, label: '2 days before' },
];

export default function ManageProfilesPage() {
  const { t, language } = useTranslation();
  const router = useRouter();

  // Profile store
  const { profiles, currentProfileId, isLoading, hasLoaded, fetchProfile, updateProfile } =
    useProfilesStore();

  // Notification preferences store
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
    initialize: initializeNotifications,
  } = useNotificationPreferencesStore();

  // Gamification store
  const { isDemo, refreshProfile, settings } = useGamificationStore();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    course: '',
    year: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingPreference, setIsTogglingPreference] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Get current profile
  const currentProfile = useMemo(() => {
    return currentProfileId ? profiles.find((p) => p.id === currentProfileId) || null : null;
  }, [profiles, currentProfileId]);

  // Fetch profile from database on mount
  useEffect(() => {
    if (!hasLoaded && !isLoading) {
      fetchProfile();
    }
    initializeNotifications();
  }, [hasLoaded, isLoading, fetchProfile, initializeNotifications]);

  // Initialize form data when profile loads
  useEffect(() => {
    if (currentProfile) {
      setFormData({
        name: currentProfile.name || '',
        email: currentProfile.email || '',
        studentId: currentProfile.studentId || '',
        course: currentProfile.course || '',
        year: currentProfile.year || '',
      });
      setHasChanges(false);
    }
  }, [currentProfile]);

  // Check if profile is complete
  const isProfileComplete = useCallback((data: typeof formData) => {
    return data.name && data.email && data.studentId && data.course && data.year;
  }, []);

  // Award XP for completing profile
  const awardProfileCompletionXP = useCallback(async () => {
    if (isDemo) return;

    try {
      const response = await apiRequest<{
        message: string;
        result: { xpAwarded: number; leveledUp: boolean; newLevel: number };
      }>('/api/gamification/award-xp', {
        method: 'POST',
        body: JSON.stringify({
          eventType: 'profile_completed',
          metadata: { source: 'manage-profiles' },
        }),
      });

      if (settings.showXPNotifications) {
        showXPEarnedNotification(response.result.xpAwarded, 'Profile Completed', language);
      }

      await refreshProfile();
    } catch (error) {
      if (error instanceof Error && !error.message.includes('already awarded')) {
        console.error('Failed to award profile completion XP:', error);
      }
    }
  }, [isDemo, settings.showXPNotifications, language, refreshProfile]);

  // Handle avatar change
  const handleAvatarChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !currentProfile) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        setIsSaving(true);
        try {
          await updateProfile(currentProfile.id, { avatar: result });
          toastUtils.success(
            t('profileUpdated'),
            t('avatarUpdated' as 'title') || 'Avatar updated successfully',
          );
        } catch {
          toastUtils.error(t('error'), t('failedToUpdateProfile'));
        } finally {
          setIsSaving(false);
        }
      };
      reader.readAsDataURL(file);
    },
    [currentProfile, updateProfile, t],
  );

  // Handle form field change
  const handleFieldChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  // Handle save profile
  const handleSaveProfile = useCallback(async () => {
    if (!currentProfile || !formData.name) return;

    setIsSaving(true);
    try {
      const wasIncomplete = !isProfileComplete({
        name: currentProfile.name,
        email: currentProfile.email,
        studentId: currentProfile.studentId,
        course: currentProfile.course,
        year: currentProfile.year,
      });
      const isNowComplete = isProfileComplete(formData);
      const shouldAwardXP = wasIncomplete && isNowComplete;

      const updates: Partial<UserProfile> = {
        name: formData.name,
        course: formData.course,
        year: formData.year,
        preferences: currentProfile.preferences,
      };

      // Only send studentId if it wasn't previously set
      if (!currentProfile.studentId && formData.studentId) {
        updates.studentId = formData.studentId;
      }

      const result = await updateProfile(currentProfile.id, updates);

      if (result) {
        setHasChanges(false);
        toastUtils.success(t('profileUpdated'), t('profileUpdatedMsg'));

        if (shouldAwardXP) {
          await awardProfileCompletionXP();
        }
      } else {
        toastUtils.error(t('error'), t('failedToUpdateProfile'));
      }
    } catch {
      toastUtils.error(t('error'), t('failedToUpdateProfile'));
    } finally {
      setIsSaving(false);
    }
  }, [currentProfile, formData, isProfileComplete, updateProfile, t, awardProfileCompletionXP]);

  // Handle preference toggles
  const togglePreference = useCallback(
    async (key: keyof UserProfile['preferences']) => {
      if (!currentProfile || isTogglingPreference) return;

      const newPreferences = {
        ...currentProfile.preferences,
        [key]: !currentProfile.preferences[key],
      };

      setIsTogglingPreference(true);
      try {
        const result = await updateProfile(currentProfile.id, { preferences: newPreferences });
        if (!result) {
          toastUtils.error(t('error'), t('failedToUpdateProfile'));
        }
      } catch {
        toastUtils.error(t('error'), t('failedToUpdateProfile'));
      } finally {
        setIsTogglingPreference(false);
      }
    },
    [currentProfile, updateProfile, t, isTogglingPreference],
  );

  // Toggle switch component
  const ToggleSwitch = ({
    checked,
    onChange,
    ariaLabel,
    disabled = false,
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
      disabled={disabled}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-mq-primary focus:ring-offset-2',
        checked ? 'bg-mq-success' : 'bg-mq-background-tertiary',
        disabled && 'opacity-50 cursor-not-allowed',
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

  // Show loading state
  if (isLoading && !hasLoaded) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-mq-primary" />
        </div>
      </div>
    );
  }

  // No profile - prompt to sign in
  if (!currentProfile) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <MagicCard isLiquidEnhanced>
          <div className="mq-magic-card-content">
            <div className="text-center py-12">
              <User className="h-16 w-16 text-mq-content-tertiary mx-auto mb-4" />
              <h2 className="text-mq-xl font-semibold text-mq-content mb-2">
                {t('noProfilesYet')}
              </h2>
              <p className="text-mq-content-secondary mb-6 max-w-md mx-auto">
                {t('signInToManageProfile')}
              </p>
              <Button onClick={() => router.push('/login')}>{t('signIn')}</Button>
            </div>
          </div>
        </MagicCard>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Profile Header with Avatar */}
      <MagicCard isLiquidEnhanced className="mb-6">
        <div className="mq-magic-card-content">
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6">
            {/* Avatar Section */}
            <div className="relative group">
              <label className="cursor-pointer block">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden shadow-lg ring-4 ring-mq-background"
                  style={{
                    backgroundColor: currentProfile.avatar ? 'transparent' : BRAND_COLORS.primary,
                  }}
                >
                  {currentProfile.avatar ? (
                    <Image
                      src={currentProfile.avatar}
                      alt={currentProfile.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-white font-bold text-3xl">
                      {currentProfile.name ? currentProfile.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  aria-label={t('changeAvatar')}
                  disabled={isSaving}
                />
              </label>
            </div>

            {/* Profile Summary */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-mq-content mb-1">
                {currentProfile.name || t('guest')}
              </h1>
              <p className="text-mq-content-secondary flex items-center justify-center sm:justify-start gap-2">
                <Mail className="h-4 w-4" />
                {currentProfile.email}
              </p>
              {currentProfile.studentId && (
                <p className="text-mq-content-tertiary text-sm mt-1 flex items-center justify-center sm:justify-start gap-2">
                  <IdCard className="h-4 w-4" />
                  <span>
                    {t('idPrefix')}
                    {currentProfile.studentId}
                  </span>
                </p>
              )}
              {currentProfile.avatar?.startsWith('data:') && (
                <p className="mt-2 text-xs text-mq-warning">{t('avatarLocalOnlyWarning')}</p>
              )}
            </div>

            {/* Save Button */}
            {hasChanges && (
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? t('saving') : t('save')}
              </Button>
            )}
          </div>
        </div>
      </MagicCard>

      {/* Personal Information */}
      <MagicCard isLiquidEnhanced className="mb-6">
        <div className="mq-magic-card-content p-0">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('personalInfo' as 'title') || 'Personal Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="profile-name">{t('fullName')}</Label>
                <Input
                  id="profile-name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder={t('enterFullName')}
                  disabled={isSaving}
                />
              </div>

              {/* Email - Read only */}
              <div className="space-y-2">
                <Label htmlFor="profile-email">{t('emailAddress')}</Label>
                <Input
                  id="profile-email"
                  value={formData.email}
                  disabled
                  className="bg-mq-background-subtle cursor-not-allowed"
                />
                <p className="text-mq-xs text-mq-content-tertiary">{t('emailCannotBeChanged')}</p>
              </div>

              {/* Student ID */}
              <div className="space-y-2">
                <Label htmlFor="profile-student-id">{t('studentId')}</Label>
                <Input
                  id="profile-student-id"
                  value={formData.studentId}
                  onChange={(e) => handleFieldChange('studentId', e.target.value)}
                  placeholder="12345678"
                  disabled={isSaving || !!currentProfile.studentId}
                  className={
                    currentProfile.studentId ? 'bg-mq-background-subtle cursor-not-allowed' : ''
                  }
                />
                {currentProfile.studentId && (
                  <p className="text-mq-xs text-mq-content-tertiary">
                    {t('studentIdCannotBeChanged' as 'title') ||
                      'Student ID cannot be changed once set.'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </MagicCard>

      {/* Academic Information */}
      <MagicCard isLiquidEnhanced className="mb-6">
        <div className="mq-magic-card-content p-0">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                {t('academicInfo' as 'title') || 'Academic Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Course/Major */}
              <div className="space-y-2">
                <Label htmlFor="profile-course">{t('course')}</Label>
                <Input
                  id="profile-course"
                  value={formData.course}
                  onChange={(e) => handleFieldChange('course', e.target.value)}
                  placeholder={t('coursePlaceholder')}
                  disabled={isSaving}
                />
              </div>

              {/* Academic Year */}
              <div className="space-y-2">
                <Label htmlFor="profile-year">{t('year')}</Label>
                <Select
                  value={formData.year}
                  onValueChange={(value) => handleFieldChange('year', value)}
                  disabled={isSaving}
                >
                  <SelectTrigger id="profile-year">
                    <SelectValue placeholder={t('yearPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {ACADEMIC_YEARS.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </MagicCard>

      {/* Notification Preferences */}
      <MagicCard isLiquidEnhanced className="mb-6">
        <div className="mq-magic-card-content p-0">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('notificationPreferences' as 'title') || 'Notification Preferences'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Master Push Toggle */}
              <div className="flex items-center justify-between p-3 bg-mq-card-background rounded-mq border border-mq-border">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-mq-content-secondary" />
                  <div>
                    <p className="text-sm font-medium text-mq-content">{t('pushNotifications')}</p>
                    <p className="text-xs text-mq-content-tertiary">
                      {t('pushNotificationsDesc' as 'title') ||
                        'Receive push notifications on this device'}
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={pushEnabled}
                  onChange={() => setPushEnabled(!pushEnabled)}
                  ariaLabel={t('pushNotifications')}
                />
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between p-3 bg-mq-card-background rounded-mq border border-mq-border">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-mq-content-secondary" />
                  <div>
                    <p className="text-sm font-medium text-mq-content">{t('emailNotifications')}</p>
                    <p className="text-xs text-mq-content-tertiary">
                      {t('emailNotificationsDesc' as 'title') ||
                        'Receive important updates via email'}
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={currentProfile.preferences.notifications}
                  onChange={() => togglePreference('notifications')}
                  ariaLabel={t('emailNotifications')}
                  disabled={isTogglingPreference}
                />
              </div>

              {/* Email Reminders */}
              <div className="flex items-center justify-between p-3 bg-mq-card-background rounded-mq border border-mq-border">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-mq-content-secondary" />
                  <div>
                    <p className="text-sm font-medium text-mq-content">{t('emailReminders')}</p>
                    <p className="text-xs text-mq-content-tertiary">
                      {t('emailRemindersDesc' as 'title') ||
                        'Get email reminders for upcoming deadlines'}
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={currentProfile.preferences.emailReminders}
                  onChange={() => togglePreference('emailReminders')}
                  ariaLabel={t('emailReminders')}
                  disabled={isTogglingPreference}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </MagicCard>

      {/* Reminder Settings */}
      <MagicCard isLiquidEnhanced className="mb-6">
        <div className="mq-magic-card-content p-0">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('reminderSettings' as 'title') || 'Reminder Settings'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Deadline Reminders */}
              <div className="space-y-3 p-3 bg-mq-card-background rounded-mq border border-mq-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-mq-content">
                        {t('deadlineReminders' as 'title') || 'Deadline Reminders'}
                      </p>
                      <p className="text-xs text-mq-content-tertiary">
                        {t('deadlineRemindersDesc' as 'title') ||
                          'Get reminded before assignments are due'}
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={deadlinesEnabled}
                    onChange={() => setDeadlinesEnabled(!deadlinesEnabled)}
                    ariaLabel={t('deadlineReminders' as 'title') || 'Deadline Reminders'}
                  />
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
                          {timing.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Class Reminders */}
              <div className="space-y-3 p-3 bg-mq-card-background rounded-mq border border-mq-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-mq-content">
                        {t('classReminders' as 'title') || 'Class Reminders'}
                      </p>
                      <p className="text-xs text-mq-content-tertiary">
                        {t('classRemindersDesc' as 'title') || 'Get reminded before classes start'}
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={classesEnabled}
                    onChange={() => setClassesEnabled(!classesEnabled)}
                    ariaLabel={t('classReminders' as 'title') || 'Class Reminders'}
                  />
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
                          {timing.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Event Reminders */}
              <div className="space-y-3 p-3 bg-mq-card-background rounded-mq border border-mq-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-mq-content">
                        {t('eventReminders' as 'title') || 'Event Reminders'}
                      </p>
                      <p className="text-xs text-mq-content-tertiary">
                        {t('eventRemindersDesc' as 'title') || 'Get reminded before campus events'}
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={eventsEnabled}
                    onChange={() => setEventsEnabled(!eventsEnabled)}
                    ariaLabel={t('eventReminders' as 'title') || 'Event Reminders'}
                  />
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
                          {timing.label}
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

      {/* Save Button at Bottom */}
      {hasChanges && (
        <div className="sticky bottom-6 flex justify-center">
          <Button
            onClick={handleSaveProfile}
            disabled={isSaving}
            size="lg"
            className="shadow-lg flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {isSaving ? t('saving') : t('saveChanges' as 'title') || 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}

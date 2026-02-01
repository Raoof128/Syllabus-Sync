import { useState, useCallback, useEffect } from 'react';
import { useProfilesStore } from '@/lib/store/profilesStore';
import { useNotificationPreferencesStore } from '@/lib/store/notificationPreferencesStore';
import { toastUtils } from '@/lib/utils/toast';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { logger } from '@/lib/logger';

export function useProfileManager() {
  const { t } = useTypedTranslation();

  // Use selector to get current profile
  const currentProfile = useProfilesStore((state) =>
    state.currentProfileId
      ? state.profiles.find((p) => p.id === state.currentProfileId) || null
      : null,
  );

  const {
    updateProfile,
    fetchProfile,
    isLoading: isProfileLoading,
    hasLoaded,
  } = useProfilesStore();
  const { initialize: initializeNotifications } = useNotificationPreferencesStore();

  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    course: '',
    year: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Initial Data Fetching
  useEffect(() => {
    if (!hasLoaded && !isProfileLoading) {
      fetchProfile();
    }
    initializeNotifications();
  }, [hasLoaded, isProfileLoading, fetchProfile, initializeNotifications]);

  // Initialize form
  useEffect(() => {
    if (currentProfile) {
      setFormData({
        name: currentProfile.name || '',
        studentId: currentProfile.studentId || '',
        course: currentProfile.course || '',
        year: currentProfile.year || '',
      });
    }
  }, [currentProfile]);

  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const saveProfile = useCallback(async () => {
    if (!currentProfile) return;
    setIsSaving(true);
    try {
      await updateProfile(currentProfile.id, formData);
      toastUtils.success(t('profileUpdated'), t('profileUpdatedMsg'));
    } catch (error) {
      logger.error('Failed to save profile:', error);
      toastUtils.error(t('error'), t('failedToUpdateProfile'));
    } finally {
      setIsSaving(false);
    }
  }, [currentProfile, formData, updateProfile, t]);

  return {
    currentProfile,
    formData,
    isSaving,
    isProfileLoading,
    hasLoaded,
    handleFieldChange,
    saveProfile,
  };
}

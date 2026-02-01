import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProfilesStore } from '@/lib/store/profilesStore';
import { toastUtils } from '@/lib/utils/toast';
import { profileSchema, ProfileFormValues } from '../schema';
import { updateProfileAction } from '../actions';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { useNotificationPreferencesStore } from '@/lib/store/notificationPreferencesStore';
import { logger } from '@/lib/logger';

export function useProfileManager() {
  const { t } = useTypedTranslation();

  // Use selector to get current profile safely
  const currentProfile = useProfilesStore((state) =>
    state.currentProfileId
      ? state.profiles.find((p) => p.id === state.currentProfileId) || null
      : null,
  );

  const {
    updateProfile: updateStoreProfile,
    fetchProfile,
    isLoading: isProfileLoading,
    hasLoaded,
  } = useProfilesStore();
  const { initialize: initializeNotifications } = useNotificationPreferencesStore();

  // Setup React Hook Form with Zod
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      studentId: '',
      course: '',
      year: '',
    },
    mode: 'onChange', // Validate as they type
  });

  // Initial Data Fetching
  useEffect(() => {
    if (!hasLoaded && !isProfileLoading) {
      fetchProfile();
    }
    initializeNotifications();
  }, [hasLoaded, isProfileLoading, fetchProfile, initializeNotifications]);

  // Load data into form when profile is fetched
  useEffect(() => {
    if (currentProfile) {
      form.reset({
        name: currentProfile.name || '',
        studentId: currentProfile.studentId || '',
        course: currentProfile.course || '',
        year: currentProfile.year || '',
      });
    }
  }, [currentProfile, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!currentProfile) return;

    let result;
    try {
      // Call Server Action
      result = await updateProfileAction(currentProfile.id, data);
    } catch (error) {
      logger.error('Failed to update profile in server action:', error);
      toastUtils.error(t('error'), 'Database connection failed');
      return; // Exit early if server action call fails
    }

    if (result.success) {
      // Update local store to reflect changes immediately
      await updateStoreProfile(currentProfile.id, data);
      toastUtils.success('Saved', t('profileUpdatedMsg') || 'Profile updated successfully');
    } else {
      // Handle both validation errors and generic messages
      let errorMessage = 'Validation failed';

      if ('error' in result && result.error) {
        errorMessage = 'Please check the form for errors';
      } else if ('message' in result) {
        errorMessage = result.message;
      }

      toastUtils.error(t('error'), errorMessage);
    }
  };

  return {
    currentProfile,
    form, // Expose the form methods
    isSaving: form.formState.isSubmitting,
    saveProfile: form.handleSubmit(onSubmit),
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty, // True if user changed something
    isProfileLoading,
    hasLoaded,
  };
}

import { useEffect, useOptimistic, startTransition } from 'react';
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

  // 1. Setup Optimistic State
  // This hook holds the "truth" + any pending changes
  const [optimisticProfile, addOptimisticUpdate] = useOptimistic(
    currentProfile,
    (state, newValues: Partial<ProfileFormValues>) => {
      if (!state) return null; // Should ideally ensure state is not null
      return {
        ...state,
        ...newValues,
        // Keep existing ID/Email/etc, just overwrite form fields
      };
    },
  );

  // Setup React Hook Form with Zod
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentProfile?.name || '',
      studentId: currentProfile?.studentId || '',
      course: currentProfile?.course || '',
      year: currentProfile?.year || '',
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

    // 2. OPTIMISTIC UPDATE: Update UI instantly (0ms latency)
    startTransition(() => {
      addOptimisticUpdate(data);
    });

    let result;
    try {
      // 3. SERVER UPDATE: Do the real work
      result = await updateProfileAction(currentProfile.id, data);
    } catch (error) {
      logger.error('Failed to update profile in server action:', error);
      toastUtils.error(t('error'), 'Database connection failed');
      // Revert optimistic state roughly handled by re-render, but resetting form is good
      form.reset({
        name: currentProfile.name || '',
        studentId: currentProfile.studentId || '',
        course: currentProfile.course || '',
        year: currentProfile.year || '',
      });
      return;
    }

    if (result.success) {
      // Sync the permanent store
      await updateStoreProfile(currentProfile.id, data);
      toastUtils.success('Saved', t('profileUpdatedMsg') || 'Profile updated successfully');
      // Reset form to clean "dirty" state
      form.reset(data);
    } else {
      // Handle server validation failures or messages
      let errorMessage = 'Validation failed';

      if ('error' in result && result.error) {
        errorMessage = 'Please check the form for errors';
      } else if ('message' in result) {
        errorMessage = result.message || 'Unknown error';
      }

      toastUtils.error(t('error'), errorMessage);

      // Reset form to previous valid server state to undo optimistic UI if we want strict consistency
      // Or keep user input to let them fix it. Keeping user input is usually better UX for form errors.
      // However, if the error is "server totally failed", maybe revert.
      // For now, we leave the form state as is so they can fix errors.
    }
  };

  return {
    // Return the OPTIMISTIC profile to the UI, not the raw store profile
    currentProfile: optimisticProfile,
    form, // Expose the form methods
    isSaving: form.formState.isSubmitting,
    saveProfile: form.handleSubmit(onSubmit),
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty, // True if user changed something
    isProfileLoading,
    hasLoaded,
  };
}

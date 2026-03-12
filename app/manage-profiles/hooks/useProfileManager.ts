import { useEffect, useOptimistic, startTransition, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProfilesStore } from '@/lib/store/profilesStore';
import { toastUtils } from '@/lib/utils/toast';
import { createProfileSchema, ProfileFormValues } from '../schema';
import { updateProfileAction } from '../actions';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { useNotificationPreferencesStore } from '@/lib/store/notificationPreferencesStore';
import { logger } from '@/lib/logger';

// Map legacy year format (old manage-profile values) → numeric format used by signup
// Ensures existing users whose year was stored as "1st Year" still see correct data
const YEAR_LEGACY_MAP: Record<string, string> = {
  '1st Year': '1',
  '2nd Year': '2',
  '3rd Year': '3',
  '4th Year': '4',
  '5th Year': '5',
  '6th Year': '6',
  '7th Year': '7',
  '8th Year': '8',
};

function normalizeYear(year: string | undefined | null): string {
  if (!year) return '';
  return YEAR_LEGACY_MAP[year] ?? year;
}

function normalizeStudentId(studentId: string | undefined | null): string {
  if (!studentId) return '';
  return studentId.trim();
}

export function useProfileManager() {
  const { t } = useTypedTranslation();
  const profileSchema = createProfileSchema(t);

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

  // Prevent double-fetch in React Strict Mode (effects run twice in dev)
  const fetchedOnMount = useRef(false);

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
      studentId: normalizeStudentId(currentProfile?.studentId),
      faculty: currentProfile?.faculty || '',
      course: currentProfile?.course || '',
      year: normalizeYear(currentProfile?.year),
    },
    mode: 'onChange', // Validate as they type
  });

  // Always fetch fresh profile from DB on mount so the page is in sync with login
  useEffect(() => {
    if (!fetchedOnMount.current) {
      fetchedOnMount.current = true;
      fetchProfile();
      initializeNotifications();
    }
  }, [fetchProfile, initializeNotifications]);

  // Load data into form when profile is fetched (normalize legacy year values)
  useEffect(() => {
    if (currentProfile) {
      form.reset({
        name: currentProfile.name || '',
        studentId: normalizeStudentId(currentProfile.studentId),
        faculty: currentProfile.faculty || '',
        course: currentProfile.course || '',
        year: normalizeYear(currentProfile.year),
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
      toastUtils.error(t('error'), t('databaseConnectionFailed'));
      form.reset({
        name: currentProfile.name || '',
        studentId: normalizeStudentId(currentProfile.studentId),
        faculty: currentProfile.faculty || '',
        course: currentProfile.course || '',
        year: normalizeYear(currentProfile.year),
      });
      return;
    }

    if (result.success) {
      // Sync the permanent store
      const updatedProfile = await updateStoreProfile(currentProfile.id, data);
      if (!updatedProfile) {
        // Store already shows the specific error toast — just reset the form
        form.reset({
          name: currentProfile.name || '',
          studentId: normalizeStudentId(currentProfile.studentId),
          faculty: currentProfile.faculty || '',
          course: currentProfile.course || '',
          year: normalizeYear(currentProfile.year),
        });
        return;
      }
      toastUtils.success(t('saved'), t('profileUpdatedMsg'));
      // Reset form to clean "dirty" state
      form.reset(data);
      // Re-fetch from DB so the UI reflects the persisted values
      await fetchProfile();
    } else {
      // Handle server validation failures or messages
      let errorMessage = t('validationFailed');

      if ('error' in result && result.error) {
        errorMessage = t('validationFailed');
      } else if ('message' in result) {
        errorMessage = result.message || t('unexpectedError');
      }

      toastUtils.error(t('error'), errorMessage);

      // Reset form to previous valid server state to undo optimistic UI if we want strict consistency
      // Or keep user input to let them fix it. Keeping user input is usually better UX for form errors.
      // However, if the error is "server totally failed", maybe revert.
      // For now, we leave the form state as is so they can fix errors.
    }
  };

  const reloadProfile = async () => {
    await fetchProfile();
    toastUtils.success(t('profileReloaded'), t('profileReloadedMsg'));
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
    reloadProfile,
  };
}

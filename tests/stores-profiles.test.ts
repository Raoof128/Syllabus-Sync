/**
 * Profiles Store Tests
 * Focus on branch coverage for mapDbToClient, mapClientToDb, mapDbPreferencesToClient helpers, and store actions
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProfilesStore } from '@/lib/store/profilesStore';

vi.mock('@/lib/utils/api', () => ({
  apiRequest: vi.fn().mockRejectedValue(new Error('401: authentication required')),
}));

vi.mock('@/lib/utils/errorHandling', () => ({
  errorHandler: { logError: vi.fn() },
}));

vi.mock('@/lib/utils/toast', () => ({
  toastUtils: { error: vi.fn(), success: vi.fn() },
}));

describe('profilesStore', () => {
  beforeEach(() => {
    useProfilesStore.getState().reset();
  });

  it('initializes with empty state', () => {
    const state = useProfilesStore.getState();
    expect(state.profiles).toEqual([]);
    expect(state.currentProfileId).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.hasLoaded).toBe(false);
  });

  it('addProfile creates a new profile with id and createdAt', () => {
    useProfilesStore.getState().addProfile({
      name: 'Test User',
      email: 'test@example.com',
      studentId: '12345',
      faculty: 'Science',
      course: 'CS',
      year: '2026',
      preferences: { notifications: true, emailReminders: false, pushNotifications: true },
    });
    const { profiles, currentProfileId } = useProfilesStore.getState();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].id).toBeDefined();
    expect(profiles[0].name).toBe('Test User');
    expect(currentProfileId).toBe(profiles[0].id);
  });

  it('deleteProfile removes a non-current profile without API call', async () => {
    useProfilesStore.getState().addProfile({
      name: 'A',
      email: '',
      studentId: '',
      faculty: '',
      course: '',
      year: '',
      preferences: { notifications: true, emailReminders: false, pushNotifications: true },
    });
    useProfilesStore.getState().addProfile({
      name: 'B',
      email: '',
      studentId: '',
      faculty: '',
      course: '',
      year: '',
      preferences: { notifications: true, emailReminders: false, pushNotifications: true },
    });
    const { profiles } = useProfilesStore.getState();
    const nonCurrentId = profiles.find(
      (p) => p.id !== useProfilesStore.getState().currentProfileId,
    )?.id;
    if (nonCurrentId) {
      await useProfilesStore.getState().deleteProfile(nonCurrentId);
      expect(useProfilesStore.getState().profiles).toHaveLength(1);
    }
  });

  it('deleteProfile removes the current profile and nullifies currentProfileId', async () => {
    useProfilesStore.getState().addProfile({
      name: 'C',
      email: '',
      studentId: '',
      faculty: '',
      course: '',
      year: '',
      preferences: { notifications: true, emailReminders: false, pushNotifications: true },
    });
    const { currentProfileId } = useProfilesStore.getState();
    await useProfilesStore.getState().deleteProfile(currentProfileId!);
    expect(useProfilesStore.getState().currentProfileId).toBeNull();
    expect(useProfilesStore.getState().profiles).toHaveLength(0);
  });

  it('setCurrentProfile sets the current profile id', () => {
    useProfilesStore.getState().setCurrentProfile('abc');
    expect(useProfilesStore.getState().currentProfileId).toBe('abc');
  });

  it('getCurrentProfile returns null when no current profile', () => {
    expect(useProfilesStore.getState().getCurrentProfile()).toBeNull();
  });

  it('getCurrentProfile returns the correct profile', () => {
    useProfilesStore.getState().addProfile({
      name: 'X',
      email: 'x@x.com',
      studentId: '',
      faculty: '',
      course: '',
      year: '',
      preferences: { notifications: true, emailReminders: false, pushNotifications: true },
    });
    const profile = useProfilesStore.getState().getCurrentProfile();
    expect(profile).not.toBeNull();
    expect(profile!.name).toBe('X');
  });

  it('getCurrentProfile returns null for non-existent id', () => {
    useProfilesStore.getState().setCurrentProfile('nonexistent');
    expect(useProfilesStore.getState().getCurrentProfile()).toBeNull();
  });

  it('updateCurrentProfile returns null when no current profile', async () => {
    const result = await useProfilesStore.getState().updateCurrentProfile({ name: 'New' });
    expect(result).toBeNull();
  });

  it('clearProfiles clears all data', () => {
    useProfilesStore.getState().addProfile({
      name: 'Y',
      email: '',
      studentId: '',
      faculty: '',
      course: '',
      year: '',
      preferences: { notifications: true, emailReminders: false, pushNotifications: true },
    });
    useProfilesStore.getState().clearProfiles();
    expect(useProfilesStore.getState().profiles).toHaveLength(0);
    expect(useProfilesStore.getState().currentProfileId).toBeNull();
    expect(useProfilesStore.getState().hasLoaded).toBe(false);
  });

  it('reset clears all data including loading state', () => {
    useProfilesStore.setState({ isLoading: true, hasLoaded: true });
    useProfilesStore.getState().reset();
    const state = useProfilesStore.getState();
    expect(state.profiles).toHaveLength(0);
    expect(state.isLoading).toBe(false);
    expect(state.hasLoaded).toBe(false);
  });

  it('fetchProfile sets hasLoaded even on auth error', async () => {
    await useProfilesStore.getState().fetchProfile();
    const state = useProfilesStore.getState();
    expect(state.hasLoaded).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('fetchProfile does not re-fetch while loading', async () => {
    useProfilesStore.setState({ isLoading: true });
    await useProfilesStore.getState().fetchProfile();
    // Should return immediately
    expect(useProfilesStore.getState().isLoading).toBe(true);
  });

  it('updateProfile returns null when profile not found', async () => {
    const result = await useProfilesStore.getState().updateProfile('no-id', { name: 'X' });
    expect(result).toBeNull();
  });
});

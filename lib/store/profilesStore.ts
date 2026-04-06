// lib/store/profilesStore.ts
// ============================================
// PROFILES STORE
// ============================================
// Manages user profiles with Supabase integration

'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { apiRequest } from '@/lib/utils/api';
import { errorHandler } from '@/lib/utils/errorHandling';
import { toastUtils } from '@/lib/utils/toast';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Database profile schema (snake_case from Supabase)
 */
interface DbProfile {
  id: string;
  email: string;
  full_name: string | null;
  student_id: string | null;
  faculty: string | null;
  course: string | null;
  year: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string | null;
}

interface DbUserPreferences {
  user_id: string;
  notifications_enabled: boolean | null;
  email_notifications: boolean | null;
}

/**
 * Client-side profile with additional local preferences (camelCase)
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  studentId: string;
  avatar?: string;
  // Profile fields stored in Supabase
  faculty: string;
  course: string;
  year: string;
  // Local-only fields (not stored in Supabase)
  preferences: {
    notifications: boolean;
    emailReminders: boolean;
    pushNotifications: boolean;
  };
  createdAt: Date;
  lastLogin?: Date;
}

export interface ProfilesState {
  profiles: UserProfile[];
  currentProfileId: string | null;
  isLoading: boolean;
  hasLoaded: boolean;
  lastFetched: number | null;
  // Actions
  addProfile: (profile: Omit<UserProfile, 'id' | 'createdAt'>) => void;
  deleteProfile: (id: string) => Promise<void>;
  fetchProfile: (options?: { force?: boolean }) => Promise<void>;
  updateProfile: (id: string, updates: Partial<UserProfile>) => Promise<UserProfile | null>;
  setCurrentProfile: (id: string | null) => void;
  getCurrentProfile: () => UserProfile | null;
  updateCurrentProfile: (updates: Partial<UserProfile>) => Promise<UserProfile | null>;
  clearProfiles: () => void;
  reset: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const AVATAR_URL_MAX_LENGTH = 500;
const AVATAR_STORAGE_BUCKET = 'avatars';

const isDataUrl = (value: string) => value.startsWith('data:');

const normalizeAvatarExtension = (mimeType: string) => {
  const rawExtension = mimeType.split('/')[1] || 'png';
  return rawExtension.replace('svg+xml', 'svg');
};

/**
 * Convert a data: URI to a Blob without using fetch().
 * fetch(dataUrl) is blocked by CSP's connect-src which doesn't allow data: URIs.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

async function uploadAvatarToStorage(dataUrl: string, profileId: string): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const { createBrowserClient, isSupabaseConfigured } = await import('@/lib/supabase/client');

    if (!isSupabaseConfigured()) {
      return null;
    }

    const blob = dataUrlToBlob(dataUrl);
    const mimeType = blob.type || 'image/png';
    const extension = normalizeAvatarExtension(mimeType);
    const filename = `${crypto.randomUUID()}.${extension}`;
    const path = `${profileId}/${filename}`;

    const supabase = createBrowserClient();
    const { error } = await supabase.storage
      .from(AVATAR_STORAGE_BUCKET)
      .upload(path, blob, { contentType: mimeType, upsert: true });

    if (error) {
      errorHandler.logError(error, 'ProfilesStore.uploadAvatarToStorage', 'medium');
      return null;
    }

    const { data } = supabase.storage.from(AVATAR_STORAGE_BUCKET).getPublicUrl(path);
    return data?.publicUrl ?? null;
  } catch (error) {
    errorHandler.logError(
      error instanceof Error ? error : new Error('Failed to upload avatar to storage'),
      'ProfilesStore.uploadAvatarToStorage',
      'medium',
    );
    return null;
  }
}

/**
 * Map database profile (snake_case) to client profile (camelCase)
 */
function mapDbToClient(db: DbProfile, existing?: Partial<UserProfile>): UserProfile {
  return {
    id: db.id,
    name: db.full_name || '',
    email: db.email,
    studentId: db.student_id || '',
    avatar: db.avatar_url || undefined,
    // Profile fields from database
    faculty: db.faculty || '',
    course: db.course || '',
    year: db.year || '',
    // Local-only fields from existing profile or use defaults
    preferences: existing?.preferences || {
      notifications: true,
      emailReminders: false,
      pushNotifications: true,
    },
    createdAt: new Date(db.created_at),
    lastLogin: new Date(),
  };
}

/**
 * Map client updates to database format (only server-synced fields)
 */
function mapClientToDb(updates: Partial<UserProfile>): Partial<DbProfile> {
  const dbUpdates: Partial<DbProfile> = {};

  if (updates.name !== undefined) {
    const trimmed = updates.name.trim();
    if (trimmed) {
      dbUpdates.full_name = trimmed;
    }
  }
  if (updates.studentId !== undefined) {
    const trimmed = updates.studentId.trim();
    dbUpdates.student_id = trimmed || null;
  }
  if (updates.faculty !== undefined) {
    dbUpdates.faculty = updates.faculty || null;
  }
  if (updates.course !== undefined) {
    dbUpdates.course = updates.course || null;
  }
  if (updates.year !== undefined) {
    dbUpdates.year = updates.year || null;
  }
  if (updates.avatar !== undefined) {
    const avatar = updates.avatar?.trim();
    if (!avatar) {
      dbUpdates.avatar_url = null;
    } else if (!isDataUrl(avatar) && avatar.length <= AVATAR_URL_MAX_LENGTH) {
      dbUpdates.avatar_url = avatar;
    }
  }

  return dbUpdates;
}

function mapDbPreferencesToClient(
  dbPreferences?: DbUserPreferences | null,
  existing?: UserProfile['preferences'],
): UserProfile['preferences'] {
  if (!dbPreferences) {
    return (
      existing || {
        notifications: true,
        emailReminders: false,
        pushNotifications: true,
      }
    );
  }
  return {
    notifications: dbPreferences.notifications_enabled ?? true,
    emailReminders: dbPreferences.email_notifications ?? false,
    // pushNotifications is local-only, preserve existing value
    pushNotifications: existing?.pushNotifications ?? true,
  };
}

function mapClientPreferencesToDb(preferences: UserProfile['preferences']) {
  return {
    notifications_enabled: preferences.notifications,
    email_notifications: preferences.emailReminders,
    // pushNotifications is local-only, not synced to database
  };
}

// ============================================================================
// STORE
// ============================================================================

export const useProfilesStore = create<ProfilesState>()(
  persist(
    (set, get) => ({
      profiles: [],
      currentProfileId: null,
      isLoading: false,
      hasLoaded: false,
      lastFetched: null,

      /**
       * Add a local profile (used for local profile management)
       * Note: Auth profile is created via signup API, this is for local state only
       */
      addProfile: (profileData) => {
        const newProfile: UserProfile = {
          ...profileData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        };

        set((state) => ({
          profiles: [...state.profiles, newProfile],
          currentProfileId: newProfile.id,
        }));
      },

      /**
       * Delete a local profile
       * Note: This only removes from local state, not from Supabase
       */
      deleteProfile: async (id) => {
        // Check if this is the current (authenticated) profile BEFORE updating state
        const isCurrentProfile = get().currentProfileId === id;

        // Save state for rollback on API failure
        const previousProfiles = get().profiles;
        const previousCurrentProfileId = get().currentProfileId;

        set((state) => {
          const newProfiles = state.profiles.filter((p) => p.id !== id);
          const newCurrentProfileId = state.currentProfileId === id ? null : state.currentProfileId;
          return {
            profiles: newProfiles,
            currentProfileId: newCurrentProfileId,
          };
        });

        // Only call API delete for the authenticated user's profile
        if (!isCurrentProfile) return;

        try {
          await apiRequest<{ id: string }>('/api/profiles', {
            method: 'DELETE',
          });
        } catch (error) {
          // Rollback local state on API failure
          set({
            profiles: previousProfiles,
            currentProfileId: previousCurrentProfileId,
          });
          errorHandler.logError(
            error instanceof Error ? error : new Error('Failed to delete profile'),
            'ProfilesStore.deleteProfile',
            'high',
          );
        }
      },

      fetchProfile: async (options) => {
        if (get().isLoading) return;

        // SWR: skip fetch if data is fresh (< 60s) unless forced
        const { lastFetched } = get();
        if (!options?.force && lastFetched && Date.now() - lastFetched < 60_000) {
          return;
        }

        set({ isLoading: true });
        try {
          const dbProfile = await apiRequest<DbProfile | null>('/api/profiles');

          if (dbProfile) {
            const existingProfile = get().profiles.find((p) => p.id === dbProfile.id);
            let preferences = existingProfile?.preferences;
            try {
              const dbPreferences = await apiRequest<DbUserPreferences | null>(
                '/api/user-preferences',
                { noRetry: true },
              );
              preferences = mapDbPreferencesToClient(dbPreferences, preferences);
            } catch {
              // Keep existing preferences if API fails (e.g. unauthenticated)
            }

            const clientProfile = mapDbToClient(dbProfile, {
              ...existingProfile,
              preferences,
            });

            set((state) => {
              const existingIndex = state.profiles.findIndex((p) => p.id === dbProfile.id);
              const newProfiles = [...state.profiles];

              if (existingIndex >= 0) {
                // Update existing profile, preserving local-only fields
                newProfiles[existingIndex] = {
                  ...newProfiles[existingIndex],
                  ...clientProfile,
                };
              } else {
                // Add new profile
                newProfiles.push(clientProfile);
              }

              return {
                profiles: newProfiles,
                currentProfileId: dbProfile.id,
                hasLoaded: true,
                lastFetched: Date.now(),
              };
            });
          } else {
            set({ hasLoaded: true, lastFetched: Date.now() });
          }
        } catch (error) {
          // Silently handle API errors - keep persisted data
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (
            !errorMessage.includes('401') &&
            !errorMessage.includes('authentication') &&
            !errorMessage.includes('unauthorized')
          ) {
            errorHandler.logError(
              error instanceof Error ? error : new Error('Failed to fetch profile'),
              'ProfilesStore.fetchProfile',
              'medium',
            );
          }
          set({ hasLoaded: true });
        } finally {
          set({ isLoading: false });
        }
      },

      updateProfile: async (id, updates) => {
        const currentProfile = get().profiles.find((p) => p.id === id);
        if (!currentProfile) return null;

        // Optimistic update
        const optimisticProfile = {
          ...currentProfile,
          ...updates,
          lastLogin: new Date(),
        };
        set((state) => ({
          profiles: state.profiles.map((p) => (p.id === id ? optimisticProfile : p)),
        }));

        let uploadedAvatarUrl: string | null = null;
        let avatarUploadFailed = false;
        if (updates.avatar && isDataUrl(updates.avatar)) {
          uploadedAvatarUrl = await uploadAvatarToStorage(updates.avatar, id);
          if (uploadedAvatarUrl) {
            set((state) => ({
              profiles: state.profiles.map((p) =>
                p.id === id ? { ...p, avatar: uploadedAvatarUrl!, lastLogin: new Date() } : p,
              ),
            }));
          } else {
            // Upload failed — revert avatar to previous value so data URL doesn't linger
            avatarUploadFailed = true;
            set((state) => ({
              profiles: state.profiles.map((p) =>
                p.id === id
                  ? {
                      ...p,
                      avatar: currentProfile.avatar,
                      lastLogin: new Date(),
                    }
                  : p,
              ),
            }));
            toastUtils.error('Avatar upload failed', 'Could not save avatar. Please try again.');
          }
        }

        // Build updates for DB: use uploaded URL if available, strip failed avatar
        const updatesForDb = uploadedAvatarUrl
          ? { ...updates, avatar: uploadedAvatarUrl }
          : avatarUploadFailed
            ? { ...updates, avatar: undefined }
            : updates;

        const preferences = updatesForDb.preferences;

        // If avatar was the only update and it failed, nothing to save
        const dbUpdates = mapClientToDb(updatesForDb);
        const hasServerUpdates = Object.keys(dbUpdates).length > 0;

        if (avatarUploadFailed && !hasServerUpdates && !updatesForDb.preferences) {
          return null;
        }

        let serverProfile: UserProfile = optimisticProfile;

        if (hasServerUpdates) {
          try {
            const dbProfile = await apiRequest<DbProfile>('/api/profiles', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dbUpdates),
            });

            serverProfile = mapDbToClient(dbProfile, optimisticProfile);
            set((state) => ({
              profiles: state.profiles.map((p) => (p.id === id ? serverProfile : p)),
            }));
          } catch (error) {
            // Revert on error
            set((state) => ({
              profiles: state.profiles.map((p) => (p.id === id ? currentProfile : p)),
            }));

            const errorMessage = error instanceof Error ? error.message : String(error);
            errorHandler.logError(
              error instanceof Error ? error : new Error('Failed to update profile'),
              'ProfilesStore.updateProfile',
              'high',
            );
            toastUtils.error('Update failed', errorMessage);
            return null;
          }
        }

        if (preferences) {
          try {
            const dbPreferences = await apiRequest<DbUserPreferences>('/api/user-preferences', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(mapClientPreferencesToDb(preferences)),
            });
            const nextPreferences = mapDbPreferencesToClient(
              dbPreferences,
              serverProfile.preferences,
            );
            serverProfile = { ...serverProfile, preferences: nextPreferences };
            set((state) => ({
              profiles: state.profiles.map((p) => (p.id === id ? serverProfile : p)),
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (
              !errorMessage.includes('authentication') &&
              !errorMessage.includes('unauthorized')
            ) {
              errorHandler.logError(
                error instanceof Error ? error : new Error('Failed to update preferences'),
                'ProfilesStore.updatePreferences',
                'medium',
              );
            }
          }
        }

        return serverProfile;
      },

      setCurrentProfile: (id) => {
        set({ currentProfileId: id });
      },

      getCurrentProfile: () => {
        const { profiles, currentProfileId } = get();
        return currentProfileId
          ? profiles.find((profile) => profile.id === currentProfileId) || null
          : null;
      },

      updateCurrentProfile: async (updates) => {
        const { currentProfileId } = get();
        if (!currentProfileId) return null;

        return get().updateProfile(currentProfileId, updates);
      },

      clearProfiles: () => {
        set({
          profiles: [],
          currentProfileId: null,
          hasLoaded: false,
          lastFetched: null,
        });
      },

      reset: () => {
        set({
          profiles: [],
          currentProfileId: null,
          hasLoaded: false,
          isLoading: false,
          lastFetched: null,
        });
      },
    }),
    {
      name: 'profiles-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        profiles: state.profiles.map((p) => ({
          ...p,
          // SECURITY: Don't persist sensitive PII to localStorage
          studentId: '',
          email: '',
        })),
        currentProfileId: state.currentProfileId,
      }),
      // Ensure hasLoaded stays false after rehydration so fetchProfile can update it
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset hasLoaded to false after rehydration
          // This ensures the manage-profiles page waits for fresh DB data
          state.hasLoaded = false;
        }
      },
    },
  ),
);

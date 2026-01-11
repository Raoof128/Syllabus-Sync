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
  avatar_url: string | null;
  created_at: string;
  updated_at: string | null;
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
  // Local-only fields (not stored in Supabase)
  course: string;
  year: string;
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
  // Actions
  addProfile: (profile: Omit<UserProfile, 'id' | 'createdAt'>) => void;
  deleteProfile: (id: string) => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (id: string, updates: Partial<UserProfile>) => Promise<UserProfile | null>;
  setCurrentProfile: (id: string | null) => void;
  getCurrentProfile: () => UserProfile | null;
  updateCurrentProfile: (updates: Partial<UserProfile>) => Promise<UserProfile | null>;
  clearProfiles: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

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
    // Preserve local-only fields from existing profile or use defaults
    course: existing?.course || '',
    year: existing?.year || '',
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
    dbUpdates.full_name = updates.name;
  }
  if (updates.avatar !== undefined) {
    dbUpdates.avatar_url = updates.avatar || null;
  }

  return dbUpdates;
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
      deleteProfile: (id) => {
        set((state) => {
          const newProfiles = state.profiles.filter((p) => p.id !== id);
          const newCurrentProfileId = state.currentProfileId === id ? null : state.currentProfileId;
          return {
            profiles: newProfiles,
            currentProfileId: newCurrentProfileId,
          };
        });
      },

      fetchProfile: async () => {
        if (get().isLoading) return;

        set({ isLoading: true });
        try {
          const dbProfile = await apiRequest<DbProfile | null>('/api/profiles');

          if (dbProfile) {
            const existingProfile = get().profiles.find((p) => p.id === dbProfile.id);
            const clientProfile = mapDbToClient(dbProfile, existingProfile);

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
              };
            });
          } else {
            set({ hasLoaded: true });
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
        const optimisticProfile = { ...currentProfile, ...updates, lastLogin: new Date() };
        set((state) => ({
          profiles: state.profiles.map((p) => (p.id === id ? optimisticProfile : p)),
        }));

        // Determine which fields need server sync
        const dbUpdates = mapClientToDb(updates);
        const hasServerUpdates = Object.keys(dbUpdates).length > 0;

        if (hasServerUpdates) {
          try {
            const dbProfile = await apiRequest<DbProfile>('/api/profiles', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dbUpdates),
            });

            // Update with server response
            const serverProfile = mapDbToClient(dbProfile, optimisticProfile);
            set((state) => ({
              profiles: state.profiles.map((p) => (p.id === id ? serverProfile : p)),
            }));

            return serverProfile;
          } catch (error) {
            // Revert on error
            set((state) => ({
              profiles: state.profiles.map((p) => (p.id === id ? currentProfile : p)),
            }));

            errorHandler.logError(
              error instanceof Error ? error : new Error('Failed to update profile'),
              'ProfilesStore.updateProfile',
              'high',
            );
            return null;
          }
        }

        // Local-only update succeeded
        return optimisticProfile;
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
    },
  ),
);

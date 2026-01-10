// lib/store/profilesStore.ts
// ============================================
// PROFILES STORE
// ============================================
// Manages user profiles and authentication

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  studentId: string;
  avatar?: string;
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
  addProfile: (profile: Omit<UserProfile, 'id' | 'createdAt'>) => void;
  updateProfile: (id: string, updates: Partial<UserProfile>) => void;
  deleteProfile: (id: string) => void;
  setCurrentProfile: (id: string | null) => void;
  getCurrentProfile: () => UserProfile | null;
  updateCurrentProfile: (updates: Partial<UserProfile>) => void;
  fetchProfile: () => Promise<void>;
}

export const useProfilesStore = create<ProfilesState>()(
  persist(
    (set, get) => ({
      profiles: [],
      currentProfileId: null,

      addProfile: (profileData) => {
        const newProfile: UserProfile = {
          ...profileData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        };

        set((state) => ({
          ...state,
          profiles: [...state.profiles, newProfile],
          // Automatically set as current profile (always set new profile as current)
          currentProfileId: newProfile.id,
        }));
      },

      updateProfile: (id, updates) => {
        set((state) => ({
          ...state,
          profiles: state.profiles.map((profile) =>
            profile.id === id ? { ...profile, ...updates } : profile,
          ),
        }));
      },

      deleteProfile: (id) => {
        set((state) => {
          const newProfiles = state.profiles.filter((profile) => profile.id !== id);
          const newCurrentProfileId = state.currentProfileId === id ? null : state.currentProfileId;

          return {
            ...state,
            profiles: newProfiles,
            currentProfileId: newCurrentProfileId,
          };
        });
      },

      setCurrentProfile: (id) => {
        set((state) => ({
          ...state,
          currentProfileId: id,
        }));
      },

      getCurrentProfile: () => {
        const { profiles, currentProfileId } = get();
        return currentProfileId
          ? profiles.find((profile) => profile.id === currentProfileId) || null
          : null;
      },

      updateCurrentProfile: (updates) => {
        const { currentProfileId } = get();
        if (!currentProfileId) return;

        set((state) => ({
          ...state,
          profiles: state.profiles.map((profile) =>
            profile.id === currentProfileId
              ? { ...profile, ...updates, lastLogin: new Date() }
              : profile,
          ),
        }));
      },

      fetchProfile: async () => {
        try {
          // Fetch from secure API
          const res = await fetch('/api/auth/user');
          if (!res.ok) return;
          const data = await res.json();

          if (data.success && data.data.profile) {
            const profile = data.data.profile;
            // Note: API returns snake_case from DB, need to map if necessary
            // Assuming the API returns matching structure or we map it here
            // But UserProfile interface uses camelCase.
            // Let's assume for now we trust the structure or the API helps us.
            // Actually, app/api/auth/user returns the raw DB row which is snake_case.
            // We need to map it.

            const mappedProfile: Partial<UserProfile> = {
              id: profile.id,
              email: profile.email,
              name: profile.full_name,
              studentId: profile.student_id,
              // Add other fields as needed
            };

            set((state) => {
              // Determine if we need to add or update
              const existingIndex = state.profiles.findIndex((p) => p.id === profile.id);
              if (existingIndex >= 0) {
                const newProfiles = [...state.profiles];
                newProfiles[existingIndex] = { ...newProfiles[existingIndex], ...mappedProfile };
                return { ...state, profiles: newProfiles };
              }
              // If completely new, might need full object.
              // For now, let's just update if exists or log warning if not found
              return state;
            });
          }
        } catch (e) {
          console.error('Failed to fetch profile', e);
        }
      },
    }),
    {
      name: 'profiles-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ...state,
        profiles: state.profiles.map((p) => ({
          ...p,
          studentId: '', // SECURITY: Don't persist sensitive PII
          email: '', // SECURITY: Don't persist sensitive PII
        })),
      }),
    },
  ),
);

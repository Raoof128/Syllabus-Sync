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
            profile.id === id ? { ...profile, ...updates } : profile
          ),
        }));
      },

      deleteProfile: (id) => {
        set((state) => {
          const newProfiles = state.profiles.filter((profile) => profile.id !== id);
          const newCurrentProfileId =
            state.currentProfileId === id ? null : state.currentProfileId;

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
              : profile
          ),
        }));
      },
    }),
    {
      name: 'profiles-storage',
      storage: createJSONStorage(() => localStorage),
    }
  ),
);

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/utils/api';
import { useProfilesStore } from '@/lib/store/profilesStore';
import { useHydration } from '@/lib/hooks';
import { AuthUser } from '../types';

export function useHomeUser(initialUser: AuthUser | null = null) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const profiles = useProfilesStore((state) => state.profiles);
  const currentProfileId = useProfilesStore((state) => state.currentProfileId);
  const setCurrentProfile = useProfilesStore((state) => state.setCurrentProfile);
  const getCurrentProfile = useProfilesStore((state) => state.getCurrentProfile);
  const hasHydrated = useHydration();
  // Avoid reading persisted store state until after hydration to prevent SSR/client text mismatches.
  const currentProfile = hasHydrated ? getCurrentProfile() : null;

  // Keep user state in sync with auth endpoint
  useEffect(() => {
    let isActive = true;

    const loadUser = async () => {
      try {
        const data = await apiRequest<{ user?: AuthUser }>('/api/auth/user', { noRetry: true });
        if (isActive) {
          setUser(data?.user ?? null);
        }
      } catch {
        if (isActive) {
          setUser(null);
        }
      }
    };

    void loadUser();

    const handleFocus = () => {
      void loadUser();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      isActive = false;
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Auto-select first profile if profiles exist but none is selected
  useEffect(() => {
    if (hasHydrated && profiles.length > 0 && !currentProfileId) {
      setCurrentProfile(profiles[0].id);
    }
  }, [hasHydrated, profiles, currentProfileId, setCurrentProfile]);

  // Get display name for welcome message
  const displayName = (() => {
    if (currentProfile?.name) return currentProfile.name;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.user_metadata?.name) return user.user_metadata.name;
    // Extract name from email prefix and capitalize it
    if (user?.email) {
      const emailPrefix = user.email.split('@')[0];
      const nameWithoutNumbers = emailPrefix.replace(/\d+$/, '');
      if (nameWithoutNumbers.length > 0) {
        return (
          nameWithoutNumbers.charAt(0).toUpperCase() + nameWithoutNumbers.slice(1).toLowerCase()
        );
      }
    }
    return null;
  })();

  return {
    user,
    displayName,
    hasHydrated, // Useful to pass back
  };
}

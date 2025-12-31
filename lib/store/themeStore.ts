// lib/store/themeStore.ts
// ============================================
// THEME STORE
// ============================================
// Manages application theme (light/dark mode) and user preferences

import React from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  resolvedTheme: 'light' | 'dark';
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getResolvedTheme = (theme: Theme): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => {
      return {
        theme: 'system',
        setTheme: (theme) => set({ theme, resolvedTheme: getResolvedTheme(theme) }),
        toggleTheme: () => {
          const currentTheme = get().theme;
          let newTheme: Theme;
          if (typeof window !== 'undefined' && currentTheme === 'system') {
            newTheme = getSystemTheme() === 'dark' ? 'light' : 'dark';
          } else if (currentTheme === 'light') {
            newTheme = 'dark';
          } else {
            newTheme = 'light';
          }
          set({ theme: newTheme, resolvedTheme: getResolvedTheme(newTheme) });
        },
        resolvedTheme: 'light',
      };
    },
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// Hook to apply theme to document
export const useThemeEffect = () => {
  const storedTheme = useThemeStore((state) => state.theme);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const currentResolvedTheme =
        storedTheme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : storedTheme;

      if (currentResolvedTheme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  }, [storedTheme]);
};

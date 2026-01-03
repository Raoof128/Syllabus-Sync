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

type ThemePersistedState = Pick<ThemeState, 'theme' | 'resolvedTheme'>;

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
          if (currentTheme === 'system') {
            // When in system mode, toggle to the opposite of current system preference
            newTheme = getSystemTheme() === 'dark' ? 'light' : 'dark';
          } else if (currentTheme === 'light') {
            newTheme = 'dark';
          } else {
            newTheme = 'light';
          }
          set({ theme: newTheme, resolvedTheme: getResolvedTheme(newTheme) });
        },
        resolvedTheme: typeof window !== 'undefined' ? getResolvedTheme('system') : 'light',
      };
    },
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as ThemePersistedState;
        const theme = state?.theme ?? 'system';
        return { ...state, theme, resolvedTheme: getResolvedTheme(theme) };
      },
    },
  ),
);

// Hook to apply theme to document
export const useThemeEffect = () => {
  const { theme, resolvedTheme } = useThemeStore();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;

      // Apply theme class
      if (resolvedTheme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }

      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        const computedBackground = getComputedStyle(root)
          .getPropertyValue('--mq-background')
          .trim();
        const fallback = resolvedTheme === 'dark' ? '#0f172a' : '#ffffff';
        metaThemeColor.setAttribute('content', computedBackground || fallback);
      }
    }
  }, [resolvedTheme]);

  // Listen for system theme changes when in system mode
  React.useEffect(() => {
    if (typeof window !== 'undefined' && theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = (e: MediaQueryListEvent) => {
        const newResolvedTheme = e.matches ? 'dark' : 'light';
        useThemeStore.setState({ resolvedTheme: newResolvedTheme });
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);
};

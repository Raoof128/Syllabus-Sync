// lib/store/themeStore.ts
// ============================================
// THEME STORE
// ============================================
// Manages application theme (light/dark mode), glass settings, and user preferences
// Extended in v0.14.32 to include Apple Liquid Glass configuration

import React from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

// ============================================
// GLASS MODE CONFIGURATION
// ============================================
// iOS 26-inspired glass modes for the Liquid Glass UI
export type GlassMode = 'clear' | 'tinted';

export interface GlassSettings {
  /** Glass mode: "clear" (more transparent) vs "tinted" (more opaque) */
  mode: GlassMode;
  /** Glass intensity (0-100) - controls overall effect strength */
  intensity: number;
  /** Enable SVG refraction filters */
  enableRefraction: boolean;
  /** Enable spring animations */
  enableSpringAnimations: boolean;
}

const DEFAULT_GLASS_SETTINGS: GlassSettings = {
  mode: 'clear',
  intensity: 75,
  enableRefraction: true,
  enableSpringAnimations: true,
};

// ============================================
// THEME STATE
// ============================================
export interface ThemeState {
  // Theme settings
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  resolvedTheme: 'light' | 'dark';

  // Glass settings
  glass: GlassSettings;
  setGlassMode: (mode: GlassMode) => void;
  reset: () => void;

  setGlassIntensity: (intensity: number) => void;
  setGlassRefraction: (enabled: boolean) => void;
  setGlassSpringAnimations: (enabled: boolean) => void;
  resetGlassSettings: () => void;
}

type ThemePersistedState = Pick<ThemeState, 'theme' | 'resolvedTheme' | 'glass'>;

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
        // Theme state
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

        // Glass state
        glass: DEFAULT_GLASS_SETTINGS,
        setGlassMode: (mode) => set((state) => ({ glass: { ...state.glass, mode } })),
        setGlassIntensity: (intensity) =>
          set((state) => ({
            glass: { ...state.glass, intensity: Math.max(0, Math.min(100, intensity)) },
          })),
        setGlassRefraction: (enabled) =>
          set((state) => ({ glass: { ...state.glass, enableRefraction: enabled } })),
        setGlassSpringAnimations: (enabled) =>
          set((state) => ({ glass: { ...state.glass, enableSpringAnimations: enabled } })),
        reset: () =>
          set({
            theme: 'system',
            resolvedTheme: 'light',
            glass: DEFAULT_GLASS_SETTINGS,
          }),
        resetGlassSettings: () => set({ glass: DEFAULT_GLASS_SETTINGS }),
      };
    },
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
      version: 2, // Bumped for glass settings migration
      migrate: (persistedState, version) => {
        const state = persistedState as ThemePersistedState;
        const theme = state?.theme ?? 'system';

        // Migrate from v1 (no glass settings) to v2
        if (version < 2) {
          return {
            ...state,
            theme,
            resolvedTheme: getResolvedTheme(theme),
            glass: DEFAULT_GLASS_SETTINGS,
          };
        }

        return {
          ...state,
          theme,
          resolvedTheme: getResolvedTheme(theme),
          glass: state?.glass ?? DEFAULT_GLASS_SETTINGS,
        };
      },
    },
  ),
);

// Hook to apply theme and glass settings to document
export const useThemeEffect = () => {
  const { theme, resolvedTheme, glass } = useThemeStore();

  // Apply theme class to document
  React.useEffect(() => {
    if (typeof window !== 'undefined' && document.documentElement) {
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
        const fallback = resolvedTheme === 'dark' ? '#0f172a' : '#EDEADE';
        metaThemeColor.setAttribute('content', computedBackground || fallback);
      }
    }
  }, [resolvedTheme]);

  // Apply glass settings to document
  React.useEffect(() => {
    if (typeof window !== 'undefined' && document.documentElement) {
      const root = document.documentElement;

      // Apply glass mode via data attribute (used by CSS)
      root.dataset.glassMode = glass.mode;

      // Apply glass intensity via CSS custom property
      root.style.setProperty('--glass-intensity', String(glass.intensity));

      // Apply refraction toggle
      if (glass.enableRefraction) {
        root.classList.remove('glass-no-refraction');
      } else {
        root.classList.add('glass-no-refraction');
      }

      // Apply spring animation toggle
      if (glass.enableSpringAnimations) {
        root.classList.remove('glass-no-spring');
      } else {
        root.classList.add('glass-no-spring');
      }
    }
  }, [glass]);

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

// ============================================
// GLASS SETTINGS HELPERS
// ============================================

/** Hook for accessing just glass settings */
export const useGlassSettings = () => useThemeStore((state) => state.glass);

/** Hook for glass mode only */
export const useGlassMode = () => useThemeStore((state) => state.glass.mode);

/** Hook for glass intensity only */
export const useGlassIntensity = () => useThemeStore((state) => state.glass.intensity);

/** Default glass settings export */
export { DEFAULT_GLASS_SETTINGS };

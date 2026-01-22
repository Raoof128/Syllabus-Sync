'use client';

import { useState, useSyncExternalStore } from 'react';

const useIsClient = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

import { useTranslation } from '@/lib/hooks/useTranslation';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useThemeStore } from '@/lib/store/themeStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { STORAGE_KEYS } from '@/lib/constants';
import { errorHandler } from '@/lib/utils/errorHandling';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { SessionInfo } from '@/lib/types';
import type { TranslationKey } from '@/lib/i18n/translations';

import {
  NotificationSettings,
  AppearanceSettings,
  PrivacySettings,
  SecuritySettings,
  QuickActions,
  HelpSupport,
  SettingsSkeleton,
  GamificationSettings,
  MapSettings,
} from './components';

// Helper to get device label
const getDeviceLabel = (t: (key: TranslationKey) => string) => {
  if (typeof window === 'undefined') return t('deviceUnknown');
  const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } })
    ?.userAgentData;
  const platform = uaData?.platform || navigator.platform || t('deviceThis');
  const ua = navigator.userAgent;
  const browserMatch = ua.match(/(Firefox|Edg|Chrome|Safari)/);
  const browser = browserMatch ? browserMatch[0] : t('deviceBrowser');
  return `${platform} · ${browser}`;
};

// Helper to initialize sessions from localStorage
const initializeSessions = (t: (key: TranslationKey) => string): SessionInfo[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.SESSIONS);
    const parsed = stored ? (JSON.parse(stored) as SessionInfo[]) : [];
    const currentId = 'current-device';
    const now = new Date().toISOString();
    const currentSession: SessionInfo = {
      id: currentId,
      device: getDeviceLabel(t),
      lastActive: now,
      current: true,
    };

    const existingIndex = parsed.findIndex((s) => s.id === currentId);
    const nextSessions =
      existingIndex >= 0
        ? parsed.map((s, idx) => (idx === existingIndex ? currentSession : s))
        : [...parsed, currentSession];

    window.localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(nextSessions));
    return nextSessions;
  } catch (error) {
    errorHandler.logError(error as Error, 'Sessions bootstrap', 'low');
    return [];
  }
};

function SettingsContent() {
  const isClient = useIsClient();

  // Store data
  const units = useUnitsStore((state) => state.units);
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const { theme, resolvedTheme, setTheme } = useThemeStore();
  const { t, language, setLanguage } = useTranslation();

  // Local state - initialized lazily
  const [sessions, setSessions] = useState<SessionInfo[]>(() => initializeSessions(t));

  // Show skeleton on the server / before hydration
  if (!isClient) {
    return <SettingsSkeleton t={t} />;
  }

  return (
    <div className="settings-page container mx-auto p-6 max-w-7xl" data-testid="settings-page">
      <header className="mb-8">
        <h1 className="text-mq-3xl font-bold text-mq-content mb-2">{t('settingsTitle')}</h1>
        <p className="text-mq-content-secondary">{t('settingsSubtitle')}</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Notification Settings */}
        <NotificationSettings t={t} />

        {/* Appearance Settings */}
        <AppearanceSettings
          theme={theme}
          resolvedTheme={resolvedTheme}
          setTheme={setTheme}
          language={language}
          setLanguage={setLanguage}
          t={t}
        />

        {/* Privacy & Security Settings */}
        <PrivacySettings
          t={t}
          sessions={sessions}
          setSessions={setSessions}
          units={units}
          deadlines={deadlines}
          theme={theme}
          language={language}
        />

        {/* Security Settings (Biometric Auth) */}
        <SecuritySettings t={t} />

        {/* Quick Actions */}
        <QuickActions t={t} />

        {/* Gamification Settings */}
        <GamificationSettings t={t} />

        {/* Map Navigation Settings */}
        <MapSettings t={t} />
      </div>

      {/* Help & Support Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <HelpSupport t={t} />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ErrorBoundary>
      <SettingsContent />
    </ErrorBoundary>
  );
}

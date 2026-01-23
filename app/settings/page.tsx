'use client';

import { useSyncExternalStore } from 'react';

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
import ErrorBoundary from '@/components/ErrorBoundary';

import {
  NotificationSettings,
  AccountSettings,
  AppearanceSettings,
  PrivacySettings,
  SecuritySettings,
  QuickActions,
  HelpSupport,
  SettingsSkeleton,
  GamificationSettings,
  MapSettings,
} from './components';

function SettingsContent() {
  const isClient = useIsClient();

  // Store data
  const units = useUnitsStore((state) => state.units);
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const { theme, resolvedTheme, setTheme } = useThemeStore();
  const { t, language, setLanguage } = useTranslation();

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

        {/* Account Settings */}
        <AccountSettings t={t} />

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

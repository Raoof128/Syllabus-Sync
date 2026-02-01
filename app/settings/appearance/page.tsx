'use client';

import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { useThemeStore } from '@/lib/store/themeStore';
import { AppearanceSettings } from '../components';

export default function AppearanceSettingsPage() {
  const { t, language, setLanguage } = useTypedTranslation();
  const { theme, resolvedTheme, setTheme } = useThemeStore();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-mq-lg rounded-xl">
          <AppearanceSettings
            theme={theme}
            resolvedTheme={resolvedTheme}
            setTheme={setTheme}
            language={language}
            setLanguage={setLanguage}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}

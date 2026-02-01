'use client';

import { useTranslation } from '@/lib/hooks/useTranslation';
import { useThemeStore } from '@/lib/store/themeStore';
import { PrivacySettings, SecuritySettings } from '../components';

export default function SecuritySettingsPage() {
  const { t, language } = useTranslation();
  const { theme } = useThemeStore();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-mq-lg rounded-xl">
          <PrivacySettings
            t={t}
            language={language}
          />
        </div>
        <div className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-mq-lg rounded-xl">
          <SecuritySettings t={t} />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useTranslation } from '@/lib/hooks/useTranslation';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useThemeStore } from '@/lib/store/themeStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { PrivacySettings, SecuritySettings } from '../components';

export default function SecuritySettingsPage() {
  const { t, language } = useTranslation();
  const { theme } = useThemeStore();
  const units = useUnitsStore((state) => state.units);
  const deadlines = useDeadlinesStore((state) => state.deadlines);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-mq-lg rounded-xl">
          <PrivacySettings
            t={t}
            units={units}
            deadlines={deadlines}
            theme={theme}
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

'use client';

import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { GamificationSettings, MapSettings, QuickActions } from '@/features/settings/components';

export default function ExperienceSettingsPage() {
  const { t } = useTypedTranslation();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-mq-lg rounded-xl">
          <GamificationSettings t={t} />
        </div>
        <div className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-mq-lg rounded-xl">
          <MapSettings t={t} />
        </div>
        <div className="md:col-span-2 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-mq-lg rounded-xl">
          <QuickActions t={t} />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { MapSettings, NotificationSettings } from '@/features/settings/components';

export default function GeneralSettingsPage() {
  const { t } = useTypedTranslation();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-mq-lg rounded-xl">
          <NotificationSettings t={t} />
        </div>
        <div className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-mq-lg rounded-xl">
          <MapSettings t={t} />
        </div>
      </div>
    </div>
  );
}

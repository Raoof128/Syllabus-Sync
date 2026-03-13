'use client';

import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { MapSettings, NotificationSettings } from '@/features/settings/components';

export function GeneralSettingsContent() {
  const { t } = useTypedTranslation();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="w-full transform transition-all duration-300 hover:-translate-y-1 hover:shadow-mq-lg rounded-xl">
          <NotificationSettings t={t} />
        </div>
        <div className="w-full transform transition-all duration-300 hover:-translate-y-1 hover:shadow-mq-lg rounded-xl">
          <MapSettings t={t} />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { NotificationSettings } from '../components';

export default function GeneralSettingsPage() {
  const { t } = useTypedTranslation();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-mq-lg rounded-xl">
          <NotificationSettings t={t} />
        </div>
      </div>
    </div>
  );
}

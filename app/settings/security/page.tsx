'use client';

import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { PrivacySettings } from '@/features/settings/components';

export default function SecuritySettingsPage() {
  const { t, language } = useTypedTranslation();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-mq-lg rounded-xl">
        <PrivacySettings t={t} language={language} />
      </div>
    </div>
  );
}

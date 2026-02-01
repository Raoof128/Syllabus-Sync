'use client';

import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { HelpSupport } from '../components';

export default function SupportSettingsPage() {
  const { t } = useTypedTranslation();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-mq-lg rounded-xl">
          <HelpSupport t={t} />
        </div>
      </div>
    </div>
  );
}

// components/home/QuickActions.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/mq/button';
import { Map, Calendar } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function QuickActions() {
  const { t } = useTranslation();
  return (
    <div className="flex gap-4">
      <Button asChild size="lg">
        <Link href="/map" className="gap-2">
          <Map className="h-5 w-5" />
          {t('openMap')}
        </Link>
      </Button>

      <Button asChild variant="secondary" size="lg">
        <Link href="/calendar" className="gap-2">
          <Calendar className="h-5 w-5" />
          {t('viewCalendar')}
        </Link>
      </Button>
    </div>
  );
}

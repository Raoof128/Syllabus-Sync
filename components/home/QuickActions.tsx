// components/home/QuickActions.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/mq/button';
import { Map, Calendar } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function QuickActions() {
  const { t } = useTranslation();
  return (
    <div className="mq-magic-card mq-liquid-enhanced h-auto">
      <div className="mq-magic-card-content p-4 items-center justify-center">
        <div className="flex flex-col gap-3 w-full">
          <Button
            asChild
            variant="glass"
            size="lg"
            className="rounded-full justify-start px-5 py-3"
          >
            <Link href="/map" className="gap-2">
              <Map className="h-5 w-5" />
              {t('openMap')}
            </Link>
          </Button>

          <Button
            asChild
            variant="glass"
            size="lg"
            className="rounded-full justify-start px-5 py-3"
          >
            <Link href="/calendar" className="gap-2">
              <Calendar className="h-5 w-5" />
              {t('viewCalendar')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

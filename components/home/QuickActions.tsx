// components/home/QuickActions.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/mq/button';
import { Map, Calendar } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function QuickActions() {
  const { t } = useTranslation();
  return (
    <div className="mq-magic-card h-auto">
      <div className="mq-magic-card-content p-4 items-center justify-center bg-mq-card-background">
        <div className="flex flex-col gap-3 w-full">
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="border border-mq-border rounded-full bg-mq-card-background hover:bg-mq-hover-background text-mq-content justify-start px-5 py-3"
          >
            <Link href="/map" className="gap-2">
              <Map className="h-5 w-5" />
              {t('openMap')}
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="lg"
            className="border border-mq-border rounded-full bg-mq-card-background hover:bg-mq-hover-background text-mq-content justify-start px-5 py-3"
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

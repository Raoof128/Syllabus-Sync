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
        <div className="flex gap-4 w-full justify-center">
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="border border-mq-border bg-transparent hover:bg-mq-hover-background text-mq-content"
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
            className="border border-mq-border bg-transparent hover:bg-mq-hover-background text-mq-content"
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

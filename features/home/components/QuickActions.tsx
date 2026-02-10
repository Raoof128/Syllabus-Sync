// components/home/QuickActions.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/mq/button';
import { Map, Calendar } from 'lucide-react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { CardSolid } from '@/features/home/components/HomeCard';

export default function QuickActions() {
  const { t } = useTypedTranslation();
  return (
    <CardSolid className="h-auto p-4 items-center justify-center">
      <div className="flex flex-col gap-3 w-full">
        <Button
          asChild
          variant="secondary"
          size="lg"
          className="rounded-full justify-start px-5 py-3 border border-transparent hover:border-mq-primary/20 hover:shadow-sm transition-all duration-300"
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
          className="rounded-full justify-start px-5 py-3 border border-transparent hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300"
        >
          <Link href="/calendar" className="gap-2">
            <Calendar className="h-5 w-5" />
            {t('viewCalendar')}
          </Link>
        </Button>
      </div>
    </CardSolid>
  );
}

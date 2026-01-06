'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TranslationKey } from '@/lib/i18n/translations';

type QuickActionsProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const quickActionLinks: { href: string; labelKey: TranslationKey }[] = [
  { href: '/home', labelKey: 'homeDashboard' },
  { href: '/calendar', labelKey: 'calendarView' },
  { href: '/feed', labelKey: 'eventsFeed' },
  { href: '/map', labelKey: 'campusMap' },
  { href: '/manage-profiles', labelKey: 'manageProfiles' },
];

const QuickActions = memo(({ t }: QuickActionsProps) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="mq-magic-card">
        <Card className="mq-magic-card-content">
          <CardHeader>
            <CardTitle>{t('quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActionLinks.map(({ href, labelKey }) => (
              <Button
                key={href}
                variant="ghost"
                className="w-full justify-start rounded-mq-lg bg-mq-card-background hover:bg-mq-hover-background text-mq-content border border-mq-border"
                asChild
              >
                <Link href={href}>{t(labelKey)}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

QuickActions.displayName = 'QuickActions';

export default QuickActions;

'use client';

import Link from 'next/link';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { cn } from '@/lib/utils';

interface AppFooterProps {
  className?: string;
}

export default function AppFooter({ className }: AppFooterProps) {
  const { t } = useTypedTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      aria-label={t('footer')}
      className={cn('w-full border-t border-mq-border/70 bg-mq-background', className)}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-1 px-4 py-4 text-center sm:py-5">
        <p className="text-xs text-mq-content-secondary sm:text-sm">
          {t('copyright', { year: currentYear })}
        </p>
        <div className="flex items-center gap-2 text-xs text-mq-content-secondary sm:text-sm">
          <Link href="/about" className="transition-colors hover:text-mq-primary hover:underline">
            {t('settings_about')}
          </Link>
          <span aria-hidden="true" className="text-mq-border">
            ·
          </span>
          <Link href="/terms" className="transition-colors hover:text-mq-primary hover:underline">
            {t('termsFooter')}
          </Link>
          <span aria-hidden="true" className="text-mq-border">
            ·
          </span>
          <Link
            href="/privacy"
            className="transition-colors hover:text-mq-primary hover:underline"
          >
            {t('privacyFooter')}
          </Link>
        </div>
      </div>
    </footer>
  );
}

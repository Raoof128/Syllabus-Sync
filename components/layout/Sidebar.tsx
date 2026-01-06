// components/layout/Sidebar.tsx
'use client';

import { useState, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { Home, MapPin, Calendar, MessageSquare, Settings, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import SocialButtons from './SocialButtons';
import styles from './animated-sidebar.module.css';

import { TranslationKey } from '@/lib/i18n/translations';

const navigation: {
  name: TranslationKey;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { name: 'home', href: '/home', icon: Home },
  { name: 'calendar', href: '/calendar', icon: Calendar },
  { name: 'map', href: '/map', icon: MapPin },
  { name: 'feed', href: '/feed', icon: MessageSquare },
  { name: 'settings', href: '/settings', icon: Settings },
];

const Sidebar = memo(() => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-mq-background rounded-mq-lg shadow-mq-lg border border-mq-border hover:shadow-mq-xl hover:bg-mq-red hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-mq-mid ease-mq-ease touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center btn-premium"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? t('closeMenu') : t('openMenu')}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-mq-content/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'relative group/sidebar md:block md:fixed md:left-0 md:top-0 md:h-full md:w-12 sidebar-shell',
          styles.sidebarShell,
        )}
      >
        <button
          type="button"
          aria-label={t('openMenu')}
          className={cn(
            'hidden md:flex absolute left-0 top-0 h-full w-12 items-center justify-center border-r border-mq-border bg-mq-card-background text-mq-content-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background z-50',
            styles.trigger,
          )}
        >
          <span className={cn('flex flex-col items-center gap-3', styles.bars)}>
            <span className={cn('h-6 w-1 rounded-full bg-mq-content', styles.barTop)} />
            <span className={cn('h-6 w-1 rounded-full bg-mq-content', styles.barMid)} />
            <span className={cn('h-6 w-1 rounded-full bg-mq-content', styles.barBottom)} />
          </span>
          <span className="sr-only">{t('openMenu')}</span>
        </button>

        <div
          className={cn(
            'fixed md:relative z-40 w-56 bg-mq-card-background border-r border-mq-border min-h-screen p-4 md:pl-12 flex flex-col',
            // Desktop: use CSS module for hover-based animation
            'md:transition-none',
            styles.panel,
            // Mobile: use dedicated mobile animation classes
            'max-md:transition-transform max-md:duration-300 max-md:ease-[cubic-bezier(0.22,1,0.36,1)]',
            mobileMenuOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
            // Reduced motion
            'motion-reduce:transition-none motion-reduce:transform-none',
          )}
        >
          {/* Logo and branding */}
          <div className="mb-8">
            <Link href="/home" className="flex items-center gap-2">
              <Image
                src="/MQ_Logo_Final.png"
                alt={t('mqLogoAlt')}
                width={128}
                height={128}
                style={{ objectFit: 'contain', borderRadius: '8px' }}
              />
            </Link>
          </div>

          <nav className="space-y-2" role="navigation" aria-label={t('mainNavigation')}>
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || (pathname === '/' && item.href === '/home');
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'group flex items-center gap-3 px-3 py-3 rounded-mq text-mq-sm font-medium touch-manipulation min-h-[44px] btn-premium',
                    styles.menuItem,
                    isActive
                      ? 'bg-mq-primary text-white shadow-mq-sm'
                      : 'text-mq-content-secondary hover:text-white hover:bg-mq-red hover:shadow-mq active:scale-[0.98] transition-colors duration-200',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={t('navigateToItem', { name: t(item.name) })}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-transform duration-300 group-hover:scale-110 ease-mq-snap',
                      isActive && 'animate-pulse-subtle',
                    )}
                    aria-hidden="true"
                  />
                  {t(item.name)}
                </Link>
              );
            })}
          </nav>

          {/* Social buttons at bottom */}
          <div className="mt-auto pt-6 border-t border-mq-border">
            <SocialButtons />
          </div>
        </div>
      </div>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;

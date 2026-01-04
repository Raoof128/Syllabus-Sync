// components/layout/Sidebar.tsx
'use client';

import { useState, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/hooks/useTranslation';
import {
  Home,
  MapPin,
  Calendar,
  MessageSquare,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SocialButtons from './SocialButtons';

import { TranslationKey } from '@/lib/i18n/translations';

const navigation: { name: TranslationKey; href: string; icon: React.ComponentType<{ className?: string }> }[] = [
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
          'fixed md:relative z-40 w-48 bg-mq-card-background border-r border-mq-border min-h-screen p-4 transition-transform duration-mq-fast flex flex-col',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
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
            const isActive = pathname === item.href || (pathname === '/' && item.href === '/home');
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'group flex items-center gap-3 px-3 py-3 rounded-mq text-mq-sm font-medium transition-all duration-mq-mid ease-mq-ease touch-manipulation min-h-[44px] btn-premium',
                  isActive
                    ? 'bg-mq-primary text-white shadow-mq-sm'
                    : 'text-mq-content-secondary hover:text-white hover:bg-mq-red hover:-translate-y-0.5 hover:shadow-mq hover:translate-x-1 active:scale-[0.98]',
                )}
                aria-current={isActive ? 'page' : undefined}
                aria-label={t('navigateToItem', { name: t(item.name) })}
              >
                <Icon className={cn("h-4 w-4 transition-transform duration-300 group-hover:scale-110 ease-mq-snap", isActive && "animate-pulse-subtle")} aria-hidden="true" />
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
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;

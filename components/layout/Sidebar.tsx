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

const navigation = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Map', href: '/map', icon: MapPin },
  { name: 'Feed', href: '/feed', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar = memo(() => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-mq-background rounded-mq-lg shadow-mq-lg border border-mq-border hover:shadow-mq-xl active:scale-95 transition-all duration-mq-fast touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
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
          'fixed md:relative z-40 w-48 bg-mq-card-background border-r border-mq-border min-h-screen p-4 transition-transform duration-mq-fast',
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
                  'flex items-center gap-3 px-3 py-3 rounded-mq text-mq-sm font-medium transition-all duration-mq-fast ease-mq-snap touch-manipulation min-h-[44px]',
                  isActive
                    ? 'bg-mq-primary text-white shadow-mq-sm'
                    : 'text-mq-content-secondary hover:text-mq-content hover:bg-mq-background-secondary',
                )}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Navigate to ${item.name}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;

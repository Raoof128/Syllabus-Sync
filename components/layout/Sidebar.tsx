// components/layout/Sidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  MapPin,
  Calendar,
  MessageSquare,
  Settings,
  Menu,
  X,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_CONFIG, BRAND_COLORS } from '@/lib/config';

const navigation = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Map', href: '/map', icon: MapPin },
  { name: 'Feed', href: '/feed', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl active:scale-95 transition-all duration-200 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed md:relative z-40 w-48 bg-gray-50 border-r border-gray-200 min-h-screen p-4 transition-transform duration-200',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Logo and branding */}
        <div className="mb-8">
          <Link href="/home" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: BRAND_COLORS.primary }}
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">{APP_CONFIG.name}</span>
          </Link>
        </div>

        <nav className="space-y-2" role="navigation" aria-label="Main navigation">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (pathname === '/' && item.href === '/home');
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation min-h-[44px] border',
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 shadow-sm'
                    : 'text-gray-700 dark:text-slate-300 border-transparent hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100 hover:border-gray-200 dark:hover:border-slate-700',
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
}

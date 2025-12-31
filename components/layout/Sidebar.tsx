// components/layout/Sidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, Calendar, MessageSquare, Settings, Menu, X, GraduationCap } from 'lucide-react';
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
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed md:relative z-40 w-48 bg-gray-50 border-r border-gray-200 min-h-screen p-4 transition-transform duration-200',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
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

          <nav className="space-y-1" role="navigation" aria-label="Main navigation">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (pathname === '/' && item.href === '/home');
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:bg-white hover:text-gray-900',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`Navigate to ${item.name}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
      </div>
    </>
  );
}

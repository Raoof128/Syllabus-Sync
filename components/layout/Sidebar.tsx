// components/layout/Sidebar.tsx
'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
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

// Static class names for SSR - no CSS modules to avoid hydration mismatch
const BASE_CLASSES = {
  aside:
    'relative group/sidebar md:block md:fixed md:left-0 md:top-0 md:h-screen md:w-12 sidebar-shell',
  trigger:
    'hidden md:flex absolute left-0 top-0 h-full w-12 items-center justify-center border-r border-mq-border bg-mq-card-background text-mq-content-secondary z-50 cursor-pointer select-none',
  bars: 'flex flex-col items-center gap-2',
  bar: 'h-5 w-0.5 rounded-full bg-mq-content',
  panel:
    'fixed md:relative z-40 w-56 bg-mq-card-background border-r border-mq-border h-screen p-4 md:pl-12 flex flex-col md:transition-none motion-reduce:transition-none motion-reduce:transform-none',
  logo: 'mb-8',
  menuItem:
    'group flex items-center gap-3 px-3 py-3 rounded-mq text-mq-sm font-medium touch-manipulation min-h-[44px] btn-premium',
  social: 'mt-auto pt-6 border-t border-mq-border',
};

const Sidebar = memo(() => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLAnchorElement>(null);

  // Track mounted state to avoid hydration mismatch with CSS modules
  // This is an intentional pattern for hydration safety
  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  // Focus trap for mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    // Get all focusable elements within the sidebar
    const getFocusableElements = () => {
      return sidebar.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
    };

    // Focus the first nav link when menu opens
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      // Focus trap on Tab
      if (e.key === 'Tab') {
        const focusable = getFocusableElements();
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Close menu when clicking outside
  const handleOverlayClick = useCallback(() => {
    setMobileMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  // Get mobile panel classes - only apply CSS module classes when mounted
  const getMobilePanelClasses = () => {
    if (!mounted) {
      // SSR/initial render: use Tailwind for hidden state
      return '-translate-x-full md:translate-x-0';
    }
    // Client after mount: use CSS module classes
    return cn(
      styles.panel,
      styles.panelMobile,
      mobileMenuOpen ? styles.panelMobileOpen : styles.panelMobileClosed,
    );
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        ref={menuButtonRef}
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-mq-background rounded-mq-lg shadow-mq-lg border border-mq-border hover:shadow-mq-xl hover:bg-mq-red hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-mq-mid ease-mq-ease touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center btn-premium"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? t('closeMenu') : t('openMenu')}
        aria-expanded={mobileMenuOpen}
        aria-controls="mobile-sidebar"
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-mq-content/60 z-40 backdrop-blur-sm"
          onClick={handleOverlayClick}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(BASE_CLASSES.aside, mounted && styles.sidebarShell)}
        onMouseLeave={() => {
          // Blur any focused element to prevent sidebar staying open
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }}
        suppressHydrationWarning
      >
        {/* Trigger area with hamburger bars */}
        <div
          aria-hidden="true"
          className={cn(BASE_CLASSES.trigger, mounted && styles.trigger)}
          suppressHydrationWarning
        >
          {/* Hamburger bars container */}
          <span className={cn(BASE_CLASSES.bars, mounted && styles.bars)} suppressHydrationWarning>
            <span
              className={cn(BASE_CLASSES.bar, mounted && styles.barTop)}
              suppressHydrationWarning
            />
            <span
              className={cn(BASE_CLASSES.bar, mounted && styles.barMid)}
              suppressHydrationWarning
            />
            <span
              className={cn(BASE_CLASSES.bar, mounted && styles.barBottom)}
              suppressHydrationWarning
            />
          </span>
        </div>

        {/* Sliding panel */}
        <div
          ref={sidebarRef}
          id="mobile-sidebar"
          role="dialog"
          aria-modal={mobileMenuOpen ? 'true' : undefined}
          aria-label={t('mainNavigation')}
          className={cn(BASE_CLASSES.panel, getMobilePanelClasses())}
          suppressHydrationWarning
        >
          {/* Logo and branding - animated */}
          <div className={cn(BASE_CLASSES.logo, mounted && styles.logo)} suppressHydrationWarning>
            <Link
              href="/home"
              className="flex items-center gap-2"
              ref={firstFocusableRef}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Image
                src="/MQ_Logo_Final.png"
                alt={t('mqLogoAlt')}
                width={128}
                height={128}
                priority
                style={{ objectFit: 'contain', borderRadius: '8px' }}
              />
            </Link>
          </div>

          {/* Navigation with staggered menu items */}
          <nav
            className="space-y-2"
            role="navigation"
            aria-label={t('mainNavigation')}
            suppressHydrationWarning
          >
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
                    BASE_CLASSES.menuItem,
                    mounted && styles.menuItem,
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

          {/* Social buttons at bottom - animated */}
          <div
            className={cn(BASE_CLASSES.social, mounted && styles.socialSection)}
            suppressHydrationWarning
          >
            <SocialButtons />
          </div>
        </div>
      </aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;

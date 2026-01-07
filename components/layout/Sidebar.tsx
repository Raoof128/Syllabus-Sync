// components/layout/Sidebar.tsx
// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================
// Premium expandable sidebar with hover-triggered animations on desktop
// and slide-out drawer on mobile.
//
// FEATURES:
// - Desktop: Hover to expand, animated hamburger bars, staggered menu items
// - Mobile: Hamburger button toggles slide-out drawer with overlay
// - Accessibility: Focus trap, keyboard navigation, ARIA attributes
// - Performance: Memoized component, CSS-based animations (no JS animation libs)
//
// CSS CLASSES (defined in globals.css):
// - .sidebar-shell      → Main container, detects :hover
// - .sidebar-trigger    → Always-visible 48px strip with hamburger
// - .sidebar-panel      → Sliding content panel
// - .sidebar-bar-*      → Animated hamburger bars
// - .sidebar-menu-item  → Navigation links with staggered animation
// - .sidebar-logo       → Logo with bounce-in animation
// - .sidebar-social     → Social buttons at bottom
// ============================================================================
'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { Home, MapPin, Calendar, MessageSquare, Settings, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import SocialButtons from './SocialButtons';

import { TranslationKey } from '@/lib/i18n/translations';

// Navigation items configuration
// Each item maps to a route and displays with an icon
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

/**
 * Sidebar Component
 *
 * A responsive sidebar navigation that:
 * - On desktop (md+): Shows a collapsed trigger strip that expands on hover
 * - On mobile: Shows a hamburger button that opens a full slide-out drawer
 *
 * The component is memoized to prevent unnecessary re-renders since it
 * only depends on pathname and translation state.
 */
const Sidebar = memo(() => {
  const { t } = useTranslation();
  const pathname = usePathname();

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Refs for focus management
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLAnchorElement>(null);

  // ============================================================================
  // FOCUS TRAP FOR MOBILE MENU
  // ============================================================================
  // When mobile menu opens, trap focus within the sidebar for accessibility.
  // Pressing Escape closes the menu, Tab cycles through focusable elements.
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
      // Close on Escape key
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus(); // Return focus to trigger button
        return;
      }

      // Focus trap on Tab key
      if (e.key === 'Tab') {
        const focusable = getFocusableElements();
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        // Shift+Tab on first element → go to last
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
        // Tab on last element → go to first
        else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Close menu when clicking the overlay backdrop
  const handleOverlayClick = useCallback(() => {
    setMobileMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  return (
    <>
      {/* ========================================================================
          MOBILE MENU BUTTON
          ========================================================================
          Fixed hamburger/X button in top-left corner on mobile devices.
          Toggles the slide-out drawer open/closed.
          ======================================================================== */}
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

      {/* ========================================================================
          MOBILE OVERLAY BACKDROP
          ========================================================================
          Semi-transparent backdrop that appears behind the sidebar on mobile.
          Clicking it closes the menu.
          ======================================================================== */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-mq-content/60 z-40 backdrop-blur-sm"
          onClick={handleOverlayClick}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* ========================================================================
          SIDEBAR CONTAINER
          ========================================================================
          The main sidebar wrapper. On desktop, hovering this container triggers
          all child animations via CSS :hover selectors in globals.css.
          ======================================================================== */}
      <aside
        className="relative group/sidebar md:block md:fixed md:left-0 md:top-0 md:h-screen md:w-12 sidebar-shell"
        onMouseLeave={() => {
          // Blur any focused element to prevent sidebar staying open via :focus-within
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }}
      >
        {/* ----------------------------------------------------------------------
            DESKTOP TRIGGER STRIP
            ----------------------------------------------------------------------
            Always-visible 48px strip on the left edge with animated hamburger bars.
            Hovering this area triggers the sidebar to expand.
            ---------------------------------------------------------------------- */}
        <div
          aria-hidden="true"
          className="hidden md:flex absolute left-0 top-0 h-full w-12 items-center justify-center border-r border-mq-border bg-mq-card-background text-mq-content-secondary z-50 cursor-pointer select-none sidebar-trigger"
        >
          {/* Hamburger bars - animate on hover (expand outward) */}
          <span className="flex flex-col items-center gap-2 sidebar-bars">
            <span className="h-5 w-0.5 rounded-full bg-mq-content sidebar-bar-top" />
            <span className="h-5 w-0.5 rounded-full bg-mq-content sidebar-bar-mid" />
            <span className="h-5 w-0.5 rounded-full bg-mq-content sidebar-bar-bottom" />
          </span>
        </div>

        {/* ----------------------------------------------------------------------
            SLIDING PANEL
            ----------------------------------------------------------------------
            The main sidebar content that slides in from the left on hover (desktop)
            or when mobileMenuOpen is true (mobile).
            ---------------------------------------------------------------------- */}
        <div
          ref={sidebarRef}
          id="mobile-sidebar"
          role="dialog"
          aria-modal={mobileMenuOpen ? 'true' : undefined}
          aria-label={t('mainNavigation')}
          className={cn(
            'fixed md:relative z-40 w-56 bg-mq-card-background border-r border-mq-border h-screen p-4 md:pl-12 flex flex-col md:transition-none motion-reduce:transition-none motion-reduce:transform-none sidebar-panel',
            mobileMenuOpen && 'sidebar-panel-open',
          )}
        >
          {/* Logo - bounces in with slight overshoot */}
          <div className="mb-8 sidebar-logo">
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

          {/* Navigation Links - staggered slide-in animation */}
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
                    'group flex items-center gap-3 px-3 py-3 rounded-mq text-mq-sm font-medium touch-manipulation min-h-[44px] btn-premium sidebar-menu-item',
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

          {/* Social Buttons - fades in last after menu items */}
          <div className="mt-auto pt-6 border-t border-mq-border sidebar-social">
            <SocialButtons />
          </div>
        </div>
      </aside>
    </>
  );
});

// Display name for React DevTools
Sidebar.displayName = 'Sidebar';

export default Sidebar;

// components/layout/Header.tsx
// ============================================================================
// HEADER COMPONENT - APPLE LIQUID GLASS EDITION
// ============================================================================
// Premium top bar with "Apple Liquid Glass" effect featuring:
// - Optical refraction via feTurbulence + feDisplacementMap filters
// - 25px backdrop-filter blur with saturation boost
// - Specular highlights via inset box-shadow
// - LiveClock (date display) and NotificationSystem
//
// The header acts as a floating glass panel over the content, creating
// visible distortion of the parallax mesh background beneath it.
//
// COMPONENTS:
// - Logo and app title (left)
// - Live date display (center-left)
// - Notifications bell with badge
// - Theme toggle (sun/moon)
// - Profile dropdown menu
//
// ACCESSIBILITY:
// - All interactive elements have min 44px touch targets
// - Focus visible states for keyboard navigation
// - ARIA labels and roles for screen readers
// - Respects prefers-reduced-motion
// ============================================================================
'use client';

import React, { useEffect, useState, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/hooks/useTranslation';
import {
  Bell,
  Settings,
  User,
  Clock,
  Calendar,
  BookOpen,
  Info,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { APP_CONFIG, BRAND_COLORS, UNIVERSITY_CONFIG } from '@/lib/config';
import { useNotificationsStore } from '@/lib/store/notificationsStore';
import { useThemeStore } from '@/lib/store/themeStore';
import { useProfilesStore } from '@/lib/store/profilesStore';
import { apiRequest } from '@/lib/utils/api';
import { formatDistanceToNow } from 'date-fns';
import { getLocaleString } from '@/lib/utils/locale';
import { clearAllClientStorage } from '@/lib/utils/clientStorage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const notificationIcons = {
  deadline: Clock,
  event: Calendar,
  class: BookOpen,
  system: Info,
};

const Header = memo(() => {
  const { t, language } = useTranslation();
  const router = useRouter();

  const [user, setUser] = useState<{
    email?: string;
    user_metadata?: { full_name?: string; name?: string };
  } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(true);

  const notifications = useNotificationsStore((state) => state.notifications);
  const loadNotifications = useNotificationsStore((state) => state.loadNotifications);
  const markAsRead = useNotificationsStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead);
  const getUnreadCount = useNotificationsStore((state) => state.getUnreadCount);
  const unreadNotifications = notifications.filter((n) => !n.read);

  const [hasSeeded, setHasSeeded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Load notifications on mount
  useEffect(() => {
    if (isClient) {
      loadNotifications();
    }
  }, [isClient, loadNotifications]);

  // Load user authentication state
  useEffect(() => {
    let isActive = true;

    const getUser = async () => {
      try {
        const data = await apiRequest<{
          user?: { email?: string; user_metadata?: { full_name?: string; name?: string } };
        }>('/api/auth/user', { noRetry: true });
        if (!isActive) return;
        setUser(data?.user ?? null);
      } catch {
        if (!isActive) return;
        setUser(null);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void getUser();

    const handleFocus = () => {
      void getUser();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      isActive = false;
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Handle notifications seeding (only if authenticated)
  useEffect(() => {
    if (!user || hasSeeded) return;

    const notificationsSeededKey = 'notifications-seeded';

    try {
      const notificationsSeeded = localStorage.getItem(notificationsSeededKey) === 'true';

      if (!notificationsSeeded) {
        // Note: For now, we'll rely on API data
        // In future, we might seed some demo notifications
        localStorage.setItem(notificationsSeededKey, 'true');
      }
    } catch {
      // Ignore localStorage errors
    }
    setHasSeeded(true);
  }, [user, hasSeeded]);

  // Theme and profile stores
  const { toggleTheme, resolvedTheme } = useThemeStore();
  const { getCurrentProfile } = useProfilesStore();
  const currentProfile = isClient ? getCurrentProfile() : null;

  // Hydration mismatch fix
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only calculate unread count on client to avoid hydration mismatch
  const unreadCount = isClient ? getUnreadCount() : 0;

  // Get display name: prioritize profile name, then Supabase user metadata full_name/name, then extract from email
  // Extract a proper name from the email prefix (capitalize first letter)
  // Only calculate on client to avoid hydration mismatch
  const displayName = isClient
    ? (() => {
        if (currentProfile?.name) return currentProfile.name;
        if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
        if (user?.user_metadata?.name) return user.user_metadata.name;
        // Extract name from email prefix and capitalize it
        if (user?.email) {
          const emailPrefix = user.email.split('@')[0];
          // Remove numbers from the end of the email prefix (e.g., "pouyaalavi1378" -> "pouyaalavi")
          const nameWithoutNumbers = emailPrefix.replace(/\d+$/, '');
          // Capitalize first letter
          if (nameWithoutNumbers.length > 0) {
            return (
              nameWithoutNumbers.charAt(0).toUpperCase() + nameWithoutNumbers.slice(1).toLowerCase()
            );
          }
        }
        return null;
      })()
    : null;

  return (
    <header className="h-16 mq-liquid-glass border-b border-[var(--liquid-glass-border)] flex items-center justify-between px-4 sm:px-6 relative z-10">
      {/* Left side - Logo and title (far left) */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <Image
            src="/MQ_Logo_Final.png"
            alt={t('mqLogoAlt')}
            width={80}
            height={80}
            priority
            className="h-[72px] w-auto sm:h-20"
            style={{ width: 'auto' }}
          />
          <div className="hidden sm:block">
            <span className="text-mq-lg font-semibold text-mq-content block">
              {APP_CONFIG.name}
            </span>
            <span className="text-mq-xs text-mq-content-secondary block">
              {UNIVERSITY_CONFIG.shortName}
            </span>
          </div>
        </Link>

        {/* Date display - next to logo/title */}
        {isClient && (
          <div className="hidden md:flex items-center ml-4 pl-4 border-l border-mq-border">
            <span className="text-mq-sm font-medium text-mq-content-secondary">
              {new Date().toLocaleDateString(getLocaleString(language), {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Right side - Actions (far right) */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Notifications - wrapped in isClient to prevent hydration mismatch with Radix UI IDs */}
        {isClient && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`group p-2 rounded-mq transition-all duration-mq-mid ease-mq-ease relative hover:bg-mq-red hover:text-white hover:-translate-y-0.5 hover:shadow-mq active:scale-[0.98] min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background btn-premium ${unreadCount > 0 ? 'animate-pulse-subtle' : ''}`}
                aria-label={`${t('notifications')}${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                aria-haspopup="menu"
                title={unreadCount > 0 ? t('notificationsBellHint') : t('notifications')}
              >
                <Bell
                  className={`w-5 h-5 text-mq-content-secondary transition-transform duration-300 group-hover:scale-110 group-active:scale-95 ${unreadCount > 0 ? 'animate-wiggle' : ''}`}
                  aria-hidden="true"
                />
                {unreadCount > 0 && (
                  <span
                    className="absolute top-1 right-1 w-4 h-4 bg-mq-error rounded-full text-[10px] text-white flex items-center justify-center font-medium animate-bounce-subtle"
                    aria-hidden="true"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 max-w-[calc(100vw-2rem)] bg-mq-card-background rounded-mq-lg border border-mq-border shadow-lg z-50 max-h-96 overflow-hidden"
              role="menu"
              aria-label={t('notifications')}
            >
              <div className="p-3 border-b border-mq-border flex items-center justify-between">
                <h3 className="font-semibold text-mq-content">{t('notifications')}</h3>
                {unreadCount > 0 && (
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      markAllAsRead();
                    }}
                    className="text-xs text-mq-info hover:text-mq-info/80 focus:text-mq-info focus:bg-transparent"
                  >
                    {t('markAllRead')}
                  </DropdownMenuItem>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-mq-content-tertiary text-sm font-medium">
                      {t('noNotificationsYet')}
                    </p>
                    <p className="text-mq-content-tertiary/70 text-xs mt-1">
                      {t('noNotificationsYetDesc')}
                    </p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notification) => {
                    const Icon = notificationIcons[notification.type];
                    return (
                      <DropdownMenuItem
                        key={notification.id}
                        asChild
                        onSelect={() => {
                          if (!notification.read) {
                            markAsRead(notification.id);
                          }
                        }}
                        className={`p-0 border-b border-mq-border last:border-0 ${
                          !notification.read ? 'bg-mq-info/10' : ''
                        }`}
                      >
                        <Link
                          href={notification.link || '#'}
                          className="block w-full p-3 hover:bg-mq-background-secondary focus-visible:outline-none"
                        >
                          <div className="flex gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                notification.type === 'deadline'
                                  ? 'bg-mq-warning/20'
                                  : notification.type === 'event'
                                    ? 'bg-mq-purple/20'
                                    : notification.type === 'class'
                                      ? 'bg-mq-info/20'
                                      : 'bg-mq-background-secondary'
                              }`}
                              aria-hidden="true"
                            >
                              <Icon
                                className={`w-4 h-4 ${
                                  notification.type === 'deadline'
                                    ? 'text-mq-warning'
                                    : notification.type === 'event'
                                      ? 'text-mq-purple'
                                      : notification.type === 'class'
                                        ? 'text-mq-info'
                                        : 'text-mq-content-secondary'
                                }`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-mq-content truncate`}
                              >
                                {notification.title}
                              </p>
                              <p className="text-xs text-mq-content-secondary line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-mq-content-tertiary mt-1">
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                            {!notification.read && (
                              <div
                                className="w-2 h-2 bg-mq-info rounded-full flex-shrink-0 mt-2"
                                aria-label="Unread"
                              />
                            )}
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Theme Toggle */}
        {isClient && (
          <button
            onClick={toggleTheme}
            className="group relative p-2 rounded-mq transition-all duration-mq-mid ease-mq-ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background hover:bg-mq-red hover:-translate-y-0.5 hover:shadow-mq active:scale-[0.98] min-h-[44px] min-w-[44px]"
            aria-label={t(resolvedTheme === 'dark' ? 'switchToLight' : 'switchToDark')}
            aria-pressed={resolvedTheme === 'dark'}
            title={t(resolvedTheme === 'dark' ? 'switchToLight' : 'switchToDark')}
          >
            <div className="relative w-5 h-5">
              <Sun
                className={`absolute inset-0 w-5 h-5 text-mq-warning transition-all duration-500 group-hover:rotate-45 ${resolvedTheme === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
              />
              <Moon
                className={`absolute inset-0 w-5 h-5 text-mq-info transition-all duration-500 group-hover:-rotate-12 ${resolvedTheme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}
                style={
                  resolvedTheme === 'dark'
                    ? { transform: 'translate(0.5px, 0.5px) scale(1) rotate(0deg)' }
                    : { transform: 'translate(0.5px, 0.5px) scale(0) rotate(-90deg)' }
                }
              />
            </div>
          </button>
        )}

        {/* Profile */}
        {isClient && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="group flex items-center gap-2 p-2 rounded-mq transition-all duration-mq-mid ease-mq-ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-[44px] hover:bg-mq-red hover:text-white hover:-translate-y-0.5 hover:shadow-mq active:scale-[0.98] btn-premium"
                aria-label={t('openProfileMenu')}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-110 group-active:scale-95 shadow-mq-sm group-hover:shadow-mq"
                  style={{
                    backgroundColor: currentProfile?.avatar ? 'transparent' : BRAND_COLORS.primary,
                  }}
                >
                  {currentProfile?.avatar ? (
                    <Image
                      src={currentProfile.avatar}
                      alt={currentProfile.name ? `${currentProfile.name} avatar` : 'Profile avatar'}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : displayName ? (
                    <span className="text-white font-bold text-sm">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div
                  className="text-sm font-medium text-mq-content-secondary hidden sm:inline max-w-[120px] truncate"
                  title={displayName || t('guest')}
                >
                  {displayName || t('guest')}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-mq-border shadow-mq-lg">
              <DropdownMenuItem asChild>
                <Link href="/manage-profiles" className="flex items-center gap-2 text-mq-content">
                  <User className="w-4 h-4" />
                  {t('manageProfiles')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 text-mq-content">
                  <Settings className="w-4 h-4" />
                  {t('settings')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    // SECURITY: Clear client storage before signing out
                    // This prevents sensitive data from persisting after logout
                    await clearAllClientStorage();
                    await apiRequest('/api/auth/signout', { method: 'POST', noRetry: true });
                    setUser(null);
                    router.push('/login');
                  } catch {
                    // Silent fail - redirect to login anyway
                    router.push('/login');
                  }
                }}
                className="flex items-center gap-2 text-mq-content hover:text-mq-content cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                {t('signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;

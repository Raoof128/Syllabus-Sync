// components/layout/Header.tsx
// ============================================================================
// HEADER COMPONENT - SOLID SURFACE EDITION
// ============================================================================
// Premium top bar with "Solid Surface" design featuring:
// - Clean, opaque background consistent with MQ design system
// - Sharp border for clear separation
// - LiveClock (date display) and NotificationSystem
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

import React, { useEffect, useRef, useState, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/hooks/useTranslation';
import {
  Bell,
  Check,
  User,
  Clock,
  Calendar,
  BookOpen,
  Info,
  LogOut,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { APP_CONFIG, BRAND_COLORS, UNIVERSITY_CONFIG } from '@/lib/config';
import { useNotificationsStore } from '@/lib/store/notificationsStore';
import { useThemeStore } from '@/lib/store/themeStore';
import { useProfilesStore } from '@/lib/store/profilesStore';
import { apiRequest } from '@/lib/utils/api';
import { formatDistanceToNow } from 'date-fns';
import { getLocaleString } from '@/lib/utils/locale';
import { clearAllClientStorage, resetAllStores } from '@/lib/utils/clientStorage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import WeatherWidget from './WeatherWidget';

const notificationIcons = {
  deadline: Clock,
  event: Calendar,
  class: BookOpen,
  system: Info,
};

const Header = memo(() => {
  const { t, language } = useTranslation();
  const router = useRouter();
  const headerRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<{
    email?: string;
    user_metadata?: { full_name?: string; name?: string };
  } | null>(null);

  const notifications = useNotificationsStore((state) => state.notifications);
  const loadNotifications = useNotificationsStore((state) => state.loadNotifications);
  const markAsRead = useNotificationsStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead);
  const removeNotification = useNotificationsStore((state) => state.removeNotification);

  const [hasSeeded, setHasSeeded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [collisionBoundary, setCollisionBoundary] = useState<Element | null>(null);

  // Set isClient to true when component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      setCollisionBoundary(document.documentElement);
    }
  }, [isClient]);

  // Load notifications on mount
  useEffect(() => {
    if (isClient) {
      loadNotifications({ force: true });
    }
  }, [isClient, loadNotifications]);

  // Error boundary for notifications
  const [notificationError, setNotificationError] = useState<Error | null>(null);

  useEffect(() => {
    const handleNotificationError = (event: CustomEvent) => {
      setNotificationError(event.detail as Error);
    };

    window.addEventListener('notification-error', handleNotificationError as EventListener);
    return () => {
      window.removeEventListener('notification-error', handleNotificationError as EventListener);
    };
  }, []);

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
          // Loading complete
        }
      }
    };

    void getUser();

    const handleFocus = () => {
      void getUser();
      loadNotifications({ force: true });
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      isActive = false;
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadNotifications]);

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

  // Only calculate notifications on client to avoid hydration mismatch
  const unreadNotifications = isClient ? notifications.filter((n) => !n.read) : [];
  const unreadCount = unreadNotifications.length;
  // Show all recent notifications in dropdown (both read and unread)
  const recentNotifications = isClient ? notifications.slice(0, 10) : [];

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
    <header
      ref={headerRef}
      className="h-14 sm:h-16 w-full shrink-0 bg-mq-background border-b border-mq-border flex items-center justify-between pl-20 sm:pl-16 pr-3 sm:pr-4 md:px-6 sticky top-0 z-40"
    >
      {/* Left side - Logo and title (far left) */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0 min-w-0">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
          <Image
            src="/MQ_Logo_Final.png"
            alt={t('mqLogoAlt')}
            width={80}
            height={80}
            priority
            className="h-10 sm:h-12 md:h-14 w-auto shrink-0"
            style={{ width: 'auto' }}
          />
          <div className="hidden sm:block min-w-0">
            <span className="text-sm md:text-base lg:text-lg font-semibold text-mq-content block truncate leading-tight">
              {APP_CONFIG.name}
            </span>
            <span className="text-[10px] md:text-xs text-mq-content-secondary block truncate">
              {UNIVERSITY_CONFIG.shortName}
            </span>
          </div>
        </Link>

        {/* Date and Weather display - next to logo/title */}
        {isClient && (
          <div className="hidden md:flex items-center gap-3 ml-4 pl-4 border-l border-mq-border/50">
            <time
              className="text-sm font-medium text-mq-content whitespace-nowrap"
              dateTime={new Date().toISOString().split('T')[0]}
            >
              {new Date().toLocaleDateString(getLocaleString(language), {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
            <div className="w-px h-5 bg-mq-border/50" aria-hidden="true" />
            <WeatherWidget />
          </div>
        )}
      </div>

      {/* Right side - Actions (far right) */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
        {/* Notifications - wrapped in isClient to prevent hydration mismatch with Radix UI IDs */}
        {isClient && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`group p-1.5 sm:p-2 rounded-lg transition-all duration-200 ease-out relative hover:bg-mq-red hover:text-white hover:-translate-y-0.5 hover:shadow-lg active:scale-95 min-h-10 min-w-10 sm:min-h-11 sm:min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background ${unreadCount > 0 ? 'animate-pulse-subtle' : ''}`}
                aria-label={
                  unreadCount > 0
                    ? t('viewUnreadNotifications', { count: unreadCount })
                    : t('notifications')
                }
                aria-haspopup="menu"
                title={unreadCount > 0 ? t('notificationsBellHint') : t('notifications')}
              >
                <Bell
                  className={`w-4 h-4 sm:w-5 sm:h-5 text-mq-content-secondary transition-transform duration-300 group-hover:scale-110 group-active:scale-95 ${unreadCount > 0 ? 'animate-wiggle' : ''}`}
                  aria-hidden="true"
                />
                {unreadCount > 0 && (
                  <span
                    className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-mq-error rounded-full text-[9px] sm:text-[10px] text-white flex items-center justify-center font-medium animate-bounce-subtle"
                    aria-hidden="true"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              side="bottom"
              collisionPadding={24}
              collisionBoundary={collisionBoundary ?? headerRef.current ?? undefined}
              alignOffset={0}
              className="w-[min(20rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1rem)] bg-mq-card-background rounded-mq-lg border border-mq-border shadow-lg"
              role="menu"
              aria-label={t('notifications')}
            >
              <div className="p-3 border-b border-mq-border flex items-center justify-between">
                <h3 className="font-semibold text-mq-content">{t('notifications')}</h3>
                <DropdownMenuItem
                  disabled={unreadCount === 0}
                  onSelect={(event) => {
                    event.preventDefault();
                    if (unreadCount === 0) return;
                    markAllAsRead();
                  }}
                  className="text-xs text-mq-info hover:text-mq-info/80 focus:text-mq-info focus:bg-transparent disabled:opacity-50 cursor-pointer"
                >
                  {t('markAllRead')}
                </DropdownMenuItem>
              </div>
              <div className="max-h-[min(20rem,calc(100vh-10rem))] overflow-y-auto">
                {notificationError ? (
                  <div className="p-4 text-center">
                    <p className="text-mq-error text-sm font-medium">
                      {t('notificationLoadError')}
                    </p>
                    <button
                      onClick={() => {
                        setNotificationError(null);
                        loadNotifications({ force: true });
                      }}
                      className="text-xs text-mq-info hover:underline mt-2"
                    >
                      {t('retry')}
                    </button>
                  </div>
                ) : recentNotifications.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-mq-content-tertiary text-sm font-medium">
                      {t('noNotificationsYet')}
                    </p>
                    <p className="text-mq-content-tertiary/70 text-xs mt-1">
                      {t('noNotificationsYetDesc')}
                    </p>
                  </div>
                ) : (
                  recentNotifications.map((notification) => {
                    const Icon = notificationIcons[notification.type];
                    return (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`p-0 border-b border-mq-border last:border-0 ${
                          !notification.read ? 'bg-mq-info/10' : ''
                        }`}
                      >
                        <div className="flex w-full items-start gap-1">
                          <Link
                            href={notification.link || '#'}
                            onClick={() => {
                              if (!notification.read) {
                                markAsRead(notification.id);
                              }
                            }}
                            className="block flex-1 min-w-0 p-3 hover:bg-mq-background-secondary focus-visible:outline-none"
                          >
                            <div className="flex gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
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
                                  className="w-2 h-2 bg-mq-info rounded-full shrink-0 mt-2"
                                  aria-label={t('unread')}
                                />
                              )}
                            </div>
                          </Link>
                          {/* Action buttons */}
                          <div className="flex flex-col gap-1 mr-2 mt-2">
                            {/* Mark as read button - only for unread notifications */}
                            {!notification.read && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-mq-info transition-colors hover:bg-mq-info/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus"
                                aria-label={t('markAsRead')}
                                title={t('markAsRead')}
                              >
                                <Check className="h-4 w-4" aria-hidden="true" />
                              </button>
                            )}
                            {/* Delete button - for all notifications */}
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-mq-content-tertiary transition-colors hover:bg-mq-error/10 hover:text-mq-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus"
                              aria-label={t('deleteNotification')}
                              title={t('deleteNotification')}
                            >
                              <X className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    );
                  })
                )}
              </div>
              {/* View All link removed as requested */}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Theme Toggle */}
        {isClient && (
          <button
            onClick={toggleTheme}
            className="group relative p-1.5 sm:p-2 rounded-lg transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background hover:bg-mq-red hover:-translate-y-0.5 hover:shadow-lg active:scale-95 min-h-10 min-w-10 sm:min-h-11 sm:min-w-11"
            aria-label={t(resolvedTheme === 'dark' ? 'switchToLight' : 'switchToDark')}
            aria-pressed={resolvedTheme === 'dark'}
            title={t(resolvedTheme === 'dark' ? 'switchToLight' : 'switchToDark')}
          >
            <div className="relative w-4 h-4 sm:w-5 sm:h-5">
              <Sun
                className={`absolute inset-0 w-4 h-4 sm:w-5 sm:h-5 text-mq-warning transition-all duration-500 group-hover:rotate-45 ${resolvedTheme === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
              />
              <Moon
                className={`absolute inset-0 w-4 h-4 sm:w-5 sm:h-5 text-mq-info transition-all duration-500 group-hover:-rotate-12 ${resolvedTheme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}
                style={
                  resolvedTheme === 'dark'
                    ? { transform: 'translate(0.5px, 0.5px) scale(1) rotate(0deg)' }
                    : { transform: 'translate(0.5px, 0.5px) scale(0) rotate(-90deg)' }
                }
              />
            </div>
          </button>
        )}

        {isClient && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="group flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-lg transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-10 sm:min-h-11 hover:bg-mq-red hover:text-white hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
                aria-label={t('openProfileMenu')}
              >
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-110 group-active:scale-95 shadow-sm group-hover:shadow-md shrink-0"
                  style={{
                    backgroundColor: currentProfile?.avatar ? 'transparent' : BRAND_COLORS.primary,
                  }}
                >
                  {currentProfile?.avatar ? (
                    <Image
                      src={currentProfile.avatar}
                      alt={
                        currentProfile.name
                          ? t('userAvatar', { name: currentProfile.name })
                          : t('profileAvatar')
                      }
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : displayName ? (
                    <span className="text-white font-bold text-xs sm:text-sm">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </div>
                <div
                  className="text-xs sm:text-sm font-medium text-mq-content-secondary hidden md:inline max-w-[80px] lg:max-w-[120px] truncate"
                  title={displayName || t('guest')}
                >
                  {displayName || t('guest')}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              side="bottom"
              collisionPadding={16}
              collisionBoundary={collisionBoundary ?? headerRef.current ?? undefined}
              alignOffset={-8}
              avoidCollisions
              className="w-48 max-w-[90vw] border-mq-border shadow-mq-lg"
            >
              <DropdownMenuItem asChild>
                <Link href="/manage-profiles" className="flex items-center gap-2 text-mq-content">
                  <User className="w-4 h-4" />
                  {t('manageProfiles')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await resetAllStores();
                    await clearAllClientStorage();
                    await apiRequest('/api/auth/signout', { method: 'POST', noRetry: true });
                    setUser(null);
                    router.push('/login');
                  } catch {
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

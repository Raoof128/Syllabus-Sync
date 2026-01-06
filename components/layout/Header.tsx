'use client';

import React, { useEffect, useState, useRef, memo, useMemo } from 'react';
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
import { createBrowserClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
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

  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createBrowserClient(), []);

  const [user, setUser] = useState<{
    email?: string;
    user_metadata?: { full_name?: string; name?: string };
  } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(true);

  const notifications = useNotificationsStore((state) => state.notifications);
  // const addNotification = useNotificationsStore((state) => state.addNotification);
  const markAsRead = useNotificationsStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead);
  const getUnreadCount = useNotificationsStore((state) => state.getUnreadCount);

  const [showNotifications, setShowNotifications] = useState(false);
  const [hasSeeded, setHasSeeded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load user authentication state
  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Failed to get user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (
        _event: string,
        session: {
          user: {
            id: string;
            email?: string;
            user_metadata?: { full_name?: string; name?: string };
          };
        } | null,
      ) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Only calculate unread count on client to avoid hydration mismatch
  const unreadCount = isClient ? getUnreadCount() : 0;

  // Get display name: prioritize profile name, then Supabase user metadata full_name/name, then extract from email
  // Extract a proper name from the email prefix (capitalize first letter)
  const displayName = useMemo(() => {
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
  }, [currentProfile, user]);

  return (
    <header className="h-16 bg-mq-background border-b border-mq-border flex items-center justify-between px-4 sm:px-6 relative z-10">
      {/* Left side - Logo and title (far left) */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <Image
            src="/MQ_Logo_Final.png"
            alt={t('mqLogoAlt')}
            width={128}
            height={128}
            style={{ objectFit: 'contain' }}
          />
          <div className="hidden sm:block">
            <h1 className="text-mq-lg font-semibold text-mq-content">{APP_CONFIG.name}</h1>
            <p className="text-mq-xs text-mq-content-secondary">{UNIVERSITY_CONFIG.shortName}</p>
          </div>
        </Link>

        {/* Date display - next to logo/title */}
        {isClient && (
          <div className="hidden md:flex items-center ml-4 pl-4 border-l border-mq-border">
            <span className="text-mq-sm font-medium text-mq-content-secondary">
              {new Date().toLocaleDateString(
                language === 'fa'
                  ? 'fa-IR'
                  : language === 'es'
                    ? 'es-ES'
                    : language === 'zh'
                      ? 'zh-CN'
                      : language === 'ar'
                        ? 'ar-SA'
                        : language === 'hi'
                          ? 'hi-IN'
                          : language === 'ru'
                            ? 'ru-RU'
                            : language === 'ja'
                              ? 'ja-JP'
                              : language === 'ko'
                                ? 'ko-KR'
                                : language === 'ur'
                                  ? 'ur-PK'
                                  : language === 'th'
                                    ? 'th-TH'
                                    : language === 'vi'
                                      ? 'vi-VN'
                                      : 'en-AU',
                {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                },
              )}
            </span>
          </div>
        )}
      </div>

      {/* Right side - Actions (far right) */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="group p-2 rounded-mq transition-all duration-mq-mid ease-mq-ease relative hover:bg-mq-red hover:text-white hover:-translate-y-0.5 hover:shadow-mq active:scale-[0.98] min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background btn-premium"
            aria-label={t('notifications')}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5 text-mq-content-secondary transition-transform duration-300 group-hover:scale-110 group-active:scale-95" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-mq-error rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-mq-card-background rounded-mq-lg shadow-mq-lg border border-mq-border z-50 max-h-96 overflow-hidden">
              <div className="p-3 border-b border-mq-border flex items-center justify-between">
                <h3 className="font-semibold text-mq-content">{t('notifications')}</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-xs text-mq-info hover:text-mq-info/80 rounded-mq focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-card-background"
                    aria-label={t('markAllRead')}
                  >
                    {t('markAllRead')}
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-mq-content-tertiary text-sm">
                    {t('noNotificationsYet')}
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notification) => {
                    const Icon = notificationIcons[notification.type];
                    return (
                      <Link
                        key={notification.id}
                        href={notification.link || '#'}
                        onClick={() => {
                          markAsRead(notification.id);
                          setShowNotifications(false);
                        }}
                        className={`block p-3 border-b border-mq-border last:border-0 hover:bg-mq-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-card-background ${
                          !notification.read ? 'bg-mq-info/10' : ''
                        }`}
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
                            <div className="w-2 h-2 bg-mq-info rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        {isClient && (
          <button
            onClick={toggleTheme}
            className="group relative p-2 rounded-mq transition-all duration-mq-mid ease-mq-ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background hover:bg-mq-red hover:-translate-y-0.5 hover:shadow-mq active:scale-[0.98] min-h-[44px] min-w-[44px]"
            aria-label={t(resolvedTheme === 'dark' ? 'switchToLight' : 'switchToDark')}
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
                      alt={currentProfile.name}
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
                <div className="text-sm font-medium text-mq-content-secondary hidden sm:inline">
                  {displayName || t('guest')}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-mq-card-background border-mq-border shadow-mq-lg [&_[data-radix-menu-item]]:focus:bg-transparent [&_[data-radix-menu-item]]:hover:bg-transparent"
            >
              <DropdownMenuItem asChild>
                <Link
                  href="/manage-profiles"
                  className="flex items-center gap-2 text-mq-content-secondary"
                >
                  <User className="w-4 h-4" />
                  {t('manageProfiles')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 text-mq-content-secondary"
                >
                  <Settings className="w-4 h-4" />
                  {t('settings')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                    router.push('/login');
                  } catch (error) {
                    console.error('Logout failed:', error);
                  }
                }}
                className="flex items-center gap-2 text-mq-content-secondary hover:text-mq-content cursor-pointer"
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

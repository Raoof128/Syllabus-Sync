'use client';

import React, { useEffect, useState, useRef, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { APP_CONFIG, DEMO_USER, BRAND_COLORS, UNIVERSITY_CONFIG } from '@/lib/config';
import { useNotificationsStore } from '@/lib/store/notificationsStore';
import { useThemeStore } from '@/lib/store/themeStore';
import { useProfilesStore } from '@/lib/store/profilesStore';
import { sampleNotifications } from '@/data/sampleNotifications';
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
  const notifications = useNotificationsStore((state) => state.notifications);
  const addNotification = useNotificationsStore((state) => state.addNotification);
  const markAsRead = useNotificationsStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead);
  const getUnreadCount = useNotificationsStore((state) => state.getUnreadCount);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasSeeded, setHasSeeded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  // setState called in effect is correct here - syncing with localStorage during hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  // setState called in effect is correct here - syncing with localStorage during hydration
  useEffect(() => {
    if (!hasSeeded && isClient) {
      const seededKey = 'notifications-seeded';
      try {
        const alreadySeeded = localStorage.getItem(seededKey) === 'true';
        if (!alreadySeeded) {
          sampleNotifications.forEach(addNotification);
          localStorage.setItem(seededKey, 'true');
        }
      } catch {
        sampleNotifications.forEach(addNotification);
      }
      setHasSeeded(true);
    }
  }, [addNotification, hasSeeded, isClient]);

  // Theme and profile stores
  const { toggleTheme, resolvedTheme } = useThemeStore();
  const { getCurrentProfile } = useProfilesStore();
  const currentProfile = isClient ? getCurrentProfile() : null;

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

  return (
    <header className="h-16 bg-mq-background border-b border-mq-border flex items-center justify-between px-6 relative z-10">
      {/* Left side - Logo and title */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/MQ_Logo_Final.png"
            alt="Macquarie University Logo"
            width={128}
            height={128}
            style={{ objectFit: 'contain' }}
          />
          <div className="hidden sm:block">
            <h1 className="text-mq-lg font-semibold text-mq-content">
              {APP_CONFIG.name}
            </h1>
            <p className="text-mq-xs text-mq-content-secondary">{UNIVERSITY_CONFIG.shortName}</p>
          </div>
        </Link>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="p-2 rounded-mq transition-all duration-mq-fast ease-mq-snap relative hover:bg-mq-background-secondary min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background"
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5 text-mq-content-secondary" />
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
                <h3 className="font-semibold text-mq-content">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-xs text-mq-info hover:text-mq-info/80 rounded-mq focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-card-background"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-mq-content-tertiary text-sm">No notifications yet</div>
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
            className="relative p-2 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background active:scale-95 hover:bg-mq-background-secondary min-h-[44px] min-w-[44px]"
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <div className="relative w-5 h-5">
              <Sun
                className={`absolute inset-0 w-5 h-5 text-mq-warning transition-all duration-300 ${resolvedTheme === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
              />
              <Moon
                className={`absolute inset-0 w-5 h-5 text-mq-info transition-all duration-300 ${resolvedTheme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}
              />
            </div>
          </button>
        )}

        {/* Profile */}
        {isClient && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-[44px] hover:bg-mq-background-secondary"
                aria-label="Open profile menu"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: BRAND_COLORS.primary }}
                >
                  {currentProfile ? (
                    <span className="text-white font-bold text-sm">
                      {currentProfile.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="text-sm font-medium text-mq-content-secondary hidden sm:inline">
                  {currentProfile ? currentProfile.name : DEMO_USER.name}
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
                  Manage Profiles
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 text-mq-content-secondary"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/calendar"
                  className="flex items-center gap-2 text-mq-content-secondary"
                >
                  <Calendar className="w-4 h-4" />
                  Calendar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled
                className="flex items-center gap-2 text-mq-content-tertiary"
              >
                <LogOut className="w-4 h-4" />
                Sign out
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

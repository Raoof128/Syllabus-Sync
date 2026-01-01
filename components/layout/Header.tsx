'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Bell,
  Settings,
  User,
  GraduationCap,
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

export default function Header() {
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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left side - Logo and title */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: BRAND_COLORS.primary }}
        >
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-lg font-semibold text-gray-900">{APP_CONFIG.name}</h1>
          <p className="text-xs text-gray-500">{UNIVERSITY_CONFIG.shortName}</p>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="p-2 rounded-lg transition-colors relative"
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
              <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">No notifications yet</div>
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
                        className={`block p-3 border-b border-gray-100 last:border-0 ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              notification.type === 'deadline'
                                ? 'bg-orange-100'
                                : notification.type === 'event'
                                  ? 'bg-purple-100'
                                  : notification.type === 'class'
                                    ? 'bg-blue-100'
                                    : 'bg-gray-100'
                            }`}
                          >
                            <Icon
                              className={`w-4 h-4 ${
                                notification.type === 'deadline'
                                  ? 'text-orange-600'
                                  : notification.type === 'event'
                                    ? 'text-purple-600'
                                    : notification.type === 'class'
                                      ? 'text-blue-600'
                                      : 'text-gray-600'
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-gray-900 truncate`}
                            >
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
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
            className="relative p-2 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95"
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <div className="relative w-5 h-5">
              <Sun
                className={`absolute inset-0 w-5 h-5 text-yellow-500 transition-all duration-300 ${resolvedTheme === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
              />
              <Moon
                className={`absolute inset-0 w-5 h-5 text-blue-400 transition-all duration-300 ${resolvedTheme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}
              />
            </div>
          </button>
        )}

        {/* Profile */}
        {isClient && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
                <div className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {currentProfile ? currentProfile.name : DEMO_USER.name}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 [&_[data-radix-menu-item]]:focus:bg-transparent [&_[data-radix-menu-item]]:hover:bg-transparent"
            >
              <DropdownMenuItem asChild>
                <Link href="/manage-profiles" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Manage Profiles
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/calendar" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Calendar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

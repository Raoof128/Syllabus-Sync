'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Bell, Settings, User, GraduationCap, Clock, Calendar, BookOpen, Info } from 'lucide-react';
import { APP_CONFIG, DEMO_USER, BRAND_COLORS, UNIVERSITY_CONFIG } from '@/lib/config';
import { useNotificationsStore } from '@/lib/store/notificationsStore';
import { sampleNotifications } from '@/data/sampleNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useHydration } from '@/lib/hooks/useHydration';

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use proper hydration hook
  const isHydrated = useHydration();
  const hasSeedRef = useRef(false);

  // Seed sample notifications on first mount - using external system pattern
  useEffect(() => {
    if (hasSeedRef.current || notifications.length > 0 || !isHydrated) {
      return;
    }

    hasSeedRef.current = true;
    // Seed notifications - this is updating an external system (zustand store)
    // which is the correct use of useEffect
    sampleNotifications.forEach(addNotification);
  }, [addNotification, notifications.length, isHydrated]);

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
  const unreadCount = isHydrated ? getUnreadCount() : 0;

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
          <h1 className="text-lg font-semibold text-gray-900">
            {APP_CONFIG.name}
          </h1>
          <p className="text-xs text-gray-500">{UNIVERSITY_CONFIG.shortName}</p>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
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
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
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
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No notifications yet
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
                        className={`block p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            notification.type === 'deadline' ? 'bg-orange-100' :
                            notification.type === 'event' ? 'bg-purple-100' :
                            notification.type === 'class' ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <Icon className={`w-4 h-4 ${
                              notification.type === 'deadline' ? 'text-orange-600' :
                              notification.type === 'event' ? 'text-purple-600' :
                              notification.type === 'class' ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-gray-900 truncate`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
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

        {/* Settings */}
        <Link
          href="/settings"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </Link>

        {/* Profile */}
        <button
          className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Profile"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: BRAND_COLORS.primary }}
          >
            <User className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:inline">{DEMO_USER.name}</span>
        </button>
      </div>
    </header>
  );
}

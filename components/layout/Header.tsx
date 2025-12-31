'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Settings, User, GraduationCap } from 'lucide-react';
import { APP_CONFIG, DEMO_USER, BRAND_COLORS, UNIVERSITY_CONFIG } from '@/lib/config';

export default function Header() {
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
        <button
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
          aria-label="Notifications"
          title="Notifications coming soon"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

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

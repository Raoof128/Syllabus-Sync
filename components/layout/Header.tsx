'use client';

import React from 'react';
import { Bell, Settings, User } from 'lucide-react';
import { APP_CONFIG, DEMO_USER, BRAND_COLORS } from '@/lib/config';

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left side - Page title */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          {APP_CONFIG.name}
        </h1>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-gray-600" />
        </button>

        {/* Settings */}
        <button
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>

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
          <span className="text-sm font-medium text-gray-700">{DEMO_USER.name}</span>
        </button>
      </div>
    </header>
  );
}

'use client';

import { useState } from 'react';
import { Settings, User, Bell, Palette, Shield, Database, Clock, Info, Mail, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UNIVERSITY_CONFIG, APP_CONFIG } from '@/lib/config';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import ProfileCard from '@/components/ProfileCard';

export default function SettingsPage() {
  const [clearing, setClearing] = useState(false);
  const units = useUnitsStore((state) => state.units);
  const removeUnit = useUnitsStore((state) => state.removeUnit);
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const removeDeadline = useDeadlinesStore((state) => state.removeDeadline);

  const handleClearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      setClearing(true);
      units.forEach((unit) => removeUnit(unit.id));
      deadlines.forEach((deadline) => removeDeadline(deadline.id));
      localStorage.removeItem('units-storage');
      localStorage.removeItem('deadlines-storage');
      localStorage.removeItem('notifications-storage');
      localStorage.removeItem('notifications-seeded');
      localStorage.removeItem('units-seeded');
      localStorage.removeItem('deadlines-seeded');
      localStorage.setItem('seed-disabled', 'true');
      setClearing(false);
      alert('All data has been cleared successfully!');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your preferences and account settings.</p>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-blue-900">
            <strong>Coming soon:</strong> Full settings functionality will be available with
            database integration in Week 3-4.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="text-sm text-gray-600">
                Profile management functionality will be available with database integration in Week 3-4.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">Deadline Reminders</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Get notified before assignments are due</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Coming Soon</Badge>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">Class Reminders</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Reminder 15 minutes before each class</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Coming Soon</Badge>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">Event Updates</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Updates about campus events</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Coming Soon</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Dark Mode</h4>
                  <p className="text-sm text-gray-600">Switch to dark theme</p>
                </div>
                <div className="w-10 h-5 bg-gray-200 rounded-full opacity-50"></div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Language</h4>
                  <p className="text-sm text-gray-600">Choose your preferred language</p>
                </div>
                <div className="w-10 h-5 bg-gray-200 rounded-full opacity-50"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Data Storage</h4>
                  <p className="text-sm text-gray-600">Currently using local storage</p>
                </div>
                <div className="w-10 h-5 bg-green-500 rounded-full opacity-50"></div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Export Data</h4>
                  <p className="text-sm text-gray-600">Download all your data as JSON</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Coming Soon</Badge>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Clear All Data</h4>
                  <p className="text-sm text-gray-600">Delete all stored data from app</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAllData}
                  disabled={clearing}
                >
                  {clearing ? 'Clearing...' : 'Clear'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Sync Status</h4>
                  <p className="text-sm text-gray-600">Connected</p>
                </div>
                <Badge className="bg-green-500 text-green-800">Active</Badge>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Units</h4>
                  <p className="text-sm text-gray-600">Saved locally</p>
                </div>
                <div className="w-10 h-5 bg-gray-200 rounded-full opacity-50"></div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Deadlines</h4>
                  <p className="text-sm text-gray-600">Saved locally</p>
                </div>
                <div className="w-10 h-5 bg-gray-200 rounded-full opacity-50"></div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Events</h4>
                  <p className="text-sm text-gray-600">Sample data</p>
                </div>
                <div className="w-10 h-5 bg-gray-200 rounded-full opacity-50"></div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Last Sync</h4>
                  <p className="text-sm text-gray-600">Just now</p>
                </div>
                <div className="w-10 h-5 bg-gray-200 rounded-full opacity-50"></div>
              </div>
            </div>
            <div className="flex items-center justify-center mt-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">Cloud sync coming soon</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Development
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Status</h4>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
                <div className="w-10 h-5 bg-blue-500 rounded-full opacity-50"></div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Full settings functionality will be available with database integration in Week 3-4.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex justify-between">
                <div>
                  <span className="text-gray-600">Version</span>
                  <span className="text-gray-900 ml-2">{APP_CONFIG.version}</span>
                </div>

              </div>
              <div className="flex justify-between mt-2">
                <span className="text-gray-600">Last Update</span>
                <span className="text-gray-900">Dec 31, 2025</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => (window.location.href = '/home')}>
              Home
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => (window.location.href = '/calendar')}>
              Calendar
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3 mt-6">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-blue-900">
            <strong>Get started:</strong> Full settings functionality will be available with database integration in Week 3-4.
          </p>
        </div>
      </div>
    </div>
  );
}

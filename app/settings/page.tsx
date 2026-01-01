'use client';

import { useState } from 'react';
import { Bell, Palette, Shield, Info, Mail, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { toastUtils } from '@/lib/utils/toast';

export default function SettingsPage() {
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const units = useUnitsStore((state) => state.units);
  const removeUnit = useUnitsStore((state) => state.removeUnit);
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const removeDeadline = useDeadlinesStore((state) => state.removeDeadline);

  const handleClearAllData = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAllData = () => {
    units.forEach((unit) => removeUnit(unit.id));
    deadlines.forEach((deadline) => removeDeadline(deadline.id));
    localStorage.removeItem('units-storage');
    localStorage.removeItem('deadlines-storage');
    localStorage.removeItem('notifications-storage');
    localStorage.removeItem('seed-disabled');
    localStorage.removeItem('units-seeded');
    setClearing(false);
    setShowClearConfirm(false);
    toastUtils.success(
      'Data Cleared',
      'All units, deadlines, and data have been cleared successfully.',
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your preferences and account settings.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <p className="text-sm text-gray-600 mt-1">
                    Get notified before assignments are due
                  </p>
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
                  <p className="text-sm text-gray-600 mt-1">
                    Reminder 15 minutes before each class
                  </p>
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
                <div className="w-10 h-5 bg-gray-200 rounded-full opacity-50" />
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Language</h4>
                  <p className="text-sm text-gray-600">Choose your preferred language</p>
                </div>
                <div className="w-10 h-5 bg-gray-200 rounded-full opacity-50" />
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
                <div className="w-10 h-5 bg-green-500 rounded-full opacity-50" />
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
      </div>

      <div className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => (window.location.href = '/home')}
            >
              Home
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => (window.location.href = '/calendar')}
            >
              Calendar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clear All Data</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all data? This action cannot be undone and will remove
              all units, deadlines, and profiles.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmClearAllData} disabled={clearing}>
              {clearing ? 'Clearing...' : 'Clear All Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

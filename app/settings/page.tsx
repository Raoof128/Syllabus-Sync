'use client';

import { useState } from 'react';
import { Bell, Palette, Shield, Info, Mail, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Button } from '@/components/ui/mq/button';
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
        <header className="mb-8">
          <h1 className="text-mq-3xl font-bold text-mq-content mb-2">Settings</h1>
          <p className="text-mq-content-secondary">Manage your preferences and account settings.</p>
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
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg hover:bg-mq-hover-background transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-mq-content-tertiary" />
                  <div>
                    <p className="text-mq-sm font-medium text-mq-content">Deadline Reminders</p>
                    <p className="text-mq-sm text-mq-content-secondary mt-1">Get notified about upcoming deadlines</p>
                  </div>
                </div>
                <Badge className="bg-mq-warning/10 text-mq-warning">Coming Soon</Badge>
               </div>
             </div>
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg hover:bg-mq-hover-background transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-mq-content-tertiary" />
                  <div>
                    <p className="text-mq-sm font-medium text-mq-content">Class Reminders</p>
                    <p className="text-mq-sm text-mq-content-secondary mt-1">Notifications for class schedules</p>
                  </div>
                </div>
                <Badge className="bg-mq-warning/10 text-mq-warning">Coming Soon</Badge>
              </div>
             </div>
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg hover:bg-mq-hover-background transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Info className="h-4 w-4 text-mq-content-tertiary" />
                  <div>
                    <p className="text-mq-sm font-medium text-mq-content">Event Updates</p>
                    <p className="text-mq-sm text-mq-content-secondary mt-1">Updates about campus events</p>
                  </div>
                </div>
                <Badge className="bg-mq-warning/10 text-mq-warning">Coming Soon</Badge>
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
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg hover:bg-mq-hover-background transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-mq-content">Dark Mode</h4>
                  <p className="text-mq-sm text-mq-content-secondary">Switch to dark theme</p>
                </div>
                <div className="w-10 h-5 bg-mq-border rounded-full opacity-50" />
              </div>
            </div>
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg hover:bg-mq-hover-background transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-mq-content">Language</h4>
                  <p className="text-mq-sm text-mq-content-secondary">Choose your preferred language</p>
                </div>
                <div className="w-10 h-5 bg-mq-border rounded-full opacity-50" />
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
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg hover:bg-mq-hover-background transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-mq-content">Data Storage</h4>
                  <p className="text-mq-sm text-mq-content-secondary">Currently using local storage</p>
                </div>
                <div className="w-10 h-5 bg-mq-success rounded-full opacity-50" />
              </div>
            </div>
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg hover:bg-mq-hover-background transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-mq-content">Export Data</h4>
                  <p className="text-mq-sm text-mq-content-secondary">Download all your data as JSON</p>
                </div>
                <Badge className="bg-mq-warning/10 text-mq-warning">Coming Soon</Badge>
              </div>
            </div>
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg hover:bg-mq-hover-background transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-mq-content">Clear All Data</h4>
                  <p className="text-mq-sm text-mq-content-secondary">Delete all stored data from app</p>
                </div>
                <Button
                  variant="primary"
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
              variant="secondary"
              className="w-full justify-start"
              onClick={() => (window.location.href = '/home')}
            >
              Home
            </Button>
            <Button
              variant="secondary"
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
            <Button variant="secondary" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmClearAllData} disabled={clearing}>
              {clearing ? 'Clearing...' : 'Clear All Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

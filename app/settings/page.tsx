'use client';

import { useState, useEffect } from 'react';
import { Bell, Palette, Shield, Info, Mail, Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Button } from '@/components/ui/mq/button';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useThemeStore } from '@/lib/store/themeStore';
import { useNotificationsStore } from '@/lib/store/notificationsStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { toastUtils } from '@/lib/utils/toast';
import { errorHandler } from '@/lib/utils/errorHandling';
import { APP_CONFIG } from '@/lib/config';

export default function SettingsPage() {
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [language, setLanguage] = useState('en');

  const units = useUnitsStore((state) => state.units);
  const removeUnit = useUnitsStore((state) => state.removeUnit);
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const removeDeadline = useDeadlinesStore((state) => state.removeDeadline);

  const { theme, resolvedTheme, setTheme } = useThemeStore();
  const notifications = useNotificationsStore((state) => state.notifications);

  // Load preferences on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedLanguage = localStorage.getItem('language') || 'en';
        setLanguage(savedLanguage);
      }
    } catch (error) {
      // Silently handle localStorage errors (e.g., in private browsing mode)
      console.warn('Unable to load language preference from localStorage');
    }
  }, []);

  // Handle language change with keyboard support
  const handleLanguageChange = (newLanguage: string) => {
    if (newLanguage === language) return; // No change needed
    setLanguage(newLanguage);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', newLanguage);
        toastUtils.success('Language Updated', `Language changed to ${newLanguage === 'en' ? 'English' : 'Español'}`);
      }
    } catch (error) {
      toastUtils.error('Settings Error', 'Unable to save language preference. Please try again.');
    }
  };

  // Handle notification preferences (local storage based)
  const handleNotificationPreference = (type: string, enabled: boolean) => {
    try {
      if (typeof window !== 'undefined') {
        const key = `notification-${type}`;
        localStorage.setItem(key, enabled.toString());
        toastUtils.success(
          'Preference Updated',
          `${type} notifications ${enabled ? 'enabled' : 'disabled'}`
        );
      }
    } catch (error) {
      toastUtils.error('Settings Error', 'Unable to save notification preference. Please try again.');
    }
  };

  // Check if notification type is enabled
  const isNotificationEnabled = (type: string) => {
    try {
      if (typeof window === 'undefined') return true;
      const key = `notification-${type}`;
      const saved = localStorage.getItem(key);
      return saved !== null ? saved === 'true' : true; // Default to enabled
    } catch (error) {
      // If localStorage fails, default to enabled
      return true;
    }
  };

  const handleClearAllData = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAllData = () => {
    setClearing(true);
    let cleared = false;
    try {
      units.forEach((unit) => removeUnit(unit.id));
      deadlines.forEach((deadline) => removeDeadline(deadline.id));
      if (typeof window !== 'undefined') {
        localStorage.removeItem('units-storage');
        localStorage.removeItem('deadlines-storage');
        localStorage.removeItem('notifications-storage');
        localStorage.removeItem('seed-disabled');
        localStorage.removeItem('units-seeded');
        localStorage.removeItem('deadlines-seeded');
        localStorage.removeItem('notifications-seeded');
      }
      cleared = true;
    } catch (error) {
      errorHandler.logError(
        error instanceof Error ? error : new Error('Failed to clear data'),
        'Settings Clear Data',
        'medium',
      );
      toastUtils.error('Error', 'Failed to clear local data. Please try again.');
    } finally {
      setClearing(false);
      if (cleared) {
        setShowClearConfirm(false);
        toastUtils.success(
          'Data Cleared',
          'All units, deadlines, and data have been cleared successfully.',
        );
      }
    }
  };

  return (
      <div className="container mx-auto p-6 max-w-7xl">
        <header className="mb-8">
          <h1 className="text-mq-3xl font-bold text-mq-content mb-2">Settings</h1>
          <p className="text-mq-content-secondary">Manage your preferences and account settings.</p>
        </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNotificationPreference('deadlines', !isNotificationEnabled('deadlines'))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationPreference('deadlines', !isNotificationEnabled('deadlines'));
                    }
                  }}
                  className={`px-3 py-1 text-xs flex items-center gap-1 transition-colors focus:ring-2 focus:ring-mq-primary/50 ${isNotificationEnabled('deadlines') ? 'bg-mq-success text-white hover:bg-mq-success/80' : 'bg-mq-error text-white hover:bg-mq-error/80'}`}
                  aria-label={`Deadline reminders notifications are ${isNotificationEnabled('deadlines') ? 'enabled' : 'disabled'}. Click to ${isNotificationEnabled('deadlines') ? 'disable' : 'enable'}`}
                  aria-pressed={isNotificationEnabled('deadlines')}
                >
                  {isNotificationEnabled('deadlines') ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      Disabled
                    </>
                  )}
                </Button>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNotificationPreference('classes', !isNotificationEnabled('classes'))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationPreference('classes', !isNotificationEnabled('classes'));
                    }
                  }}
                  className={`px-3 py-1 text-xs flex items-center gap-1 transition-colors focus:ring-2 focus:ring-mq-primary/50 ${isNotificationEnabled('classes') ? 'bg-mq-success text-white hover:bg-mq-success/80' : 'bg-mq-error text-white hover:bg-mq-error/80'}`}
                  aria-label={`Class schedule notifications are ${isNotificationEnabled('classes') ? 'enabled' : 'disabled'}. Click to ${isNotificationEnabled('classes') ? 'disable' : 'enable'}`}
                  aria-pressed={isNotificationEnabled('classes')}
                >
                  {isNotificationEnabled('classes') ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      Disabled
                    </>
                  )}
                </Button>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNotificationPreference('events', !isNotificationEnabled('events'))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationPreference('events', !isNotificationEnabled('events'));
                    }
                  }}
                  className={`px-3 py-1 text-xs flex items-center gap-1 transition-colors focus:ring-2 focus:ring-mq-primary/50 ${isNotificationEnabled('events') ? 'bg-mq-success text-white hover:bg-mq-success/80' : 'bg-mq-error text-white hover:bg-mq-error/80'}`}
                  aria-label={`Campus event notifications are ${isNotificationEnabled('events') ? 'enabled' : 'disabled'}. Click to ${isNotificationEnabled('events') ? 'disable' : 'enable'}`}
                  aria-pressed={isNotificationEnabled('events')}
                >
                  {isNotificationEnabled('events') ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      Disabled
                    </>
                  )}
                </Button>
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
                  <p className="text-mq-sm text-mq-content-secondary">
                    Current: {theme === 'system' ? `System (${resolvedTheme})` : resolvedTheme}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme('light')}
                    className={`px-3 py-1 text-xs ${theme === 'light' ? 'bg-mq-primary text-white' : 'text-mq-content-secondary'}`}
                  >
                    Light
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme('system')}
                    className={`px-3 py-1 text-xs ${theme === 'system' ? 'bg-mq-primary text-white' : 'text-mq-content-secondary'}`}
                  >
                    System
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className={`px-3 py-1 text-xs ${theme === 'dark' ? 'bg-mq-primary text-white' : 'text-mq-content-secondary'}`}
                  >
                    Dark
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg hover:bg-mq-hover-background transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-mq-content">Language</h4>
                  <p className="text-mq-sm text-mq-content-secondary">
                    Current: {language === 'en' ? 'English' : 'Español'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLanguageChange('en')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleLanguageChange('en');
                      }
                    }}
                    className={`px-3 py-1 text-xs transition-colors focus:ring-2 focus:ring-mq-primary/50 ${language === 'en' ? 'bg-mq-primary text-white' : 'text-mq-content-secondary hover:bg-mq-primary/10'}`}
                    aria-pressed={language === 'en'}
                    aria-label={`Switch to English language${language === 'en' ? ' (currently selected)' : ''}`}
                  >
                    English
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLanguageChange('es')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleLanguageChange('es');
                      }
                    }}
                    className={`px-3 py-1 text-xs transition-colors focus:ring-2 focus:ring-mq-primary/50 ${language === 'es' ? 'bg-mq-primary text-white' : 'text-mq-content-secondary hover:bg-mq-primary/10'}`}
                    aria-pressed={language === 'es'}
                    aria-label={`Switch to Spanish language${language === 'es' ? ' (currently selected)' : ''}`}
                  >
                    Español
                  </Button>
                </div>
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
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    try {
                      const data = {
                        units,
                        deadlines,
                        exportedAt: new Date().toISOString(),
                        version: '1.0',
                        appVersion: APP_CONFIG.version
                      };
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `syllabus-sync-data-${new Date().toISOString().split('T')[0]}.json`;
                      a.style.display = 'none';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toastUtils.success('Export Complete', 'Your data has been downloaded successfully.');
                    } catch (error) {
                      errorHandler.logError(
                        error instanceof Error ? error : new Error('Failed to export data'),
                        'Settings Export Data',
                        'medium'
                      );
                      toastUtils.error('Export Failed', 'Unable to export your data. Please try again.');
                    }
                  }}
                  aria-label="Export all your units and deadlines data as a JSON file"
                >
                  Export
                </Button>
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
                  className="flex items-center gap-2"
                >
                  {clearing && <Loader2 className="h-3 w-3 animate-spin" />}
                  {clearing ? 'Clearing...' : 'Clear Data'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="secondary" className="w-full justify-start" asChild>
              <Link href="/home">🏠 Home Dashboard</Link>
            </Button>
            <Button variant="secondary" className="w-full justify-start" asChild>
              <Link href="/calendar">📅 Calendar View</Link>
            </Button>
            <Button variant="secondary" className="w-full justify-start" asChild>
              <Link href="/feed">📰 Events Feed</Link>
            </Button>
            <Button variant="secondary" className="w-full justify-start" asChild>
              <Link href="/map">🗺️ Campus Map</Link>
            </Button>
            <Button variant="secondary" className="w-full justify-start" asChild>
              <Link href="/manage-profiles">👤 Manage Profiles</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Help & Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg">
              <h4 className="font-semibold text-mq-content mb-1">About Syllabus Sync</h4>
              <p className="text-mq-sm text-mq-content-secondary">
                Version {APP_CONFIG.version} - Macquarie University Campus Management
              </p>
            </div>
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg">
              <h4 className="font-semibold text-mq-content mb-1">Need Help?</h4>
              <p className="text-mq-sm text-mq-content-secondary mb-2">
                Visit our documentation or contact support.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  toastUtils.info('Documentation', '📚 Opening Macquarie University Syllabus Sync documentation...');
                  // In a real app, this would open documentation
                  setTimeout(() => {
                    toastUtils.success('Documentation', '📖 Documentation will be available soon. Check back later!');
                  }, 1500);
                }}
                aria-label="View application documentation and help guides"
              >
                View Documentation
              </Button>
            </div>
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg">
              <h4 className="font-semibold text-mq-content mb-1">Feedback</h4>
              <p className="text-mq-sm text-mq-content-secondary mb-2">
                Help us improve by sharing your feedback.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  toastUtils.info('Feedback', '📝 Preparing feedback form...');
                  setTimeout(() => {
                    toastUtils.success('Thank you!', '💌 Feedback system will be available soon. We appreciate your input!');
                  }, 1500);
                }}
                aria-label="Send feedback about the Syllabus Sync application"
              >
                Send Feedback
              </Button>
            </div>
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

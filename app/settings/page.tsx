'use client';

import { useState, useEffect } from 'react';
import { Bell, Palette, Shield, Info, Mail, Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Button } from '@/components/ui/mq/button';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useThemeStore } from '@/lib/store/themeStore';
// import { useNotificationsStore } from '@/lib/store/notificationsStore';
import { useTranslation } from '@/lib/hooks/useTranslation';
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
  const [storageEnabled, setStorageEnabled] = useState(true);

  const units = useUnitsStore((state) => state.units);
  const removeUnit = useUnitsStore((state) => state.removeUnit);
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const removeDeadline = useDeadlinesStore((state) => state.removeDeadline);

  const { theme, resolvedTheme, setTheme } = useThemeStore();
  // const notifications = useNotificationsStore((state) => state.notifications);
  const { t, language, setLanguage } = useTranslation();

  // Notification States (Optimistic UI)
  const [notifications, setNotifications] = useState({
    deadlines: true,
    classes: true,
    events: true
  });

  // Initialize from LocalStorage

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const getVal = (key: string) => {
          const val = localStorage.getItem(`notification-${key}`);
          return val === null ? true : val === 'true';
        }
        setNotifications({
          deadlines: getVal('deadlines'),
          classes: getVal('classes'),
          events: getVal('events')
        });
      }
    } catch {
      // Defaults are true
    }
  }, []); // Run once on mount

  // Handle language change with keyboard support
  const handleLanguageChange = (newLanguage: 'en' | 'es' | 'fa' | 'zh' | 'ar' | 'hi' | 'ko' | 'ja' | 'ur' | 'th' | 'vi' | 'ru') => {
    if (newLanguage === language) return; // No change needed
    setLanguage(newLanguage);

    // Map language codes to translation keys
    const languageNames: Record<string, string> = {
      en: t('english'),
      es: t('spanish'),
      fa: t('persian'),
      zh: t('chinese'),
      ar: t('arabic'),
      hi: t('hindi'),
      ko: t('korean'),
      ja: t('japanese'),
      ur: t('urdu'),
      th: t('thai'),
      vi: t('vietnamese'),
      ru: t('russian'),
    };

    toastUtils.success(
      t('languageUpdated'),
      `${t('languageUpdatedMsg')} ${languageNames[newLanguage] || newLanguage}`
    );
  };

  // Handle notification preferences
  const handleNotificationPreference = (type: keyof typeof notifications, enabled: boolean) => {
    try {
      // 1. Update State Immediately (Optimistic)
      setNotifications(prev => ({
        ...prev,
        [type]: enabled
      }));

      // 2. Persist to Storage
      if (typeof window !== 'undefined') {
        const key = `notification-${type}`;
        localStorage.setItem(key, enabled.toString());

        const typeLabels: Record<string, string> = {
          deadlines: t('deadlineReminders'),
          classes: t('classReminders'),
          events: t('eventUpdates'),
        };

        toastUtils.success(
          t('preferenceUpdated'),
          `${typeLabels[type] || type} ${enabled ? t('enabled').toLowerCase() : t('disabled').toLowerCase()}`
        );
      }
    } catch (error) {
      // Revert on error? For simple local storage, unlikely to fail, but could add revert logic.
      errorHandler.logError(error as Error, 'Notification Prefs', 'low');
      toastUtils.error(t('settingsError'), t('preferenceError'));
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
      toastUtils.error(t('clearError'), t('clearErrorMsg'));
    } finally {
      setClearing(false);
      if (cleared) {
        setShowClearConfirm(false);
        toastUtils.success(
          t('dataCleared'),
          t('dataClearedMsg'),
        );
      }
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-mq-3xl font-bold text-mq-content mb-2">{t('settingsTitle')}</h1>
        <p className="text-mq-content-secondary">{t('settingsSubtitle')}</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('notifications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg hover:bg-mq-hover-background transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-mq-content-tertiary" />
                  <div>
                    <p className="text-mq-sm font-medium text-mq-content">{t('deadlineReminders')}</p>
                    <p className="text-mq-sm text-mq-content-secondary mt-1">{t('deadlineRemindersDesc')}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNotificationPreference('deadlines', !notifications.deadlines)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationPreference('deadlines', !notifications.deadlines);
                    }
                  }}
                  className={`px-3 py-1 text-xs flex items-center gap-1 transition-colors focus:ring-2 focus:ring-mq-primary/50 ${notifications.deadlines ? 'bg-mq-success text-white hover:bg-mq-success/80' : 'bg-mq-error text-white hover:bg-mq-error/80'}`}
                  aria-label={`${t('deadlineReminders')} ${t('notifications').toLowerCase()} ${t('are')} ${notifications.deadlines ? t('enabled') : t('disabled')}. ${t('clickTo')} ${notifications.deadlines ? t('disable').toLowerCase() : t('enable').toLowerCase()}`}
                  aria-pressed={notifications.deadlines}
                >
                  {notifications.deadlines ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      {t('enabled')}
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      {t('disabled')}
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
                    <p className="text-mq-sm font-medium text-mq-content">{t('classReminders')}</p>
                    <p className="text-mq-sm text-mq-content-secondary mt-1">{t('classRemindersDesc')}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNotificationPreference('classes', !notifications.classes)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationPreference('classes', !notifications.classes);
                    }
                  }}
                  className={`px-3 py-1 text-xs flex items-center gap-1 transition-colors focus:ring-2 focus:ring-mq-primary/50 ${notifications.classes ? 'bg-mq-success text-white hover:bg-mq-success/80' : 'bg-mq-error text-white hover:bg-mq-error/80'}`}
                  aria-label={`${t('classReminders')} ${t('notifications').toLowerCase()} ${t('are')} ${notifications.classes ? t('enabled') : t('disabled')}. ${t('clickTo')} ${notifications.classes ? t('disable').toLowerCase() : t('enable').toLowerCase()}`}
                  aria-pressed={notifications.classes}
                >
                  {notifications.classes ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      {t('enabled')}
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      {t('disabled')}
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
                    <p className="text-mq-sm font-medium text-mq-content">{t('eventUpdates')}</p>
                    <p className="text-mq-sm text-mq-content-secondary mt-1">{t('eventUpdatesDesc')}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNotificationPreference('events', !notifications.events)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationPreference('events', !notifications.events);
                    }
                  }}
                  className={`px-3 py-1 text-xs flex items-center gap-1 transition-colors focus:ring-2 focus:ring-mq-primary/50 ${notifications.events ? 'bg-mq-success text-white hover:bg-mq-success/80' : 'bg-mq-error text-white hover:bg-mq-error/80'}`}
                  aria-label={`${t('eventUpdates')} ${t('notifications').toLowerCase()} ${t('are')} ${notifications.events ? t('enabled') : t('disabled')}. ${t('clickTo')} ${notifications.events ? t('disable').toLowerCase() : t('enable').toLowerCase()}`}
                  aria-pressed={notifications.events}
                >
                  {notifications.events ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      {t('enabled')}
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      {t('disabled')}
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
              {t('appearance')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg hover:bg-mq-hover-background transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-mq-content">{t('darkMode')}</h4>
                  <p className="text-mq-sm text-mq-content-secondary">
                    {t('current')}: {theme === 'system' ? `${t('system')} (${resolvedTheme})` : resolvedTheme}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme('light')}
                    className={`px-3 py-1 text-xs ${theme === 'light' ? 'bg-mq-primary text-white' : 'text-mq-content-secondary'}`}
                  >
                    {t('light')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme('system')}
                    className={`px-3 py-1 text-xs ${theme === 'system' ? 'bg-mq-primary text-white' : 'text-mq-content-secondary'}`}
                  >
                    {t('system')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className={`px-3 py-1 text-xs ${theme === 'dark' ? 'bg-mq-primary text-white' : 'text-mq-content-secondary'}`}
                  >
                    {t('dark')}
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg hover:bg-mq-hover-background transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-mq-content">{t('language')}</h4>
                  <p className="text-mq-sm text-mq-content-secondary">
                    {t('current')}: {language === 'en' ? t('english') : language === 'es' ? t('spanish') : t('persian')}
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
                    aria-label={`${t('switchToEnglish')}${language === 'en' ? ` ${t('currentlySelected')}` : ''}`}
                  >
                    {t('english')}
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
                    aria-label={`${t('switchToSpanish')}${language === 'es' ? ` ${t('currentlySelected')}` : ''}`}
                  >
                    {t('spanish')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLanguageChange('fa')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleLanguageChange('fa');
                      }
                    }}
                    className={`px-3 py-1 text-xs transition-colors focus:ring-2 focus:ring-mq-primary/50 ${language === 'fa' ? 'bg-mq-primary text-white' : 'text-mq-content-secondary hover:bg-mq-primary/10'}`}
                    aria-pressed={language === 'fa'}
                    aria-label={`${t('switchToPersian')}${language === 'fa' ? ` ${t('currentlySelected')}` : ''}`}
                  >
                    {t('persian')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLanguageChange('zh')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleLanguageChange('zh');
                      }
                    }}
                    className={`px-3 py-1 text-xs transition-colors focus:ring-2 focus:ring-mq-primary/50 ${language === 'zh' ? 'bg-mq-primary text-white' : 'text-mq-content-secondary hover:bg-mq-primary/10'}`}
                    aria-pressed={language === 'zh'}
                    aria-label={`${t('switchToChinese')}${language === 'zh' ? ` ${t('currentlySelected')}` : ''}`}
                  >
                    {t('chinese')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLanguageChange('ar')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleLanguageChange('ar');
                      }
                    }}
                    className={`px-3 py-1 text-xs transition-colors focus:ring-2 focus:ring-mq-primary/50 ${language === 'ar' ? 'bg-mq-primary text-white' : 'text-mq-content-secondary hover:bg-mq-primary/10'}`}
                    aria-pressed={language === 'ar'}
                    aria-label={`${t('switchToArabic')}${language === 'ar' ? ` ${t('currentlySelected')}` : ''}`}
                  >
                    {t('arabic')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLanguageChange('hi')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleLanguageChange('hi');
                      }
                    }}
                    className={`px-3 py-1 text-xs transition-colors focus:ring-2 focus:ring-mq-primary/50 ${language === 'hi' ? 'bg-mq-primary text-white' : 'text-mq-content-secondary hover:bg-mq-primary/10'}`}
                    aria-pressed={language === 'hi'}
                    aria-label={`${t('switchToHindi')}${language === 'hi' ? ` ${t('currentlySelected')}` : ''}`}
                  >
                    {t('hindi')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLanguageChange('ko')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleLanguageChange('ko');
                      }
                    }}
                    className={`px-3 py-1 text-xs transition-colors focus:ring-2 focus:ring-mq-primary/50 ${language === 'ko' ? 'bg-mq-primary text-white' : 'text-mq-content-secondary hover:bg-mq-primary/10'}`}
                    aria-pressed={language === 'ko'}
                    aria-label={`${t('switchToKorean')}${language === 'ko' ? ` ${t('currentlySelected')}` : ''}`}
                  >
                    {t('korean')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLanguageChange('ja')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleLanguageChange('ja');
                      }
                    }}
                    className={`px-3 py-1 text-xs transition-colors focus:ring-2 focus:ring-mq-primary/50 ${language === 'ja' ? 'bg-mq-primary text-white' : 'text-mq-content-secondary hover:bg-mq-primary/10'}`}
                    aria-pressed={language === 'ja'}
                    aria-label={`${t('switchToJapanese')}${language === 'ja' ? ` ${t('currentlySelected')}` : ''}`}
                  >
                    {t('japanese')}
                  </Button>
                  <Button
                    variant={language === 'ur' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleLanguageChange('ur')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleLanguageChange('ur');
                      }
                    }}
                    className={`px-3 py-1 text-xs transition-colors focus:ring-2 focus:ring-mq-primary/50 ${language === 'ur' ? 'bg-mq-primary text-white' : 'text-mq-content-secondary hover:bg-mq-primary/10'}`}
                    aria-pressed={language === 'ur'}
                    aria-label={`${t('switchToUrdu')}${language === 'ur' ? ` ${t('currentlySelected')}` : ''}`}
                  >
                    {t('urdu')}
                  </Button>
                  <Button
                    variant={language === 'th' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleLanguageChange('th')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleLanguageChange('th');
                      }
                    }}
                    className={`px-3 py-1 text-xs transition-colors focus:ring-2 focus:ring-mq-primary/50 ${language === 'th' ? 'bg-mq-primary text-white' : 'text-mq-content-secondary hover:bg-mq-primary/10'}`}
                    aria-pressed={language === 'th'}
                    aria-label={`${t('switchToThai')}${language === 'th' ? ` ${t('currentlySelected')}` : ''}`}
                  >
                    {t('thai')}
                  </Button>
                  <Button
                    variant={language === 'vi' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleLanguageChange('vi')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleLanguageChange('vi');
                      }
                    }}
                    className={`px-3 py-1 text-xs transition-colors focus:ring-2 focus:ring-mq-primary/50 ${language === 'vi' ? 'bg-mq-primary text-white' : 'text-mq-content-secondary hover:bg-mq-primary/10'}`}
                    aria-pressed={language === 'vi'}
                    aria-label={`${t('switchToVietnamese')}${language === 'vi' ? ` ${t('currentlySelected')}` : ''}`}
                  >
                    {t('vietnamese')}
                  </Button>
                  <Button
                    variant={language === 'ru' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleLanguageChange('ru')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleLanguageChange('ru');
                      }
                    }}
                    className={`px-3 py-1 text-xs transition-colors focus:ring-2 focus:ring-mq-primary/50 ${language === 'ru' ? 'bg-mq-primary text-white' : 'text-mq-content-secondary hover:bg-mq-primary/10'}`}
                    aria-pressed={language === 'ru'}
                    aria-label={`${t('switchToRussian')}${language === 'ru' ? ` ${t('currentlySelected')}` : ''}`}
                  >
                    {t('russian')}
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
              {t('privacySecurity')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg hover:bg-mq-hover-background transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-mq-content">{t('dataStorage')}</h4>
                  <p className="text-mq-sm text-mq-content-secondary">
                    {storageEnabled ? t('dataStorageDesc') : 'Storage disabled (Session only)'}
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={storageEnabled}
                  onClick={() => {
                    if (storageEnabled) {
                      toastUtils.info('Local Storage', 'Disabling local storage is not recommended as your data will not be saved.');
                      // Optional: setStorageEnabled(false);
                    } else {
                      setStorageEnabled(true);
                      toastUtils.success('Storage Enabled', 'Your data will be saved locally.');
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-primary focus-visible:ring-offset-2 ${storageEnabled ? 'bg-mq-success' : 'bg-mq-background-tertiary'
                    }`}
                >
                  <span className="sr-only">{t('toggleStorage')}</span>
                  <span
                    className={`${storageEnabled ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              </div>
            </div>
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg hover:bg-mq-hover-background transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-mq-content">{t('exportData')}</h4>
                  <p className="text-mq-sm text-mq-content-secondary">{t('exportDataDesc')}</p>
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
                      toastUtils.success(t('exportComplete'), t('exportCompleteMsg'));
                    } catch (error) {
                      errorHandler.logError(
                        error instanceof Error ? error : new Error('Failed to export data'),
                        'Settings Export Data',
                        'medium'
                      );
                      toastUtils.error(t('exportFailed'), t('exportFailedMsg'));
                    }
                  }}
                  aria-label={t('exportDataDesc')}
                >
                  {t('export')}
                </Button>
              </div>
            </div>
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg hover:bg-mq-hover-background transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-mq-content">{t('clearAllData')}</h4>
                  <p className="text-mq-sm text-mq-content-secondary">{t('clearAllDataDesc')}</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleClearAllData}
                  disabled={clearing}
                  className="flex items-center gap-2"
                >
                  {clearing && <Loader2 className="h-3 w-3 animate-spin" />}
                  {clearing ? t('clearing') : t('clearData')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="secondary" className="w-full justify-start" asChild>
              <Link href="/home">{t('homeDashboard')}</Link>
            </Button>
            <Button variant="secondary" className="w-full justify-start" asChild>
              <Link href="/calendar">{t('calendarView')}</Link>
            </Button>
            <Button variant="secondary" className="w-full justify-start" asChild>
              <Link href="/feed">{t('eventsFeed')}</Link>
            </Button>
            <Button variant="secondary" className="w-full justify-start" asChild>
              <Link href="/map">{t('campusMap')}</Link>
            </Button>
            <Button variant="secondary" className="w-full justify-start" asChild>
              <Link href="/manage-profiles">{t('manageProfiles')}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {t('helpSupport')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg">
              <h4 className="font-semibold text-mq-content mb-1">{t('aboutTitle')}</h4>
              <p className="text-mq-sm text-mq-content-secondary">
                {t('version')} {APP_CONFIG.version} - {t('aboutDesc')}
              </p>
            </div>
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg">
              <h4 className="font-semibold text-mq-content mb-1">{t('needHelp')}</h4>
              <p className="text-mq-sm text-mq-content-secondary mb-2">
                {t('helpDesc')}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  toastUtils.info(t('viewDocumentation'), t('documentationOpening'));
                  // In a real app, this would open documentation
                  setTimeout(() => {
                    toastUtils.success(t('viewDocumentation'), t('documentationMsg'));
                  }, 1500);
                }}
                aria-label={t('viewDocumentation').toLowerCase()}
              >
                {t('viewDocumentation')}
              </Button>
            </div>
            <div className="p-3 bg-mq-background-secondary rounded-mq-lg">
              <h4 className="font-semibold text-mq-content mb-1">{t('feedback')}</h4>
              <p className="text-mq-sm text-mq-content-secondary mb-2">
                {t('feedbackDesc')}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  toastUtils.info(t('feedback'), t('feedbackPreparing'));
                  setTimeout(() => {
                    toastUtils.success(t('feedbackThankYou'), t('feedbackMsg'));
                  }, 1500);
                }}
                aria-label={t('sendFeedback').toLowerCase()}
              >
                {t('sendFeedback')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('clearAllDataTitle')}</DialogTitle>
            <DialogDescription>
              {t('clearAllDataDialogDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowClearConfirm(false)}>
              {t('cancel')}
            </Button>
            <Button variant="primary" onClick={confirmClearAllData} disabled={clearing}>
              {clearing ? t('clearing') : t('clearAllDataTitle')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { useTranslation } from '@/lib/hooks/useTranslation';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useThemeStore } from '@/lib/store/themeStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { APP_CONFIG, EXTERNAL_LINKS } from '@/lib/config';
import { errorHandler } from '@/lib/utils/errorHandling';
import { toastUtils } from '@/lib/utils/toast';

import {
  Bell,
  Calendar,
  CheckCircle,
  Info,
  Loader2,
  Palette,
  Shield,
  XCircle,
  Mail,
  Download,
  Trash2,
  Lock,
  Key,
  LogOut,
  User,
} from 'lucide-react';

const languageNames: Record<string, string> = {
  en: 'English',
  es: 'Español',
  fa: 'فارسی',
  zh: '中文',
  ar: 'العربية',
  hi: 'हिन्दी',
  ko: '한국어',
  ja: '日本語',
  ur: 'اردو',
  th: 'ไทย',
  vi: 'Tiếng Việt',
  ru: 'Русский',
  ta: 'தமிழ்',
  bn: 'বাংলা',
  id: 'Bahasa Indonesia',
  ms: 'Bahasa Melayu',
  it: 'Italiano',
  fr: 'Français',
  he: 'עברית',
};

export default function SettingsPage() {
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');

  const units = useUnitsStore((state) => state.units);
  const removeUnit = useUnitsStore((state) => state.removeUnit);
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const removeDeadline = useDeadlinesStore((state) => state.removeDeadline);

  const { theme, resolvedTheme, setTheme } = useThemeStore();
  const { t, language, setLanguage } = useTranslation();

  const [notifications, setNotifications] = useState({
    deadlines: true,
    classes: true,
    events: true,
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const getVal = (key: string) => {
          const val = localStorage.getItem(`notification-${key}`);
          return val === null ? true : val === 'true';
        };
        setNotifications({
          deadlines: getVal('deadlines'),
          classes: getVal('classes'),
          events: getVal('events'),
        });
      }
    } catch {}
  }, []);

  const handleLanguageChange = (
    newLanguage:
      | 'en'
      | 'es'
      | 'fr'
      | 'it'
      | 'zh'
      | 'ja'
      | 'ko'
      | 'vi'
      | 'hi'
      | 'ur'
      | 'bn'
      | 'ta'
      | 'th'
      | 'id'
      | 'ms'
      | 'fa'
      | 'ru'
      | 'ar'
      | 'he',
  ) => {
    if (newLanguage === language) return;
    setLanguage(newLanguage);

    const displayName = languageNames[newLanguage] || newLanguage;
    toastUtils.success(t('languageUpdated'), `${t('languageUpdatedMsg')} ${displayName}`);
  };

  const handleNotificationPreference = (type: keyof typeof notifications, enabled: boolean) => {
    try {
      setNotifications((prev) => ({ ...prev, [type]: enabled }));

      if (typeof window !== 'undefined') {
        localStorage.setItem(`notification-${type}`, enabled.toString());

        const typeLabels: Record<string, string> = {
          deadlines: t('deadlineReminders'),
          classes: t('classReminders'),
          events: t('eventUpdates'),
        };

        toastUtils.success(
          t('preferenceUpdated'),
          `${typeLabels[type] || type} ${enabled ? t('enabled').toLowerCase() : t('disabled').toLowerCase()}`,
        );
      }
    } catch (error) {
      errorHandler.logError(error as Error, 'Notification Prefs', 'low');
      toastUtils.error(t('settingsError'), t('preferenceError'));
    }
  };

  const handleClearAllData = () => {
    setClearConfirmText('');
    setShowClearConfirm(true);
  };

  const confirmClearAllData = () => {
    if (clearConfirmText !== 'CLEAR') {
      toastUtils.error(t('clearDataConfirmRequired'), '');
      return;
    }

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
        ['deadlines', 'classes', 'events'].forEach((k) =>
          localStorage.removeItem(`notification-${k}`),
        );
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
        toastUtils.success(t('dataCleared'), t('dataClearedMsg'));
      }
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        units,
        deadlines,
        preferences: {
          theme,
          language,
          notifications: {
            deadlines:
              typeof window !== 'undefined'
                ? localStorage.getItem('notification-deadlines') === 'true'
                : true,
            classes:
              typeof window !== 'undefined'
                ? localStorage.getItem('notification-classes') === 'true'
                : true,
            events:
              typeof window !== 'undefined'
                ? localStorage.getItem('notification-events') === 'true'
                : true,
          },
        },
        exportedAt: new Date().toISOString(),
        version: '1.0',
        appVersion: APP_CONFIG.version,
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
        'medium',
      );
      toastUtils.error(t('exportFailed'), t('exportFailedMsg'));
    }
  };

  return (
    <div className="settings-page container mx-auto p-6 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-mq-3xl font-bold text-mq-content mb-2">{t('settingsTitle')}</h1>
        <p className="text-mq-content-secondary">{t('settingsSubtitle')}</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        <div className="mq-magic-card">
          <Card className="mq-magic-card-content">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('notifications')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  key: 'deadlines',
                  icon: Mail,
                  label: t('deadlineReminders'),
                  desc: t('deadlineRemindersDesc'),
                },
                {
                  key: 'classes',
                  icon: Calendar,
                  label: t('classReminders'),
                  desc: t('classRemindersDesc'),
                },
                {
                  key: 'events',
                  icon: Info,
                  label: t('eventUpdates'),
                  desc: t('eventUpdatesDesc'),
                },
              ].map(({ key, icon: Icon, label, desc }) => (
                <div
                  key={key}
                  className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-mq-content-tertiary" />
                      <div>
                        <p className="text-mq-sm font-medium text-mq-content">{label}</p>
                        <p className="text-mq-sm text-mq-content-secondary mt-1">{desc}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleNotificationPreference(
                          key as keyof typeof notifications,
                          !notifications[key as keyof typeof notifications],
                        )
                      }
                      className={`px-3 py-1 text-xs flex items-center gap-1 transition-colors focus:ring-2 focus:ring-mq-primary/50 ${notifications[key as keyof typeof notifications] ? 'bg-mq-success text-white hover:bg-mq-success/80' : 'bg-mq-error text-white hover:bg-mq-error/80'}`}
                      aria-label={`${label} ${t('notifications').toLowerCase()} ${t('are')} ${notifications[key as keyof typeof notifications] ? t('enabled') : t('disabled')}. ${t('clickTo')} ${notifications[key as keyof typeof notifications] ? t('disable').toLowerCase() : t('enable').toLowerCase()}`}
                      aria-pressed={notifications[key as keyof typeof notifications]}
                    >
                      {notifications[key as keyof typeof notifications] ? (
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
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="mq-magic-card">
          <Card className="mq-magic-card-content">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                {t('appearance')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-mq-content">{t('darkMode')}</h4>
                    <p className="text-mq-sm text-mq-content-secondary">
                      {t('current')}:{' '}
                      {theme === 'system' ? `${t('system')} (${resolvedTheme})` : resolvedTheme}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(['light', 'system', 'dark'] as const).map((mode) => (
                      <Button
                        key={mode}
                        variant="ghost"
                        size="sm"
                        onClick={() => setTheme(mode)}
                        className={`px-3 py-1 text-xs ${theme === mode ? 'bg-mq-primary text-white' : 'text-mq-content-secondary'}`}
                      >
                        {t(mode)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-mq-content">{t('language')}</h4>
                    <p className="text-mq-sm text-mq-content-secondary">
                      {t('current')}: {languageNames[language] || language}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 max-w-[200px]">
                    {(
                      [
                        'en',
                        'es',
                        'fr',
                        'it',
                        'zh',
                        'ja',
                        'ko',
                        'vi',
                        'hi',
                        'ur',
                        'bn',
                        'ta',
                        'th',
                        'id',
                        'ms',
                        'fa',
                        'ru',
                        'ar',
                        'he',
                      ] as const
                    ).map((lang) => (
                      <Button
                        key={lang}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLanguageChange(lang)}
                        className={`px-2 py-1 text-xs transition-colors focus:ring-2 focus:ring-mq-primary/50 ${language === lang ? 'bg-mq-primary text-white' : 'text-mq-content-secondary hover:bg-mq-primary/10'}`}
                        aria-pressed={language === lang}
                        aria-label={`Switch to ${languageNames[lang]}`}
                      >
                        {lang.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mq-magic-card">
          <Card className="mq-magic-card-content">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('privacySecurity')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-mq-content">{t('dataRetention')}</h4>
                    <p className="text-mq-sm text-mq-content-secondary">{t('dataRetentionDesc')}</p>
                  </div>
                  <Lock className="h-4 w-4 text-mq-success" />
                </div>
              </div>

              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-mq-content">{t('encryptionNote')}</h4>
                  </div>
                  <Key className="h-4 w-4 text-mq-success" />
                </div>
              </div>

              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-mq-content">{t('changePassword')}</h4>
                    <p className="text-mq-sm text-mq-content-secondary">
                      {t('changePasswordDesc')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                    onClick={() => toastUtils.info(t('changePassword'), t('comingSoon'))}
                  >
                    {t('changePassword')}
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-mq-content">{t('manageSessions')}</h4>
                    <p className="text-mq-sm text-mq-content-secondary">
                      {t('manageSessionsDesc')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                    onClick={() => toastUtils.info(t('manageSessions'), t('comingSoon'))}
                  >
                    {t('manageSessions')}
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-mq-content">{t('privacyPolicy')}</h4>
                    <p className="text-mq-sm text-mq-content-secondary">{t('privacyPolicy')}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                    onClick={() =>
                      window.open(EXTERNAL_LINKS.privacy, '_blank', 'noopener,noreferrer')
                    }
                  >
                    {t('view')}
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-mq-content">{t('exportData')}</h4>
                    <p className="text-mq-sm text-mq-content-secondary">{t('exportDataDesc')}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                    onClick={handleExportData}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('export')}
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-mq-content">{t('clearAllData')}</h4>
                    <p className="text-mq-sm text-mq-content-secondary">{t('clearAllDataDesc')}</p>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleClearAllData}
                    disabled={clearing}
                    className="flex items-center gap-2"
                  >
                    {clearing && <Loader2 className="h-3 w-3 animate-spin" />}
                    <Trash2 className="h-3 w-3" />
                    {clearing ? t('clearing') : t('clearData')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="mq-magic-card">
            <Card className="mq-magic-card-content">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t('account')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border">
                  <h4 className="font-semibold text-mq-content mb-1">{t('signedInAs')}</h4>
                  <p className="text-mq-sm text-mq-content-secondary">{t('guest')}</p>
                </div>

                <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-mq-content">{t('signOut')}</h4>
                      <p className="text-mq-sm text-mq-content-secondary">{t('signOut')}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                      onClick={() => toastUtils.info(t('signOut'), t('comingSoon'))}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('signOut')}
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-mq-content">{t('deleteAccount')}</h4>
                      <p className="text-mq-sm text-mq-content-secondary">
                        {t('deleteAccountWarning')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-mq-error/10 text-mq-error hover:bg-mq-error/20"
                      onClick={() => toastUtils.info(t('deleteAccount'), t('comingSoon'))}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('delete')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mq-magic-card">
            <Card className="mq-magic-card-content">
              <CardHeader>
                <CardTitle>{t('quickActions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { href: '/home', label: t('homeDashboard') },
                  { href: '/calendar', label: t('calendarView') },
                  { href: '/feed', label: t('eventsFeed') },
                  { href: '/map', label: t('campusMap') },
                  { href: '/manage-profiles', label: t('manageProfiles') },
                ].map(({ href, label }) => (
                  <Button
                    key={href}
                    variant="ghost"
                    className="w-full justify-start bg-mq-card-background hover:bg-mq-hover-background text-mq-content border border-mq-border"
                    asChild
                  >
                    <Link href={href}>{label}</Link>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="mq-magic-card">
          <Card className="mq-magic-card-content">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                {t('helpSupport')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border">
                <h4 className="font-semibold text-mq-content mb-1">{t('aboutTitle')}</h4>
                <p className="text-mq-sm text-mq-content-secondary">
                  {t('version')} {APP_CONFIG.version} - {t('aboutDesc')}
                </p>
              </div>
              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
                <h4 className="font-semibold text-mq-content mb-1">{t('needHelp')}</h4>
                <p className="text-mq-sm text-mq-content-secondary mb-2">{t('helpDesc')}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                  onClick={() => {
                    toastUtils.info(t('viewDocumentation'), t('documentationOpening'));
                    setTimeout(() => {
                      window.open(EXTERNAL_LINKS.documentation, '_blank', 'noopener,noreferrer');
                    }, 500);
                  }}
                >
                  {t('viewDocumentation')}
                </Button>
              </div>
              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
                <h4 className="font-semibold text-mq-content mb-1">{t('feedback')}</h4>
                <p className="text-mq-sm text-mq-content-secondary mb-2">{t('feedbackDesc')}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                  onClick={() => {
                    toastUtils.info(t('feedback'), t('feedbackPreparing'));
                    setTimeout(() => {
                      window.location.href = EXTERNAL_LINKS.feedback;
                    }, 500);
                  }}
                >
                  {t('sendFeedback')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('clearAllDataTitle')}</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>{t('clearAllDataDialogDesc')}</p>
              <p className="text-mq-error font-medium">{t('exportReminder')}</p>
              <p className="text-mq-sm text-mq-content-secondary">
                {t('clearDataSummary')
                  .replace('{{units}}', units.length.toString())
                  .replace('{{deadlines}}', deadlines.length.toString())}
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={t('clearDataConfirmPlaceholder')}
              value={clearConfirmText}
              onChange={(e) => setClearConfirmText(e.target.value)}
              className="text-center"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowClearConfirm(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="default"
              onClick={confirmClearAllData}
              disabled={clearing || clearConfirmText !== 'CLEAR'}
            >
              {clearing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {clearing ? t('clearing') : t('clearAllDataTitle')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

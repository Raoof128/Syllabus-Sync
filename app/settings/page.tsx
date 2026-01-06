'use client';

import Link from 'next/link';
import { useState } from 'react';

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
  Palette,
  Shield,
  XCircle,
  Mail,
  Download,
} from 'lucide-react';

type SessionInfo = { id: string; device: string; lastActive: string; current: boolean };

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
  const units = useUnitsStore((state) => state.units);
  const deadlines = useDeadlinesStore((state) => state.deadlines);

  const { theme, resolvedTheme, setTheme } = useThemeStore();
  const { t, language, setLanguage } = useTranslation();

  const [sessions, setSessions] = useState<SessionInfo[]>(() => {
    if (typeof window === 'undefined') return [];

    const getDeviceLabel = () => {
      const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } })
        ?.userAgentData;
      const platform = uaData?.platform || navigator.platform || 'This device';
      const ua = navigator.userAgent;
      const browserMatch = ua.match(/(Firefox|Edg|Chrome|Safari)/);
      const browser = browserMatch ? browserMatch[0] : 'Browser';
      return `${platform} · ${browser}`;
    };

    try {
      const stored = window.localStorage.getItem('mq-sessions');
      const parsed = stored ? (JSON.parse(stored) as SessionInfo[]) : [];
      const currentId = 'current-device';
      const now = new Date().toISOString();
      const currentSession: SessionInfo = {
        id: currentId,
        device: getDeviceLabel(),
        lastActive: now,
        current: true,
      };

      const existingIndex = parsed.findIndex((s) => s.id === currentId);
      const nextSessions =
        existingIndex >= 0
          ? parsed.map((s, idx) => (idx === existingIndex ? currentSession : s))
          : [...parsed, currentSession];

      window.localStorage.setItem('mq-sessions', JSON.stringify(nextSessions));
      return nextSessions;
    } catch (error) {
      errorHandler.logError(error as Error, 'Sessions bootstrap', 'low');
      return [];
    }
  });
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    if (typeof window === 'undefined') {
      return { deadlines: true, classes: true, events: true };
    }
    const getVal = (key: string) => {
      const val = localStorage.getItem(`notification-${key}`);
      return val === null ? true : val === 'true';
    };
    return {
      deadlines: getVal('deadlines'),
      classes: getVal('classes'),
      events: getVal('events'),
    };
  });

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

  const openSessions = () => {
    if (typeof window !== 'undefined') {
      setShowSessionsDialog(true);
    }
  };

  const endSession = (id: string) => {
    try {
      setSessions((prev) => {
        const remaining = prev.filter((session) => session.id !== id || session.current);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('mq-sessions', JSON.stringify(remaining));
        }
        return remaining;
      });
      toastUtils.success(t('manageSessions'), t('preferenceUpdated'));
    } catch (error) {
      errorHandler.logError(error as Error, 'End session', 'medium');
      toastUtils.error(t('settingsError'), t('preferenceError'));
    }
  };

  const endAllSessions = () => {
    try {
      const currentOnly = sessions.filter((s) => s.current);
      setSessions(currentOnly);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('mq-sessions', JSON.stringify(currentOnly));
      }
      toastUtils.success(t('manageSessions'), t('preferenceUpdated'));
    } catch (error) {
      errorHandler.logError(error as Error, 'End all sessions', 'medium');
      toastUtils.error(t('settingsError'), t('preferenceError'));
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
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
                    onClick={openSessions}
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

            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
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

      <Dialog open={showSessionsDialog} onOpenChange={setShowSessionsDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('manageSessions')}</DialogTitle>
            <DialogDescription>{t('manageSessionsDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-mq-sm text-mq-content-secondary">No sessions to show.</p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-mq-lg border border-mq-border bg-mq-card-background px-3 py-2"
                >
                  <div>
                    <p className="font-semibold text-mq-content">
                      {session.current ? t('current') : t('manageSessions')}
                    </p>
                    <p className="text-mq-sm text-mq-content-secondary">{session.device}</p>
                    <p className="text-mq-xs text-mq-content-tertiary">
                      Last active: {new Date(session.lastActive).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                    disabled={session.current}
                    onClick={() => endSession(session.id)}
                  >
                    {t('signOut')}
                  </Button>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              size="sm"
              disabled={sessions.length === 0}
              onClick={endAllSessions}
            >
              Sign out all sessions
            </Button>
            <Button variant="secondary" onClick={() => setShowSessionsDialog(false)}>
              {t('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Trophy, Flame, Star, RotateCcw } from 'lucide-react';
import { toastUtils } from '@/lib/utils/toast';
import { MagicCard } from '@/components/ui/MagicCard';
import { useGamificationStore } from '@/lib/store/gamificationStore';
import { getLevelTier } from '@/lib/types';
import type { TranslationKey } from '@/lib/i18n/translations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type GamificationSettingsProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const GamificationSettings = memo(({ t }: GamificationSettingsProps) => {
  const { profile, settings, updateSettings, getLevelTitle, getStreakEmoji } =
    useGamificationStore();
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleToggleSetting = useCallback(
    (
      key:
        | 'showXPNotifications'
        | 'showLevelUpNotifications'
        | 'showStreakReminders'
        | 'displayOnProfile',
    ) => {
      const newValue = !settings[key];
      updateSettings({ [key]: newValue });
      toastUtils.success(
        t('preferenceUpdated'),
        `${t(key as TranslationKey)} ${newValue ? t('enabled') : t('disabled')}`,
      );
    },
    [settings, updateSettings, t],
  );

  const handleResetProgress = useCallback(() => {
    // Reset the gamification store profile to defaults
    // Note: This only resets local state. Server-side reset would need API call
    useGamificationStore.setState({
      profile: {
        xp: 0,
        level: 1,
        streakDays: 0,
        longestStreak: 0,
        lastActivityDate: null,
        xpToNextLevel: 25,
        xpForCurrentLevel: 0,
        levelProgress: 0,
      },
      recentEvents: [],
    });
    setShowResetDialog(false);
    toastUtils.success(t('progressReset'), t('progressResetMsg'));
  }, [t]);

  const levelTier = profile ? getLevelTier(profile.level) : 'bronze';
  const tierColors: Record<string, string> = {
    bronze: 'text-amber-600',
    silver: 'text-gray-400',
    gold: 'text-yellow-500',
    platinum: 'text-cyan-400',
    diamond: 'text-purple-400',
  };

  return (
    <>
      <MagicCard data-testid="gamification-settings">
        <Card className="mq-magic-card-content">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-mq-primary" aria-hidden="true" />
              <span id="gamification-heading">{t('gamification')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3" role="region" aria-labelledby="gamification-heading">
            {/* Current Progress Display */}
            <div className="p-3 bg-mq-card-background/50 backdrop-blur-sm rounded-mq-lg border border-mq-border">
              <h3 className="font-semibold text-mq-content mb-3">{t('yourProgress')}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Star className={`h-4 w-4 ${tierColors[levelTier]}`} aria-hidden="true" />
                  <div>
                    <p className="text-mq-sm text-mq-content-secondary">{t('level')}</p>
                    <p className="font-semibold text-mq-content">
                      {profile?.level ?? 1} - {getLevelTitle()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-mq-primary" aria-hidden="true" />
                  <div>
                    <p className="text-mq-sm text-mq-content-secondary">{t('totalXP')}</p>
                    <p className="font-semibold text-mq-content">{profile?.xp ?? 0} XP</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" aria-hidden="true" />
                  <div>
                    <p className="text-mq-sm text-mq-content-secondary">{t('currentStreak')}</p>
                    <p className="font-semibold text-mq-content">
                      {profile?.streakDays ?? 0} {t('day')}s {getStreakEmoji()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-yellow-500" aria-hidden="true" />
                  <div>
                    <p className="text-mq-sm text-mq-content-secondary">{t('longestStreak')}</p>
                    <p className="font-semibold text-mq-content">
                      {profile?.longestStreak ?? 0} {t('day')}s
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* XP Notifications Toggle */}
            <div className="p-3 bg-mq-card-background/50 backdrop-blur-sm rounded-mq-lg border border-mq-border hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-mq-content">{t('showXPNotifications')}</h3>
                  <p className="text-mq-sm text-mq-content-secondary">
                    {t('showXPNotificationsDesc')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleSetting('showXPNotifications')}
                  className={`px-3 py-1 text-xs ${
                    settings.showXPNotifications
                      ? 'bg-mq-primary text-white'
                      : 'text-mq-content-secondary'
                  }`}
                  aria-pressed={settings.showXPNotifications}
                  data-testid="toggle-xp-notifications"
                >
                  {settings.showXPNotifications ? t('enabled') : t('disabled')}
                </Button>
              </div>
            </div>

            {/* Level Up Notifications Toggle */}
            <div className="p-3 bg-mq-card-background/50 backdrop-blur-sm rounded-mq-lg border border-mq-border hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-mq-content">{t('showLevelUpNotifications')}</h3>
                  <p className="text-mq-sm text-mq-content-secondary">
                    {t('showLevelUpNotificationsDesc')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleSetting('showLevelUpNotifications')}
                  className={`px-3 py-1 text-xs ${
                    settings.showLevelUpNotifications
                      ? 'bg-mq-primary text-white'
                      : 'text-mq-content-secondary'
                  }`}
                  aria-pressed={settings.showLevelUpNotifications}
                  data-testid="toggle-levelup-notifications"
                >
                  {settings.showLevelUpNotifications ? t('enabled') : t('disabled')}
                </Button>
              </div>
            </div>

            {/* Streak Reminders Toggle */}
            <div className="p-3 bg-mq-card-background/50 backdrop-blur-sm rounded-mq-lg border border-mq-border hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-mq-content">{t('showStreakReminders')}</h3>
                  <p className="text-mq-sm text-mq-content-secondary">
                    {t('showStreakRemindersDesc')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleSetting('showStreakReminders')}
                  className={`px-3 py-1 text-xs ${
                    settings.showStreakReminders
                      ? 'bg-mq-primary text-white'
                      : 'text-mq-content-secondary'
                  }`}
                  aria-pressed={settings.showStreakReminders}
                  data-testid="toggle-streak-reminders"
                >
                  {settings.showStreakReminders ? t('enabled') : t('disabled')}
                </Button>
              </div>
            </div>

            {/* Display on Profile Toggle */}
            <div className="p-3 bg-mq-card-background/50 backdrop-blur-sm rounded-mq-lg border border-mq-border hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-mq-content">{t('displayOnProfile')}</h3>
                  <p className="text-mq-sm text-mq-content-secondary">
                    {t('displayOnProfileDesc')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleSetting('displayOnProfile')}
                  className={`px-3 py-1 text-xs ${
                    settings.displayOnProfile
                      ? 'bg-mq-primary text-white'
                      : 'text-mq-content-secondary'
                  }`}
                  aria-pressed={settings.displayOnProfile}
                  data-testid="toggle-display-profile"
                >
                  {settings.displayOnProfile ? t('enabled') : t('disabled')}
                </Button>
              </div>
            </div>

            {/* Reset Progress */}
            <div className="p-3 bg-mq-card-background/50 backdrop-blur-sm rounded-mq-lg border border-mq-border hover:border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-mq-content">{t('resetProgress')}</h3>
                  <p className="text-mq-sm text-mq-content-secondary">{t('resetProgressDesc')}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResetDialog(true)}
                  className="px-3 py-1 text-xs text-red-500 hover:bg-red-500/10"
                  data-testid="reset-progress-button"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  {t('reset')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </MagicCard>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('resetProgress')}</DialogTitle>
            <DialogDescription>{t('resetProgressConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowResetDialog(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetProgress}
              data-testid="confirm-reset-progress"
            >
              {t('reset')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

GamificationSettings.displayName = 'GamificationSettings';

export default GamificationSettings;

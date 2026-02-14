'use client';

import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Trophy, Flame, Star, RotateCcw } from 'lucide-react';
import { toastUtils } from '@/lib/utils/toast';
import { MagicCard } from '@/components/ui/MagicCard';
import { useGamificationStore } from '@/lib/store/gamificationStore';
import type { TranslationKey } from '@/lib/i18n/translations';
import type { GamificationSettings as GamificationSettingsType } from '@/lib/types';
import { GamificationToggleRow } from './GamificationToggleRow';
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
  const { profile, settings, updateSettings, getLevelTitle, getStreakEmoji, resetProgress } =
    useGamificationStore();
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleToggleSetting = useCallback(
    (key: keyof GamificationSettingsType) => {
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
    // Reset the gamification store profile to defaults using the store action
    // Note: This only resets local state. Server-side reset would need API call
    resetProgress();
    setShowResetDialog(false);
    toastUtils.success(t('progressReset'), t('progressResetMsg'));
  }, [t, resetProgress]);

  return (
    <>
      <MagicCard data-testid="gamification-settings">
        <Card className="mq-magic-card-content bg-mq-card-background border border-mq-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" aria-hidden="true" />
              <span id="gamification-heading">{t('gamification')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3" role="region" aria-labelledby="gamification-heading">
            {/* Current Progress Display */}
            <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border">
              <h3 className="font-semibold text-mq-content mb-3">{t('yourProgress')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" aria-hidden="true" />
                  <div>
                    <p className="text-mq-sm text-mq-content-secondary">{t('level')}</p>
                    <p className="font-semibold text-mq-content">
                      {profile?.level ?? 1} - {getLevelTitle()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" aria-hidden="true" />
                  <div>
                    <p className="text-mq-sm text-mq-content-secondary">{t('totalXP')}</p>
                    <p className="font-semibold text-mq-content">{profile?.xp ?? 0} XP</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4" aria-hidden="true" />
                  <div>
                    <p className="text-mq-sm text-mq-content-secondary">{t('currentStreak')}</p>
                    <p className="font-semibold text-mq-content">
                      {profile?.streakDays ?? 0}{' '}
                      {(profile?.streakDays ?? 0) === 1 ? t('day') : t('days')} {getStreakEmoji()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4" aria-hidden="true" />
                  <div>
                    <p className="text-mq-sm text-mq-content-secondary">{t('longestStreak')}</p>
                    <p className="font-semibold text-mq-content">
                      {profile?.longestStreak ?? 0}{' '}
                      {(profile?.longestStreak ?? 0) === 1 ? t('day') : t('days')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* XP Notifications Toggle */}
            <GamificationToggleRow
              settingKey="showXPNotifications"
              labelKey="showXPNotifications"
              descKey="showXPNotificationsDesc"
              enabled={settings.showXPNotifications}
              t={t}
              onToggle={handleToggleSetting}
              testId="toggle-xp-notifications"
            />

            {/* Level Up Notifications Toggle */}
            <GamificationToggleRow
              settingKey="showLevelUpNotifications"
              labelKey="showLevelUpNotifications"
              descKey="showLevelUpNotificationsDesc"
              enabled={settings.showLevelUpNotifications}
              t={t}
              onToggle={handleToggleSetting}
              testId="toggle-levelup-notifications"
            />

            {/* Streak Reminders Toggle */}
            <GamificationToggleRow
              settingKey="showStreakReminders"
              labelKey="showStreakReminders"
              descKey="showStreakRemindersDesc"
              enabled={settings.showStreakReminders}
              t={t}
              onToggle={handleToggleSetting}
              testId="toggle-streak-reminders"
            />

            {/* Display on Profile Toggle */}
            <GamificationToggleRow
              settingKey="displayOnProfile"
              labelKey="displayOnProfile"
              descKey="displayOnProfileDesc"
              enabled={settings.displayOnProfile}
              t={t}
              onToggle={handleToggleSetting}
              testId="toggle-display-profile"
            />

            {/* Reset Progress */}
            <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)] transition-all duration-300">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-mq-content">{t('resetProgress')}</h3>
                  <p className="text-mq-sm text-mq-content-secondary">{t('resetProgressDesc')}</p>
                  <p className="text-mq-xs text-mq-warning" id="reset-progress-caution">
                    {t('resetProgressConfirm')}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setShowResetDialog(true)}
                  aria-describedby="reset-progress-caution"
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

'use client';

import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Trophy, Flame, Star, RotateCcw } from 'lucide-react';
import { toastUtils } from '@/lib/utils/toast';
import { MagicCard } from '@/components/ui/MagicCard';
import { useGamificationStore } from '@/lib/store/gamificationStore';
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

type ToggleControlProps = {
  checked: boolean;
  onToggle: () => void;
  label: string;
  testId?: string;
};

const ToggleControl = ({ checked, onToggle, label, testId }: ToggleControlProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onToggle}
    className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mq-primary ${checked ? 'bg-mq-primary border-mq-primary' : 'bg-mq-background border-mq-border'}`}
    data-testid={testId}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : 'translate-x-1'}`}
      aria-hidden="true"
    />
  </button>
);

const GamificationSettings = memo(({ t }: GamificationSettingsProps) => {
  const { profile, settings, updateSettings, getLevelTitle, getStreakEmoji, resetProgress } =
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
              <div className="grid grid-cols-2 gap-3">
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
            <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-mq-content">{t('showXPNotifications')}</h3>
                  <p className="text-mq-sm text-mq-content-secondary">
                    {t('showXPNotificationsDesc')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ToggleControl
                    checked={settings.showXPNotifications}
                    onToggle={() => handleToggleSetting('showXPNotifications')}
                    label={t('showXPNotifications')}
                    testId="toggle-xp-notifications"
                  />
                  <span className="text-mq-xs text-mq-content-secondary">
                    {settings.showXPNotifications ? t('enabled') : t('disabled')}
                  </span>
                </div>
              </div>
            </div>

            {/* Level Up Notifications Toggle */}
            <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-mq-content">{t('showLevelUpNotifications')}</h3>
                  <p className="text-mq-sm text-mq-content-secondary">
                    {t('showLevelUpNotificationsDesc')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ToggleControl
                    checked={settings.showLevelUpNotifications}
                    onToggle={() => handleToggleSetting('showLevelUpNotifications')}
                    label={t('showLevelUpNotifications')}
                    testId="toggle-levelup-notifications"
                  />
                  <span className="text-mq-xs text-mq-content-secondary">
                    {settings.showLevelUpNotifications ? t('enabled') : t('disabled')}
                  </span>
                </div>
              </div>
            </div>

            {/* Streak Reminders Toggle */}
            <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-mq-content">{t('showStreakReminders')}</h3>
                  <p className="text-mq-sm text-mq-content-secondary">
                    {t('showStreakRemindersDesc')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ToggleControl
                    checked={settings.showStreakReminders}
                    onToggle={() => handleToggleSetting('showStreakReminders')}
                    label={t('showStreakReminders')}
                    testId="toggle-streak-reminders"
                  />
                  <span className="text-mq-xs text-mq-content-secondary">
                    {settings.showStreakReminders ? t('enabled') : t('disabled')}
                  </span>
                </div>
              </div>
            </div>

            {/* Display on Profile Toggle */}
            <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-mq-content">{t('displayOnProfile')}</h3>
                  <p className="text-mq-sm text-mq-content-secondary">
                    {t('displayOnProfileDesc')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ToggleControl
                    checked={settings.displayOnProfile}
                    onToggle={() => handleToggleSetting('displayOnProfile')}
                    label={t('displayOnProfile')}
                    testId="toggle-display-profile"
                  />
                  <span className="text-mq-xs text-mq-content-secondary">
                    {settings.displayOnProfile ? t('enabled') : t('disabled')}
                  </span>
                </div>
              </div>
            </div>

            {/* Reset Progress */}
            <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)] transition-all duration-300">
              <div className="flex items-center justify-between gap-3">
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

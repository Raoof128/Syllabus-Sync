'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useGamificationStore } from '@/lib/store/gamificationStore';
import { toastUtils } from '@/lib/utils/toast';
import { getLevelTier } from '@/lib/types';

// Translations for level-up messages
const LEVEL_UP_MESSAGES: Record<string, string> = {
  en: 'You reached Level',
  es: 'Alcanzaste el Nivel',
  ar: 'وصلت إلى المستوى',
  zh: '你达到了等级',
  fa: 'به سطح رسیدید',
  hi: 'आपने स्तर प्राप्त किया',
  ja: 'レベルに到達しました',
  ko: '레벨에 도달했습니다',
  ur: 'آپ نے سطح حاصل کی',
  th: 'คุณถึงระดับ',
  vi: 'Bạn đã đạt Cấp độ',
  ru: 'Вы достигли Уровня',
  ta: 'நீங்கள் நிலை அடைந்தீர்கள்',
  bn: 'আপনি স্তরে পৌঁছেছেন',
  id: 'Anda mencapai Level',
  ms: 'Anda mencapai Tahap',
  it: 'Hai raggiunto il Livello',
  fr: 'Vous avez atteint le Niveau',
  he: 'הגעת לרמה',
};

const CONGRATULATIONS: Record<string, string> = {
  en: 'Congratulations!',
  es: '¡Felicitaciones!',
  ar: 'تهانينا!',
  zh: '恭喜！',
  fa: 'تبریک!',
  hi: 'बधाई हो!',
  ja: 'おめでとうございます！',
  ko: '축하합니다!',
  ur: 'مبارک ہو!',
  th: 'ยินดีด้วย!',
  vi: 'Chúc mừng!',
  ru: 'Поздравляем!',
  ta: 'வாழ்த்துக்கள்!',
  bn: 'অভিনন্দন!',
  id: 'Selamat!',
  ms: 'Tahniah!',
  it: 'Congratulazioni!',
  fr: 'Félicitations!',
  he: 'מזל טוב!',
};

// Tier-specific celebration emojis
const TIER_EMOJIS: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '👑',
  master: '🏆',
};

interface LevelUpNotificationProviderProps {
  children: React.ReactNode;
  /** User's locale for localized messages */
  locale?: string;
}

/**
 * LevelUpNotificationProvider
 *
 * Monitors the gamification store for level changes and shows
 * celebratory notifications when the user levels up.
 *
 * Add this as a wrapper in your app layout to enable level-up notifications.
 */
export function LevelUpNotificationProvider({
  children,
  locale = 'en',
}: LevelUpNotificationProviderProps) {
  const profile = useGamificationStore((state) => state.profile);
  const settings = useGamificationStore((state) => state.settings);
  const getLevelTitle = useGamificationStore((state) => state.getLevelTitle);

  // Track previous level to detect changes
  const prevLevelRef = useRef<number | null>(null);
  const hasInitialized = useRef(false);

  const showLevelUpNotification = useCallback(
    (newLevel: number) => {
      const tier = getLevelTier(newLevel);
      const emoji = TIER_EMOJIS[tier] || '🎉';
      const title = getLevelTitle();

      // Get localized messages
      const congratsMsg = CONGRATULATIONS[locale] || CONGRATULATIONS.en;
      const levelMsg = LEVEL_UP_MESSAGES[locale] || LEVEL_UP_MESSAGES.en;

      toastUtils.success(`${emoji} ${congratsMsg}`, `${levelMsg} ${newLevel}! ${title}`);
    },
    [locale, getLevelTitle],
  );

  useEffect(() => {
    if (!profile || !settings.showLevelUpNotifications) {
      return;
    }

    const currentLevel = profile.level;

    // Skip first render - we don't want to show notification on initial load
    if (!hasInitialized.current) {
      prevLevelRef.current = currentLevel;
      hasInitialized.current = true;
      return;
    }

    // Detect level increase
    if (prevLevelRef.current !== null && currentLevel > prevLevelRef.current) {
      showLevelUpNotification(currentLevel);
    }

    prevLevelRef.current = currentLevel;
  }, [profile?.level, settings.showLevelUpNotifications, showLevelUpNotification, profile]);

  return children as React.ReactElement;
}

/**
 * Hook to manually trigger level-up notification
 * Useful for testing or special scenarios
 */
export function useLevelUpNotification() {
  const getLevelTitle = useGamificationStore((state) => state.getLevelTitle);
  const settings = useGamificationStore((state) => state.settings);

  const showNotification = useCallback(
    (level: number, locale = 'en') => {
      if (!settings.showLevelUpNotifications) {
        return;
      }

      const tier = getLevelTier(level);
      const emoji = TIER_EMOJIS[tier] || '🎉';
      const title = getLevelTitle();

      const congratsMsg = CONGRATULATIONS[locale] || CONGRATULATIONS.en;
      const levelMsg = LEVEL_UP_MESSAGES[locale] || LEVEL_UP_MESSAGES.en;

      toastUtils.success(`${emoji} ${congratsMsg}`, `${levelMsg} ${level}! ${title}`);
    },
    [getLevelTitle, settings.showLevelUpNotifications],
  );

  return { showNotification };
}

/**
 * XP Earned Notification utility
 * Shows a small notification when XP is earned
 */
export function showXPEarnedNotification(
  xpAmount: number,
  reason: string,
  locale = 'en',
  enabled = true,
) {
  if (!enabled) return;

  const messages: Record<string, string> = {
    en: `+${xpAmount} XP`,
    es: `+${xpAmount} XP`,
    ar: `+${xpAmount} XP`,
    zh: `+${xpAmount} 经验值`,
    ja: `+${xpAmount} XP`,
  };

  const xpMsg = messages[locale] || messages.en;

  toastUtils.info(xpMsg, reason);
}

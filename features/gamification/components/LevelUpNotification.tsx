'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useGamificationStore } from '@/lib/store/gamificationStore';
import { toastUtils } from '@/lib/utils/toast';
import { getLevelTier } from '@/lib/types';

// Translations for level-up messages
const LEVEL_UP_MESSAGES: Record<string, string> = {
  en: 'You reached Level',
  ar: 'وصلت إلى المستوى',
  bn: 'আপনি স্তরে পৌঁছেছেন',
  cs: 'Dosáhli jste úrovně',
  da: 'Du nåede niveau',
  de: 'Du hast Stufe erreicht',
  el: 'Φτάσατε στο επίπεδο',
  es: 'Alcanzaste el Nivel',
  fa: 'به سطح رسیدید',
  fi: 'Saavutit tason',
  fr: 'Vous avez atteint le Niveau',
  he: 'הגעת לרמה',
  hi: 'आपने स्तर प्राप्त किया',
  hu: 'Elérted a szintet',
  id: 'Anda mencapai Level',
  it: 'Hai raggiunto il Livello',
  ja: 'レベルに到達しました',
  ko: '레벨에 도달했습니다',
  ms: 'Anda mencapai Tahap',
  ne: 'तपाईंले स्तर प्राप्त गर्नुभयो',
  nl: 'Je hebt niveau bereikt',
  no: 'Du nådde nivå',
  pl: 'Osiągnąłeś poziom',
  pt: 'Você atingiu o Nível',
  ro: 'Ai atins nivelul',
  ru: 'Вы достигли Уровня',
  si: 'ඔබ මට්ටමට ළඟා විය',
  sv: 'Du nådde nivå',
  ta: 'நீங்கள் நிலை அடைந்தீர்கள்',
  th: 'คุณถึงระดับ',
  tr: 'Seviye ulaştınız',
  uk: 'Ви досягли рівня',
  ur: 'آپ نے سطح حاصل کی',
  vi: 'Bạn đã đạt Cấp độ',
  zh: '你达到了等级',
};

const CONGRATULATIONS: Record<string, string> = {
  en: 'Congratulations!',
  ar: 'تهانينا!',
  bn: 'অভিনন্দন!',
  cs: 'Gratulujeme!',
  da: 'Tillykke!',
  de: 'Glückwunsch!',
  el: 'Συγχαρητήρια!',
  es: '¡Felicitaciones!',
  fa: 'تبریک!',
  fi: 'Onneksi olkoon!',
  fr: 'Félicitations!',
  he: 'מזל טוב!',
  hi: 'बधाई हो!',
  hu: 'Gratulálunk!',
  id: 'Selamat!',
  it: 'Congratulazioni!',
  ja: 'おめでとうございます！',
  ko: '축하합니다!',
  ms: 'Tahniah!',
  ne: 'बधाई छ!',
  nl: 'Gefeliciteerd!',
  no: 'Gratulerer!',
  pl: 'Gratulacje!',
  pt: 'Parabéns!',
  ro: 'Felicitări!',
  ru: 'Поздравляем!',
  si: 'සුභ පැතුම්!',
  sv: 'Grattis!',
  ta: 'வாழ்த்துக்கள்!',
  th: 'ยินดีด้วย!',
  tr: 'Tebrikler!',
  uk: 'Вітаємо!',
  ur: 'مبارک ہو!',
  vi: 'Chúc mừng!',
  zh: '恭喜！',
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

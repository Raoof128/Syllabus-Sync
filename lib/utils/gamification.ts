import { TranslationKey } from "@/lib/i18n/translations";

/**
 * Get the translation key for a gamification level title
 */
export function getLevelTitleKey(level: number): TranslationKey {
  if (level <= 10) {
    // Keys are gamification_level_1 to gamification_level_10
    return `gamification_level_${level}` as TranslationKey;
  }
  if (level <= 20) return "gamification_level_veteran";
  if (level <= 30) return "gamification_level_expert";
  if (level <= 50) return "gamification_level_legend";
  if (level <= 75) return "gamification_level_titan";
  return "gamification_level_grand";
}

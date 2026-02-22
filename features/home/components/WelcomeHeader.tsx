// components/home/WelcomeHeader.tsx
// ============================================
// DYNAMIC WELCOME HEADER SYSTEM
// ============================================
// A personalised, rotating welcome message component for the
// Macquarie University student dashboard.
//
// DESIGN RATIONALE:
// 1. Dynamic name personalisation creates immediate connection and
//    demonstrates that the app recognises the user as an individual.
// 2. Rotating microcopy keeps the interface feeling fresh across sessions
//    without requiring user interaction or new features.
// 3. The professional, Australian academic tone ensures suitability for
//    demos, lectures, and judge evaluations while still feeling human.
// 4. Campus-specific messaging (walking distances, building codes) adds
//    authentic Macquarie flavour without referencing specific staff or units.
// 5. Gamification stats (Level, XP, Streak) provide motivation and progression.
// ============================================

"use client";

import { useMemo, ReactNode } from "react";
import { useTypedTranslation } from "@/lib/hooks/useTypedTranslation";
import { GamificationStats } from "@/features/gamification/components";

// ============================================
// TYPES
// ============================================

interface WelcomeHeaderProps {
  /** User's display name from profile. Null/undefined triggers fallback. */
  name: string | null | undefined;
  /** Fallback name to use when primary name is unavailable (e.g., DEMO_USER.name) */
  fallbackName?: string;
  /** Optional CSS class for the container */
  className?: string;
  /** Show gamification stats (level, streak) */
  showGamification?: boolean;
  children?: ReactNode;
}

// ============================================
// MESSAGE POOLS (MOVED TO TRANSLATIONS)
// ============================================
// Messages are now handled via i18n keys (welcomeMsg1..8, etc.)
// to support full internationalisation.

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Deterministic daily seed (UTC) for stable messaging.
 * Avoids re-rolling the message on every page load.
 */
function getUtcDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function hashToIndex(seed: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return modulo === 0 ? 0 : hash % modulo;
}

/**
 * Formats the user's name for display.
 * Handles edge cases like empty strings, whitespace-only names.
 *
 * @param name - Raw name from profile
 * @returns Cleaned name or null if invalid
 */
function formatDisplayName(name: string | null | undefined): string | null {
  if (!name) return null;

  const trimmed = name.trim();
  if (trimmed.length === 0) return null;

  // Extract first name only for a more personal greeting
  // "Raouf Alavi" -> "Raouf"
  const firstName = trimmed.split(/\s+/)[0];

  // Capitalise first letter, preserve rest (handles "McDonald", etc.)
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

// ============================================
// REACT COMPONENT
// ============================================

/**
 * WelcomeHeader Component
 *
 * Displays a personalised greeting with the user's name and a rotating
 * Macquarie-specific welcome message.
 *
 * The message is selected ONCE on initial mount and persists across
 * re-renders to prevent jarring content changes.
 *
 * @example
 * ```tsx
 * <WelcomeHeader name={currentProfile?.name} />
 * ```
 */
export function WelcomeHeader({
  name,
  fallbackName,
  className = "",
  showGamification = true,
  children,
}: WelcomeHeaderProps) {
  const { t } = useTypedTranslation();

  // Format the display name, with fallback chain: name -> fallbackName -> null
  const displayName = useMemo(() => {
    const formatted = formatDisplayName(name);
    if (formatted) return formatted;
    // Try fallback name if provided
    return fallbackName ? formatDisplayName(fallbackName) : null;
  }, [name, fallbackName]);

  const messageKey = useMemo(() => {
    const generalKeys = [
      "welcomeMsg1",
      "welcomeMsg2",
      "welcomeMsg3",
      "welcomeMsg4",
      "welcomeMsg5",
      "welcomeMsg6",
      "welcomeMsg7",
      "welcomeMsg8",
    ];

    const seed = `${getUtcDateKey()}|${displayName ?? fallbackName ?? ""}`;
    return generalKeys[hashToIndex(seed, generalKeys.length)];
  }, [displayName, fallbackName]);

  // Build the greeting text
  const greeting = displayName
    ? `${t("welcome")}, ${displayName}!`
    : `${t("welcome")}!`;

  // Get the translated message using the selected key
  const message = messageKey
    ? t(messageKey as "welcomeMsg1")
    : t("dayAtGlance");

  return (
    <div
      className={`flex flex-col md:flex-row md:items-end justify-between gap-4 ${className}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-2">
          <h1 className="text-2xl font-semibold text-mq-content leading-tight">
            {greeting}
          </h1>
          {showGamification && <GamificationStats variant="compact" />}
        </div>
        <p className="text-sm text-mq-content-secondary">{message}</p>
      </div>

      {children && (
        <div className="flex items-center gap-3 shrink-0">{children}</div>
      )}
    </div>
  );
}

// ============================================
// OPTIONAL EXTENSIONS (NOT IMPLEMENTED)
// ============================================
// These are documented patterns for future enhancement.

/*
 * EXAM WEEK MESSAGING
 * -------------------
 * The system could detect exam periods via:
 * - A feature flag or config date range
 * - An API check for upcoming exams in the user's units
 *
 * Implementation:
 * ```ts
 * const EXAM_WEEK_MESSAGES = [
 *   "Exam season is upon us. Stay strong.",
 *   "You've prepared for this.",
 *   "Deep breaths. One exam at a time.",
 * ];
 *
 * function isExamWeek(): boolean {
 *   // Check localStorage flag or date range
 *   return localStorage.getItem('exam-week') === 'true';
 * }
 *
 * // In selectWelcomeMessage:
 * if (isExamWeek()) {
 *   return selectRandom(EXAM_WEEK_MESSAGES);
 * }
 * ```
 */

/*
 * FACULTY-SPECIFIC MESSAGING
 * --------------------------
 * Messages could be tailored to the user's faculty:
 *
 * ```ts
 * const FACULTY_MESSAGES: Record<string, string[]> = {
 *   'science': ["Lab coat on, data ready."],
 *   'business': ["Markets wait for no one."],
 *   'arts': ["Create something meaningful today."],
 * };
 *
 * // In WelcomeHeader:
 * const userFaculty = useFaculty(); // hypothetical hook
 * if (userFaculty && FACULTY_MESSAGES[userFaculty]) {
 *   // 20% chance to show faculty message
 * }
 * ```
 */

/*
 * DAILY ROTATION WITH LOCALSTORAGE
 * ---------------------------------
 * To show one message per day (not per page load):
 *
 * ```ts
 * function getDailyMessage(): string {
 *   const today = new Date().toISOString().split('T')[0];
 *   const stored = localStorage.getItem('daily-welcome');
 *
 *   if (stored) {
 *     const { date, message } = JSON.parse(stored);
 *     if (date === today) return message;
 *   }
 *
 *   const newMessage = selectWelcomeMessage();
 *   localStorage.setItem('daily-welcome', JSON.stringify({
 *     date: today,
 *     message: newMessage,
 *   }));
 *
 *   return newMessage;
 * }
 * ```
 */

/*
 * FEATURE FLAGS FOR "FUN MODE"
 * ----------------------------
 * A settings toggle could enable more playful messages:
 *
 * ```ts
 * const FUN_MODE_MESSAGES = [
 *   "Legend has it, someone once found parking on campus.",
 *   "The wifi is working. Miracles happen.",
 * ];
 *
 * const isFunMode = localStorage.getItem('fun-mode') === 'true';
 * if (isFunMode) {
 *   allMessages.push(...FUN_MODE_MESSAGES);
 * }
 * ```
 */

export default WelcomeHeader;

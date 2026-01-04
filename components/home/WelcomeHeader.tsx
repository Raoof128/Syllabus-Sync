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
// ============================================

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/lib/hooks/useTranslation';

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
}

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

// ============================================
// MESSAGE POOLS
// ============================================
// Each pool is thematically grouped for maintainability.
// All messages use Australian English and avoid emojis, slang, or memes.

/** Core Macquarie welcome messages - always safe, always professional */
const CORE_MESSAGES: readonly string[] = [
    "Here's your day at a glance.",
    "Your academic dashboard is ready.",
    "Let's make today productive.",
    "Your schedule awaits.",
    "Everything you need, in one place.",
    "Ready when you are.",
    "Your university companion.",
    "Organised and on track.",
    "Your academic command centre.",
    "All systems go.",
] as const;

/** Student life messages - light, relatable, professional */
const STUDENT_LIFE_MESSAGES: readonly string[] = [
    "Coffee first, then we conquer.",
    "One lecture at a time.",
    "You've got this.",
    "Another day, another tutorial.",
    "Keep calm and study on.",
    "The library awaits.",
    "Your future self will thank you.",
    "Progress over perfection.",
    "Small steps, big results.",
    "Stay focused, stay brilliant.",
] as const;

/** Macquarie campus-specific messages - walking, scale, atmosphere */
const CAMPUS_MESSAGES: readonly string[] = [
    "Hope you've got comfortable shoes today.",
    "The walk to C5C builds character.",
    "At least the weather's nice for the trek to E7A.",
    "Pro tip: the library has the best air conditioning.",
    "Another lap around campus never hurt anyone.",
    "Somewhere between W6A and your next class.",
    "The campus is big, but your ambition is bigger.",
    "Navigating Macquarie, one building at a time.",
    "From the train station to your tutorial: a journey.",
    "The outdoor escalators are judging your cardio.",
] as const;

/** Academic grind messages - motivational, deadline-aware tone */
const ACADEMIC_MESSAGES: readonly string[] = [
    "Deadlines wait for no one.",
    "Your assignments are calling.",
    "Time to turn caffeine into grades.",
    "The semester waits for no one.",
    "Another day closer to graduation.",
    "Your transcript is watching.",
    "Excellence requires attendance.",
    "Procrastination is not a study technique.",
    "The grind never stops.",
    "Knowledge doesn't download itself.",
] as const;

/** Time-of-day aware messages */
const TIME_OF_DAY_MESSAGES: Readonly<Record<TimeOfDay, readonly string[]>> = {
    morning: [
        "Early start, strong finish.",
        "The early bird catches the HD.",
        "Morning classes build discipline.",
        "Rise and grind.",
        "Fresh coffee, fresh start.",
    ],
    afternoon: [
        "Halfway through the day.",
        "Keep the momentum going.",
        "The afternoon productivity window is open.",
        "Post-lunch focus mode: activated.",
        "The day is yours to command.",
    ],
    evening: [
        "Evening sessions can be productive too.",
        "The library's quiet hours are golden.",
        "Sunset study sessions hit different.",
        "Wind down with some light revision.",
        "The day's not over until you say so.",
    ],
    night: [
        "Burning the midnight oil?",
        "The quiet hours belong to the dedicated.",
        "Night owl mode engaged.",
        "Sometimes the best ideas come late.",
        "The campus is peaceful at this hour.",
    ],
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Determines the current time of day for message selection.
 * Uses local time to provide contextually appropriate messages.
 */
function getTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
}

/**
 * Selects a random element from an array.
 * Uses Math.random() for simplicity; could be replaced with a seeded
 * random for deterministic testing.
 */
function selectRandom<T>(array: readonly T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Combines all message pools and selects ONE message.
 * Weighted slightly toward core messages for professionalism.
 * 
 * @param includeTimeAware - Whether to include time-of-day messages (default: true)
 * @returns A single welcome message string
 */
function selectWelcomeMessage(includeTimeAware: boolean = true): string {
    // Weight distribution: Core messages appear twice to increase probability
    const allMessages: string[] = [
        ...CORE_MESSAGES,
        ...CORE_MESSAGES, // Double weight for professional messages
        ...STUDENT_LIFE_MESSAGES,
        ...CAMPUS_MESSAGES,
        ...ACADEMIC_MESSAGES,
    ];

    // 30% chance to use a time-of-day message when enabled
    if (includeTimeAware && Math.random() < 0.3) {
        const timeOfDay = getTimeOfDay();
        const timeMessages = TIME_OF_DAY_MESSAGES[timeOfDay];
        return selectRandom(timeMessages);
    }

    return selectRandom(allMessages);
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
export function WelcomeHeader({ name, fallbackName, className = '' }: WelcomeHeaderProps) {
    const { t } = useTranslation();

    // Format the display name, with fallback chain: name -> fallbackName -> null
    const displayName = useMemo(() => {
        const formatted = formatDisplayName(name);
        if (formatted) return formatted;
        // Try fallback name if provided
        return fallbackName ? formatDisplayName(fallbackName) : null;
    }, [name, fallbackName]);

    // State for the rotating message - initialised to null to prevent hydration mismatch
    const [message, setMessage] = useState<string | null>(null);

    // Select message ONCE on client-side mount
    // This prevents:
    // 1. SSR/CSR hydration mismatches
    // 2. Message re-rolling on every state change
    useEffect(() => {
        setMessage(selectWelcomeMessage());
    }, []); // Empty deps = run once on mount

    // Build the greeting text
    const greeting = displayName
        ? `${t('welcome')}, ${displayName}!`
        : `${t('welcome')}!`;

    return (
        <div className={`flex-1 min-w-0 ${className}`}>
            <h1 className="text-mq-3xl font-bold text-mq-content mb-2">
                {greeting}
            </h1>
            <p className="text-mq-content-secondary">
                {/* Use translation fallback while message is loading (SSR) */}
                {message ?? t('dayAtGlance')}
            </p>
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

"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  useGamificationStore,
  useXPProgress,
  useStreak,
} from "@/lib/store/gamificationStore";
import { useTypedTranslation } from "@/lib/hooks/useTypedTranslation";
import { LevelBadge } from "./LevelBadge";
import { XPProgressBar } from "./XPProgressBar";

type LevelColors = {
  pillGradientStyle: string;
  ringClass: string;
  ringColor: string;
  trackBgStyle: string;
  trackBorderStyle: string;
  fillGradientStyle: string;
  textClass: string;
};

function getLevelColors(level: number): LevelColors {
  // Bronze tier (1-5)
  if (level <= 5) {
    return {
      pillGradientStyle: "linear-gradient(90deg, #f59e0b, #b45309)",
      ringClass: "ring-amber-500/60",
      ringColor: "#f59e0b",
      trackBgStyle: "rgba(245, 158, 11, 0.2)",
      trackBorderStyle: "rgba(245, 158, 11, 0.4)",
      fillGradientStyle: "linear-gradient(90deg, #fff7ed, #fef3c7, #fff7ed)",
      textClass: "text-white",
    };
  }
  // Silver tier (6-10)
  if (level <= 10) {
    return {
      pillGradientStyle: "linear-gradient(90deg, #94a3b8, #475569)",
      ringClass: "ring-slate-400/60",
      ringColor: "#94a3b8",
      trackBgStyle: "rgba(148, 163, 184, 0.2)",
      trackBorderStyle: "rgba(148, 163, 184, 0.4)",
      fillGradientStyle: "linear-gradient(90deg, #ffffff, #f1f5f9, #ffffff)",
      textClass: "text-white",
    };
  }
  // Gold tier (11-20)
  if (level <= 20) {
    return {
      pillGradientStyle: "linear-gradient(90deg, #fbbf24, #b45309)",
      ringClass: "ring-amber-400/60",
      ringColor: "#fbbf24",
      trackBgStyle: "rgba(251, 191, 36, 0.2)",
      trackBorderStyle: "rgba(251, 191, 36, 0.4)",
      fillGradientStyle: "linear-gradient(90deg, #fefce8, #fef3c7, #fefce8)",
      textClass: "text-amber-950",
    };
  }
  // Platinum tier (21-35)
  if (level <= 35) {
    return {
      pillGradientStyle: "linear-gradient(90deg, #22d3ee, #0284c7)",
      ringClass: "ring-cyan-400/60",
      ringColor: "#22d3ee",
      trackBgStyle: "rgba(34, 211, 238, 0.2)",
      trackBorderStyle: "rgba(34, 211, 238, 0.35)",
      fillGradientStyle: "linear-gradient(90deg, #ecfeff, #cffafe, #ecfeff)",
      textClass: "text-white",
    };
  }
  // Diamond tier (36-50)
  if (level <= 50) {
    return {
      pillGradientStyle: "linear-gradient(90deg, #a855f7, #6366f1)",
      ringClass: "ring-purple-400/60",
      ringColor: "#a855f7",
      trackBgStyle: "rgba(168, 85, 247, 0.2)",
      trackBorderStyle: "rgba(168, 85, 247, 0.35)",
      fillGradientStyle: "linear-gradient(90deg, #faf5ff, #f3e8ff, #faf5ff)",
      textClass: "text-white",
    };
  }
  // Master tier (51+)
  return {
    pillGradientStyle: "linear-gradient(90deg, #e11d48, #be123c)",
    ringClass: "ring-rose-500/60",
    ringColor: "#e11d48",
    trackBgStyle: "rgba(225, 29, 72, 0.2)",
    trackBorderStyle: "rgba(225, 29, 72, 0.35)",
    fillGradientStyle: "linear-gradient(90deg, #fff1f2, #ffe4e6, #fff1f2)",
    textClass: "text-white",
  };
}

interface GamificationStatsProps {
  /** Display variant */
  variant?: "compact" | "full" | "card";
  /** Show XP progress bar */
  showProgress?: boolean;
  /** Show streak info */
  showStreak?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * GamificationStats Component
 * A flexible component to display user's gamification stats
 * Can be used in headers, profile cards, or as a standalone card
 */
export function GamificationStats({
  variant = "compact",
  showProgress = true,
  showStreak = true,
  className,
}: GamificationStatsProps) {
  const { t } = useTypedTranslation();
  const { loadProfile, hasLoaded, isLoading, isDemo } = useGamificationStore();
  const { currentXP, level, xpToNext, progress } = useXPProgress();
  const { days, longest: longestStreak } = useStreak();

  // Load profile on mount
  useEffect(() => {
    if (!hasLoaded) {
      loadProfile();
    }
  }, [hasLoaded, loadProfile]);

  if (isLoading && !hasLoaded) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-mq-background-secondary rounded-full" />
          <div className="w-20 h-4 bg-mq-background-secondary rounded" />
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    const rawProgress = Math.min(100, Math.max(0, Math.round(progress ?? 0)));
    // Ensure a visible sliver for low progress without exceeding 100%
    const progressPercent =
      rawProgress <= 0 ? 0 : Math.min(100, Math.max(rawProgress, 18));
    const levelAriaLabel = t("levelBadgeAria", { level, currentXP, xpToNext });
    const levelColors = getLevelColors(level);
    const levelTooltip = t("levelTooltip", {
      level,
      xp: currentXP.toLocaleString(),
    });

    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        {/* Level Badge with XP display */}
        <div
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-md transition-all duration-200 hover:shadow-lg cursor-default",
            levelColors.textClass,
          )}
          style={{
            background: levelColors.pillGradientStyle,
          }}
          aria-label={levelAriaLabel}
          title={levelTooltip}
          data-testid="level-badge"
        >
          {/* Level text with XP */}
          <span className="whitespace-nowrap">
            {t("level")} {level}
          </span>
          <span className="opacity-70">•</span>
          <span className="whitespace-nowrap tabular-nums">
            {currentXP.toLocaleString()} XP
          </span>

          {/* XP Progress bar */}
          <span
            className="h-2 w-12 rounded-full overflow-hidden bg-white/20"
            aria-hidden="true"
          >
            <span
              className="block h-full transition-[width] duration-300 bg-white/80 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </span>
        </div>

        {/* Streak Badge - polished and consistent */}
        {showStreak && days > 0 && (
          <div
            data-testid="streak-badge"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md bg-gradient-to-r from-orange-500 to-amber-500 text-white"
            title={t("streakTooltip", { days, longest: longestStreak })}
            aria-label={t("streakDay", { count: days })}
          >
            <span
              className="text-base leading-none"
              role="img"
              aria-hidden="true"
            >
              🔥
            </span>
            <span className="tabular-nums">
              {days} day{days !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {isDemo && (
          <span className="text-[10px] text-mq-content-tertiary bg-mq-background-secondary px-1.5 py-0.5 rounded-full border border-mq-border">
            {t("demo")}
          </span>
        )}
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Level and XP Row */}
        <div className="flex items-center justify-between">
          <LevelBadge size="md" showTitle />
          {showStreak && days > 0 && (
            <div className="flex items-center gap-1 text-orange-500">
              <span role="img" aria-label={t("streakDay", { count: days })}>
                🔥
              </span>
              <span className="font-bold">{days}</span>
              <span className="text-sm text-mq-content-secondary">
                {t("day", { count: days })}
              </span>
            </div>
          )}
        </div>

        {/* XP Progress */}
        {showProgress && <XPProgressBar size="md" showNumbers />}

        {/* Demo indicator */}
        {isDemo && (
          <p className="text-xs text-mq-content-tertiary text-center">
            {t("signInToTrack")}
          </p>
        )}
      </div>
    );
  }

  // Card variant
  return (
    <div
      className={cn(
        "p-4 rounded-xl border bg-mq-card-background border-mq-border",
        className,
      )}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-mq-content">{t("yourProgress")}</h3>
          {isDemo && (
            <span className="text-xs text-mq-content-tertiary bg-mq-background-secondary px-2 py-1 rounded">
              {t("demoMode")}
            </span>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between">
          <LevelBadge size="lg" showTitle />
          {showStreak && (
            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                <span
                  className="text-2xl"
                  role="img"
                  aria-label={t("streakDay", { count: days })}
                >
                  🔥
                </span>
                <span className="text-2xl font-bold text-mq-content">
                  {days}
                </span>
              </div>
              <span className="text-xs text-mq-content-secondary">
                {t("streakDay", { count: 1 }).replace("1 ", "")}
              </span>
            </div>
          )}
        </div>

        {/* XP Progress */}
        {showProgress && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-mq-content-secondary">
                {t("xpProgress")}
              </span>
              <span className="text-mq-content font-medium">
                {currentXP.toLocaleString()} XP
              </span>
            </div>
            <XPProgressBar size="lg" showNumbers={false} />
            <p className="text-xs text-mq-content-tertiary mt-1 text-right">
              {t("xpToNextLevel", {
                xp: xpToNext.toLocaleString(),
                nextLevel: level + 1,
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Minimal XP indicator for navbar/headers
 */
export function XPIndicator({ className }: { className?: string }) {
  const { t } = useTypedTranslation();
  const { profile, loadProfile, hasLoaded } = useGamificationStore();
  const { days, longest } = useStreak();

  useEffect(() => {
    if (!hasLoaded) {
      loadProfile(false); // Don't load events for minimal indicator
    }
  }, [hasLoaded, loadProfile]);

  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const levelTooltip = t("levelTooltip", { level, xp: xp.toLocaleString() });
  const streakTooltip =
    days > 0
      ? t("streakDayTooltip", { count: days, longest })
      : t("startStreak");

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Level */}
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-mq-primary text-white text-xs font-bold"
        title={levelTooltip}
        aria-label={levelTooltip}
      >
        {level}
      </span>

      {/* Streak (only if active) */}
      {days > 0 && (
        <span
          className="text-orange-500 text-sm"
          title={streakTooltip}
          aria-label={streakTooltip}
        >
          🔥{days}
        </span>
      )}
    </div>
  );
}

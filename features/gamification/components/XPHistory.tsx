// components/gamification/XPHistory.tsx
"use client";

import { memo, useMemo } from "react";
import {
  CheckCircle,
  Clock,
  Calendar,
  Flame,
  BookOpen,
  Star,
  Trophy,
  Target,
  UserCheck,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/mq/card";
import { Badge } from "@/components/ui/mq/badge";
import {
  useGamificationStore,
  type XPEvent,
} from "@/lib/store/gamificationStore";
import { useTypedTranslation } from "@/lib/hooks/useTypedTranslation";
import { cn } from "@/lib/utils";

// ============================================================================
// LOCALE MAPPING
// ============================================================================

/**
 * Maps language codes to full locale identifiers for date/time formatting.
 * Used by Intl.DateTimeFormat and Intl.RelativeTimeFormat.
 */
const LOCALE_MAP: Record<string, string> = {
  en: "en-AU",
  es: "es-ES",
  fa: "fa-IR",
  zh: "zh-CN",
  ar: "ar-SA",
  hi: "hi-IN",
  ko: "ko-KR",
  ja: "ja-JP",
};

const DEFAULT_LOCALE = "en-AU";

// ============================================================================
// EVENT TYPE CONFIG
// ============================================================================

interface EventTypeConfig {
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  label: string;
}

const EVENT_TYPE_CONFIGS: Record<string, EventTypeConfig> = {
  deadline_completed: {
    icon: CheckCircle,
    colorClass: "text-mq-success",
    bgClass: "bg-mq-success/10",
    label: "Deadline Completed",
  },
  deadline_early: {
    icon: Clock,
    colorClass: "text-mq-info",
    bgClass: "bg-mq-info/10",
    label: "Early Completion",
  },
  daily_login: {
    icon: Calendar,
    colorClass: "text-mq-purple",
    bgClass: "bg-mq-purple/10",
    label: "Daily Login",
  },
  streak_bonus: {
    icon: Flame,
    colorClass: "text-mq-warning",
    bgClass: "bg-mq-warning/10",
    label: "Streak Bonus",
  },
  unit_added: {
    icon: BookOpen,
    colorClass: "text-mq-info",
    bgClass: "bg-mq-info/10",
    label: "Unit Added",
  },
  event_attended: {
    icon: Star,
    colorClass: "text-mq-purple",
    bgClass: "bg-mq-purple/10",
    label: "Event Attended",
  },
  profile_completed: {
    icon: UserCheck,
    colorClass: "text-mq-success",
    bgClass: "bg-mq-success/10",
    label: "Profile Completed",
  },
  first_deadline: {
    icon: Target,
    colorClass: "text-mq-primary",
    bgClass: "bg-mq-primary/10",
    label: "First Deadline",
  },
  weekly_goal: {
    icon: Trophy,
    colorClass: "text-mq-warning",
    bgClass: "bg-mq-warning/10",
    label: "Weekly Goal",
  },
  level_up_bonus: {
    icon: Zap,
    colorClass: "text-mq-primary",
    bgClass: "bg-mq-primary/10",
    label: "Level Up Bonus",
  },
};

const DEFAULT_CONFIG: EventTypeConfig = {
  icon: Star,
  colorClass: "text-mq-content-secondary",
  bgClass: "bg-mq-background-secondary",
  label: "XP Event",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getEventConfig(eventType: string): EventTypeConfig {
  return EVENT_TYPE_CONFIGS[eventType] || DEFAULT_CONFIG;
}

function formatRelativeTime(dateString: string, locale: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Use Intl.RelativeTimeFormat for localized relative time
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffMinutes < 1) {
    return "Just now";
  } else if (diffMinutes < 60) {
    return rtf.format(-diffMinutes, "minute");
  } else if (diffHours < 24) {
    return rtf.format(-diffHours, "hour");
  } else if (diffDays < 7) {
    return rtf.format(-diffDays, "day");
  } else {
    return date.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
    });
  }
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface XPEventItemProps {
  event: XPEvent;
  locale: string;
}

const XPEventItem = memo(({ event, locale }: XPEventItemProps) => {
  const config = getEventConfig(event.eventType);
  const Icon = config.icon;

  const relativeTime = useMemo(
    () => formatRelativeTime(event.createdAt, locale),
    [event.createdAt, locale],
  );

  // Extract title from metadata if available
  const title =
    (event.metadata?.title as string) ||
    (event.metadata?.unitCode as string) ||
    config.label;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-mq-border last:border-b-0">
      {/* Icon */}
      <div className={cn("p-2 rounded-full flex-shrink-0", config.bgClass)}>
        <Icon className={cn("h-4 w-4", config.colorClass)} aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-mq-sm font-medium text-mq-content truncate">
            {title}
          </span>
          <Badge
            className={cn(
              "flex-shrink-0 text-xs font-semibold",
              config.bgClass,
              config.colorClass,
            )}
          >
            +{event.xpAmount} XP
          </Badge>
        </div>
        <p className="text-mq-xs text-mq-content-secondary mt-0.5">
          {relativeTime}
        </p>
      </div>
    </div>
  );
});
XPEventItem.displayName = "XPEventItem";

// ============================================================================
// XP HISTORY CARD
// ============================================================================

interface XPHistoryProps {
  maxEvents?: number;
  showHeader?: boolean;
  className?: string;
}

export const XPHistory = memo(
  ({ maxEvents = 10, showHeader = true, className }: XPHistoryProps) => {
    const { t, language } = useTypedTranslation();
    const recentEvents = useGamificationStore((state) => state.recentEvents);
    const isLoading = useGamificationStore((state) => state.isLoading);

    // Get locale string for formatting
    const locale = useMemo(
      () => LOCALE_MAP[language] || DEFAULT_LOCALE,
      [language],
    );

    // Limit events to display
    const displayEvents = useMemo(
      () => recentEvents.slice(0, maxEvents),
      [recentEvents, maxEvents],
    );

    // Calculate total XP from recent events
    const totalRecentXP = useMemo(
      () => displayEvents.reduce((sum, event) => sum + event.xpAmount, 0),
      [displayEvents],
    );

    if (isLoading) {
      return (
        <Card className={cn("animate-pulse", className)}>
          {showHeader && (
            <CardHeader>
              <div className="h-6 bg-mq-background-secondary rounded w-32" />
            </CardHeader>
          )}
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 bg-mq-background-secondary rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-mq-background-secondary rounded w-3/4" />
                  <div className="h-3 bg-mq-background-secondary rounded w-1/4" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      );
    }

    if (displayEvents.length === 0) {
      return (
        <Card className={className}>
          {showHeader && (
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" aria-hidden="true" />
                {t("recentActivity")}
              </CardTitle>
            </CardHeader>
          )}
          <CardContent>
            <div className="text-center py-8">
              <Star
                className="h-12 w-12 mx-auto mb-3 text-mq-content-tertiary"
                aria-hidden="true"
              />
              <p className="text-mq-sm text-mq-content-secondary">
                {t("noRecentActivity")}
              </p>
              <p className="text-mq-xs text-mq-content-tertiary mt-1">
                {t("startEarningXP")}
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" aria-hidden="true" />
                {t("recentActivity")}
              </CardTitle>
              {totalRecentXP > 0 && (
                <Badge variant="neutral" className="text-xs">
                  +{totalRecentXP} XP {t("recently")}
                </Badge>
              )}
            </div>
          </CardHeader>
        )}
        <CardContent className="pt-0">
          <div role="list" aria-label={t("recentXPEvents")}>
            {displayEvents.map((event) => (
              <XPEventItem key={event.id} event={event} locale={locale} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  },
);
XPHistory.displayName = "XPHistory";

// ============================================================================
// COMPACT XP HISTORY (for sidebars/widgets)
// ============================================================================

interface XPHistoryCompactProps {
  maxEvents?: number;
  className?: string;
}

export const XPHistoryCompact = memo(
  ({ maxEvents = 5, className }: XPHistoryCompactProps) => {
    const { language } = useTypedTranslation();
    const recentEvents = useGamificationStore((state) => state.recentEvents);

    const locale = useMemo(
      () => LOCALE_MAP[language] || DEFAULT_LOCALE,
      [language],
    );

    const displayEvents = useMemo(
      () => recentEvents.slice(0, maxEvents),
      [recentEvents, maxEvents],
    );

    if (displayEvents.length === 0) {
      return null;
    }

    return (
      <div className={cn("space-y-2", className)}>
        {displayEvents.map((event) => {
          const config = getEventConfig(event.eventType);
          const Icon = config.icon;

          return (
            <div key={event.id} className="flex items-center gap-2 text-mq-xs">
              <Icon
                className={cn("h-3 w-3 flex-shrink-0", config.colorClass)}
                aria-hidden="true"
              />
              <span className="text-mq-content-secondary truncate flex-1">
                +{event.xpAmount} XP
              </span>
              <span className="text-mq-content-tertiary">
                {formatRelativeTime(event.createdAt, locale)}
              </span>
            </div>
          );
        })}
      </div>
    );
  },
);
XPHistoryCompact.displayName = "XPHistoryCompact";

export default XPHistory;

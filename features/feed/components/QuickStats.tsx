"use client";

import { memo, useMemo, useState, useCallback } from "react";
import {
  TrendingUp,
  Calendar,
  Users,
  Pizza,
  MapPin,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PublicEvent } from "@/lib/types/publicEvents";
import { useTypedTranslation } from "@/lib/hooks/useTypedTranslation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/mq/button";
import { Badge } from "@/components/ui/mq/badge";

interface QuickStatsProps {
  events: PublicEvent[];
  className?: string;
}

interface DialogState {
  title: string;
  events: PublicEvent[];
}

export const QuickStats = memo(({ events, className }: QuickStatsProps) => {
  const { t } = useTypedTranslation();
  const [dialogState, setDialogState] = useState<DialogState | null>(null);

  const stats = useMemo(() => {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));

    const thisWeekEvents = events.filter((e) => e.startAt <= endOfWeek);
    const freeFood = events.filter((e) => e.category === "Free Food");
    const career = events.filter((e) => e.category === "Career");
    const social = events.filter((e) => e.category === "Social");
    const academic = events.filter((e) => e.category === "Academic");

    return {
      total: events.length,
      totalEvents: events,
      thisWeek: thisWeekEvents.length,
      thisWeekEvents,
      freeFood: freeFood.length,
      freeFoodEvents: freeFood,
      career: career.length,
      careerEvents: career,
      social: social.length,
      socialEvents: social,
      academic: academic.length,
      academicEvents: academic,
    };
  }, [events]);

  const openDialog = useCallback((title: string, eventsList: PublicEvent[]) => {
    setDialogState({ title, events: eventsList });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState(null);
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-mq-primary" />
        <h3 className="font-bold text-mq-content">
          {t("thisWeek") || "This Week"}
        </h3>
      </div>

      {/* Stats Cards */}
      <div className="space-y-2">
        <StatCard
          icon={Calendar}
          label={t("totalEvents") || "Total Events"}
          value={stats.total}
          color="text-mq-primary"
          bgColor="bg-mq-primary/10"
          onClick={() =>
            openDialog(t("totalEvents") || "Total Events", stats.totalEvents)
          }
        />
        <StatCard
          icon={Users}
          label={t("thisWeek") || "This Week"}
          value={stats.thisWeek}
          color="text-purple-500"
          bgColor="bg-purple-500/10"
          onClick={() =>
            openDialog(t("thisWeek") || "This Week", stats.thisWeekEvents)
          }
        />
        <StatCard
          icon={Pizza}
          label={t("freeFood") || "Free Food"}
          value={stats.freeFood}
          color="text-amber-500"
          bgColor="bg-amber-500/10"
          onClick={() =>
            openDialog(t("freeFood") || "Free Food", stats.freeFoodEvents)
          }
        />
      </div>

      {/* Category Breakdown */}
      <div className="pt-4 border-t border-mq-border">
        <p className="text-xs font-semibold text-mq-content-tertiary uppercase tracking-wide mb-3">
          {t("byCategory") || "By Category"}
        </p>
        <div className="space-y-2">
          <CategoryBar
            icon="💼"
            label={t("career") || "Career"}
            count={stats.career}
            total={stats.total}
            color="bg-blue-500"
            onClick={() =>
              openDialog(t("career") || "Career", stats.careerEvents)
            }
          />
          <CategoryBar
            icon="📚"
            label={t("academic") || "Academic"}
            count={stats.academic}
            total={stats.total}
            color="bg-emerald-500"
            onClick={() =>
              openDialog(t("academic") || "Academic", stats.academicEvents)
            }
          />
          <CategoryBar
            icon="🎉"
            label={t("social") || "Social"}
            count={stats.social}
            total={stats.total}
            color="bg-purple-500"
            onClick={() =>
              openDialog(t("social") || "Social", stats.socialEvents)
            }
          />
          <CategoryBar
            icon="🍕"
            label={t("freeFood") || "Free Food"}
            count={stats.freeFood}
            total={stats.total}
            color="bg-amber-500"
            onClick={() =>
              openDialog(t("freeFood") || "Free Food", stats.freeFoodEvents)
            }
          />
        </div>
      </div>

      {/* Events Dialog */}
      <Dialog
        open={dialogState !== null}
        onOpenChange={(open: boolean) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh]">
          {dialogState && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {dialogState.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-mq-content-secondary">
                  {t(
                    dialogState.events.length === 1
                      ? "eventsCount_one"
                      : "eventsCount_other",
                    {
                      count: dialogState.events.length,
                    },
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-3 overflow-y-auto max-h-[50vh]">
                {dialogState.events.length === 0 ? (
                  <p className="text-center py-8 text-mq-content-tertiary">
                    {t("noEventsFound")}
                  </p>
                ) : (
                  dialogState.events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))
                )}
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={closeDialog}>
                  {t("close")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});

QuickStats.displayName = "QuickStats";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  onClick: () => void;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
  onClick,
}: StatCardProps) {
  const { t } = useTypedTranslation();
  return (
    <div
      className="flex items-center justify-between p-3 rounded-xl bg-mq-card-background border border-mq-border cursor-pointer select-none hover:shadow-md active:scale-[0.98] transition-all"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={t("viewLabel", { label })}
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", bgColor)}>
          <Icon className={cn("h-4 w-4", color)} aria-hidden="true" />
        </div>
        <span className="text-sm text-mq-content-secondary">{label}</span>
      </div>
      <span className="text-lg font-bold text-mq-content">{value}</span>
    </div>
  );
}

interface CategoryBarProps {
  icon: string;
  label: string;
  count: number;
  total: number;
  color: string;
  onClick: () => void;
}

function CategoryBar({
  icon,
  label,
  count,
  total,
  color,
  onClick,
}: CategoryBarProps) {
  const { t } = useTypedTranslation();
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div
      className="cursor-pointer select-none p-2 -m-2 rounded-lg hover:bg-mq-background-secondary/50 transition-all active:scale-[0.98]"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={t("viewCategoryEvents", { label })}
    >
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="flex items-center gap-1.5 text-mq-content-secondary">
          <span>{icon}</span>
          {label}
        </span>
        <span className="font-medium text-mq-content">{count}</span>
      </div>
      <div className="h-1.5 bg-mq-background-secondary rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            color,
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Event Card Component for Dialog
interface EventCardProps {
  event: PublicEvent;
}

function EventCard({ event }: EventCardProps) {
  const { t } = useTypedTranslation();
  const categoryColors: Record<string, string> = {
    Career: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    Social: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    Academic: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    "Free Food": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-AU", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-AU", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getTimeRange = () => {
    if (event.allDay) return t("allDay");
    const start = formatTime(event.startAt);
    if (event.endAt) {
      const end = formatTime(event.endAt);
      return `${start} - ${end}`;
    }
    return start;
  };

  return (
    <div className="p-4 rounded-lg border border-mq-border bg-mq-card-background hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="font-semibold text-base text-mq-content flex-1">
          {event.title}
        </h4>
        <Badge
          className={cn(
            "text-xs shrink-0 border",
            categoryColors[event.category],
          )}
        >
          {event.category}
        </Badge>
      </div>
      {event.description && (
        <p className="text-sm text-mq-content-secondary mb-3">
          {event.description}
        </p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-mq-content-secondary">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          <span>{formatDate(event.startAt)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" aria-hidden="true" />
          <span>{getTimeRange()}</span>
        </div>
        {event.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span>{event.location}</span>
          </div>
        )}
      </div>
    </div>
  );
}

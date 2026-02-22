import { useCallback } from "react";
import dayjs from "dayjs";
import { useTypedTranslation } from "@/lib/hooks/useTypedTranslation";
import { getMQKeyDatesForDay } from "@/data/mqKeyDates";
import { formatLocalizedDate } from "@/lib/utils/locale";
import { Unit, Deadline, Event } from "@/lib/types";
import { TranslationKey } from "@/lib/i18n/translations";

export function useCalendarGetters(
  filteredUnits: Unit[],
  filteredDeadlines: Deadline[],
  filteredEvents: Event[],
) {
  const { language, t } = useTypedTranslation();

  const getUnitsForDay = useCallback(
    (date: Date) => {
      const dayName = dayjs(date).locale("en").format("dddd");
      return filteredUnits.flatMap((unit) =>
        unit.schedule
          .filter((s) => s.day === dayName)
          .map((s) => ({ ...unit, schedule: s })),
      );
    },
    [filteredUnits],
  );

  const getItemsForDay = useCallback(
    (date: Date) => {
      const dayDeadlines = filteredDeadlines.filter((d) =>
        dayjs(d.dueDate).isSame(date, "day"),
      );
      const dayEvents = filteredEvents.filter((e) => {
        const eventDate = e.startAt || e.date;
        return dayjs(eventDate).isSame(date, "day");
      });
      const dayMQDates = getMQKeyDatesForDay(date).filter(
        (d) => d.category !== "classes",
      );
      const dayUnits = getUnitsForDay(date);
      return {
        deadlines: dayDeadlines,
        events: dayEvents,
        mqDates: dayMQDates,
        units: dayUnits,
      };
    },
    [filteredDeadlines, filteredEvents, getUnitsForDay],
  );

  const formatLocalized = useCallback(
    (date: Date, options: Intl.DateTimeFormatOptions) =>
      formatLocalizedDate(date, language, options),
    [language],
  );

  const formatDayNumber = useCallback(
    (date: Date) => formatLocalized(date, { day: "numeric" }),
    [formatLocalized],
  );
  const formatMonthYear = useCallback(
    (date: Date) => formatLocalized(date, { month: "long", year: "numeric" }),
    [formatLocalized],
  );
  const formatWeekRange = useCallback(
    (startDate: Date) => {
      const start = dayjs(startDate);
      const end = start.add(6, "day");
      const startStr = formatLocalized(start.toDate(), {
        day: "numeric",
        month: "short",
      });
      const endStr = formatLocalized(end.toDate(), {
        day: "numeric",
        month: "short",
      });
      return `${startStr} - ${endStr}`;
    },
    [formatLocalized],
  );
  const formatWeekdayLong = useCallback(
    (date: Date) => formatLocalized(date, { weekday: "long" }),
    [formatLocalized],
  );
  const formatWeekdayShort = useCallback(
    (date: Date) => formatLocalized(date, { weekday: "short" }),
    [formatLocalized],
  );
  const formatTimeShort = useCallback(
    (date: Date) =>
      formatLocalized(date, { hour: "numeric", minute: "2-digit" }),
    [formatLocalized],
  );

  const formatHourLabel = useCallback(
    (hour: number) =>
      formatLocalized(
        dayjs().hour(hour).minute(0).second(0).millisecond(0).toDate(),
        {
          hour: "numeric",
        },
      ),
    [formatLocalized],
  );

  const formatScheduleTime = useCallback(
    (time: string) => {
      const [hourStr, minuteStr] = time.split(":");
      const hour = Number(hourStr);
      const minute = Number(minuteStr);
      if (Number.isNaN(hour) || Number.isNaN(minute)) return time;
      return formatLocalized(
        dayjs().hour(hour).minute(minute).second(0).millisecond(0).toDate(),
        {
          hour: "numeric",
          minute: "2-digit",
        },
      );
    },
    [formatLocalized],
  );

  const getEventTitle = useCallback(
    (event: Event) =>
      event.translationKey
        ? t(event.translationKey as TranslationKey)
        : event.title,
    [t],
  );

  const getDeadlineTypeLabel = useCallback(
    (type: Deadline["type"]) => t(`type_${type}` as TranslationKey),
    [t],
  );

  return {
    getUnitsForDay,
    getItemsForDay,
    formatLocalized,
    formatDayNumber,
    formatMonthYear,
    formatWeekRange,
    formatWeekdayLong,
    formatWeekdayShort,
    formatTimeShort,
    formatHourLabel,
    formatScheduleTime,
    getEventTitle,
    getDeadlineTypeLabel,
    t,
  };
}

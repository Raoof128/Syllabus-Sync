import { useCallback } from "react";
import { toastUtils } from "@/lib/utils/toast";
import { errorHandler } from "@/lib/utils/errorHandling";
import { useGamificationStore } from "@/lib/store/gamificationStore";
import { useNotificationPreferencesStore } from "@/lib/store/notificationPreferencesStore";
import { useUnitsStore } from "@/lib/store/unitsStore";
import { useDeadlinesStore } from "@/lib/store/deadlinesStore";
import { useThemeStore } from "@/lib/store/themeStore";
import { APP_CONFIG } from "@/lib/config";
import type { TranslationKey } from "@/lib/i18n/translations";

type UseDataExportProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  language: string;
};

// Helper to strip sensitive data recursively
const sanitizeData = (data: unknown): unknown => {
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  if (typeof data === "object" && data !== null) {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(
      data as Record<string, unknown>,
    )) {
      // Skip sensitive keys
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("token") ||
        lowerKey.includes("password") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("sessionid") ||
        lowerKey.includes("auth") ||
        lowerKey.includes("key")
      ) {
        continue;
      }

      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }

  return data;
};

export function useDataExport({ t, language }: UseDataExportProps) {
  const exportData = useCallback(() => {
    try {
      const units = useUnitsStore.getState().units;
      const deadlines = useDeadlinesStore.getState().deadlines;
      const theme = useThemeStore.getState().theme;

      // Get gamification data from store
      const gamificationState = useGamificationStore.getState();
      const gamificationData = {
        profile: gamificationState.profile,
        recentEvents: gamificationState.recentEvents,
        settings: gamificationState.settings,
      };

      // Get notification preferences from store
      const notificationState = useNotificationPreferencesStore.getState();
      const notificationPreferences = {
        deadlines: notificationState.deadlinesEnabled,
        classes: notificationState.classesEnabled,
        events: notificationState.eventsEnabled,
        deadlineReminderTiming: notificationState.deadlineReminderTiming,
        classReminderTiming: notificationState.classReminderTiming,
        eventReminderTiming: notificationState.eventReminderTiming,
        pushEnabled: notificationState.pushEnabled,
      };

      const data = {
        units,
        deadlines,
        gamification: gamificationData,
        preferences: {
          theme,
          language,
          notifications: notificationPreferences,
        },
        exportedAt: new Date().toISOString(),
        version: "1.0",
        appVersion: APP_CONFIG.version,
      };

      const sanitizedData = sanitizeData(data);

      const blob = new Blob([JSON.stringify(sanitizedData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `syllabus-sync-data-${new Date().toISOString().split("T")[0]}.json`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toastUtils.success(t("exportComplete"), t("exportCompleteMsg"));
    } catch (error) {
      errorHandler.logError(
        error instanceof Error ? error : new Error("Failed to export data"),
        "Settings Export Data",
        "medium",
      );
      toastUtils.error(t("exportFailed"), t("exportFailedMsg"));
    }
  }, [t, language]);

  return { exportData };
}

"use client";

import { memo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/mq/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/mq/card";
import {
  Bell,
  BellOff,
  Mail,
  Calendar,
  Info,
  AlertTriangle,
} from "lucide-react";
import { useNotificationPreferencesStore } from "@/lib/store/notificationPreferencesStore";
import { toastUtils } from "@/lib/utils/toast";
import type { TranslationKey } from "@/lib/i18n/translations";
import { MagicCard } from "@/components/ui/MagicCard";
import { REMINDER_TIMING_OPTIONS } from "../constants";
import { ToggleControl } from "./ToggleControl";
import { NotificationRow } from "./NotificationRow";
import { useHydration } from "@/lib/hooks/useHydration";

type NotificationSettingsProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const NotificationSettings = memo(({ t }: NotificationSettingsProps) => {
  const isClient = useHydration();

  // Use individual selectors to prevent infinite re-renders
  const permissionStatus = useNotificationPreferencesStore(
    (state) => state.permissionStatus,
  );
  const pushEnabled = useNotificationPreferencesStore(
    (state) => state.pushEnabled,
  );
  const deadlinesEnabled = useNotificationPreferencesStore(
    (state) => state.deadlinesEnabled,
  );
  const classesEnabled = useNotificationPreferencesStore(
    (state) => state.classesEnabled,
  );
  const eventsEnabled = useNotificationPreferencesStore(
    (state) => state.eventsEnabled,
  );
  const deadlineReminderTiming = useNotificationPreferencesStore(
    (state) => state.deadlineReminderTiming,
  );
  const classReminderTiming = useNotificationPreferencesStore(
    (state) => state.classReminderTiming,
  );
  const eventReminderTiming = useNotificationPreferencesStore(
    (state) => state.eventReminderTiming,
  );
  const initialize = useNotificationPreferencesStore(
    (state) => state.initialize,
  );
  const requestPermission = useNotificationPreferencesStore(
    (state) => state.requestPermission,
  );
  const setDeadlinesEnabled = useNotificationPreferencesStore(
    (state) => state.setDeadlinesEnabled,
  );
  const setClassesEnabled = useNotificationPreferencesStore(
    (state) => state.setClassesEnabled,
  );
  const setEventsEnabled = useNotificationPreferencesStore(
    (state) => state.setEventsEnabled,
  );
  const setPushEnabled = useNotificationPreferencesStore(
    (state) => state.setPushEnabled,
  );
  const setDeadlineReminderTiming = useNotificationPreferencesStore(
    (state) => state.setDeadlineReminderTiming,
  );
  const setClassReminderTiming = useNotificationPreferencesStore(
    (state) => state.setClassReminderTiming,
  );
  const setEventReminderTiming = useNotificationPreferencesStore(
    (state) => state.setEventReminderTiming,
  );

  // Initialize on mount - single source of truth from store
  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleRequestPermission = useCallback(async () => {
    const status = await requestPermission();
    if (status === "granted") {
      toastUtils.success(
        t("notificationsEnabled"),
        t("notificationsEnabledMsg"),
      );
    } else if (status === "denied") {
      toastUtils.error(t("permissionDenied"), t("permissionDeniedMsg"));
    }
  }, [requestPermission, t]);

  const handleTogglePush = useCallback(() => {
    const newValue = !pushEnabled;
    setPushEnabled(newValue);
    toastUtils.success(
      t("preferenceUpdated"),
      t("pushNotificationsToggle", {
        status: newValue
          ? t("enabled").toLowerCase()
          : t("disabled").toLowerCase(),
      }),
    );
  }, [pushEnabled, setPushEnabled, t]);

  const handleNotificationPreference = useCallback(
    (type: "deadlines" | "classes" | "events", enabled: boolean) => {
      const setters = {
        deadlines: setDeadlinesEnabled,
        classes: setClassesEnabled,
        events: setEventsEnabled,
      };

      // Update store (single source of truth)
      setters[type](enabled);

      const typeLabels: Record<string, string> = {
        deadlines: t("deadlineReminders"),
        classes: t("classReminders"),
        events: t("eventUpdates"),
      };

      toastUtils.success(
        t("preferenceUpdated"),
        `${typeLabels[type]} ${enabled ? t("enabled").toLowerCase() : t("disabled").toLowerCase()}`,
      );
    },
    [setDeadlinesEnabled, setClassesEnabled, setEventsEnabled, t],
  );

  const handleTimingChange = useCallback(
    (type: "deadlines" | "classes" | "events", minutes: number) => {
      const setters = {
        deadlines: setDeadlineReminderTiming,
        classes: setClassReminderTiming,
        events: setEventReminderTiming,
      };

      setters[type](minutes);

      const option = REMINDER_TIMING_OPTIONS.find((o) => o.value === minutes);
      const timingLabel = option ? t(option.labelKey) : `${minutes} minutes`;
      toastUtils.success(
        t("reminderTimingUpdated"),
        t("reminderTimingUpdatedMsg", { timing: timingLabel }),
      );
    },
    [
      setDeadlineReminderTiming,
      setClassReminderTiming,
      setEventReminderTiming,
      t,
    ],
  );

  // Use store values directly for rendering (single source of truth)
  const currentNotifications = {
    deadlines: deadlinesEnabled,
    classes: classesEnabled,
    events: eventsEnabled,
  };

  const notificationItems = [
    {
      key: "deadlines" as const,
      icon: Mail,
      label: t("deadlineReminders"),
      desc: t("deadlineRemindersDesc"),
      timing: deadlineReminderTiming,
    },
    {
      key: "classes" as const,
      icon: Calendar,
      label: t("classReminders"),
      desc: t("classRemindersDesc"),
      timing: classReminderTiming,
    },
    {
      key: "events" as const,
      icon: Info,
      label: t("eventUpdates"),
      desc: t("eventUpdatesDesc"),
      timing: eventReminderTiming,
    },
  ];

  const isNotificationSupported =
    isClient && typeof window !== "undefined" && "Notification" in window;

  return (
    <MagicCard data-testid="notification-settings">
      <Card className="mq-magic-card-content bg-mq-card-background border border-mq-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span id="notifications-heading">{t("notifications")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent
          className="space-y-4"
          role="region"
          aria-labelledby="notifications-heading"
        >
          {/* Push Notification Permission Banner */}
          {isClient && (
            <div
              className="p-3 rounded-mq-lg border border-mq-border bg-mq-background-secondary"
              data-testid="push-notification-banner"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  {permissionStatus === "granted" ? (
                    <Bell className="h-5 w-5" aria-hidden="true" />
                  ) : permissionStatus === "denied" ? (
                    <BellOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  )}
                  <div className="min-w-0">
                    <p className="text-mq-sm font-medium text-mq-content">
                      {permissionStatus === "granted"
                        ? t("pushNotificationsActive")
                        : permissionStatus === "denied"
                          ? t("pushNotificationsBlocked")
                          : t("enablePushNotifications")}
                    </p>
                    <p className="text-mq-xs text-mq-content-secondary mt-0.5">
                      {permissionStatus === "granted"
                        ? t("pushNotificationsActiveDesc")
                        : permissionStatus === "denied"
                          ? t("pushNotificationsBlockedDesc")
                          : t("enablePushNotificationsDesc")}
                    </p>
                  </div>
                </div>
                {permissionStatus !== "granted" && isNotificationSupported && (
                  <Button
                    size="sm"
                    className="w-full sm:w-auto sm:flex-shrink-0"
                    onClick={handleRequestPermission}
                    data-testid="enable-notifications-button"
                  >
                    {t("enable")}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Master Push Toggle */}
          <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-mq-sm font-medium text-mq-content">
                  {t("pushNotifications")}
                </p>
                <p className="text-mq-xs text-mq-content-secondary mt-0.5">
                  {t("pushNotificationsDesc")}
                </p>
              </div>
              <ToggleControl
                checked={pushEnabled}
                onToggle={handleTogglePush}
                label={t("pushNotifications")}
                testId="toggle-push-notifications"
              />
            </div>
          </div>

          <div className="border-t border-mq-border my-4" />

          <h3 className="text-mq-sm font-semibold text-mq-content mb-3">
            {t("customizeNotifications")}
          </h3>

          {/* Notification Categories */}
          <div className="space-y-3">
            {notificationItems.map((item) => (
              <NotificationRow
                key={item.key}
                type={item.key}
                icon={item.icon}
                label={item.label}
                desc={item.desc}
                timing={item.timing}
                enabled={currentNotifications[item.key]}
                permissionGranted={permissionStatus === "granted"}
                t={t}
                onToggle={handleNotificationPreference}
                onTimingChange={handleTimingChange}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </MagicCard>
  );
});

NotificationSettings.displayName = "NotificationSettings";

export default NotificationSettings;

"use client";

import { memo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/mq/card";
import { Map, Navigation } from "lucide-react";
import { useMapStore } from "@/lib/store/mapStore";
import { toastUtils } from "@/lib/utils/toast";
import type { TranslationKey } from "@/lib/i18n/translations";
import { MagicCard } from "@/components/ui/MagicCard";
import { ToggleControl } from "./ToggleControl";

type MapSettingsProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const MapSettings = memo(({ t }: MapSettingsProps) => {
  const { hapticFeedbackEnabled, toggleHapticFeedback } = useMapStore();

  const handleToggleHapticFeedback = () => {
    toggleHapticFeedback();
    const newState = !hapticFeedbackEnabled;
    toastUtils.success(
      t("preferenceUpdated"),
      `${t("hapticFeedback")} ${newState ? t("enabled") : t("disabled").toLowerCase()}`,
    );
  };

  return (
    <MagicCard data-testid="map-settings">
      <Card className="mq-magic-card-content bg-mq-card-background border border-mq-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" aria-hidden="true" />
            <span id="map-settings-heading">{t("mapNavigation")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent
          className="space-y-4"
          role="region"
          aria-labelledby="map-settings-heading"
        >
          <div
            className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300"
            data-testid="haptic-feedback-item"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Navigation
                  className="h-4 w-4 flex-shrink-0"
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-mq-sm font-medium text-mq-content">
                    {t("hapticFeedback")}
                  </p>
                  <p className="text-mq-xs text-mq-content-secondary mt-0.5">
                    {t("hapticFeedbackDesc")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:flex-shrink-0">
                <ToggleControl
                  checked={hapticFeedbackEnabled}
                  onToggle={handleToggleHapticFeedback}
                  label={`${t("hapticFeedback")} ${hapticFeedbackEnabled ? t("enabled") : t("disabled")}`}
                  testId="toggle-haptic-feedback"
                />
                <span className="text-mq-xs text-mq-content-secondary">
                  {hapticFeedbackEnabled ? t("on") : t("off")}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </MagicCard>
  );
});

MapSettings.displayName = "MapSettings";

export default MapSettings;

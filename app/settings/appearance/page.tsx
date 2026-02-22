"use client";

import { useTypedTranslation } from "@/lib/hooks/useTypedTranslation";
import { useThemeStore } from "@/lib/store/themeStore";
import { AppearanceSettings } from "@/features/settings/components";

export default function AppearanceSettingsPage() {
  const { t, language, setLanguage } = useTypedTranslation();
  const { theme, resolvedTheme, setTheme } = useThemeStore();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-mq-lg rounded-xl">
          <AppearanceSettings
            theme={theme}
            resolvedTheme={resolvedTheme}
            setTheme={setTheme}
            language={language}
            setLanguage={setLanguage}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Language } from "@/lib/i18n/translations";

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  isRTL: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  reset: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "en",
      isRTL: false,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setLanguage: (language) =>
        set({
          language,
          isRTL:
            language === "fa" ||
            language === "ar" ||
            language === "ur" ||
            language === "he",
        }),
      reset: () =>
        set({
          language: "en",
          isRTL: false,
        }),
    }),
    {
      name: "language-storage",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Skip automatic hydration - we'll control it manually to prevent hydration mismatch
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

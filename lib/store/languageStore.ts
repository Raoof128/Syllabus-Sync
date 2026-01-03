import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Language } from '@/lib/i18n/translations';

interface LanguageState {
    language: Language;
    setLanguage: (language: Language) => void;
    isRTL: boolean;
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set) => ({
            language: 'en',
            isRTL: false,
            setLanguage: (language) => set({
                language,
                isRTL: language === 'fa'
            }),
        }),
        {
            name: 'language-storage',
            storage: createJSONStorage(() => localStorage),
            version: 1,
        }
    )
);

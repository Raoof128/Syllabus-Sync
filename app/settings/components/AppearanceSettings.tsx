'use client';

import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Palette } from 'lucide-react';
import { toastUtils } from '@/lib/utils/toast';
import type { Language, TranslationKey } from '@/lib/i18n/translations';

type ThemeMode = 'light' | 'system' | 'dark';

const languageNames: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fa: 'فارسی',
  zh: '中文',
  ar: 'العربية',
  hi: 'हिन्दी',
  ko: '한국어',
  ja: '日本語',
  ur: 'اردو',
  th: 'ไทย',
  vi: 'Tiếng Việt',
  ru: 'Русский',
  ta: 'தமிழ்',
  bn: 'বাংলা',
  id: 'Bahasa Indonesia',
  ms: 'Bahasa Melayu',
  it: 'Italiano',
  fr: 'Français',
  he: 'עברית',
};

const SUPPORTED_LANGUAGES: Language[] = [
  'en',
  'es',
  'fr',
  'it',
  'zh',
  'ja',
  'ko',
  'vi',
  'hi',
  'ur',
  'bn',
  'ta',
  'th',
  'id',
  'ms',
  'fa',
  'ru',
  'ar',
  'he',
];

// Map language codes to translation keys for aria-labels
const languageAriaLabelKeys: Record<Language, TranslationKey> = {
  en: 'switchToEnglish',
  es: 'switchToSpanish',
  fa: 'switchToPersian',
  zh: 'switchToChinese',
  ar: 'switchToArabic',
  hi: 'switchToHindi',
  ko: 'switchToKorean',
  ja: 'switchToJapanese',
  ur: 'switchToUrdu',
  th: 'switchToThai',
  vi: 'switchToVietnamese',
  ru: 'switchToRussian',
  ta: 'switchToTamil',
  bn: 'switchToBengali',
  id: 'switchToIndonesian',
  ms: 'switchToMalay',
  it: 'switchToItalian',
  fr: 'switchToFrench',
  he: 'switchToHebrew',
};

type AppearanceSettingsProps = {
  theme: ThemeMode;
  resolvedTheme: string;
  setTheme: (theme: ThemeMode) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const AppearanceSettings = memo(
  ({ theme, resolvedTheme, setTheme, language, setLanguage, t }: AppearanceSettingsProps) => {
    const handleLanguageChange = useCallback(
      (newLanguage: Language) => {
        if (newLanguage === language) return;
        setLanguage(newLanguage);

        const displayName = languageNames[newLanguage] || newLanguage;
        toastUtils.success(t('languageUpdated'), `${t('languageUpdatedMsg')} ${displayName}`);
      },
      [language, setLanguage, t],
    );

    const handleThemeChange = useCallback(
      (mode: ThemeMode) => {
        setTheme(mode);
      },
      [setTheme],
    );

    return (
      <div className="mq-magic-card">
        <Card className="mq-magic-card-content">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t('appearance')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Theme Selection */}
            <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-mq-content">{t('darkMode')}</h4>
                  <p className="text-mq-sm text-mq-content-secondary">
                    {t('current')}:{' '}
                    {theme === 'system' ? `${t('system')} (${resolvedTheme})` : resolvedTheme}
                  </p>
                </div>
                <div className="flex items-center gap-2" role="group" aria-label={t('darkMode')}>
                  {(['light', 'system', 'dark'] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleThemeChange(mode)}
                      className={`px-3 py-1 text-xs ${theme === mode ? 'bg-mq-primary text-white' : 'text-mq-content-secondary'}`}
                      aria-pressed={theme === mode}
                      aria-label={`${t(mode)} ${t('darkMode').toLowerCase()}`}
                    >
                      {t(mode)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Language Selection */}
            <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border hover:bg-mq-card-background transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-mq-content">{t('language')}</h4>
                  <p className="text-mq-sm text-mq-content-secondary">
                    {t('current')}: {languageNames[language] || language}
                  </p>
                </div>
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
                  role="group"
                  aria-label={t('language')}
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <Button
                      key={lang}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLanguageChange(lang)}
                      className={`px-2 py-1 text-xs transition-colors focus:ring-2 focus:ring-mq-primary/50 ${
                        language === lang
                          ? 'bg-mq-primary text-white'
                          : 'text-mq-content-secondary hover:bg-mq-primary/10'
                      }`}
                      aria-pressed={language === lang}
                      aria-label={`${t(languageAriaLabelKeys[lang])}${language === lang ? ` ${t('currentlySelected')}` : ''}`}
                    >
                      {lang.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  },
);

AppearanceSettings.displayName = 'AppearanceSettings';

export default AppearanceSettings;

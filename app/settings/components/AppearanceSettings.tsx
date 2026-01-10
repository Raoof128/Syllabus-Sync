'use client';

import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Palette } from 'lucide-react';
import { toastUtils } from '@/lib/utils/toast';
import type { Language, TranslationKey } from '@/lib/i18n/translations';
import { MagicCard } from '@/components/ui/MagicCard';

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
      <MagicCard data-testid="appearance-settings">
        <Card className="mq-magic-card-content">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" aria-hidden="true" />
              <span id="appearance-heading">{t('appearance')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3" role="region" aria-labelledby="appearance-heading">
            {/* Theme Selection */}
            <div className="p-3 bg-mq-card-background/50 backdrop-blur-sm rounded-mq-lg border border-mq-border hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-semibold text-mq-content">{t('darkMode')}</h3>
                  <p className="text-mq-sm text-mq-content-secondary">
                    {t('current')}:{' '}
                    {theme === 'system' ? `${t('system')} (${resolvedTheme})` : resolvedTheme}
                  </p>
                </div>
                <div
                  className="flex items-center gap-2"
                  role="radiogroup"
                  aria-label={t('darkMode')}
                >
                  {(['light', 'system', 'dark'] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleThemeChange(mode)}
                      className={`px-3 py-1 text-xs ${theme === mode ? 'bg-mq-primary text-white' : 'text-mq-content-secondary'}`}
                      role="radio"
                      aria-checked={theme === mode}
                      aria-label={`${t(mode)} ${t('darkMode').toLowerCase()}`}
                      data-testid={`theme-${mode}`}
                    >
                      {t(mode)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Language Selection */}
            <div className="p-3 bg-mq-card-background/50 backdrop-blur-sm rounded-mq-lg border border-mq-border hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-mq-content">{t('language')}</h3>
                    <p className="text-mq-sm text-mq-content-secondary">
                      {t('current')}: {languageNames[language] || language}
                    </p>
                  </div>
                </div>
                <div
                  className="space-y-2"
                  role="radiogroup"
                  aria-label={t('language')}
                  data-testid="language-group"
                >
                  <p className="text-mq-xs text-mq-content-secondary">{t('language')}</p>
                  <div className="flex flex-wrap gap-2">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <Button
                        key={lang}
                        variant="ghost"
                        size="sm"
                        role="radio"
                        aria-checked={language === lang}
                        aria-label={t(languageAriaLabelKeys[lang])}
                        onClick={() => handleLanguageChange(lang)}
                        data-testid={`language-${lang}`}
                        className={`px-3 py-1 text-xs ${language === lang ? 'bg-mq-primary text-white' : 'text-mq-content-secondary'}`}
                      >
                        {languageNames[lang] || lang}
                        {language === lang ? ` ${t('currentlySelected') || ''}` : ''}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </MagicCard>
    );
  },
);

AppearanceSettings.displayName = 'AppearanceSettings';

export default AppearanceSettings;

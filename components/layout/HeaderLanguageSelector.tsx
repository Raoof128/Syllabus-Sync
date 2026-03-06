'use client';

import { memo, useCallback } from 'react';
import { Globe2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n/translations';
import type { TranslationKey } from '@/lib/i18n/translations';
import { toastUtils } from '@/lib/utils/toast';

type HeaderLanguageSelectorProps = {
  language: Language;
  isLoading?: boolean;
  setLanguage: (language: Language) => Promise<void> | void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const HeaderLanguageSelector = memo(
  ({ language, isLoading = false, setLanguage, t }: HeaderLanguageSelectorProps) => {
    const currentLanguageLabel = LANGUAGE_NAMES[language] || language;

    const handleLanguageChange = useCallback(
      async (nextLanguage: Language) => {
        if (nextLanguage === language || isLoading) {
          return;
        }

        await setLanguage(nextLanguage);
        toastUtils.success(
          t('languageUpdated'),
          `${t('languageUpdatedMsg')} ${LANGUAGE_NAMES[nextLanguage]}`,
        );
      },
      [isLoading, language, setLanguage, t],
    );

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="group flex items-center justify-center gap-1.5 p-1.5 sm:p-2 rounded-lg transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background hover:bg-mq-red hover:text-white hover:-translate-y-0.5 hover:shadow-lg active:scale-95 min-h-10 min-w-10 sm:min-h-11 sm:min-w-11 disabled:pointer-events-none disabled:opacity-60"
            aria-label={`${t('language')}: ${currentLanguageLabel}`}
            title={`${t('language')}: ${currentLanguageLabel}`}
            disabled={isLoading}
            data-testid="header-language-trigger"
          >
            <Globe2
              className="w-4 h-4 sm:w-5 sm:h-5 text-mq-content-secondary dark:text-white/80 transition-transform duration-300 group-hover:scale-110 group-active:scale-95 group-hover:text-white"
              aria-hidden="true"
            />
            <span className="hidden md:inline text-[11px] lg:text-xs font-semibold text-mq-content-secondary group-hover:text-white uppercase tracking-wide">
              {language}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={4}
          className="w-64 max-h-[min(24rem,calc(100vh-8rem))] bg-mq-card-background rounded-mq-lg border border-mq-border shadow-lg"
        >
          <DropdownMenuLabel className="flex items-center justify-between gap-2 text-mq-content">
            <span>{t('language')}</span>
            <span className="text-xs font-normal text-mq-content-secondary">
              {t('current')}: {currentLanguageLabel}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-mq-border" />
          <DropdownMenuRadioGroup
            value={language}
            onValueChange={(value) => {
              void handleLanguageChange(value as Language);
            }}
          >
            {SUPPORTED_LANGUAGES.map((optionLanguage) => (
              <DropdownMenuRadioItem
                key={optionLanguage}
                value={optionLanguage}
                disabled={isLoading}
                className="text-mq-content"
                aria-label={`${t('language')}: ${LANGUAGE_NAMES[optionLanguage]}`}
                data-testid={`header-language-${optionLanguage}`}
              >
                <span className="flex min-w-0 items-center justify-between gap-3">
                  <span className="truncate">{LANGUAGE_NAMES[optionLanguage]}</span>
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-mq-content-tertiary">
                    {optionLanguage}
                  </span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);

HeaderLanguageSelector.displayName = 'HeaderLanguageSelector';

export default HeaderLanguageSelector;

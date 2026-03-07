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
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { toastUtils } from '@/lib/utils/toast';

/**
 * Standalone language selector for public pages (terms, privacy)
 * that don't have the main header/sidebar layout.
 */
const StandaloneLanguageSelector = memo(() => {
  const { t, language, setLanguage, isLoadingTranslations } = useTypedTranslation();
  const currentLanguageLabel = LANGUAGE_NAMES[language] || language;

  const handleLanguageChange = useCallback(
    async (nextLanguage: Language) => {
      if (nextLanguage === language || isLoadingTranslations) {
        return;
      }

      await setLanguage(nextLanguage);
      toastUtils.success(
        t('languageUpdated'),
        `${t('languageUpdatedMsg')} ${LANGUAGE_NAMES[nextLanguage]}`,
      );
    },
    [isLoadingTranslations, language, setLanguage, t],
  );

  return (
    <div className="fixed top-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 hover:bg-white/20 hover:border-white/35 active:scale-95 disabled:pointer-events-none disabled:opacity-60"
            aria-label={`${t('language')}: ${currentLanguageLabel}`}
            title={`${t('language')}: ${currentLanguageLabel}`}
            disabled={isLoadingTranslations}
            data-testid="standalone-language-trigger"
          >
            <Globe2 className="w-4 h-4 text-white" aria-hidden="true" />
            <span className="text-xs font-semibold text-white uppercase tracking-wide">
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
                disabled={isLoadingTranslations}
                className="text-mq-content"
                aria-label={`${t('language')}: ${LANGUAGE_NAMES[optionLanguage]}`}
                data-testid={`standalone-language-${optionLanguage}`}
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
    </div>
  );
});

StandaloneLanguageSelector.displayName = 'StandaloneLanguageSelector';

export default StandaloneLanguageSelector;

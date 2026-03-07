'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import {
  MQProgram,
  PROGRAM_LABELS,
  PROGRAM_STYLES,
  MQ_DATE_COLORS,
  MQDateCategory,
} from '@/data/mqKeyDates';
import { Button } from '@/components/ui/mq/button';

interface ProgramLegendProps {
  /** Which programs to show in the legend */
  programs?: MQProgram[];
  /** Whether to show category legend as well */
  showCategories?: boolean;
  /** Additional className */
  className?: string;
}

export default function ProgramLegend({
  programs = [
    'general',
    'business-school',
    'college',
    'global-mba',
    'fmhhs',
    'oua',
    'exchange',
    'online-degree',
    'muic',
    'elc',
  ],
  showCategories = true,
  className,
}: ProgramLegendProps) {
  const { t } = useTypedTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop: Always visible inline legend */}
      <div className="hidden md:block bg-mq-background-secondary/50 border border-mq-border rounded-lg px-4 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Program Legend */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-mq-content-secondary">
              {t('programKey')}:
            </span>
            {programs.map((program) => {
              const style = PROGRAM_STYLES[program];
              return (
                <div
                  key={program}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border-l-4',
                    style.bgLight,
                    style.border,
                    style.text,
                    style.pattern,
                  )}
                >
                  <span className="text-sm" aria-hidden="true">
                    {style.icon}
                  </span>
                  <span>{PROGRAM_LABELS[program]}</span>
                </div>
              );
            })}
          </div>

          {/* Category Legend */}
          {showCategories && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-mq-content-secondary">
                {t('categoryKey')}:
              </span>
              {(Object.keys(MQ_DATE_COLORS) as MQDateCategory[]).map((category) => {
                const colors = MQ_DATE_COLORS[category];
                return (
                  <div
                    key={category}
                    className={cn(
                      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                      colors.bg,
                      colors.text,
                    )}
                  >
                    {t(`category_${category}` as TranslationKey)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile/Tablet: Collapsible legend */}
      <div className="md:hidden bg-mq-background-secondary/50 border border-mq-border rounded-lg">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between px-4 py-2 h-auto"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="program-legend-content"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Info className="h-4 w-4" />
            {t('programLegend')}
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {isExpanded && (
          <div id="program-legend-content" className="px-4 pb-3 space-y-3">
            {/* Program Legend */}
            <div>
              <span className="text-xs font-medium text-mq-content-secondary block mb-2">
                {t('programKey')}
              </span>
              <div className="flex flex-wrap gap-2">
                {programs.map((program) => {
                  const style = PROGRAM_STYLES[program];
                  return (
                    <div
                      key={program}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border-l-4',
                        style.bgLight,
                        style.border,
                        style.text,
                        style.pattern,
                      )}
                    >
                      <span className="text-sm" aria-hidden="true">
                        {style.icon}
                      </span>
                      <span>{PROGRAM_LABELS[program]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Legend */}
            {showCategories && (
              <div>
                <span className="text-xs font-medium text-mq-content-secondary block mb-2">
                  {t('categoryKey')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(MQ_DATE_COLORS) as MQDateCategory[]).map((category) => {
                    const colors = MQ_DATE_COLORS[category];
                    return (
                      <div
                        key={category}
                        className={cn(
                          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                          colors.bg,
                          colors.text,
                        )}
                      >
                        {t(`category_${category}` as TranslationKey)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

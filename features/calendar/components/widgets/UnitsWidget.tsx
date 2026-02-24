'use client';

import React from 'react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { MagicCard } from '@/components/ui/MagicCard';
import { cn } from '@/lib/utils';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { Unit } from '@/lib/types';
import ItemActionButtons from '@/features/calendar/components/ItemActionButtons';

interface UnitsWidgetProps {
  onAddUnit: () => void;
  onEditUnit: (unit: Unit) => void;
  onOpenUnitDetail: (unit: Unit) => void;
  onDeleteUnit: (unit: Unit) => void;
  highlightedUnitId: string | null;
  widgetRef: React.RefObject<HTMLDivElement | null>;
  highlightedWidget: string | null;
}

export default function UnitsWidget({
  onAddUnit,
  onEditUnit,
  onOpenUnitDetail,
  onDeleteUnit,
  highlightedUnitId,
  widgetRef,
  highlightedWidget,
}: UnitsWidgetProps) {
  const { t } = useTypedTranslation();
  const units = useUnitsStore((state) => state.units);
  const toggleUnitNotification = useUnitsStore((state) => state.toggleNotification);

  const tOr = (key: TranslationKey | string, fallback: string) => {
    const value = t(key as TranslationKey);
    return value === key ? fallback : value;
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <MagicCard
      isLiquidEnhanced
      className={
        highlightedWidget === 'units'
          ? 'ring-2 ring-mq-primary ring-offset-2 ring-offset-mq-background transition-all'
          : ''
      }
    >
      <div
        className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border"
        ref={widgetRef}
      >
        <Card
          variant="glass"
          className="border border-mq-border shadow-none calendar-glass-solid bg-mq-card-background"
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="h-4 w-4" />
                {t('myUnits')}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="neutral" className="text-[10px] h-5 px-1.5">
                  {units.length}{' '}
                  {units.length === 1 ? tOr('unit', 'unit') : tOr('unitsLabel', 'units')}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={onAddUnit}
                  aria-label={t('addUnit')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {units.length === 0 ? (
              <div className="text-center py-6 text-mq-content-tertiary">
                <p className="text-xs">{t('noUnitsYet')}</p>
              </div>
            ) : (
              <div className="space-y-2 pr-1">
                {units.map((unit) => (
                  <div
                    key={unit.id}
                    className={cn(
                      'group flex items-center gap-3 p-2.5 rounded-md border-l-4 border border-mq-border bg-mq-background-secondary transition-all cursor-pointer hover:bg-mq-surface hover:shadow-sm',
                      highlightedUnitId === unit.id &&
                        'ring-2 ring-mq-primary ring-offset-1 animate-pulse bg-mq-primary/5',
                    )}
                    style={{
                      borderLeftColor: unit.color,
                      borderLeftWidth: '4px',
                    }}
                    onClick={() => onOpenUnitDetail(unit)}
                    onKeyDown={(e) => handleKeyDown(e, () => onOpenUnitDetail(unit))}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{unit.code}</h4>
                      <p className="text-[11px] text-mq-content-secondary truncate">{unit.name}</p>
                    </div>
                    <ItemActionButtons
                      itemType="unit"
                      itemId={unit.id}
                      itemTitle={unit.code}
                      building={unit.location?.building}
                      room={unit.location?.room}
                      unitCode={unit.code}
                      itemColor={unit.color}
                      unitSchedule={unit.schedule}
                      notificationEnabled={unit.notificationEnabled}
                      onEdit={() => onEditUnit(unit)}
                      onDelete={() => onDeleteUnit(unit)}
                      onToggleNotification={() => toggleUnitNotification(unit.id)}
                      variant="compact"
                      stopPropagation
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MagicCard>
  );
}

'use client';

import React from 'react';
import { Unit } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Button } from '@/components/ui/mq/button';
import { MapPin, Clock, Edit, Trash2 } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { CardSolid } from '@/components/home/HomeCard';
import { formatScheduleTime } from '@/lib/utils/locale';

interface UnitCardProps {
  unit: Unit;
  onEdit?: (unit: Unit) => void;
  onDelete?: (unit: Unit) => void;
  onClick?: (unit: Unit) => void;
  showActions?: boolean;
  isHighlighted?: boolean;
}

const UnitCard = React.memo(
  ({
    unit,
    onEdit,
    onDelete,
    onClick,
    showActions = true,
    isHighlighted = false,
  }: UnitCardProps) => {
    const { t, language } = useTranslation();

    const DAY_SHORT: { [key: string]: string } = {
      Monday: t('mon'),
      Tuesday: t('tue'),
      Wednesday: t('wed'),
      Thursday: t('thu'),
      Friday: t('fri'),
      Saturday: t('sat'),
      Sunday: t('sun'),
    };

    // Day order for sorting (Monday first, Sunday last)
    const DAY_ORDER: Record<string, number> = {
      Monday: 0,
      Tuesday: 1,
      Wednesday: 2,
      Thursday: 3,
      Friday: 4,
      Saturday: 5,
      Sunday: 6,
    };

    // Get unique days sorted chronologically
    const getUniqueDays = () => {
      const uniqueDays = [...new Set(unit.schedule.map((ct) => ct.day))];
      // Sort by day order (Mon, Tue, Wed...) then map to short names
      return uniqueDays
        .sort((a, b) => DAY_ORDER[a] - DAY_ORDER[b])
        .map((day) => DAY_SHORT[day])
        .join(', ');
    };

    const handleCardClick = () => {
      if (onClick) {
        onClick(unit);
      }
    };

    return (
      <CardSolid
        className={`h-full flex flex-col p-0 ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''} ${isHighlighted ? 'ring-2 ring-mq-primary ring-offset-2 ring-offset-mq-background' : ''}`}
        onClick={handleCardClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick();
                }
              }
            : undefined
        }
        aria-label={onClick ? `${t('view')} ${unit.code} - ${unit.name}` : undefined}
      >
        {/* Color indicator bar with unit code initials for accessibility */}
        <div
          className="h-2 rounded-t-[calc(var(--c-radius-lg)-3px)] relative overflow-hidden"
          style={{ backgroundColor: unit.color }}
          aria-hidden="true"
        >
          {/* Pattern overlay for colorblind users */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 2px,
                  rgba(255,255,255,0.3) 2px,
                  rgba(255,255,255,0.3) 4px
                )`,
            }}
          />
        </div>

        <div className="p-4 flex-grow flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              {/* Unit initials badge for colorblind accessibility */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: unit.color }}
                aria-hidden="true"
                title={unit.code}
              >
                {unit.code.replace(/[0-9]/g, '').slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle as="h3" className="text-mq-medium">
                    {unit.code}
                  </CardTitle>
                  <Badge
                    variant="neutral"
                    className="font-normal shrink-0"
                    aria-label={`${t('days')}: ${getUniqueDays()}`}
                  >
                    <span aria-hidden="true">{getUniqueDays()}</span>
                  </Badge>
                </div>
                <p
                  className="text-mq-sm text-mq-content-secondary mt-1 line-clamp-2"
                  title={unit.name}
                >
                  {unit.name}
                </p>
              </div>
            </div>

            {showActions && (
              <div className="flex gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(unit)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onEdit(unit);
                      }
                    }}
                    className="h-8 w-8 p-0 focus:ring-2 focus:ring-mq-primary/50"
                    aria-label={`${t('editUnit')} ${unit.code} - ${unit.name}`}
                    title={`${t('editUnit')} ${unit.code}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(unit)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onDelete(unit);
                      }
                    }}
                    className="h-8 w-8 p-0 text-mq-error hover:text-mq-error hover:bg-mq-error/10 focus:ring-2 focus:ring-mq-error/50"
                    aria-label={`${t('deleteUnit')} ${unit.code} - ${unit.name}`}
                    title={`${t('deleteUnit')} ${unit.code}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-mq-sm">
            <MapPin className="w-4 h-4" />
            <span className="font-medium text-mq-content">{unit.location.building}</span>
            <span className="text-mq-content-tertiary">
              {unit.location.room.toLowerCase().startsWith('room')
                ? unit.location.room
                : `${t('room')} ${unit.location.room}`}
            </span>
          </div>

          {/* Class Times */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-mq-sm text-mq-content-tertiary">
              <Clock className="w-4 h-4" />
              <span>{t('classTimes')}</span>
            </div>
            <div className="space-y-1 pl-6">
              {unit.schedule.map((ct) => (
                <div key={ct.id} className="text-mq-sm flex items-center justify-between">
                  <span className="font-medium text-mq-content">{ct.day}</span>
                  <span className="text-mq-content-secondary">
                    {formatScheduleTime(ct.startTime, language)} -{' '}
                    {formatScheduleTime(ct.endTime, language)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Color indicator */}
          <div className="flex items-center gap-2 text-mq-xs text-mq-content-tertiary pt-2 border-t border-mq-border mt-auto">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: unit.color }} />
            <span>{t('colorCodingForCalendar')}</span>
          </div>
        </div>
      </CardSolid>
    );
  },
);

UnitCard.displayName = 'UnitCard';

export default UnitCard;

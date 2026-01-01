'use client';

import React from 'react';
import { Unit } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Button } from '@/components/ui/mq/button';
import { MapPin, Clock, Edit, Trash2 } from 'lucide-react';

interface UnitCardProps {
  unit: Unit;
  onEdit?: (unit: Unit) => void;
  onDelete?: (unit: Unit) => void;
  showActions?: boolean;
}

const DAY_SHORT: { [key: string]: string } = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

const UnitCard = React.memo(({ unit, onEdit, onDelete, showActions = true }: UnitCardProps) => {
  // Get unique days
  const getUniqueDays = () => {
    const days = new Set(unit.schedule.map((ct) => DAY_SHORT[ct.day]));
    return Array.from(days).join(', ');
  };

  return (
    <Card className="hover:shadow-mq transition-all duration-mq-mid ease-mq-ease hover:-translate-y-1">
      {/* Color indicator bar */}
      <div className="h-2 rounded-t-mq-lg" style={{ backgroundColor: unit.color }} />

      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-mq-medium">
              {unit.code}
              <Badge variant="outline" className="ml-2 font-normal">
                {getUniqueDays()}
              </Badge>
            </CardTitle>
            <p className="text-mq-sm text-mq-content-secondary mt-1">{unit.name}</p>
          </div>

          {showActions && (
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(unit)}
                  className="h-8 w-8 p-0"
                  aria-label={`Edit ${unit.code}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(unit)}
                  className="h-8 w-8 p-0 text-mq-error hover:text-mq-error hover:bg-mq-error/10"
                  aria-label={`Delete ${unit.code}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Location */}
        <div className="flex items-center gap-2 text-mq-sm">
          <MapPin className="w-4 h-4 text-mq-content-tertiary" />
          <span className="font-medium text-mq-content">{unit.location.building}</span>
          <span className="text-mq-content-tertiary">Room {unit.location.room}</span>
        </div>

        {/* Class Times */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-mq-sm text-mq-content-tertiary">
            <Clock className="w-4 h-4" />
            <span>Class Times</span>
          </div>
          <div className="space-y-1 pl-6">
            {unit.schedule.map((ct) => (
              <div key={ct.id} className="text-mq-sm flex items-center justify-between">
                <span className="font-medium text-mq-content">{ct.day}</span>
                <span className="text-mq-content-secondary">
                  {ct.startTime} - {ct.endTime}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Color indicator */}
        <div className="flex items-center gap-2 text-mq-xs text-mq-content-tertiary pt-2 border-t border-mq-border">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: unit.color }} />
          <span>Color coding for calendar</span>
        </div>
      </CardContent>
    </Card>
  );
});

UnitCard.displayName = 'UnitCard';

export default UnitCard;

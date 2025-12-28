'use client';

import { Unit } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

export default function UnitCard({
  unit,
  onEdit,
  onDelete,
  showActions = true,
}: UnitCardProps) {
  // Get unique days
  const getUniqueDays = () => {
    const days = new Set(unit.schedule.map((ct) => DAY_SHORT[ct.day]));
    return Array.from(days).join(', ');
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      {/* Color indicator bar */}
      <div
        className="h-2 rounded-t-lg"
        style={{ backgroundColor: unit.color }}
      />

      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {unit.code}
              <Badge variant="outline" className="ml-2 font-normal">
                {getUniqueDays()}
              </Badge>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">{unit.name}</p>
          </div>

          {showActions && (
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(unit)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(unit)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
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
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="font-medium">{unit.location.building}</span>
          <span className="text-gray-500">Room {unit.location.room}</span>
        </div>

        {/* Class Times */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Class Times</span>
          </div>
          <div className="space-y-1 pl-6">
            {unit.schedule.map((ct) => (
              <div
                key={ct.id}
                className="text-sm flex items-center justify-between"
              >
                <span className="font-medium">{ct.day}</span>
                <span className="text-gray-600">
                  {ct.startTime} - {ct.endTime}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Color indicator */}
        <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: unit.color }}
          />
          <span>Color coding for calendar</span>
        </div>
      </CardContent>
    </Card>
  );
}

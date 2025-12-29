// components/home/TodaySchedule.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, MapPin } from 'lucide-react';

export default function TodaySchedule() {
  const getTodayClasses = useUnitsStore((state) => state.getTodayClasses);
  const [todayClasses, setTodayClasses] = useState<ReturnType<typeof getTodayClasses>>([]);
  const [isClient, setIsClient] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setIsClient(true);
    setTodayClasses(getTodayClasses());
  }, [getTodayClasses]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s Classes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isClient ? (
          <div className="h-32 flex items-center justify-center">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : todayClasses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No classes today 🎉</p>
        ) : (
          todayClasses.map((cls, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Color indicator */}
              <div
                className="w-1 h-full rounded-full flex-shrink-0"
                style={{ backgroundColor: cls.color }}
              />

              {/* Class info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">
                  {cls.code} — {cls.name}
                </h3>

                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {cls.startTime} - {cls.endTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {cls.location.building} {cls.location.room}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// app/home/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import TodaySchedule from '@/components/home/TodaySchedule';
import NextDeadline from '@/components/home/NextDeadline';
import EventsFeed from '@/components/home/EventsFeed';
import QuickActions from '@/components/home/QuickActions';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { sampleUnits, sampleDeadlines } from '@/data/sampleUnits';
import { Info } from 'lucide-react';

export default function HomePage() {
  const units = useUnitsStore((state) => state.units);
  const addUnit = useUnitsStore((state) => state.addUnit);
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const addDeadline = useDeadlinesStore((state) => state.addDeadline);
  const [hasHydrated, setHasHydrated] = useState(false);
  const hasSeededRef = useRef(false);

  useEffect(() => {
    const checkHydration = () => {
      const unitsHydrated = useUnitsStore.persist.hasHydrated();
      const deadlinesHydrated = useDeadlinesStore.persist.hasHydrated();
      setHasHydrated(unitsHydrated && deadlinesHydrated);
    };

    checkHydration();
    const unsubscribeUnits = useUnitsStore.persist.onFinishHydration(checkHydration);
    const unsubscribeDeadlines = useDeadlinesStore.persist.onFinishHydration(checkHydration);

    return () => {
      unsubscribeUnits();
      unsubscribeDeadlines();
    };
  }, []);

  // Load sample data on first visit
  useEffect(() => {
    if (!hasHydrated || hasSeededRef.current) {
      return;
    }

    if (units.length === 0) {
      sampleUnits.forEach(addUnit);
    }
    if (deadlines.length === 0) {
      sampleDeadlines.forEach(addDeadline);
    }
    hasSeededRef.current = true;
  }, [addDeadline, addUnit, deadlines.length, hasHydrated, units.length]);

  const hasUnits = units.length > 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, Admin!</h1>
        <p className="text-gray-600">Here&apos;s your day at a glance.</p>
      </div>

      {/* Get Started Banner */}
      {!hasUnits && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-900">
              <strong>Get started:</strong> Add your units to sync classes to your calendar.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TodaySchedule />
        <NextDeadline />
      </div>

      {/* Events */}
      <div className="mb-8">
        <EventsFeed />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}

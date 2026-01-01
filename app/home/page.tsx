// app/home/page.tsx
'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import TodaySchedule from '@/components/home/TodaySchedule';
import NextDeadline from '@/components/home/NextDeadline';
import EventsFeed from '@/components/home/EventsFeed';
import UnitCard from '@/components/units/UnitCard';
import dynamic from 'next/dynamic';

// Dynamically import forms for better code splitting
const UnitForm = dynamic(() => import('@/components/units/UnitForm'), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <p className="text-gray-900">Loading...</p>
    </div>
  ),
});
const DeadlineForm = dynamic(() => import('@/components/deadlines/DeadlineForm'), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <p className="text-gray-900">Loading...</p>
    </div>
  ),
});
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { sampleUnits, sampleDeadlines } from '@/data/sampleUnits';
import { DEMO_USER } from '@/lib/config';
import { Info, Plus, BookOpen, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toastUtils } from '@/lib/utils/toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Unit, Deadline } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function HomePage() {
  const units = useUnitsStore((state) => state.units);
  const addUnit = useUnitsStore((state) => state.addUnit);
  const removeUnit = useUnitsStore((state) => state.removeUnit);
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const addDeadline = useDeadlinesStore((state) => state.addDeadline);
  const getStressLevel = useDeadlinesStore((state) => state.getStressLevel);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [seedDisabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('seed-disabled') === 'true';
    } catch {
      return false;
    }
  });
  const hasSeededRef = useRef(false);
  const [unitFormOpen, setUnitFormOpen] = useState(false);
  const [deadlineFormOpen, setDeadlineFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [deleteUnitConfirm, setDeleteUnitConfirm] = useState<Unit | null>(null);

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
    if (!hasHydrated || hasSeededRef.current || seedDisabled) {
      return;
    }

    const unitsSeededKey = 'units-seeded';
    const deadlinesSeededKey = 'deadlines-seeded';

    try {
      const unitsSeeded = localStorage.getItem(unitsSeededKey) === 'true';
      const deadlinesSeeded = localStorage.getItem(deadlinesSeededKey) === 'true';

      if (!unitsSeeded) {
        sampleUnits.forEach(addUnit);
        localStorage.setItem(unitsSeededKey, 'true');
      }
      if (!deadlinesSeeded) {
        sampleDeadlines.forEach(addDeadline);
        localStorage.setItem(deadlinesSeededKey, 'true');
      }
    } catch {
      sampleUnits.forEach(addUnit);
      sampleDeadlines.forEach(addDeadline);
    }
    hasSeededRef.current = true;
  }, [addDeadline, addUnit, hasHydrated, seedDisabled]);

  const hasUnits = units.length > 0;
  const stressLevel = hasHydrated ? getStressLevel() : 'Low';

  // Memoized unit stats calculation for better performance
  const unitStats = useMemo(() => {
    const totalClasses = units.reduce((acc, u) => acc + u.schedule.length, 0);
    const totalStudyHours = units.reduce((acc, u) => {
      return (
        acc +
        u.schedule.reduce((hours, s) => {
          const [startH, startM] = s.startTime.split(':').map(Number);
          const [endH, endM] = s.endTime.split(':').map(Number);
          return hours + (endH - startH) + (endM - startM) / 60;
        }, 0)
      );
    }, 0);

    return {
      unitCount: units.length,
      totalClasses,
      studyHours: Math.round(totalStudyHours),
    };
  }, [units]);

  const stressColors = {
    Low: 'bg-green-100 text-green-800',
    Busy: 'bg-yellow-100 text-yellow-800',
    High: 'bg-red-100 text-red-800',
  };

  const stressEmoji = {
    Low: '😊',
    Busy: '😅',
    High: '😰',
  };

  const handleAddUnit = () => {
    setEditingUnit(null);
    setUnitFormOpen(true);
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setUnitFormOpen(true);
  };

  const handleDeleteUnit = (unit: Unit) => {
    setDeleteUnitConfirm(unit);
  };

  const confirmDeleteUnit = () => {
    if (deleteUnitConfirm) {
      removeUnit(deleteUnitConfirm.id);
      toastUtils.success(
        'Unit Deleted',
        `${deleteUnitConfirm.code} - ${deleteUnitConfirm.name} has been deleted.`,
      );
      setDeleteUnitConfirm(null);
    }
  };

  const handleAddDeadline = () => {
    setEditingDeadline(null);
    setDeadlineFormOpen(true);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {DEMO_USER.name}!</h1>
          <p className="text-gray-900">Here&apos;s your day at a glance.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Stress Level Indicator - Show compact version on mobile */}
          {hasHydrated && deadlines.length > 0 && (
            <div className="flex sm:hidden items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700">
              <TrendingUp className="h-3 w-3 text-gray-700" />
              <Badge className={`${stressColors[stressLevel]} text-xs px-1.5 py-0.5`}>
                {stressEmoji[stressLevel]}
              </Badge>
            </div>
          )}
          {hasHydrated && deadlines.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
              <TrendingUp className="h-4 w-4 text-gray-700" />
              <span className="text-sm text-gray-900">Workload:</span>
              <Badge className={stressColors[stressLevel]}>
                {stressEmoji[stressLevel]} {stressLevel}
              </Badge>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 touch-manipulation" size="default">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add New</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleAddUnit} className="gap-2 cursor-pointer">
                <BookOpen className="h-4 w-4" />
                Add Unit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddDeadline} className="gap-2 cursor-pointer">
                <Clock className="h-4 w-4" />
                Add Deadline
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

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

      {/* Main Grid - Today's Schedule & Next Deadline */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <div className="animate-slide-up">
          <TodaySchedule />
        </div>
        <div className="animate-slide-up animation-delay-100">
          <NextDeadline />
        </div>
      </div>

      {/* My Units Section */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            My Units
          </CardTitle>
          <Button onClick={handleAddUnit} size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Add Unit
          </Button>
        </CardHeader>
        <CardContent>
          {!hasHydrated ? (
            <div className="h-32 flex items-center justify-center">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded w-1/2" />
                <div className="h-16 bg-gray-100 dark:bg-slate-700 rounded w-full" />
              </div>
            </div>
          ) : units.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No units yet</h3>
              <p className="text-gray-900 mb-4 max-w-md mx-auto">
                Add your first unit to start tracking your schedule. It&apos;ll sync your calendar
                and today&apos;s schedule.
              </p>
              <Button onClick={handleAddUnit} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Unit
              </Button>
            </div>
          ) : (
            <>
              {/* Unit Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-white dark:bg-slate-800 rounded-lg mb-6 border border-gray-200 dark:border-slate-700">
                <div className="text-center animate-fade-in">
                  <p className="text-2xl font-bold text-gray-900">{unitStats.unitCount}</p>
                  <p className="text-xs text-gray-800">Units</p>
                </div>
                <div className="text-center animate-fade-in animation-delay-100">
                  <p className="text-2xl font-bold text-gray-900">{unitStats.totalClasses}</p>
                  <p className="text-xs text-gray-800">Classes/Week</p>
                </div>
                <div className="text-center animate-fade-in animation-delay-200">
                  <p className="text-2xl font-bold text-gray-900">{unitStats.studyHours}h</p>
                  <p className="text-xs text-gray-800">Study Hours</p>
                </div>
              </div>

              {/* Units Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {units.map((unit) => (
                  <UnitCard
                    key={unit.id}
                    unit={unit}
                    onEdit={handleEditUnit}
                    onDelete={handleDeleteUnit}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Events */}
      <div className="mb-8">
        <EventsFeed />
      </div>

      {/* Unit Form Dialog */}
      <UnitForm open={unitFormOpen} onOpenChange={setUnitFormOpen} editUnit={editingUnit} />

      {/* Deadline Form Dialog */}
      <DeadlineForm
        open={deadlineFormOpen}
        onOpenChange={setDeadlineFormOpen}
        editDeadline={editingDeadline}
      />

      {/* Delete Unit Confirmation Dialog */}
      <Dialog open={!!deleteUnitConfirm} onOpenChange={() => setDeleteUnitConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Unit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong>
                {deleteUnitConfirm?.code} - {deleteUnitConfirm?.name}
              </strong>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteUnitConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUnit}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

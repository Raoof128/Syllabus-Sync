// components/assignments/AssignmentForm.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { Deadline } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/mq/button';
import { Input } from '@/components/ui/mq/input';
import { toastUtils } from '@/lib/utils/toast';
import { useRetry } from '@/lib/hooks/use-retry';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PRIORITY_LEVELS } from '@/lib/constants';
import { format, isValid } from 'date-fns';
import { errorHandler, createFormValidator, validationRules } from '@/lib/utils/errorHandling';
import { UNIT_COLORS } from '@/lib/config';
import { cn } from '@/lib/utils';
import { CalendarDays, Clock } from 'lucide-react';

interface AssignmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editAssignment?: Deadline | null;
}

export default function AssignmentForm({
  open,
  onOpenChange,
  editAssignment,
}: AssignmentFormProps) {
  const { t } = useTypedTranslation();
  const { addDeadline, updateDeadline, removeDeadline } = useDeadlinesStore();
  const units = useUnitsStore((state) => state.units);

  const [title, setTitle] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [color, setColor] = useState<string>(''); // Empty means inherit from unit
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [priority, setPriority] = useState<Deadline['priority']>('Medium');
  const [completed, setCompleted] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get selected unit for reference
  const selectedUnit = useMemo(() => {
    return units.find((u) => u.code === unitCode);
  }, [units, unitCode]);

  // Effective color: custom color if set, otherwise unit color
  const effectiveColor = useMemo(() => {
    if (useCustomColor && color) return color;
    return selectedUnit?.color || UNIT_COLORS[0].value;
  }, [useCustomColor, color, selectedUnit]);

  // Save operation with retry logic
  const performSave = useCallback(
    async (assignmentData: Deadline) => {
      if (editAssignment) {
        return await updateDeadline(editAssignment.id, assignmentData);
      } else {
        return await addDeadline(assignmentData);
      }
    },
    [editAssignment, updateDeadline, addDeadline],
  );

  const { execute: saveWithRetry } = useRetry(performSave, {
    maxAttempts: 3,
    showToastOnError: false,
    errorMessage: t('failedToSaveDeadline'),
  });

  const resetForm = () => {
    setTitle('');
    setUnitCode('');
    setColor('');
    setUseCustomColor(false);
    setDueDate('');
    setDueTime('23:59');
    setPriority('Medium');
    setCompleted(false);
    setErrors({});
  };

  useEffect(() => {
    if (editAssignment) {
      setTitle(editAssignment.title);
      setUnitCode(editAssignment.unitCode);
      // If assignment has a custom color, use it; otherwise inherit from unit
      if (editAssignment.color) {
        setColor(editAssignment.color);
        setUseCustomColor(true);
      } else {
        setColor('');
        setUseCustomColor(false);
      }
      const parsedDate = new Date(editAssignment.dueDate);
      if (isValid(parsedDate)) {
        setDueDate(format(parsedDate, 'yyyy-MM-dd'));
        setDueTime(format(parsedDate, 'HH:mm'));
      } else {
        setDueDate('');
        setDueTime('23:59');
      }
      setPriority(editAssignment.priority);
      setCompleted(editAssignment.completed);
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editAssignment?.id, open]);

  const validateForm = (): boolean => {
    const validator = createFormValidator({
      title: validationRules.required(t('title')),
      unitCode: validationRules.required(t('unit')),
      dueDate: validationRules.required(t('dueDate')),
    });

    const validationErrors = validator({ title, unitCode, dueDate });
    const formErrors = errorHandler.handleValidationError(validationErrors);

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const [year, month, day] = dueDate.split('-').map(Number);
    const timeParts = dueTime ? dueTime.split(':') : [];
    const parsedHours = Number(timeParts[0]);
    const parsedMinutes = Number(timeParts[1]);
    const hasValidTime =
      timeParts.length === 2 && !Number.isNaN(parsedHours) && !Number.isNaN(parsedMinutes);
    const dueDateObj = new Date(
      year,
      month - 1,
      day,
      hasValidTime ? parsedHours : 23,
      hasValidTime ? parsedMinutes : 59,
    );

    const assignmentData: Deadline = {
      id: editAssignment?.id || uuidv4(),
      title: title.trim(),
      unitCode,
      unitId: selectedUnit?.id,
      color: useCustomColor ? color : undefined, // Only save custom color
      dueDate: dueDateObj,
      priority,
      type: 'Assignment', // Fixed type for assignments
      completed,
      createdAt: editAssignment?.createdAt || new Date(),
    };

    const result = await saveWithRetry(assignmentData);
    if (result !== null) {
      if (editAssignment) {
        toastUtils.success(
          t('assignmentUpdated' as TranslationKey) || 'Assignment Updated',
          `"${assignmentData.title}" has been updated successfully.`,
        );
      } else {
        toastUtils.success(
          t('assignmentAdded' as TranslationKey) || 'Assignment Added',
          `"${assignmentData.title}" has been added successfully.`,
        );
      }
      onOpenChange(false);
      resetForm();
    }
  };

  const handleDelete = () => {
    if (editAssignment) {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    if (editAssignment) {
      removeDeadline(editAssignment.id);
      toastUtils.success(
        t('assignmentDeleted' as TranslationKey) || 'Assignment Deleted',
        `"${editAssignment.title}" ${t('deletedMsg')}`,
      );
      onOpenChange(false);
      resetForm();
    }
    setShowDeleteConfirm(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader className="mb-4">
            <DialogTitle>
              {editAssignment
                ? t('editAssignment' as TranslationKey) || 'Edit Assignment'
                : t('addAssignment' as TranslationKey) || 'Add Assignment'}
            </DialogTitle>
            <DialogDescription>
              {editAssignment
                ? t('updateAssignmentDetails' as TranslationKey) ||
                  'Update the assignment details below.'
                : t('fillAssignmentDetails' as TranslationKey) ||
                  'Fill in the assignment details below.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="assignment-title">
                {t('title')} <span className="text-mq-error">*</span>
              </Label>
              <Input
                id="assignment-title"
                placeholder={
                  t('assignmentTitlePlaceholder' as TranslationKey) ||
                  'e.g., Essay on Climate Change'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-invalid={Boolean(errors.title)}
                aria-required="true"
                aria-describedby={errors.title ? 'assignment-title-error' : undefined}
                className={errors.title ? 'border-mq-error' : ''}
              />
              {errors.title && (
                <p id="assignment-title-error" className="text-sm text-mq-error" role="alert">
                  {errors.title}
                </p>
              )}
            </div>

            {/* Unit */}
            <div className="space-y-2">
              <Label htmlFor="assignment-unit">
                {t('unitCode')} <span className="text-mq-error">*</span>
              </Label>
              <Select value={unitCode} onValueChange={setUnitCode}>
                <SelectTrigger
                  id="assignment-unit"
                  className={errors.unitCode ? 'border-mq-error' : ''}
                  aria-invalid={Boolean(errors.unitCode)}
                  aria-required="true"
                  aria-describedby={errors.unitCode ? 'assignment-unit-error' : undefined}
                >
                  <SelectValue placeholder={t('selectUnit')} />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.code}>
                      {unit.code} - {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unitCode && (
                <p id="assignment-unit-error" className="text-sm text-mq-error" role="alert">
                  {errors.unitCode}
                </p>
              )}
            </div>

            {/* Due Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignment-date">
                  {t('dueDate')} <span className="text-mq-error">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="assignment-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    aria-invalid={Boolean(errors.dueDate)}
                    aria-required="true"
                    aria-describedby={errors.dueDate ? 'assignment-date-error' : undefined}
                    className={`pr-10 ${errors.dueDate ? 'border-mq-error' : ''}`}
                  />
                  <CalendarDays
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mq-content-tertiary pointer-events-none"
                    aria-hidden="true"
                  />
                </div>
                {errors.dueDate && (
                  <p id="assignment-date-error" className="text-sm text-mq-error" role="alert">
                    {errors.dueDate}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignment-time">{t('dueTime')}</Label>
                <div className="relative">
                  <Input
                    id="assignment-time"
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="pr-10"
                  />
                  <Clock
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mq-content-tertiary pointer-events-none"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="assignment-priority">{t('priority')}</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Deadline['priority'])}
              >
                <SelectTrigger id="assignment-priority">
                  <SelectValue placeholder={t('selectPriority')} />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_LEVELS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {t(`priority_${p}` as TranslationKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color Selection */}
            <div className="space-y-2">
              <Label>{t('color' as TranslationKey) || 'Color'}</Label>

              {/* Unit Color Inheritance Toggle */}
              <div className="flex items-center gap-3 p-2 rounded-lg border border-mq-border bg-mq-surface/50">
                <div
                  className="w-6 h-6 rounded-full border-2 border-mq-border shrink-0"
                  style={{ backgroundColor: effectiveColor }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-mq-content">
                    {useCustomColor ? 'Custom Color' : 'Inherits Unit Color'}
                  </p>
                  <p className="text-xs text-mq-content-secondary truncate">
                    {useCustomColor
                      ? UNIT_COLORS.find((c) => c.value === color)?.name || color
                      : selectedUnit
                        ? `From ${selectedUnit.code}`
                        : 'Select a unit first'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!useCustomColor) {
                      setColor(selectedUnit?.color || UNIT_COLORS[0].value);
                    }
                    setUseCustomColor(!useCustomColor);
                  }}
                  className="text-xs px-2 py-1 rounded border border-mq-border hover:bg-mq-hover-background transition-colors"
                >
                  {useCustomColor ? 'Use Unit Color' : 'Customize'}
                </button>
              </div>

              {/* Custom Color Picker - Scrollable */}
              {useCustomColor && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-mq-border">
                  {UNIT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={cn(
                        'w-8 h-8 rounded-full border-2 shrink-0 transition-all',
                        color === c.value
                          ? 'border-mq-content ring-2 ring-offset-2 ring-mq-primary'
                          : 'border-transparent hover:border-mq-border',
                      )}
                      style={{ backgroundColor: c.value }}
                      title={t(c.translationKey as TranslationKey)}
                      aria-label={t(c.translationKey as TranslationKey)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            {editAssignment && (
              <Button variant="destructive" onClick={handleDelete}>
                {t('delete')}
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={handleCancel}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={units.length === 0}>
              {editAssignment
                ? t('saveChanges')
                : t('addAssignment' as TranslationKey) || 'Add Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('deleteAssignment' as TranslationKey) || 'Delete Assignment'}
            </DialogTitle>
            <DialogDescription>
              {t('deleteAssignmentConfirm' as TranslationKey) ||
                'Are you sure you want to delete this assignment? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

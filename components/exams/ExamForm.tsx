// components/exams/ExamForm.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { Deadline } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '@/lib/hooks/useTranslation';
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

interface ExamFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editExam?: Deadline | null;
}

export default function ExamForm({ open, onOpenChange, editExam }: ExamFormProps) {
  const { t } = useTranslation();
  const { addDeadline, updateDeadline, removeDeadline } = useDeadlinesStore();
  const units = useUnitsStore((state) => state.units);

  const [title, setTitle] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [color, setColor] = useState<string>('');
  const [useUnitColor, setUseUnitColor] = useState(true);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('09:00'); // Exams typically start in the morning
  const [priority, setPriority] = useState<Deadline['priority']>('High'); // Exams are usually high priority
  const [completed, setCompleted] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get selected unit for color inheritance
  const selectedUnit = useMemo(() => {
    return units.find((u) => u.code === unitCode);
  }, [units, unitCode]);

  // Effective color (either unit color or custom override)
  const effectiveColor = useMemo(() => {
    if (useUnitColor && selectedUnit) {
      return selectedUnit.color;
    }
    return color || selectedUnit?.color || UNIT_COLORS[0].value;
  }, [useUnitColor, selectedUnit, color]);

  // Save operation with retry logic
  const performSave = useCallback(
    async (examData: Deadline) => {
      if (editExam) {
        updateDeadline(editExam.id, examData);
      } else {
        addDeadline(examData);
      }
    },
    [editExam, updateDeadline, addDeadline],
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
    setUseUnitColor(true);
    setDueDate('');
    setDueTime('09:00');
    setPriority('High');
    setCompleted(false);
    setErrors({});
  };

  useEffect(() => {
    if (editExam) {
      setTitle(editExam.title);
      setUnitCode(editExam.unitCode);
      if (editExam.color) {
        setColor(editExam.color);
        setUseUnitColor(false);
      } else {
        setColor('');
        setUseUnitColor(true);
      }
      const parsedDate = new Date(editExam.dueDate);
      if (isValid(parsedDate)) {
        setDueDate(format(parsedDate, 'yyyy-MM-dd'));
        setDueTime(format(parsedDate, 'HH:mm'));
      } else {
        setDueDate('');
        setDueTime('09:00');
      }
      setPriority(editExam.priority);
      setCompleted(editExam.completed);
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editExam?.id, open]);

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
      hasValidTime ? parsedHours : 9,
      hasValidTime ? parsedMinutes : 0,
    );

    const examData: Deadline = {
      id: editExam?.id || uuidv4(),
      title: title.trim(),
      unitCode,
      unitId: selectedUnit?.id,
      color: useUnitColor ? undefined : effectiveColor,
      dueDate: dueDateObj,
      priority,
      type: 'Exam', // Fixed type for exams
      completed,
      createdAt: editExam?.createdAt || new Date(),
    };

    const result = await saveWithRetry(examData);
    if (result !== null) {
      if (editExam) {
        toastUtils.success(
          t('examUpdated' as TranslationKey) || 'Exam Updated',
          `"${examData.title}" has been updated successfully.`,
        );
      } else {
        toastUtils.success(
          t('examAdded' as TranslationKey) || 'Exam Added',
          `"${examData.title}" has been added successfully.`,
        );
      }
      onOpenChange(false);
      resetForm();
    }
  };

  const handleDelete = () => {
    if (editExam) {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    if (editExam) {
      removeDeadline(editExam.id);
      toastUtils.success(
        t('examDeleted' as TranslationKey) || 'Exam Deleted',
        `"${editExam.title}" ${t('deletedMsg')}`,
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
          <DialogHeader>
            <DialogTitle>
              {editExam
                ? t('editExam' as TranslationKey) || 'Edit Exam'
                : t('addExam' as TranslationKey) || 'Add Exam'}
            </DialogTitle>
            <DialogDescription>
              {editExam
                ? t('updateExamDetails' as TranslationKey) || 'Update the exam details below.'
                : t('fillExamDetails' as TranslationKey) || 'Fill in the exam details below.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="exam-title">
                {t('title')} <span className="text-mq-error">*</span>
              </Label>
              <Input
                id="exam-title"
                placeholder={t('examTitlePlaceholder' as TranslationKey) || 'e.g., Final Exam'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-invalid={Boolean(errors.title)}
                aria-required="true"
                className={errors.title ? 'border-mq-error' : ''}
              />
              {errors.title && <p className="text-sm text-mq-error">{errors.title}</p>}
            </div>

            {/* Unit */}
            <div className="space-y-2">
              <Label htmlFor="exam-unit">
                {t('unitCode')} <span className="text-mq-error">*</span>
              </Label>
              <Select value={unitCode} onValueChange={setUnitCode}>
                <SelectTrigger
                  id="exam-unit"
                  className={errors.unitCode ? 'border-mq-error' : ''}
                  aria-invalid={Boolean(errors.unitCode)}
                  aria-required="true"
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
              {errors.unitCode && <p className="text-sm text-mq-error">{errors.unitCode}</p>}
            </div>

            {/* Exam Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exam-date">
                  {t('examDate' as TranslationKey) || 'Exam Date'}{' '}
                  <span className="text-mq-error">*</span>
                </Label>
                <Input
                  id="exam-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  aria-invalid={Boolean(errors.dueDate)}
                  aria-required="true"
                  className={errors.dueDate ? 'border-mq-error' : ''}
                />
                {errors.dueDate && <p className="text-sm text-mq-error">{errors.dueDate}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="exam-time">{t('examTime' as TranslationKey) || 'Exam Time'}</Label>
                <Input
                  id="exam-time"
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                />
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="exam-priority">{t('priority')}</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Deadline['priority'])}
              >
                <SelectTrigger id="exam-priority">
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
            <div className="space-y-3">
              <Label>{t('color' as TranslationKey) || 'Color'}</Label>

              <div className="flex items-center gap-2">
                <input
                  id="exam-useUnitColor"
                  type="checkbox"
                  checked={useUnitColor}
                  onChange={(e) => setUseUnitColor(e.target.checked)}
                  disabled={!selectedUnit}
                  className="h-4 w-4 rounded border-mq-border accent-mq-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus"
                />
                <Label htmlFor="exam-useUnitColor" className="text-sm font-normal">
                  {t('useUnitColor' as TranslationKey) || 'Use unit color'}
                </Label>
                {selectedUnit && (
                  <div
                    className="w-4 h-4 rounded-full border border-mq-border ml-1"
                    style={{ backgroundColor: selectedUnit.color }}
                    title={selectedUnit.code}
                  />
                )}
              </div>

              {!useUnitColor && (
                <Select value={color || UNIT_COLORS[0].value} onValueChange={setColor}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-mq-border"
                        style={{ backgroundColor: color || UNIT_COLORS[0].value }}
                      />
                      <SelectValue
                        placeholder={t('selectColor' as TranslationKey) || 'Select a color'}
                      />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_COLORS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border border-mq-border"
                            style={{ backgroundColor: c.value }}
                          />
                          <span>{t(c.translationKey as TranslationKey)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Completed */}
            <div className="flex items-center gap-2">
              <input
                id="exam-completed"
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                className="h-4 w-4 rounded border-mq-border accent-mq-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus"
              />
              <Label htmlFor="exam-completed" className="text-sm font-medium">
                {t('markAsCompleted')}
              </Label>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            {editExam && (
              <Button variant="destructive" onClick={handleDelete}>
                {t('delete')}
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={handleCancel}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={units.length === 0}>
              {editExam ? t('saveChanges') : t('addExam' as TranslationKey) || 'Add Exam'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('deleteExam' as TranslationKey) || 'Delete Exam'}</DialogTitle>
            <DialogDescription>
              {t('deleteExamConfirm' as TranslationKey) ||
                'Are you sure you want to delete this exam? This action cannot be undone.'}
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

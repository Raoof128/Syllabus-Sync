// components/deadlines/DeadlineForm.tsx
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
import { PRIORITY_LEVELS, DEADLINE_TYPES } from '@/lib/constants';
import { format, isValid } from 'date-fns';
import { errorHandler, createFormValidator, validationRules } from '@/lib/utils/errorHandling';
import { UNIT_COLORS } from '@/lib/config';

interface DeadlineFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editDeadline?: Deadline | null;
}

export default function DeadlineForm({ open, onOpenChange, editDeadline }: DeadlineFormProps) {
  const { t } = useTranslation();
  const { addDeadline, updateDeadline, removeDeadline } = useDeadlinesStore();
  const units = useUnitsStore((state) => state.units);

  const [title, setTitle] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [color, setColor] = useState<string>(''); // Custom color override
  const [useUnitColor, setUseUnitColor] = useState(true); // Toggle for unit color inheritance
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [priority, setPriority] = useState<Deadline['priority']>('Medium');
  const [type, setType] = useState<Deadline['type']>('Assignment');
  const [completed, setCompleted] = useState(false);

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

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Save operation with retry logic
  const performSave = useCallback(
    async (deadlineData: Deadline) => {
      if (editDeadline) {
        updateDeadline(editDeadline.id, deadlineData);
      } else {
        addDeadline(deadlineData);
      }
    },
    [editDeadline, updateDeadline, addDeadline],
  );

  const { execute: saveWithRetry } = useRetry(performSave, {
    maxAttempts: 3,
    showToastOnError: false, // We'll handle toasts manually
    errorMessage: t('failedToSaveDeadline'),
  });

  const resetForm = () => {
    setTitle('');
    setUnitCode('');
    setColor('');
    setUseUnitColor(true);
    setDueDate('');
    setDueTime('23:59');
    setPriority('Medium');
    setType('Assignment');
    setCompleted(false);
    setErrors({});
  };

  useEffect(() => {
    if (editDeadline) {
      setTitle(editDeadline.title);
      setUnitCode(editDeadline.unitCode);
      // Check if deadline has custom color
      if (editDeadline.color) {
        setColor(editDeadline.color);
        setUseUnitColor(false);
      } else {
        setColor('');
        setUseUnitColor(true);
      }
      const parsedDate = new Date(editDeadline.dueDate);
      if (isValid(parsedDate)) {
        setDueDate(format(parsedDate, 'yyyy-MM-dd'));
        setDueTime(format(parsedDate, 'HH:mm'));
      } else {
        setDueDate('');
        setDueTime('23:59');
      }
      setPriority(editDeadline.priority);
      setType(editDeadline.type);
      setCompleted(editDeadline.completed);
    } else {
      resetForm();
    }
    // Use editDeadline?.id to avoid re-running when object reference changes but content is same
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editDeadline?.id, open]);

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

    const deadlineData: Deadline = {
      id: editDeadline?.id || uuidv4(),
      title: title.trim(),
      unitCode,
      unitId: selectedUnit?.id,
      color: useUnitColor ? undefined : effectiveColor,
      dueDate: dueDateObj,
      priority,
      type,
      completed,
      createdAt: editDeadline?.createdAt || new Date(),
    };

    const result = await saveWithRetry(deadlineData);
    if (result !== null) {
      // Success - show toast and close form
      if (editDeadline) {
        toastUtils.success(
          t('deadlineUpdated'),
          `"${deadlineData.title}" has been updated successfully.`,
        );
      } else {
        toastUtils.success(
          t('deadlineAdded'),
          `"${deadlineData.title}" has been added successfully.`,
        );
      }
      onOpenChange(false);
      resetForm();
    }
  };

  const handleDelete = () => {
    if (editDeadline) {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    if (editDeadline) {
      removeDeadline(editDeadline.id);
      toastUtils.success(t('deadlineDeleted'), `"${editDeadline.title}" ${t('deletedMsg')}`);
      onOpenChange(false);
      resetForm();
    }
    setShowDeleteConfirm(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetForm();
  };

  const titleDescribedBy = [errors.title ? 'deadline-title-error' : '', 'deadline-title-help']
    .filter(Boolean)
    .join(' ');
  const unitDescribedBy = [errors.unitCode ? 'deadline-unit-error' : '', 'deadline-unit-help']
    .filter(Boolean)
    .join(' ');
  const dateDescribedBy = [errors.dueDate ? 'deadline-date-error' : '', 'deadline-date-help']
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editDeadline ? t('editDeadline') : t('addNewDeadline')}</DialogTitle>
            <DialogDescription>
              {editDeadline ? t('updateDeadlineDetails') : t('fillDeadlineDetails')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                {t('title')} <span className="text-mq-error">*</span>
              </Label>
              <Input
                id="title"
                placeholder={t('titlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-describedby={titleDescribedBy}
                aria-invalid={Boolean(errors.title)}
                aria-required="true"
                className={errors.title ? 'border-mq-error' : ''}
              />
              <p id="deadline-title-help" className="text-xs text-mq-content-tertiary">
                {t('titleHelp')}
              </p>
              {errors.title && (
                <p id="deadline-title-error" className="text-sm text-mq-error">
                  {errors.title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitCode">
                {t('unitCode')} <span className="text-mq-error">*</span>
              </Label>
              <Select value={unitCode} onValueChange={setUnitCode}>
                <SelectTrigger
                  className={errors.unitCode ? 'border-mq-error' : ''}
                  aria-describedby={unitDescribedBy}
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
              <p id="deadline-unit-help" className="text-xs text-mq-content-tertiary">
                {t('unitHelp')}
              </p>
              {errors.unitCode && (
                <p id="deadline-unit-error" className="text-sm text-mq-error">
                  {errors.unitCode}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">
                {t('dueDate')} <span className="text-mq-error">*</span>
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                aria-describedby={dateDescribedBy}
                aria-invalid={Boolean(errors.dueDate)}
                aria-required="true"
                className={errors.dueDate ? 'border-mq-error' : ''}
              />
              <p id="deadline-date-help" className="text-xs text-mq-content-tertiary">
                {t('dateHelp')}
              </p>
              {errors.dueDate && (
                <p id="deadline-date-error" className="text-sm text-mq-error">
                  {errors.dueDate}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueTime">
                {t('dueTime')} <span className="text-mq-error">*</span>
              </Label>
              <Input
                id="dueTime"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">{t('priority')}</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Deadline['priority'])}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="type">{t('type')}</Label>
              <Select value={type} onValueChange={(v) => setType(v as Deadline['type'])}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectType')} />
                </SelectTrigger>
                <SelectContent>
                  {DEADLINE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`type_${type}` as TranslationKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color Selection */}
            <div className="space-y-3">
              <Label>Color</Label>

              {/* Unit color inheritance toggle */}
              <div className="flex items-center gap-2">
                <input
                  id="useUnitColor"
                  type="checkbox"
                  checked={useUnitColor}
                  onChange={(e) => setUseUnitColor(e.target.checked)}
                  disabled={!selectedUnit}
                  className="h-4 w-4 rounded border-mq-border accent-mq-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus"
                />
                <Label htmlFor="useUnitColor" className="text-sm font-normal">
                  Use unit color
                </Label>
                {selectedUnit && (
                  <div
                    className="w-4 h-4 rounded-full border border-mq-border ml-1"
                    style={{ backgroundColor: selectedUnit.color }}
                    title={selectedUnit.code}
                  />
                )}
              </div>

              {/* Custom color picker (shown when not using unit color) */}
              {!useUnitColor && (
                <div className="grid grid-cols-8 gap-2">
                  {UNIT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        color === c.value
                          ? 'border-mq-primary scale-110 ring-2 ring-mq-primary/30'
                          : 'border-transparent hover:border-mq-border'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              )}

              {/* Color preview */}
              <div className="flex items-center gap-2 text-xs text-mq-content-secondary">
                <div
                  className="w-4 h-4 rounded-full border border-mq-border"
                  style={{ backgroundColor: effectiveColor }}
                />
                <span>Preview: {effectiveColor}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="completed"
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                className="h-4 w-4 rounded border-mq-border accent-mq-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus"
              />
              <Label htmlFor="completed" className="text-sm font-medium">
                {t('markAsCompleted')}
              </Label>
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="p-3 bg-mq-error/10 border border-mq-error/20 rounded-lg text-sm text-mq-error">
                {Object.entries(errors).map(([field, error]) => (
                  <div key={field}>• {error}</div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            {editDeadline && (
              <Button variant="destructive" onClick={handleDelete}>
                {t('delete')}
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={handleCancel}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={units.length === 0}>
              {editDeadline ? t('saveChanges') : t('addDeadline')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('deleteDeadline')}</DialogTitle>
            <DialogDescription>{t('deleteDeadlineConfirm')}</DialogDescription>
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

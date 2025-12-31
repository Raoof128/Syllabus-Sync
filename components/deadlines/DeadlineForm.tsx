'use client';

import { useState, useEffect } from 'react';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { Deadline } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface DeadlineFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editDeadline?: Deadline | null;
}

export default function DeadlineForm({ open, onOpenChange, editDeadline }: DeadlineFormProps) {
  const { addDeadline, updateDeadline, removeDeadline } = useDeadlinesStore();
  const units = useUnitsStore((state) => state.units);

  // Form state
  const [title, setTitle] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [priority, setPriority] = useState<Deadline['priority']>('Medium');
  const [type, setType] = useState<Deadline['type']>('Assignment');
  const [completed, setCompleted] = useState(false);

  // Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const resetForm = () => {
    setTitle('');
    setUnitCode('');
    setDueDate('');
    setDueTime('23:59');
    setPriority('Medium');
    setType('Assignment');
    setCompleted(false);
    setErrors({});
  };

  // Initialize form with edit data
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (editDeadline) {
      setTitle(editDeadline.title);
      setUnitCode(editDeadline.unitCode);
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
  }, [editDeadline, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) newErrors.title = 'Title is required';
    if (!unitCode) newErrors.unitCode = 'Unit is required';
    if (!dueDate) newErrors.dueDate = 'Due date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
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
      dueDate: dueDateObj,
      priority,
      type,
      completed,
      createdAt: editDeadline?.createdAt || new Date(),
    };

    if (editDeadline) {
      updateDeadline(editDeadline.id, deadlineData);
    } else {
      addDeadline(deadlineData);
    }

    onOpenChange(false);
    resetForm();
  };

  const handleDelete = () => {
    if (editDeadline && confirm('Are you sure you want to delete this deadline?')) {
      removeDeadline(editDeadline.id);
      onOpenChange(false);
      resetForm();
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editDeadline ? 'Edit Deadline' : 'Add New Deadline'}</DialogTitle>
          <DialogDescription>
            {editDeadline
              ? 'Update the details of your deadline.'
              : 'Fill in the details to add a new deadline.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Assignment 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <Label htmlFor="unitCode">
              Unit <span className="text-red-500">*</span>
            </Label>
            <Select value={unitCode} onValueChange={setUnitCode}>
              <SelectTrigger className={errors.unitCode ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.code}>
                    {unit.code} - {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.unitCode && <p className="text-sm text-red-500">{errors.unitCode}</p>}
            {units.length === 0 && (
              <p className="text-sm text-yellow-600">Please add a unit first.</p>
            )}
          </div>

          {/* Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">
                Due Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={errors.dueDate ? 'border-red-500' : ''}
              />
              {errors.dueDate && <p className="text-sm text-red-500">{errors.dueDate}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueTime">Due Time</Label>
              <Input
                id="dueTime"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as Deadline['type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEADLINE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Deadline['priority'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_LEVELS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Completed */}
          <div className="flex items-center gap-2">
            <input
              id="completed"
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
            <Label htmlFor="completed">Mark as completed</Label>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {editDeadline && (
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={units.length === 0}>
            {editDeadline ? 'Save Changes' : 'Add Deadline'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

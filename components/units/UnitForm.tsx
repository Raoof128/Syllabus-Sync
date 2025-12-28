'use client';

import { useState, useEffect } from 'react';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { Unit, ClassTime, DayOfWeek } from '@/lib/types';
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
import { Plus, Trash2, X } from 'lucide-react';

interface UnitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editUnit?: Unit | null;
}

const DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const COLORS = [
  { name: 'Macquarie Red', value: '#A6192E' },
  { name: 'Macquarie Blue', value: '#002A45' },
  { name: 'Macquarie Gold', value: '#FFB81C' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Orange', value: '#f97316' },
];

export default function UnitForm({ open, onOpenChange, editUnit }: UnitFormProps) {
  const { addUnit, updateUnit, removeUnit } = useUnitsStore();

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [color, setColor] = useState(COLORS[0].value);
  const [schedule, setSchedule] = useState<ClassTime[]>([]);

  // Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const resetForm = () => {
    setCode('');
    setName('');
    setBuilding('');
    setRoom('');
    setColor(COLORS[0].value);
    setSchedule([]);
    setErrors({});
  };

  // Initialize form with edit data
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (editUnit) {
      setCode(editUnit.code);
      setName(editUnit.name);
      setBuilding(editUnit.location.building);
      setRoom(editUnit.location.room);
      setColor(editUnit.color);
      setSchedule([...editUnit.schedule]);
    } else {
      resetForm();
    }
  }, [editUnit, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const addClassTime = () => {
    const newClassTime: ClassTime = {
      id: uuidv4(),
      day: 'Monday',
      startTime: '09:00',
      endTime: '11:00',
    };
    setSchedule([...schedule, newClassTime]);
  };

  const removeClassTime = (id: string) => {
    setSchedule(schedule.filter((ct) => ct.id !== id));
  };

  const updateClassTime = (id: string, field: keyof ClassTime, value: string) => {
    setSchedule(schedule.map((ct) => (ct.id === id ? { ...ct, [field]: value } : ct)));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Required fields
    if (!code.trim()) newErrors.code = 'Unit code is required';
    if (!name.trim()) newErrors.name = 'Unit name is required';
    if (!building.trim()) newErrors.building = 'Building is required';
    if (!room.trim()) newErrors.room = 'Room is required';
    if (schedule.length === 0) newErrors.schedule = 'At least one class time is required';

    // Validate class times
    schedule.forEach((ct, index) => {
      if (ct.startTime >= ct.endTime) {
        newErrors[`time_${index}`] = 'End time must be after start time';
      }
    });

    // Check for duplicate class times
    const timesSet = new Set();
    schedule.forEach((ct, index) => {
      const timeKey = `${ct.day}-${ct.startTime}-${ct.endTime}`;
      if (timesSet.has(timeKey)) {
        newErrors[`duplicate_${index}`] = 'Duplicate class time';
      }
      timesSet.add(timeKey);
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const unitData: Unit = {
      id: editUnit?.id || uuidv4(),
      code: code.trim().toUpperCase(),
      name: name.trim(),
      color,
      location: {
        building: building.trim(),
        room: room.trim(),
      },
      schedule,
      createdAt: editUnit?.createdAt || new Date(),
    };

    if (editUnit) {
      updateUnit(editUnit.id, unitData);
    } else {
      addUnit(unitData);
    }

    onOpenChange(false);
    resetForm();
  };

  const handleDelete = () => {
    if (editUnit && confirm('Are you sure you want to delete this unit?')) {
      removeUnit(editUnit.id);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editUnit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
          <DialogDescription>
            {editUnit
              ? 'Update the details of your unit.'
              : 'Fill in the details to add a new unit to your schedule.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Unit Code */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Unit Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              placeholder="e.g., COMP2310"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={errors.code ? 'border-red-500' : ''}
            />
            {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
          </div>

          {/* Unit Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Unit Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Computer Networks"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="building">
                Building <span className="text-red-500">*</span>
              </Label>
              <Input
                id="building"
                placeholder="e.g., C5C"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className={errors.building ? 'border-red-500' : ''}
              />
              {errors.building && <p className="text-sm text-red-500">{errors.building}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="room">
                Room <span className="text-red-500">*</span>
              </Label>
              <Input
                id="room"
                placeholder="e.g., 204"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className={errors.room ? 'border-red-500' : ''}
              />
              {errors.room && <p className="text-sm text-red-500">{errors.room}</p>}
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label htmlFor="color">Unit Color</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {COLORS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: c.value }} />
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class Times */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                Class Times <span className="text-red-500">*</span>
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addClassTime}>
                <Plus className="w-4 h-4 mr-1" />
                Add Class Time
              </Button>
            </div>

            {errors.schedule && schedule.length === 0 && (
              <p className="text-sm text-red-500">{errors.schedule}</p>
            )}

            <div className="space-y-3">
              {schedule.map((ct, index) => (
                <div key={ct.id} className="flex items-start gap-2 p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    {/* Day */}
                    <div className="space-y-1">
                      <Label className="text-xs">Day</Label>
                      <Select
                        value={ct.day}
                        onValueChange={(value) => updateClassTime(ct.id, 'day', value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Start Time */}
                    <div className="space-y-1">
                      <Label className="text-xs">Start</Label>
                      <Input
                        type="time"
                        value={ct.startTime}
                        onChange={(e) => updateClassTime(ct.id, 'startTime', e.target.value)}
                        className="h-9"
                      />
                    </div>

                    {/* End Time */}
                    <div className="space-y-1">
                      <Label className="text-xs">End</Label>
                      <Input
                        type="time"
                        value={ct.endTime}
                        onChange={(e) => updateClassTime(ct.id, 'endTime', e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeClassTime(ct.id)}
                    className="mt-6"
                  >
                    <X className="w-4 h-4" />
                  </Button>

                  {/* Errors for this class time */}
                  {(errors[`time_${index}`] || errors[`duplicate_${index}`]) && (
                    <div className="col-span-4 text-xs text-red-500">
                      {errors[`time_${index}`] || errors[`duplicate_${index}`]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {editUnit && (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Unit
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              {editUnit ? 'Update' : 'Add'} Unit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

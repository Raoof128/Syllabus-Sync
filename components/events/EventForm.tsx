// components/events/EventForm.tsx
'use client';

import { useEffect, useReducer, useCallback } from 'react';
import { useEventsStore } from '@/lib/store/eventsStore';
import { Event } from '@/lib/types';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, isValid } from 'date-fns';
import { UNIT_COLORS } from '@/lib/config';
import { validateBuilding, BUILDING_VALIDATION_ERROR } from '@/lib/utils/buildingValidation';

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEvent?: Event | null;
}

const EVENT_CATEGORIES: Event['category'][] = ['Academic', 'Career', 'Social', 'Free Food'];

// Form state type
interface FormState {
  title: string;
  description: string;
  date: string;
  time: string;
  building: string;
  room: string; // Optional room field
  category: Event['category'];
  color: string;
  errors: { [key: string]: string };
  showDeleteConfirm: boolean;
}

// Form actions
type FormAction =
  | {
      type: 'SET_FIELD';
      field: keyof Omit<FormState, 'errors' | 'showDeleteConfirm'>;
      value: string | Event['category'];
    }
  | { type: 'SET_ERRORS'; errors: { [key: string]: string } }
  | { type: 'SET_DELETE_CONFIRM'; value: boolean }
  | { type: 'RESET'; values: Omit<FormState, 'errors' | 'showDeleteConfirm'> };

// Helper to get initial form values
function getInitialValues(
  editEvent?: Event | null,
): Omit<FormState, 'errors' | 'showDeleteConfirm'> {
  if (editEvent) {
    const parsedDate = new Date(editEvent.startAt);
    return {
      title: editEvent.title,
      description: editEvent.description,
      date: isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd') : '',
      time: editEvent.time,
      building: editEvent.building || '',
      room: editEvent.room || '', // Load optional room
      category: editEvent.category,
      color: editEvent.color || UNIT_COLORS[0].value,
    };
  }
  return {
    title: '',
    description: '',
    date: '',
    time: '',
    building: '',
    room: '',
    category: 'Academic' as Event['category'],
    color: UNIT_COLORS[0].value,
  };
}

// Form reducer to batch state updates and avoid cascading renders
function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'SET_DELETE_CONFIRM':
      return { ...state, showDeleteConfirm: action.value };
    case 'RESET':
      return { ...action.values, errors: {}, showDeleteConfirm: false };
    default:
      return state;
  }
}

export default function EventForm({ open, onOpenChange, editEvent }: EventFormProps) {
  const { t } = useTypedTranslation();
  const addEvent = useEventsStore((state) => state.addEvent);
  const updateEvent = useEventsStore((state) => state.updateEvent);
  const removeEvent = useEventsStore((state) => state.removeEvent);

  // Use reducer to batch form state updates and avoid cascading renders
  const [formState, dispatch] = useReducer(formReducer, {
    ...getInitialValues(editEvent),
    errors: {},
    showDeleteConfirm: false,
  });

  const {
    title,
    description,
    date,
    time,
    building,
    room,
    category,
    color,
    errors,
    showDeleteConfirm,
  } = formState;

  // Reset form when editEvent changes - use key prop pattern instead of useEffect
  const formKey = editEvent?.id ?? 'new';

  // Effect to reset form when dialog opens or editEvent changes
  // Using dispatch with RESET action batches all updates into a single render
  useEffect(() => {
    if (open) {
      dispatch({ type: 'RESET', values: getInitialValues(editEvent) });
    }
  }, [open, editEvent]);

  // Field setters using dispatch
  const setTitle = useCallback(
    (value: string) => dispatch({ type: 'SET_FIELD', field: 'title', value }),
    [],
  );
  const setDescription = useCallback(
    (value: string) => dispatch({ type: 'SET_FIELD', field: 'description', value }),
    [],
  );
  const setDate = useCallback(
    (value: string) => dispatch({ type: 'SET_FIELD', field: 'date', value }),
    [],
  );
  const setTime = useCallback(
    (value: string) => dispatch({ type: 'SET_FIELD', field: 'time', value }),
    [],
  );
  const setBuilding = useCallback(
    (value: string) => dispatch({ type: 'SET_FIELD', field: 'building', value }),
    [],
  );
  const setRoom = useCallback(
    (value: string) => dispatch({ type: 'SET_FIELD', field: 'room', value }),
    [],
  );
  const setCategory = useCallback(
    (value: Event['category']) => dispatch({ type: 'SET_FIELD', field: 'category', value }),
    [],
  );
  const setColor = useCallback(
    (value: string) => dispatch({ type: 'SET_FIELD', field: 'color', value }),
    [],
  );
  const setErrors = useCallback(
    (errors: { [key: string]: string }) => dispatch({ type: 'SET_ERRORS', errors }),
    [],
  );
  const setShowDeleteConfirm = useCallback(
    (value: boolean) => dispatch({ type: 'SET_DELETE_CONFIRM', value }),
    [],
  );

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET', values: getInitialValues(editEvent) });
  }, [editEvent]);

  const validateForm = (): boolean => {
    const formErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      formErrors.title = t('fieldRequired');
    }
    if (!date) {
      formErrors.date = t('fieldRequired');
    }
    if (!time.trim()) {
      formErrors.time = t('fieldRequired');
    }
    if (!building.trim()) {
      formErrors.building = t('fieldRequired');
    } else {
      // Validate building against map data
      const validatedBuilding = validateBuilding(building);
      if (!validatedBuilding) {
        formErrors.building = BUILDING_VALIDATION_ERROR;
      }
    }

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);

    // Parse time to create startAt timestamp
    // Supports formats like "2:00 PM", "14:00", "2:00 PM - 4:00 PM"
    const timeStr = time.trim();
    let startAt = dateObj;
    let allDay = false;

    if (timeStr) {
      // Try to parse the start time from various formats
      const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const meridiem = timeMatch[3]?.toUpperCase();

        if (meridiem === 'PM' && hours < 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;

        startAt = new Date(year, month - 1, day, hours, minutes);
      }
    } else {
      allDay = true;
    }

    const eventData: Event = {
      id: editEvent?.id || uuidv4(),
      title: title.trim(),
      description: description.trim(),
      startAt,
      endAt: undefined, // Could be parsed from "2:00 PM - 4:00 PM" format
      allDay,
      date: startAt, // Computed for backward compatibility in UI (derived from startAt)
      time: timeStr, // Keep original time string for display
      building: building.trim(),
      room: room.trim() || undefined, // Optional room field
      location: room.trim() ? `${building.trim()} ${room.trim()}` : building.trim(), // Legacy field
      category,
      color,
    };

    if (editEvent) {
      await updateEvent(editEvent.id, eventData);
      toastUtils.success(t('eventUpdated'), t('eventUpdatedMsg'));
    } else {
      await addEvent(eventData);
      toastUtils.success(t('eventCreated'), t('eventCreatedMsg'));
    }

    onOpenChange(false);
  };

  const handleDelete = () => {
    if (editEvent) {
      removeEvent(editEvent.id);
      toastUtils.success(t('eventDeleted'), t('eventDeletedMsg'));
      setShowDeleteConfirm(false);
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Reset form when opening
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" key={formKey}>
        <DialogHeader>
          <DialogTitle>{editEvent ? t('editEvent') : t('addEvent')}</DialogTitle>
          <DialogDescription>
            {editEvent ? t('editEventDesc') : t('addEventDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="event-title">
              {t('title')} <span className="text-mq-error">*</span>
            </Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('enterEventTitle')}
              aria-invalid={Boolean(errors.title)}
              aria-required="true"
              aria-describedby={errors.title ? 'event-title-error' : undefined}
              className={errors.title ? 'border-mq-error' : ''}
            />
            {errors.title && (
              <p id="event-title-error" className="text-xs text-mq-error" role="alert">
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="event-description">{t('description')}</Label>
            <Input
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('enterEventDescription')}
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-date">
                {t('date')} <span className="text-mq-error">*</span>
              </Label>
              <Input
                id="event-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-invalid={Boolean(errors.date)}
                aria-required="true"
                aria-describedby={errors.date ? 'event-date-error' : undefined}
                className={errors.date ? 'border-mq-error' : ''}
              />
              {errors.date && (
                <p id="event-date-error" className="text-xs text-mq-error" role="alert">
                  {errors.date}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-time">
                {t('time')} <span className="text-mq-error">*</span>
              </Label>
              <Input
                id="event-time"
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder={t('exampleTime')}
                aria-invalid={Boolean(errors.time)}
                aria-required="true"
                aria-describedby={errors.time ? 'event-time-error' : undefined}
                className={errors.time ? 'border-mq-error' : ''}
              />
              {errors.time && (
                <p id="event-time-error" className="text-xs text-mq-error" role="alert">
                  {errors.time}
                </p>
              )}
            </div>
          </div>

          {/* Building and Room */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-building">
                {t('building')} <span className="text-mq-error">*</span>
              </Label>
              <Input
                id="event-building"
                value={building}
                onChange={(e) => setBuilding(e.target.value.toUpperCase())}
                placeholder={t('buildingPlaceholder')}
                aria-invalid={Boolean(errors.building)}
                aria-required="true"
                aria-describedby={errors.building ? 'event-building-error' : undefined}
                className={errors.building ? 'border-mq-error' : ''}
              />
              {errors.building && (
                <p id="event-building-error" className="text-xs text-mq-error" role="alert">
                  {errors.building}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-room">{t('room')}</Label>
              <Input
                id="event-room"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder={t('roomPlaceholder')}
              />
              <p className="text-xs text-mq-content-tertiary">
                Optional
              </p>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="event-category">{t('category')}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Event['category'])}>
              <SelectTrigger id="event-category">
                <SelectValue placeholder={t('selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {EVENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {t(`category_${cat.replace(/ /g, '')}` as TranslationKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label htmlFor="event-color">{t('color')}</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger id="event-color">
                <SelectValue placeholder={t('selectColor')} />
              </SelectTrigger>
              <SelectContent>
                {UNIT_COLORS.map((colorOption) => (
                  <SelectItem key={colorOption.value} value={colorOption.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-mq-border"
                        style={{ backgroundColor: colorOption.value }}
                      />
                      <span>{t(colorOption.translationKey as TranslationKey)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {editEvent && !showDeleteConfirm && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="mr-auto"
            >
              {t('delete')}
            </Button>
          )}
          {showDeleteConfirm && (
            <div className="flex items-center gap-2 mr-auto">
              <span className="text-sm text-mq-error">{t('confirmDelete')}</span>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                {t('yes')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                {t('no')}
              </Button>
            </div>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave}>{editEvent ? t('save') : t('addEvent')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

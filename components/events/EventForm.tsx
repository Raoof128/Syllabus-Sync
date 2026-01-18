// components/events/EventForm.tsx
'use client';

import { useState } from 'react';
import { useEventsStore } from '@/lib/store/eventsStore';
import { Event } from '@/lib/types';
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

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEvent?: Event | null;
}

const EVENT_CATEGORIES: Event['category'][] = ['Academic', 'Career', 'Social', 'Free Food'];

// Helper to get initial form values
function getInitialValues(editEvent?: Event | null) {
  if (editEvent) {
    const parsedDate = new Date(editEvent.startAt);
    return {
      title: editEvent.title,
      description: editEvent.description,
      date: isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd') : '',
      time: editEvent.time,
      location: editEvent.location,
      building: editEvent.building || '',
      category: editEvent.category,
      color: editEvent.color || UNIT_COLORS[0].value,
    };
  }
  return {
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    building: '',
    category: 'Academic' as Event['category'],
    color: UNIT_COLORS[0].value,
  };
}

export default function EventForm({ open, onOpenChange, editEvent }: EventFormProps) {
  const { t } = useTranslation();
  const { addEvent, updateEvent, removeEvent } = useEventsStore();

  // Initialize form with values based on editEvent
  const initialValues = getInitialValues(editEvent);

  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description);
  const [date, setDate] = useState(initialValues.date);
  const [time, setTime] = useState(initialValues.time);
  const [location, setLocation] = useState(initialValues.location);
  const [building, setBuilding] = useState(initialValues.building);
  const [category, setCategory] = useState<Event['category']>(initialValues.category);
  const [color, setColor] = useState(initialValues.color);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset form when editEvent changes - use key prop pattern instead of useEffect
  const formKey = editEvent?.id ?? 'new';

  const resetForm = () => {
    const values = getInitialValues(editEvent);
    setTitle(values.title);
    setDescription(values.description);
    setDate(values.date);
    setTime(values.time);
    setLocation(values.location);
    setBuilding(values.building);
    setCategory(values.category);
    setColor(values.color);
    setErrors({});
    setShowDeleteConfirm(false);
  };

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
    if (!location.trim()) {
      formErrors.location = t('fieldRequired');
    }

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleSave = () => {
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
      date: startAt, // Computed for backward compatibility
      time: timeStr, // Keep original time string for display
      location: location.trim(),
      building: building.trim() || undefined,
      category,
      color,
    };

    if (editEvent) {
      updateEvent(editEvent.id, eventData);
      toastUtils.success(t('eventUpdated'), t('eventUpdatedMsg'));
    } else {
      addEvent(eventData);
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
            <Label htmlFor="event-title">{t('eventTitle')}</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('enterEventTitle')}
              className={errors.title ? 'border-mq-error' : ''}
            />
            {errors.title && <p className="text-xs text-mq-error">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="event-description">{t('description' as 'title')}</Label>
            <Input
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('enterEventDescription' as 'title')}
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-date">{t('date' as 'title')}</Label>
              <Input
                id="event-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={errors.date ? 'border-mq-error' : ''}
              />
              {errors.date && <p className="text-xs text-mq-error">{errors.date}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-time">{t('time' as 'title')}</Label>
              <Input
                id="event-time"
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g., 2:00 PM - 4:00 PM"
                className={errors.time ? 'border-mq-error' : ''}
              />
              {errors.time && <p className="text-xs text-mq-error">{errors.time}</p>}
            </div>
          </div>

          {/* Location and Building */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-location">{t('location' as 'title')}</Label>
              <Input
                id="event-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('enterLocation' as 'title')}
                className={errors.location ? 'border-mq-error' : ''}
              />
              {errors.location && <p className="text-xs text-mq-error">{errors.location}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-building">{t('buildingCode' as 'title')}</Label>
              <Input
                id="event-building"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="e.g., C5C"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="event-category">{t('category' as 'title')}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Event['category'])}>
              <SelectTrigger id="event-category">
                <SelectValue placeholder={t('selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {EVENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {t(`category_${cat.replace(/ /g, '')}` as 'category_Academic')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label htmlFor="event-color">{t('color' as TranslationKey) || 'Color'}</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger id="event-color">
                <SelectValue placeholder={t('selectColor' as TranslationKey) || 'Select a color'} />
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

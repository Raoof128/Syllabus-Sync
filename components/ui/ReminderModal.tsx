// components/ui/ReminderModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Clock, Calendar as CalendarIcon } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/mq/switch';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { useRemindersStore, ReminderItemType, ReminderTiming, getTimingLabel } from '@/lib/store/remindersStore';
import { useNotificationsStore } from '@/lib/store/notificationsStore';
import { toastUtils } from '@/lib/utils/toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemType: ReminderItemType;
  itemTitle: string;
  itemDate?: Date; // The date/time of the item (for reference)
  itemColor?: string; // Optional color for visual indication
  /** Class schedule for units - array of day/time strings */
  unitSchedule?: Array<{ day: string; startTime: string; endTime: string }>;
}

const TIMING_OPTIONS: { value: ReminderTiming; label: string }[] = [
  { value: '15min', label: '15 minutes before' },
  { value: '30min', label: '30 minutes before' },
  { value: '1hour', label: '1 hour before' },
  { value: '2hours', label: '2 hours before' },
  { value: '1day', label: '1 day before' },
  { value: '2days', label: '2 days before' },
  { value: '1week', label: '1 week before' },
  { value: 'custom', label: 'Custom date & time' },
];

export default function ReminderModal({
  open,
  onOpenChange,
  itemId,
  itemType,
  itemTitle,
  itemDate,
  itemColor,
  unitSchedule,
}: ReminderModalProps) {
  const { t } = useTypedTranslation();
  const { addReminder, updateReminder, removeReminder, getReminderForItem } = useRemindersStore();
  const { addNotification } = useNotificationsStore();

  const [enabled, setEnabled] = useState(false);
  const [timing, setTiming] = useState<ReminderTiming>('1day');
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('09:00');
  const [existingReminderId, setExistingReminderId] = useState<string | null>(null);

  // Load existing reminder on open
  useEffect(() => {
    if (open) {
      const existing = getReminderForItem(itemId, itemType);
      if (existing) {
        setEnabled(existing.enabled);
        setTiming(existing.timing);
        setCustomDate(existing.customDate || '');
        setCustomTime(existing.customTime || '09:00');
        setExistingReminderId(existing.id);
      } else {
        // Reset to defaults
        setEnabled(false);
        setTiming('1day');
        setCustomDate('');
        setCustomTime('09:00');
        setExistingReminderId(null);
      }
    }
  }, [open, itemId, itemType, getReminderForItem]);

  // Set default custom date based on item date
  useEffect(() => {
    if (open && itemDate && !customDate) {
      const defaultDate = new Date(itemDate);
      defaultDate.setDate(defaultDate.getDate() - 1); // Default to 1 day before
      setCustomDate(format(defaultDate, 'yyyy-MM-dd'));
    }
  }, [open, itemDate, customDate]);

  const handleSave = useCallback(() => {
    if (enabled) {
      // Validate custom timing
      if (timing === 'custom' && !customDate) {
        toastUtils.error(t('error'), 'Please select a custom date');
        return;
      }

      const reminderData = {
        itemId,
        itemType,
        itemTitle,
        timing,
        customDate: timing === 'custom' ? customDate : undefined,
        customTime: timing === 'custom' ? customTime : undefined,
        enabled: true,
      };

      if (existingReminderId) {
        updateReminder(existingReminderId, reminderData);
        toastUtils.success(t('success'), t('reminderUpdated' as any) || 'Reminder updated');
      } else {
        const newReminder = addReminder(reminderData);
        setExistingReminderId(newReminder.id);

        // Create a notification to show the reminder was set
        addNotification({
          title: t('reminderSet' as any) || 'Reminder Set',
          message: `${getTimingLabel(timing)} for "${itemTitle}"`,
          type: 'system',
          read: false,
          link: undefined,
          relatedId: itemId,
        });

        toastUtils.success(t('success'), t('reminderSet' as any) || 'Reminder set successfully');
      }
    } else if (existingReminderId) {
      // Disable/remove reminder
      removeReminder(existingReminderId);
      setExistingReminderId(null);

      // Create a notification to show the reminder was removed
      addNotification({
        title: t('reminderRemoved' as any) || 'Reminder Removed',
        message: `Reminder for "${itemTitle}" has been removed`,
        type: 'system',
        read: false,
        link: undefined,
        relatedId: itemId,
      });

      toastUtils.success(t('success'), t('reminderRemoved' as any) || 'Reminder removed');
    }

    onOpenChange(false);
  }, [
    enabled,
    timing,
    customDate,
    customTime,
    itemId,
    itemType,
    itemTitle,
    existingReminderId,
    addReminder,
    updateReminder,
    removeReminder,
    addNotification,
    onOpenChange,
    t,
  ]);

  const getItemTypeLabel = (type: ReminderItemType): string => {
    switch (type) {
      case 'unit': return t('class' as any) || 'Class';
      case 'exam': return t('exam' as any) || 'Exam';
      case 'assignment': return t('assignment' as any) || 'Assignment';
      case 'event': return t('event' as any) || 'Event';
      case 'todo': return t('todo' as any) || 'To-Do';
      default: return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-mq-primary" />
            {t('setReminder' as any) || 'Set Reminder'}
          </DialogTitle>
          <DialogDescription>
            {t('setReminderDesc' as any) || 'Get notified before this item is due'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Item Info */}
          <div
            className="p-3 rounded-lg border border-mq-border bg-mq-background-secondary"
            style={{ borderLeftColor: itemColor, borderLeftWidth: itemColor ? 4 : undefined }}
          >
            <div className="text-xs text-mq-content-tertiary uppercase font-medium mb-1">
              {getItemTypeLabel(itemType)}
            </div>
            <div className="font-semibold text-mq-content">{itemTitle}</div>
            {/* Show class schedule for units */}
            {itemType === 'unit' && unitSchedule && unitSchedule.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="text-xs text-mq-content-tertiary uppercase font-medium">
                  {t('classSchedule' as any) || 'Class Schedule'}
                </div>
                {unitSchedule.map((schedule, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-sm text-mq-content-secondary">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{schedule.day}: {schedule.startTime} - {schedule.endTime}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Show date for other item types */}
            {itemType !== 'unit' && itemDate && (
              <div className="flex items-center gap-1 text-sm text-mq-content-secondary mt-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                {format(itemDate, 'PPP p')}
              </div>
            )}
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {enabled ? (
                <Bell className="h-4 w-4 text-mq-primary" />
              ) : (
                <BellOff className="h-4 w-4 text-mq-content-tertiary" />
              )}
              <Label htmlFor="reminder-enabled" className="font-medium">
                {t('enableReminder' as any) || 'Enable reminder'}
              </Label>
            </div>
            <Switch
              id="reminder-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {enabled && (
            <>
              {/* Timing Selection */}
              <div className="space-y-2">
                <Label htmlFor="reminder-timing">
                  {t('remindMe' as any) || 'Remind me'}
                </Label>
                <Select value={timing} onValueChange={(v) => setTiming(v as ReminderTiming)}>
                  <SelectTrigger id="reminder-timing">
                    <SelectValue placeholder={t('selectTiming' as any) || 'Select timing'} />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMING_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date/Time */}
              {timing === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-date">
                      {t('date')}
                    </Label>
                    <Input
                      id="custom-date"
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-time">
                      {t('time')}
                    </Label>
                    <Input
                      id="custom-time"
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Preview */}
              {itemDate && timing !== 'custom' && (
                <div className="p-3 rounded-lg bg-mq-primary/5 border border-mq-primary/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-mq-primary" />
                    <span className="text-mq-content">
                      {t('youWillBeNotified' as any) || "You'll be notified"}{' '}
                      <span className="font-medium">{getTimingLabel(timing)}</span>
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave}>
            {enabled
              ? (existingReminderId ? t('update') : t('setReminder' as any) || 'Set Reminder')
              : (t('removeReminder' as any) || 'Remove Reminder')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Bell button component for easy use in cards
interface ReminderBellButtonProps {
  itemId: string;
  itemType: ReminderItemType;
  itemTitle: string;
  itemDate?: Date;
  itemColor?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function ReminderBellButton({
  itemId,
  itemType,
  itemTitle,
  itemDate,
  itemColor,
  className,
  size = 'sm',
}: ReminderBellButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { getReminderForItem } = useRemindersStore();
  const hasReminder = !!getReminderForItem(itemId, itemType);

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const buttonSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setModalOpen(true);
        }}
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-colors',
          buttonSize,
          hasReminder
            ? 'bg-mq-primary/10 text-mq-primary hover:bg-mq-primary/20'
            : 'bg-mq-background-secondary text-mq-content-tertiary hover:text-mq-content hover:bg-mq-hover-background',
          className
        )}
        title={hasReminder ? 'Edit reminder' : 'Set reminder'}
        aria-label={hasReminder ? 'Edit reminder' : 'Set reminder'}
      >
        {hasReminder ? (
          <Bell className={cn(iconSize, 'fill-current')} />
        ) : (
          <Bell className={iconSize} />
        )}
      </button>

      <ReminderModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        itemId={itemId}
        itemType={itemType}
        itemTitle={itemTitle}
        itemDate={itemDate}
        itemColor={itemColor}
      />
    </>
  );
}


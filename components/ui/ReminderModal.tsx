// components/ui/ReminderModal.tsx
'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
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
import {
  useRemindersStore,
  ReminderItemType,
  ReminderTiming,
  getTimingLabel,
} from '@/lib/store/remindersStore';
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

type TimingOption = { value: ReminderTiming; labelKey: string };

const TIMING_OPTIONS: TimingOption[] = [
  { value: '15min', labelKey: 'reminder_15minBefore' },
  { value: '30min', labelKey: 'reminder_30minBefore' },
  { value: '1hour', labelKey: 'reminder_1hourBefore' },
  { value: '2hours', labelKey: 'reminder_2hoursBefore' },
  { value: '1day', labelKey: 'reminder_1dayBefore' },
  { value: '2days', labelKey: 'reminder_2daysBefore' },
  { value: '1week', labelKey: 'reminder_1weekBefore' },
  { value: 'custom', labelKey: 'reminder_customDateTime' },
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
      startTransition(() => {
        const existing = getReminderForItem(itemId, itemType);
        if (existing) {
          setEnabled(existing.enabled);
          setTiming(existing.timing);
          setCustomDate(existing.customDate || '');
          setCustomTime(existing.customTime || '09:00');
          setExistingReminderId(existing.id);
        } else {
          // Reset to defaults - default timing is 1 hour before
          setEnabled(false);
          setTiming('1hour');
          setCustomDate('');
          setCustomTime('09:00');
          setExistingReminderId(null);
        }
      });
    }
  }, [open, itemId, itemType, getReminderForItem]);

  // Set default custom date and time based on item date when switching to custom timing
  useEffect(() => {
    if (open && itemDate && timing === 'custom') {
      startTransition(() => {
        // If no custom date set yet, default to 1 hour before the item date
        if (!customDate) {
          const defaultDate = new Date(itemDate);
          defaultDate.setHours(defaultDate.getHours() - 1);
          setCustomDate(format(defaultDate, 'yyyy-MM-dd'));
          setCustomTime(format(defaultDate, 'HH:mm'));
        }
      });
    }
  }, [open, itemDate, timing, customDate]);

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
        itemDate: itemDate ? itemDate.toISOString() : undefined,
        timing,
        customDate: timing === 'custom' ? customDate : undefined,
        customTime: timing === 'custom' ? customTime : undefined,
        enabled: true,
      };

      if (existingReminderId) {
        updateReminder(existingReminderId, reminderData);
        toastUtils.success(t('success'), t('reminderUpdated'));
      } else {
        const newReminder = addReminder(reminderData);
        setExistingReminderId(newReminder.id);

        // Create a notification to show the reminder was set
        addNotification({
          title: t('reminderSet'),
          message: `${getTimingLabel(timing)} for "${itemTitle}"`,
          type: 'system',
          read: false,
          link: undefined,
          relatedId: itemId,
        });

        toastUtils.success(t('success'), t('reminderSet'));
      }
    } else if (existingReminderId) {
      // Disable/remove reminder
      removeReminder(existingReminderId);
      setExistingReminderId(null);

      // Create a notification to show the reminder was removed
      addNotification({
        title: t('reminderRemoved'),
        message: `Reminder for "${itemTitle}" has been removed`,
        type: 'system',
        read: false,
        link: undefined,
        relatedId: itemId,
      });

      toastUtils.success(t('success'), t('reminderRemoved'));
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
    itemDate,
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
      case 'unit':
        return t('class');
      case 'exam':
        return t('exam');
      case 'assignment':
        return t('assignment');
      case 'event':
        return t('event');
      case 'todo':
        return t('todo');
      default:
        return type;
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
            {t('setReminder')}
          </DialogTitle>
          <DialogDescription>{t('setReminderDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Item Info */}
          <div
            className="p-3 rounded-lg border border-mq-border bg-mq-background-secondary"
            style={{
              borderLeftColor: itemColor,
              borderLeftWidth: itemColor ? 4 : undefined,
            }}
          >
            <div className="text-xs text-mq-content-tertiary uppercase font-medium mb-1">
              {getItemTypeLabel(itemType)}
            </div>
            <div className="font-semibold text-mq-content">{itemTitle}</div>
            {/* Show class schedule for units */}
            {itemType === 'unit' && unitSchedule && unitSchedule.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="text-xs text-mq-content-tertiary uppercase font-medium">
                  {t('classSchedule')}
                </div>
                {unitSchedule.map((schedule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 text-sm text-mq-content-secondary"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {schedule.day}: {schedule.startTime} - {schedule.endTime}
                    </span>
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
                {t('enableReminder')}
              </Label>
            </div>
            <Switch id="reminder-enabled" checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {enabled && (
            <>
              {/* Timing Selection */}
              <div className="space-y-2">
                <Label htmlFor="reminder-timing">{t('remindMe')}</Label>
                <Select value={timing} onValueChange={(v) => setTiming(v as ReminderTiming)}>
                  <SelectTrigger id="reminder-timing">
                    <SelectValue placeholder={t('selectTiming')} />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMING_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey as import('@/lib/i18n/translations').TranslationKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date/Time */}
              {timing === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-date">{t('date')}</Label>
                    <Input
                      id="custom-date"
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-time">{t('time')}</Label>
                    <Input
                      id="custom-time"
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Preview for preset timing */}
              {itemDate && timing !== 'custom' && (
                <div className="p-3 rounded-lg bg-mq-primary/5 border border-mq-primary/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-mq-primary" />
                    <span className="text-mq-content">
                      {t('youWillBeNotified')}{' '}
                      <span className="font-medium">{getTimingLabel(timing)}</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Preview for custom timing */}
              {timing === 'custom' && customDate && customTime && (
                <div className="p-3 rounded-lg bg-mq-primary/5 border border-mq-primary/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-mq-primary" />
                    <span className="text-mq-content">
                      {t('youWillBeNotified')}{' '}
                      <span className="font-medium">
                        {format(new Date(`${customDate}T${customTime}`), 'PPP p')}
                      </span>
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
            {enabled ? (existingReminderId ? t('update') : t('setReminder')) : t('removeReminder')}
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
  const { t } = useTypedTranslation();
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
          className,
        )}
        title={hasReminder ? t('editReminder') : t('setReminder')}
        aria-label={hasReminder ? t('editReminder') : t('setReminder')}
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

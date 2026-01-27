'use client';

import { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Navigation, Edit2, Trash2, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useNotificationPreferencesStore } from '@/lib/store/notificationPreferencesStore';
import { toastUtils } from '@/lib/utils/toast';
import type { TranslationKey } from '@/lib/i18n/translations';

export type ItemType = 'assignment' | 'exam' | 'event' | 'unit';

interface ItemActionButtonsProps {
  /** Type of item for context-aware behavior */
  itemType: ItemType;
  /** Unique identifier for the item */
  itemId: string;
  /** Title/name for aria labels and toasts */
  itemTitle: string;
  /** Building name for navigation (optional) */
  building?: string | null;
  /** Room identifier for navigation (optional) */
  room?: string | null;
  /** Unit code for deadline reminders (optional) */
  unitCode?: string;
  /** Due date/start time for notification scheduling */
  dateTime?: Date | string | null;
  /** Callback when edit is clicked */
  onEdit?: () => void;
  /** Callback when delete is clicked */
  onDelete?: () => void;
  /** Visual variant - 'compact' for list cards, 'detail' for detail panels */
  variant?: 'compact' | 'detail';
  /** Additional class names */
  className?: string;
  /** Stop event propagation on clicks (useful in clickable parent containers) */
  stopPropagation?: boolean;
}

export default function ItemActionButtons({
  itemType,
  itemId,
  itemTitle,
  building,
  room,
  unitCode,
  dateTime,
  onEdit,
  onDelete,
  variant = 'compact',
  className,
  stopPropagation = true,
}: ItemActionButtonsProps) {
  const { t } = useTranslation();

  // Notification store hooks
  const permissionStatus = useNotificationPreferencesStore((s) => s.permissionStatus);
  const pushEnabled = useNotificationPreferencesStore((s) => s.pushEnabled);
  const deadlinesEnabled = useNotificationPreferencesStore((s) => s.deadlinesEnabled);
  const eventsEnabled = useNotificationPreferencesStore((s) => s.eventsEnabled);
  const classesEnabled = useNotificationPreferencesStore((s) => s.classesEnabled);
  const scheduledReminders = useNotificationPreferencesStore((s) => s.scheduledReminders);
  const scheduleDeadlineReminder = useNotificationPreferencesStore((s) => s.scheduleDeadlineReminder);
  const scheduleEventReminder = useNotificationPreferencesStore((s) => s.scheduleEventReminder);
  const scheduleClassReminder = useNotificationPreferencesStore((s) => s.scheduleClassReminder);
  const cancelReminder = useNotificationPreferencesStore((s) => s.cancelReminder);
  const requestPermission = useNotificationPreferencesStore((s) => s.requestPermission);

  // Parse the date
  const parsedDate = useMemo(() => {
    if (!dateTime) return null;
    const d = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return isNaN(d.getTime()) ? null : d;
  }, [dateTime]);

  // Check if the date is in the future
  const isFutureDate = useMemo(() => {
    if (!parsedDate) return false;
    return parsedDate.getTime() > Date.now();
  }, [parsedDate]);

  // Generate reminder ID based on item type
  const reminderId = useMemo(() => {
    if (itemType === 'unit') {
      // Units use class-{unitCode}-{timestamp} format
      return `class-${unitCode || itemId}`;
    }
    return itemId;
  }, [itemType, itemId, unitCode]);

  // Check if a reminder is scheduled
  const hasScheduledReminder = useMemo(() => {
    // Check both exact match and prefix match for units
    if (itemType === 'unit') {
      return Object.keys(scheduledReminders).some((key) => key.startsWith(`class-${unitCode || itemId}`));
    }
    return reminderId in scheduledReminders;
  }, [scheduledReminders, reminderId, itemType, unitCode, itemId]);

  // Check if notifications are enabled for this item type
  const notificationsEnabled = useMemo(() => {
    if (permissionStatus !== 'granted' || !pushEnabled) return false;
    switch (itemType) {
      case 'assignment':
      case 'exam':
        return deadlinesEnabled;
      case 'event':
        return eventsEnabled;
      case 'unit':
        return classesEnabled;
      default:
        return false;
    }
  }, [permissionStatus, pushEnabled, deadlinesEnabled, eventsEnabled, classesEnabled, itemType]);

  // Determine if notify button should be enabled
  const canScheduleReminder = useMemo(() => {
    // Must have a future date (except units which may have recurring schedules)
    if (itemType === 'unit') {
      return notificationsEnabled;
    }
    return isFutureDate && notificationsEnabled;
  }, [isFutureDate, notificationsEnabled, itemType]);

  // Navigation URL
  const navigationUrl = useMemo(() => {
    if (!building) return null;
    const params = new URLSearchParams();
    params.set('building', building.toLowerCase());
    if (room) params.set('room', room);
    params.set('autonav', 'true');
    return `/map?${params.toString()}`;
  }, [building, room]);

  // Handle notify button click
  const handleNotifyClick = useCallback(async (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();

    // If permission not granted, request it
    if (permissionStatus !== 'granted') {
      const newStatus = await requestPermission();
      if (newStatus !== 'granted') {
        toastUtils.warning(
          t('pushNotificationsBlocked' as TranslationKey) || 'Notifications Blocked',
          t('pushBlockedDesc' as TranslationKey) || 'Enable in browser settings to receive reminders'
        );
        return;
      }
    }

    // If already scheduled, cancel it
    if (hasScheduledReminder) {
      if (itemType === 'unit') {
        // Cancel all class reminders for this unit
        Object.keys(scheduledReminders)
          .filter((key) => key.startsWith(`class-${unitCode || itemId}`))
          .forEach((key) => cancelReminder(key));
      } else {
        cancelReminder(reminderId);
      }
      toastUtils.info(
        t('reminderCancelled' as TranslationKey) || 'Reminder Cancelled',
        `${itemTitle}`
      );
      return;
    }

    // Schedule new reminder based on item type
    if (!parsedDate && itemType !== 'unit') {
      toastUtils.error(
        t('reminderFailed' as TranslationKey) || 'Cannot Set Reminder',
        t('noDateForReminder' as TranslationKey) || 'This item has no date set'
      );
      return;
    }

    try {
      switch (itemType) {
        case 'assignment':
        case 'exam':
          scheduleDeadlineReminder(itemId, itemTitle, unitCode || '', parsedDate!);
          break;
        case 'event':
          scheduleEventReminder(
            itemId,
            itemTitle,
            building ? `${building}${room ? ` ${room}` : ''}` : 'TBA',
            parsedDate!
          );
          break;
        case 'unit':
          // For units, we'd need schedule data - for now show info
          toastUtils.info(
            t('classRemindersInfo' as TranslationKey) || 'Class Reminders',
            t('classRemindersInfoDesc' as TranslationKey) || 'Class reminders are scheduled automatically based on your unit schedule'
          );
          return;
      }

      toastUtils.success(
        t('reminderSet' as TranslationKey) || 'Reminder Set',
        `${itemTitle}`
      );
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
      toastUtils.error(
        t('reminderFailed' as TranslationKey) || 'Failed to Set Reminder',
        t('eventReminderFailedMsg' as TranslationKey) || 'Could not set reminder. Please try again.'
      );
    }
  }, [
    stopPropagation,
    permissionStatus,
    requestPermission,
    hasScheduledReminder,
    itemType,
    unitCode,
    itemId,
    scheduledReminders,
    cancelReminder,
    reminderId,
    parsedDate,
    itemTitle,
    scheduleDeadlineReminder,
    scheduleEventReminder,
    building,
    room,
    t,
  ]);

  // Click handlers that optionally stop propagation
  const handleEditClick = useCallback((e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    onEdit?.();
  }, [stopPropagation, onEdit]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    onDelete?.();
  }, [stopPropagation, onDelete]);

  const handleNavLinkClick = useCallback((e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
  }, [stopPropagation]);

  // Button size classes based on variant
  const buttonSizeClass = variant === 'detail' ? 'h-9 w-9' : 'h-8 w-8';
  const iconSizeClass = variant === 'detail' ? 'h-4.5 w-4.5' : 'h-4 w-4';

  const baseButtonClass = cn(
    'p-0 inline-flex items-center justify-center rounded transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background',
    buttonSizeClass
  );

  // Determine notify button state
  const getNotifyButtonState = () => {
    if (!canScheduleReminder && !hasScheduledReminder) {
      return {
        disabled: true,
        title: itemType === 'unit'
          ? (t('classRemindersAutomatic' as TranslationKey) || 'Class reminders are automatic')
          : (!isFutureDate
              ? (t('reminderPastDate' as TranslationKey) || 'Cannot set reminder for past date')
              : (t('enableNotifications' as TranslationKey) || 'Enable notifications in settings')),
        className: 'opacity-50 cursor-not-allowed',
      };
    }
    if (hasScheduledReminder) {
      return {
        disabled: false,
        title: t('cancelReminder' as TranslationKey) || 'Cancel reminder',
        className: 'hover:bg-amber-100 dark:hover:bg-amber-950/30 text-amber-600',
      };
    }
    return {
      disabled: false,
      title: t('setReminder' as TranslationKey) || 'Set reminder',
      className: 'hover:bg-mq-hover-background',
    };
  };

  const notifyState = getNotifyButtonState();

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Navigate Button */}
      {navigationUrl ? (
        <Link
          href={navigationUrl}
          onClick={handleNavLinkClick}
          aria-label={t('navigateToBuildingAria', { building: building || '' }) as string}
          title={t('navigateTo' as TranslationKey, { location: building || '' }) || `Navigate to ${building}`}
        >
          <Button
            variant="ghost"
            size="icon"
            className={cn(baseButtonClass, 'hover:bg-mq-hover-background')}
            tabIndex={-1}
          >
            <Navigation className={iconSizeClass} aria-hidden="true" />
          </Button>
        </Link>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className={cn(baseButtonClass, 'opacity-50 cursor-not-allowed')}
          disabled
          title={t('noLocationSet' as TranslationKey) || 'No location set'}
          aria-label={t('noLocationSet' as TranslationKey) || 'No location set'}
        >
          <Navigation className={iconSizeClass} aria-hidden="true" />
        </Button>
      )}

      {/* Edit Button */}
      {onEdit && (
        <button
          type="button"
          onClick={handleEditClick}
          className={cn(baseButtonClass, 'hover:bg-mq-hover-background')}
          title={t('calendarEditItem', { title: itemTitle }) as string}
          aria-label={t('calendarEditItem', { title: itemTitle }) as string}
        >
          <Edit2 className={iconSizeClass} aria-hidden="true" />
        </button>
      )}

      {/* Delete Button */}
      {onDelete && (
        <button
          type="button"
          onClick={handleDeleteClick}
          className={cn(baseButtonClass, 'hover:bg-red-100 dark:hover:bg-red-950/30')}
          title={t('calendarDeleteItem', { title: itemTitle }) as string}
          aria-label={t('calendarDeleteItem', { title: itemTitle }) as string}
        >
          <Trash2 className={iconSizeClass} aria-hidden="true" />
        </button>
      )}

      {/* Notify/Reminder Button */}
      <button
        type="button"
        onClick={handleNotifyClick}
        disabled={notifyState.disabled}
        className={cn(baseButtonClass, notifyState.className)}
        title={notifyState.title}
        aria-label={notifyState.title}
      >
        {hasScheduledReminder ? (
          <Bell className={cn(iconSizeClass, 'fill-current')} aria-hidden="true" />
        ) : (
          <Bell className={iconSizeClass} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

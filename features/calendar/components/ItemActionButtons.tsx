'use client';

import { useMemo, useCallback, useState } from 'react';
import Link from 'next/link';
import { Navigation, Edit2, Trash2, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import ReminderModal from '@/components/ui/ReminderModal';
import { useRemindersStore, ReminderItemType } from '@/lib/store/remindersStore';

export type ItemType = 'assignment' | 'exam' | 'event' | 'unit' | 'todo';

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
  /** Item color for visual indication */
  itemColor?: string;
  /** Class schedule for units - array of day/time objects */
  unitSchedule?: Array<{ day: string; startTime: string; endTime: string }>;
  /** Whether notification is currently enabled for this item */
  notificationEnabled?: boolean;
  /** Callback when edit is clicked */
  onEdit?: () => void;
  /** Callback when delete is clicked */
  onDelete?: () => void;
  /** Callback when notification toggle is clicked - receives new state */
  onToggleNotification?: (enabled: boolean) => void;
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
  dateTime,
  itemColor,
  unitSchedule,
  notificationEnabled = false,
  onEdit,
  onDelete,
  onToggleNotification: _onToggleNotification,
  variant = 'compact',
  className,
  stopPropagation = true,
}: ItemActionButtonsProps) {
  const { t } = useTypedTranslation();
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const { getReminderForItem } = useRemindersStore();

  // Map ItemType to ReminderItemType
  const reminderItemType: ReminderItemType = itemType as ReminderItemType;

  // Check if reminder exists in store
  const hasReminder = !!getReminderForItem(itemId, reminderItemType);

  // Combine with legacy notificationEnabled prop
  const isNotificationActive = hasReminder || notificationEnabled;

  // Parse dateTime to Date
  const itemDate = useMemo(() => {
    if (!dateTime) return undefined;
    if (dateTime instanceof Date) return dateTime;
    const parsed = new Date(dateTime);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }, [dateTime]);

  // Navigation URL
  const navigationUrl = useMemo(() => {
    if (!building) return null;
    const params = new URLSearchParams();
    params.set('building', building.toLowerCase());
    if (room) params.set('room', room);
    params.set('autonav', 'true');
    return `/map?${params.toString()}`;
  }, [building, room]);

  // Handle notify button click - open reminder modal
  // Always stop propagation for bell to prevent parent dialog interference
  const handleNotifyClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setReminderModalOpen(true);
  }, []);

  // Click handlers that optionally stop propagation
  const handleEditClick = useCallback(
    (e: React.MouseEvent) => {
      if (stopPropagation) e.stopPropagation();
      onEdit?.();
    },
    [stopPropagation, onEdit],
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      if (stopPropagation) e.stopPropagation();
      onDelete?.();
    },
    [stopPropagation, onDelete],
  );

  const handleNavLinkClick = useCallback(
    (e: React.MouseEvent) => {
      if (stopPropagation) e.stopPropagation();
    },
    [stopPropagation],
  );

  // Button size classes based on variant
  const buttonSizeClass = variant === 'detail' ? 'h-9 w-9' : 'h-8 w-8';
  const iconSizeClass = variant === 'detail' ? 'h-4.5 w-4.5' : 'h-4 w-4';

  const baseButtonClass = cn(
    'p-0 inline-flex items-center justify-center rounded-lg transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background',
    'text-mq-content-secondary hover:text-mq-content',
    buttonSizeClass,
  );

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Navigate Button - only shown when building is set */}
      {building && navigationUrl && (
        <Link
          href={navigationUrl}
          onClick={handleNavLinkClick}
          className={cn(
            baseButtonClass,
            'hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400',
          )}
          aria-label={t('navigateToBuildingAria', { building: building || '' }) as string}
          title={
            t('navigateTo' as TranslationKey, { location: building || '' }) ||
            `Navigate to ${building}`
          }
        >
          <Navigation className={iconSizeClass} aria-hidden="true" />
        </Link>
      )}

      {/* Edit Button */}
      {onEdit && (
        <button
          type="button"
          onClick={handleEditClick}
          className={cn(
            baseButtonClass,
            'hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400',
          )}
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
          className={cn(
            baseButtonClass,
            'hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400',
          )}
          title={t('calendarDeleteItem', { title: itemTitle }) as string}
          aria-label={t('calendarDeleteItem', { title: itemTitle }) as string}
        >
          <Trash2 className={iconSizeClass} aria-hidden="true" />
        </button>
      )}

      {/* Notify/Reminder Button - Opens Modal */}
      <button
        type="button"
        onClick={handleNotifyClick}
        className={cn(
          baseButtonClass,
          isNotificationActive
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/40'
            : 'hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-900/30 dark:hover:text-amber-400',
        )}
        title={
          isNotificationActive
            ? t('editReminder' as TranslationKey) || 'Edit reminder'
            : t('setReminder' as TranslationKey) || 'Set reminder'
        }
        aria-label={
          isNotificationActive
            ? t('editReminder' as TranslationKey) || 'Edit reminder'
            : t('setReminder' as TranslationKey) || 'Set reminder'
        }
      >
        {isNotificationActive ? (
          <Bell className={cn(iconSizeClass, 'fill-current')} aria-hidden="true" />
        ) : (
          <Bell className={iconSizeClass} aria-hidden="true" />
        )}
      </button>

      {/* Reminder Modal */}
      <ReminderModal
        open={reminderModalOpen}
        onOpenChange={setReminderModalOpen}
        itemId={itemId}
        itemType={reminderItemType}
        itemTitle={itemTitle}
        itemDate={itemDate}
        itemColor={itemColor}
        unitSchedule={unitSchedule}
      />
    </div>
  );
}

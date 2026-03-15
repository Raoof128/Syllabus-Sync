/**
 * Theme, Language, CalendarIntent, ItemNotifications, and Reminders Store Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '@/lib/store/themeStore';
import { useLanguageStore } from '@/lib/store/languageStore';
import { useCalendarIntentStore } from '@/lib/store/calendarIntentStore';
import { useItemNotificationsStore } from '@/lib/store/itemNotificationsStore';
import {
  useRemindersStore,
  calculateReminderDate,
  getTimingLabel,
} from '@/lib/store/remindersStore';

// ============================================================================
// THEME STORE
// ============================================================================
describe('themeStore', () => {
  beforeEach(() => {
    useThemeStore.getState().reset();
  });

  it('should initialize with system theme', () => {
    const state = useThemeStore.getState();
    expect(state.theme).toBe('system');
  });

  it('should set theme to dark', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
  });

  it('should set theme to light', () => {
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
    expect(useThemeStore.getState().resolvedTheme).toBe('light');
  });

  it('should toggle theme from light to dark', () => {
    useThemeStore.getState().setTheme('light');
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('should toggle theme from dark to light', () => {
    useThemeStore.getState().setTheme('dark');
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('should set glass mode', () => {
    useThemeStore.getState().setGlassMode('tinted');
    expect(useThemeStore.getState().glass.mode).toBe('tinted');
  });

  it('should set glass intensity clamped between 0 and 100', () => {
    useThemeStore.getState().setGlassIntensity(150);
    expect(useThemeStore.getState().glass.intensity).toBe(100);

    useThemeStore.getState().setGlassIntensity(-10);
    expect(useThemeStore.getState().glass.intensity).toBe(0);

    useThemeStore.getState().setGlassIntensity(50);
    expect(useThemeStore.getState().glass.intensity).toBe(50);
  });

  it('should set glass refraction', () => {
    useThemeStore.getState().setGlassRefraction(false);
    expect(useThemeStore.getState().glass.enableRefraction).toBe(false);
  });

  it('should set glass spring animations', () => {
    useThemeStore.getState().setGlassSpringAnimations(false);
    expect(useThemeStore.getState().glass.enableSpringAnimations).toBe(false);
  });

  it('should reset glass settings', () => {
    useThemeStore.getState().setGlassMode('tinted');
    useThemeStore.getState().setGlassIntensity(30);
    useThemeStore.getState().resetGlassSettings();

    const { glass } = useThemeStore.getState();
    expect(glass.mode).toBe('clear');
    expect(glass.intensity).toBe(75);
    expect(glass.enableRefraction).toBe(true);
    expect(glass.enableSpringAnimations).toBe(true);
  });

  it('should reset entire store', () => {
    useThemeStore.getState().setTheme('dark');
    useThemeStore.getState().setGlassMode('tinted');
    useThemeStore.getState().reset();

    const state = useThemeStore.getState();
    expect(state.theme).toBe('system');
    expect(state.glass.mode).toBe('clear');
  });
});

// ============================================================================
// LANGUAGE STORE
// ============================================================================
describe('languageStore', () => {
  beforeEach(() => {
    useLanguageStore.getState().reset();
  });

  it('should initialize with English', () => {
    const state = useLanguageStore.getState();
    expect(state.language).toBe('en');
    expect(state.isRTL).toBe(false);
  });

  it('should set language to Persian (RTL)', () => {
    useLanguageStore.getState().setLanguage('fa');
    const state = useLanguageStore.getState();
    expect(state.language).toBe('fa');
    expect(state.isRTL).toBe(true);
  });

  it('should set language to Arabic (RTL)', () => {
    useLanguageStore.getState().setLanguage('ar');
    expect(useLanguageStore.getState().isRTL).toBe(true);
  });

  it('should set language to Urdu (RTL)', () => {
    useLanguageStore.getState().setLanguage('ur');
    expect(useLanguageStore.getState().isRTL).toBe(true);
  });

  it('should set language to Hebrew (RTL)', () => {
    useLanguageStore.getState().setLanguage('he');
    expect(useLanguageStore.getState().isRTL).toBe(true);
  });

  it('should set language to Japanese (LTR)', () => {
    useLanguageStore.getState().setLanguage('ja');
    expect(useLanguageStore.getState().isRTL).toBe(false);
  });

  it('should reset to English', () => {
    useLanguageStore.getState().setLanguage('fa');
    useLanguageStore.getState().reset();
    expect(useLanguageStore.getState().language).toBe('en');
    expect(useLanguageStore.getState().isRTL).toBe(false);
  });
});

// ============================================================================
// CALENDAR INTENT STORE
// ============================================================================
describe('calendarIntentStore', () => {
  beforeEach(() => {
    useCalendarIntentStore.setState({ pendingIntent: null });
  });

  it('should initialize with no pending intent', () => {
    expect(useCalendarIntentStore.getState().pendingIntent).toBeNull();
  });

  it('should queue a calendar intent', () => {
    const intent = useCalendarIntentStore.getState().queueCalendarIntent({
      target: 'assignment',
    });

    expect(intent.requestId).toBeDefined();
    expect(intent.highlight).toBe(true);
    expect(intent.autoOpenForm).toBe(true);
    expect(useCalendarIntentStore.getState().pendingIntent).toEqual(intent);
  });

  it('should queue intent with custom options', () => {
    const intent = useCalendarIntentStore.getState().queueCalendarIntent({
      target: 'event',
      highlight: false,
      autoOpenForm: false,
    });

    expect(intent.highlight).toBe(false);
    expect(intent.autoOpenForm).toBe(false);
  });

  it('should clear pending intent', () => {
    useCalendarIntentStore.getState().queueCalendarIntent({
      target: 'assignment',
    });

    useCalendarIntentStore.getState().clearPendingIntent();
    expect(useCalendarIntentStore.getState().pendingIntent).toBeNull();
  });

  it('should only clear matching requestId', () => {
    const intent = useCalendarIntentStore.getState().queueCalendarIntent({
      target: 'assignment',
    });

    useCalendarIntentStore.getState().clearPendingIntent('wrong-id');
    expect(useCalendarIntentStore.getState().pendingIntent).not.toBeNull();

    useCalendarIntentStore.getState().clearPendingIntent(intent.requestId);
    expect(useCalendarIntentStore.getState().pendingIntent).toBeNull();
  });

  it('should handle clearing when no intent exists', () => {
    useCalendarIntentStore.getState().clearPendingIntent();
    expect(useCalendarIntentStore.getState().pendingIntent).toBeNull();
  });
});

// ============================================================================
// ITEM NOTIFICATIONS STORE
// ============================================================================
describe('itemNotificationsStore', () => {
  beforeEach(() => {
    useItemNotificationsStore.getState().reset();
  });

  it('should initialize with empty enabled items', () => {
    expect(useItemNotificationsStore.getState().enabledItems).toEqual({});
  });

  it('should toggle notification on', () => {
    const result = useItemNotificationsStore.getState().toggleNotification('item-1');
    expect(result).toBe(true);
    expect(useItemNotificationsStore.getState().isNotificationEnabled('item-1')).toBe(true);
  });

  it('should toggle notification off', () => {
    useItemNotificationsStore.getState().enableNotification('item-1');
    const result = useItemNotificationsStore.getState().toggleNotification('item-1');
    expect(result).toBe(false);
    expect(useItemNotificationsStore.getState().isNotificationEnabled('item-1')).toBe(false);
  });

  it('should enable notification', () => {
    useItemNotificationsStore.getState().enableNotification('item-1');
    expect(useItemNotificationsStore.getState().isNotificationEnabled('item-1')).toBe(true);
  });

  it('should disable notification', () => {
    useItemNotificationsStore.getState().enableNotification('item-1');
    useItemNotificationsStore.getState().disableNotification('item-1');
    expect(useItemNotificationsStore.getState().isNotificationEnabled('item-1')).toBe(false);
  });

  it('should return false for unknown item', () => {
    expect(useItemNotificationsStore.getState().isNotificationEnabled('unknown')).toBe(false);
  });

  it('should reset all items', () => {
    useItemNotificationsStore.getState().enableNotification('a');
    useItemNotificationsStore.getState().enableNotification('b');
    useItemNotificationsStore.getState().reset();
    expect(useItemNotificationsStore.getState().enabledItems).toEqual({});
  });
});

// ============================================================================
// REMINDERS STORE
// ============================================================================
describe('remindersStore', () => {
  beforeEach(() => {
    useRemindersStore.getState().reset();
  });

  it('should add a reminder', () => {
    const reminder = useRemindersStore.getState().addReminder({
      itemId: 'deadline-1',
      itemType: 'assignment',
      itemTitle: 'Assignment 1',
      timing: '1day',
      enabled: true,
    });

    expect(reminder.id).toBeDefined();
    expect(reminder.itemTitle).toBe('Assignment 1');
    expect(useRemindersStore.getState().reminders).toHaveLength(1);
  });

  it('should update a reminder', () => {
    const reminder = useRemindersStore.getState().addReminder({
      itemId: 'deadline-1',
      itemType: 'assignment',
      itemTitle: 'Assignment 1',
      timing: '1day',
      enabled: true,
    });

    useRemindersStore.getState().updateReminder(reminder.id, { timing: '2days' });
    expect(useRemindersStore.getState().reminders[0].timing).toBe('2days');
  });

  it('should re-arm a notified reminder when timing is updated', () => {
    const reminder = useRemindersStore.getState().addReminder({
      itemId: 'deadline-1',
      itemType: 'assignment',
      itemTitle: 'Assignment 1',
      timing: '1day',
      enabled: true,
      customDate: '2026-03-16',
      customTime: '09:00',
    });

    useRemindersStore.getState().markAsNotified(reminder.id);
    expect(useRemindersStore.getState().reminders[0].notifiedAt).toBeDefined();

    useRemindersStore.getState().updateReminder(reminder.id, {
      timing: 'custom',
      customDate: '2026-03-17',
      customTime: '10:15',
      enabled: true,
    });

    const updated = useRemindersStore.getState().reminders[0];
    expect(updated.notifiedAt).toBeUndefined();
    expect(updated.customDate).toBe('2026-03-17');
    expect(updated.customTime).toBe('10:15');
  });

  it('should remove a reminder', () => {
    const reminder = useRemindersStore.getState().addReminder({
      itemId: 'deadline-1',
      itemType: 'assignment',
      itemTitle: 'Assignment 1',
      timing: '1day',
      enabled: true,
    });

    useRemindersStore.getState().removeReminder(reminder.id);
    expect(useRemindersStore.getState().reminders).toHaveLength(0);
  });

  it('should get reminder for item by type', () => {
    useRemindersStore.getState().addReminder({
      itemId: 'deadline-1',
      itemType: 'assignment',
      itemTitle: 'Assignment 1',
      timing: '1day',
      enabled: true,
    });

    const found = useRemindersStore.getState().getReminderForItem('deadline-1', 'assignment');
    expect(found).toBeDefined();
    expect(found!.itemTitle).toBe('Assignment 1');

    const notFound = useRemindersStore.getState().getReminderForItem('deadline-1', 'exam');
    expect(notFound).toBeUndefined();
  });

  it('should not return disabled reminders from getReminderForItem', () => {
    useRemindersStore.getState().addReminder({
      itemId: 'deadline-1',
      itemType: 'assignment',
      itemTitle: 'Assignment 1',
      timing: '1day',
      enabled: false,
    });

    const found = useRemindersStore.getState().getReminderForItem('deadline-1', 'assignment');
    expect(found).toBeUndefined();
  });

  it('should get all reminders for an item', () => {
    useRemindersStore.getState().addReminder({
      itemId: 'item-1',
      itemType: 'assignment',
      itemTitle: 'A',
      timing: '1day',
      enabled: true,
    });
    useRemindersStore.getState().addReminder({
      itemId: 'item-1',
      itemType: 'exam',
      itemTitle: 'B',
      timing: '1hour',
      enabled: true,
    });
    useRemindersStore.getState().addReminder({
      itemId: 'item-2',
      itemType: 'event',
      itemTitle: 'C',
      timing: '15min',
      enabled: true,
    });

    const reminders = useRemindersStore.getState().getRemindersForItem('item-1');
    expect(reminders).toHaveLength(2);
  });

  it('should get pending reminders', () => {
    const r1 = useRemindersStore.getState().addReminder({
      itemId: 'item-1',
      itemType: 'assignment',
      itemTitle: 'A',
      timing: '1day',
      enabled: true,
    });
    useRemindersStore.getState().addReminder({
      itemId: 'item-2',
      itemType: 'exam',
      itemTitle: 'B',
      timing: '1hour',
      enabled: false,
    });

    const pending = useRemindersStore.getState().getPendingReminders();
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe(r1.id);
  });

  it('should mark as notified', () => {
    const reminder = useRemindersStore.getState().addReminder({
      itemId: 'item-1',
      itemType: 'assignment',
      itemTitle: 'A',
      timing: '1day',
      enabled: true,
    });

    useRemindersStore.getState().markAsNotified(reminder.id);
    const updated = useRemindersStore.getState().reminders[0];
    expect(updated.notifiedAt).toBeDefined();

    // Should not appear in pending
    expect(useRemindersStore.getState().getPendingReminders()).toHaveLength(0);
  });

  it('should clear expired reminders', () => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const recentNotified = new Date();
    recentNotified.setDate(recentNotified.getDate() - 1);

    useRemindersStore.setState({
      reminders: [
        {
          id: '1',
          itemId: 'a',
          itemType: 'unit',
          itemTitle: 'Old',
          timing: '1day',
          enabled: true,
          createdAt: twoWeeksAgo,
          notifiedAt: twoWeeksAgo,
        },
        {
          id: '2',
          itemId: 'b',
          itemType: 'unit',
          itemTitle: 'Recent',
          timing: '1hour',
          enabled: true,
          createdAt: new Date(),
          notifiedAt: recentNotified,
        },
        {
          id: '3',
          itemId: 'c',
          itemType: 'unit',
          itemTitle: 'Pending',
          timing: '15min',
          enabled: true,
          createdAt: new Date(),
        },
      ],
    });

    useRemindersStore.getState().clearExpiredReminders();
    const reminders = useRemindersStore.getState().reminders;
    expect(reminders).toHaveLength(2);
    expect(reminders.map((r) => r.id)).toEqual(['2', '3']);
  });
});

// ============================================================================
// calculateReminderDate HELPER
// ============================================================================
describe('calculateReminderDate', () => {
  const target = new Date('2026-03-15T14:00:00');

  it('calculates 15 min before', () => {
    const result = calculateReminderDate(target, '15min');
    expect(result.getTime()).toBe(target.getTime() - 15 * 60 * 1000);
  });

  it('calculates 30 min before', () => {
    const result = calculateReminderDate(target, '30min');
    expect(result.getTime()).toBe(target.getTime() - 30 * 60 * 1000);
  });

  it('calculates 1 hour before', () => {
    const result = calculateReminderDate(target, '1hour');
    expect(result.getHours()).toBe(target.getHours() - 1);
  });

  it('calculates 2 hours before', () => {
    const result = calculateReminderDate(target, '2hours');
    expect(result.getHours()).toBe(target.getHours() - 2);
  });

  it('calculates 1 day before', () => {
    const result = calculateReminderDate(target, '1day');
    expect(result.getDate()).toBe(target.getDate() - 1);
  });

  it('calculates 2 days before', () => {
    const result = calculateReminderDate(target, '2days');
    expect(result.getDate()).toBe(target.getDate() - 2);
  });

  it('calculates 1 week before', () => {
    const result = calculateReminderDate(target, '1week');
    expect(result.getDate()).toBe(target.getDate() - 7);
  });

  it('uses custom date and time', () => {
    const result = calculateReminderDate(target, 'custom', '2026-03-14', '09:30');
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(2); // March = 2
    expect(result.getDate()).toBe(14);
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(30);
  });

  it('uses custom date with default 9 AM', () => {
    const result = calculateReminderDate(target, 'custom', '2026-03-14');
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(0);
  });
});

// ============================================================================
// getTimingLabel HELPER
// ============================================================================
describe('getTimingLabel', () => {
  it('returns correct labels for all timings', () => {
    expect(getTimingLabel('15min')).toBe('15 minutes before');
    expect(getTimingLabel('30min')).toBe('30 minutes before');
    expect(getTimingLabel('1hour')).toBe('1 hour before');
    expect(getTimingLabel('2hours')).toBe('2 hours before');
    expect(getTimingLabel('1day')).toBe('1 day before');
    expect(getTimingLabel('2days')).toBe('2 days before');
    expect(getTimingLabel('1week')).toBe('1 week before');
    expect(getTimingLabel('custom')).toBe('Custom time');
  });
});

/**
 * Calendar Utils Tests
 * Tests time parsing, position calculation, overlap detection, and color helpers
 */
import { describe, it, expect } from 'vitest';
import {
  parseTimeRange,
  getTimePositionAndHeight,
  calculateOverlapGroups,
  getDeadlineColor,
  getEventColors,
  START_HOUR,
  HOUR_HEIGHT,
  TYPE_COLORS,
  EVENT_CATEGORY_COLORS,
  type CalendarItem,
} from '@/lib/calendar-utils';

describe('parseTimeRange', () => {
  it('returns null for empty or falsy input', () => {
    expect(parseTimeRange('')).toBeNull();
    expect(parseTimeRange(null as unknown as string)).toBeNull();
  });

  it('parses 24-hour range "09:00 - 11:00"', () => {
    const result = parseTimeRange('09:00 - 11:00');
    expect(result).toEqual({ startHour: 9, startMin: 0, endHour: 11, endMin: 0 });
  });

  it('parses 24-hour range with seconds "09:00:00 - 11:30:00"', () => {
    const result = parseTimeRange('09:00:00 - 11:30:00');
    expect(result).toEqual({ startHour: 9, startMin: 0, endHour: 11, endMin: 30 });
  });

  it('parses 24-hour range with en-dash "14:00–16:00"', () => {
    const result = parseTimeRange('14:00–16:00');
    expect(result).toEqual({ startHour: 14, startMin: 0, endHour: 16, endMin: 0 });
  });

  it('parses AM/PM range "10:00 AM - 2:00 PM"', () => {
    const result = parseTimeRange('10:00 AM - 2:00 PM');
    expect(result).toEqual({ startHour: 10, startMin: 0, endHour: 14, endMin: 0 });
  });

  it('parses PM-PM range "1:00 PM - 3:30 PM"', () => {
    const result = parseTimeRange('1:00 PM - 3:30 PM');
    expect(result).toEqual({ startHour: 13, startMin: 0, endHour: 15, endMin: 30 });
  });

  it('handles 12:00 AM correctly', () => {
    const result = parseTimeRange('12:00 AM - 1:00 AM');
    expect(result).toEqual({ startHour: 0, startMin: 0, endHour: 1, endMin: 0 });
  });

  it('handles 12:00 PM correctly', () => {
    const result = parseTimeRange('12:00 PM - 1:00 PM');
    expect(result).toEqual({ startHour: 12, startMin: 0, endHour: 13, endMin: 0 });
  });

  it('parses single AM/PM time "2:00 PM" (assumes 1 hour)', () => {
    const result = parseTimeRange('2:00 PM');
    expect(result).toEqual({ startHour: 14, startMin: 0, endHour: 15, endMin: 0 });
  });

  it('parses single 24-hour time "14:00" (assumes 1 hour)', () => {
    const result = parseTimeRange('14:00');
    expect(result).toEqual({ startHour: 14, startMin: 0, endHour: 15, endMin: 0 });
  });

  it('parses single 24-hour time with seconds "08:30:00" (assumes 1 hour)', () => {
    const result = parseTimeRange('08:30:00');
    expect(result).toEqual({ startHour: 8, startMin: 30, endHour: 9, endMin: 30 });
  });

  it('returns null for unrecognized format', () => {
    expect(parseTimeRange('noon')).toBeNull();
    expect(parseTimeRange('all day')).toBeNull();
  });
});

describe('getTimePositionAndHeight', () => {
  it('calculates correct position for a class at start hour', () => {
    const result = getTimePositionAndHeight(START_HOUR, 0, START_HOUR + 1, 0);
    expect(result).not.toBeNull();
    expect(result!.top).toBe(0);
    expect(result!.height).toBe(HOUR_HEIGHT);
  });

  it('calculates correct position for midday class', () => {
    const result = getTimePositionAndHeight(12, 0, 14, 0);
    expect(result).not.toBeNull();
    expect(result!.top).toBe((12 - START_HOUR) * HOUR_HEIGHT);
    expect(result!.height).toBe(2 * HOUR_HEIGHT);
  });

  it('accounts for minutes in position', () => {
    const result = getTimePositionAndHeight(10, 30, 11, 30);
    expect(result).not.toBeNull();
    const expectedTop = (10 - START_HOUR) * HOUR_HEIGHT + 0.5 * HOUR_HEIGHT;
    expect(result!.top).toBe(expectedTop);
  });

  it('clamps to visible range', () => {
    const result = getTimePositionAndHeight(4, 0, 8, 0);
    expect(result).not.toBeNull();
    expect(result!.top).toBe(0); // Clamped to START_HOUR
  });

  it('clamps startHour 24 to 23 (visible range)', () => {
    // startHour 24 is clamped by Math.min(23, 24) = 23, which is < 24, so returns a result
    const result = getTimePositionAndHeight(24, 0, 25, 0);
    expect(result).not.toBeNull();
    expect(result!.top).toBe((23 - START_HOUR) * HOUR_HEIGHT);
  });

  it('enforces minimum height of 24px', () => {
    const result = getTimePositionAndHeight(10, 0, 10, 10);
    expect(result).not.toBeNull();
    expect(result!.height).toBeGreaterThanOrEqual(24);
  });
});

describe('calculateOverlapGroups', () => {
  it('returns empty map for no items', () => {
    const result = calculateOverlapGroups([]);
    expect(result.size).toBe(0);
  });

  it('assigns single column for non-overlapping items', () => {
    const items: CalendarItem[] = [
      { id: 'a', startHour: 9, startMin: 0, endHour: 10, endMin: 0, type: 'unit', data: null },
      { id: 'b', startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'unit', data: null },
    ];

    const result = calculateOverlapGroups(items);
    expect(result.get('a')!.totalColumns).toBe(1);
    expect(result.get('b')!.totalColumns).toBe(1);
  });

  it('assigns multiple columns for overlapping items', () => {
    const items: CalendarItem[] = [
      { id: 'a', startHour: 9, startMin: 0, endHour: 11, endMin: 0, type: 'unit', data: null },
      { id: 'b', startHour: 10, startMin: 0, endHour: 12, endMin: 0, type: 'deadline', data: null },
    ];

    const result = calculateOverlapGroups(items);
    expect(result.get('a')!.totalColumns).toBe(2);
    expect(result.get('b')!.totalColumns).toBe(2);
    expect(result.get('a')!.column).not.toBe(result.get('b')!.column);
  });

  it('handles three overlapping items', () => {
    const items: CalendarItem[] = [
      { id: 'a', startHour: 9, startMin: 0, endHour: 12, endMin: 0, type: 'unit', data: null },
      { id: 'b', startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'unit', data: null },
      { id: 'c', startHour: 10, startMin: 30, endHour: 12, endMin: 0, type: 'event', data: null },
    ];

    const result = calculateOverlapGroups(items);
    expect(result.get('a')!.totalColumns).toBeGreaterThanOrEqual(2);
  });

  it('reuses columns when earlier item ends before new one starts', () => {
    const items: CalendarItem[] = [
      { id: 'a', startHour: 9, startMin: 0, endHour: 10, endMin: 0, type: 'unit', data: null },
      { id: 'b', startHour: 9, startMin: 0, endHour: 12, endMin: 0, type: 'deadline', data: null },
      { id: 'c', startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'unit', data: null },
    ];

    const result = calculateOverlapGroups(items);
    // 'c' can reuse 'a's column since a ends at 10 and c starts at 10
    expect(result.get('a')!.column).toBe(result.get('c')!.column);
  });
});

describe('getDeadlineColor', () => {
  it('returns custom color if set', () => {
    const deadline = { color: '#FF0000', unitCode: 'COMP2310' } as any;
    expect(getDeadlineColor(deadline, [])).toBe('#FF0000');
  });

  it('returns unit color for matching unit', () => {
    const deadline = { unitCode: 'COMP2310' } as any;
    const units = [{ code: 'COMP2310', color: '#A6192E' }] as any[];
    expect(getDeadlineColor(deadline, units)).toBe('#A6192E');
  });

  it('returns default gray when no custom color and no unit match', () => {
    const deadline = { unitCode: 'UNKNOWN' } as any;
    expect(getDeadlineColor(deadline, [])).toBe('#6B7280');
  });
});

describe('getEventColors', () => {
  it('returns custom color style when event has color', () => {
    const event = { color: '#FF5500' } as any;
    const result = getEventColors(event);
    expect(result.style).toBeDefined();
    expect(result.style!.backgroundColor).toBe('#FF5500');
  });

  it('returns category color for Career', () => {
    const event = { category: 'Career' } as any;
    const result = getEventColors(event);
    expect(result).toEqual(EVENT_CATEGORY_COLORS['Career']);
  });

  it('returns category color for Social', () => {
    const event = { category: 'Social' } as any;
    const result = getEventColors(event);
    expect(result).toEqual(EVENT_CATEGORY_COLORS['Social']);
  });

  it('returns default Event color for unknown category', () => {
    const event = { category: 'Unknown' } as any;
    const result = getEventColors(event);
    expect(result).toEqual(TYPE_COLORS.Event);
  });

  it('returns default Event color when no color or category', () => {
    const event = {} as any;
    const result = getEventColors(event);
    expect(result).toEqual(TYPE_COLORS.Event);
  });
});

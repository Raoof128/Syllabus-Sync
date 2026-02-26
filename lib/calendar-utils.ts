import { Event, Unit, Deadline } from '@/lib/types';
import React from 'react';

// ... (existing constants)

// Helper to get deadline color based on custom color, unit color, or default
export function getDeadlineColor(deadline: Deadline, units: Unit[]): string {
  if (deadline.color) return deadline.color;
  const unit = units.find((u) => u.code === deadline.unitCode);
  // Return unit color if found, otherwise use a neutral gray instead of primary red
  return unit?.color || '#6B7280';
}

// Hours to display (6 AM to 11 PM = 18 hours)
export const START_HOUR = 6; // First visible hour
export const HOURS = Array.from({ length: 18 }, (_, i) => i + START_HOUR); // 6am to 11pm (23)
export const HOUR_HEIGHT = 48; // pixels per hour

// Type colors for the calendar
export const TYPE_COLORS = {
  Assignment: {
    bg: 'bg-mq-info',
    border: 'border-mq-info',
    text: 'text-white',
  },
  Exam: { bg: 'bg-mq-error', border: 'border-mq-error', text: 'text-white' },
  Event: {
    bg: 'bg-mq-success',
    border: 'border-mq-success',
    text: 'text-white',
  },
  Presentation: {
    bg: 'bg-mq-purple',
    border: 'border-mq-purple',
    text: 'text-white',
  },
  Quiz: {
    bg: 'bg-mq-warning',
    border: 'border-mq-warning',
    text: 'text-black',
  },
};

// Category-specific colors for events
export const EVENT_CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Career: {
    bg: 'bg-indigo-500',
    border: 'border-indigo-600',
    text: 'text-white',
  },
  Social: { bg: 'bg-pink-500', border: 'border-pink-600', text: 'text-white' },
  Academic: {
    bg: 'bg-cyan-500',
    border: 'border-cyan-600',
    text: 'text-white',
  },
  'Free Food': {
    bg: 'bg-orange-500',
    border: 'border-orange-600',
    text: 'text-white',
  },
};

// Helper to get event colors based on custom color, category, or default
export function getEventColors(event: Event): {
  bg: string;
  border: string;
  text: string;
  style?: React.CSSProperties;
} {
  // Use custom color if provided
  if (event.color) {
    return {
      bg: '',
      border: '',
      text: 'text-white',
      style: { backgroundColor: event.color, borderColor: event.color },
    };
  }

  // Use category-specific color if available
  if (event.category && EVENT_CATEGORY_COLORS[event.category]) {
    return EVENT_CATEGORY_COLORS[event.category];
  }

  // Fallback to default event color
  return TYPE_COLORS.Event;
}

// Parse time string like "2:00 PM" or "14:00" or "10:00 AM - 2:00 PM" or "09:00 - 11:00" to start/end hours
export function parseTimeRange(timeStr: string): {
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
} | null {
  if (!timeStr) return null;

  // Try parsing 24-hour range format "09:00 - 11:00" first (most common in our data)
  const militaryRangeMatch = timeStr.match(
    /(\d{1,2}):(\d{2})(?::\d{2})?\s*[-–]\s*(\d{1,2}):(\d{2})(?::\d{2})?/,
  );
  if (militaryRangeMatch) {
    const startHour = parseInt(militaryRangeMatch[1], 10);
    const startMin = parseInt(militaryRangeMatch[2], 10);
    const endHour = parseInt(militaryRangeMatch[3], 10);
    const endMin = parseInt(militaryRangeMatch[4], 10);
    return { startHour, startMin, endHour, endMin };
  }

  // Try parsing range format "10:00 AM - 2:00 PM"
  const rangeMatch = timeStr.match(
    /(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i,
  );
  if (rangeMatch) {
    let startHour = parseInt(rangeMatch[1], 10);
    const startMin = parseInt(rangeMatch[2], 10);
    const startPeriod = rangeMatch[3].toUpperCase();

    let endHour = parseInt(rangeMatch[4], 10);
    const endMin = parseInt(rangeMatch[5], 10);
    const endPeriod = rangeMatch[6].toUpperCase();

    if (startPeriod === 'PM' && startHour !== 12) startHour += 12;
    if (startPeriod === 'AM' && startHour === 12) startHour = 0;
    if (endPeriod === 'PM' && endHour !== 12) endHour += 12;
    if (endPeriod === 'AM' && endHour === 12) endHour = 0;

    return { startHour, startMin, endHour, endMin };
  }

  // Try parsing single time "2:00 PM" format (assume 1 hour duration)
  const ampmMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return {
      startHour: hours,
      startMin: minutes,
      endHour: hours + 1,
      endMin: minutes,
    };
  }

  // Try parsing "14:00" format (single time, assume 1 hour duration)
  const militaryMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (militaryMatch) {
    const hours = parseInt(militaryMatch[1], 10);
    const minutes = parseInt(militaryMatch[2], 10);
    return {
      startHour: hours,
      startMin: minutes,
      endHour: hours + 1,
      endMin: minutes,
    };
  }

  return null;
}

// Calculate position and height for a time-based item
export function getTimePositionAndHeight(
  startHour: number,
  startMin: number,
  endHour: number,
  endMin: number,
): { top: number; height: number } | null {
  // Clamp to visible range (6am to 11pm)
  const effectiveStartHour = Math.max(START_HOUR, Math.min(23, startHour));
  const effectiveEndHour = Math.max(START_HOUR, Math.min(24, endHour));

  if (effectiveStartHour >= 24) return null;

  const top = (effectiveStartHour - START_HOUR) * HOUR_HEIGHT + (startMin / 60) * HOUR_HEIGHT;
  const durationHours = effectiveEndHour - effectiveStartHour + (endMin - startMin) / 60;
  const height = Math.max(24, durationHours * HOUR_HEIGHT);

  return { top, height };
}

// Interface for calendar items with time info
export interface CalendarItem {
  id: string;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  type: 'unit' | 'deadline' | 'event';
  data: unknown;
}

// Calculate overlapping groups for collision detection
export function calculateOverlapGroups(
  items: CalendarItem[],
): Map<string, { column: number; totalColumns: number }> {
  if (items.length === 0) return new Map();

  // Sort items by start time
  const sortedItems = [...items].sort((a, b) => {
    const aStart = a.startHour * 60 + a.startMin;
    const bStart = b.startHour * 60 + b.startMin;
    return aStart - bStart;
  });

  const result = new Map<string, { column: number; totalColumns: number }>();
  const groups: CalendarItem[][] = [];

  // Group overlapping items
  for (const item of sortedItems) {
    const itemStart = item.startHour * 60 + item.startMin;

    // Find a group that this item overlaps with
    let foundGroup = false;
    for (const group of groups) {
      const groupEnd = Math.max(...group.map((g) => g.endHour * 60 + g.endMin));
      if (itemStart < groupEnd) {
        // Overlaps with this group
        group.push(item);
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      groups.push([item]);
    }
  }

  // Assign columns within each group
  for (const group of groups) {
    const columns: CalendarItem[][] = [];

    for (const item of group) {
      const itemStart = item.startHour * 60 + item.startMin;

      // Find the first column where this item doesn't overlap
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        const colItems = columns[col];
        const lastItem = colItems[colItems.length - 1];
        const lastEnd = lastItem.endHour * 60 + lastItem.endMin;

        if (itemStart >= lastEnd) {
          colItems.push(item);
          placed = true;
          break;
        }
      }

      if (!placed) {
        columns.push([item]);
      }
    }

    // Assign column info to each item in the group
    const totalColumns = columns.length;
    for (let col = 0; col < columns.length; col++) {
      for (const item of columns[col]) {
        result.set(item.id, { column: col, totalColumns });
      }
    }
  }

  return result;
}

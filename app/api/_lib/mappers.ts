import type { Deadline, Event, Notification, Unit } from '@/lib/types';

type Row = Record<string, unknown>;

const parseDate = (value: unknown): Date => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(0);
};

export const mapUnitRow = (row: Row): Unit => {
  // Handle both old flat structure and new JSONB location
  let location: Unit['location'];
  if (row.location && typeof row.location === 'object') {
    // New JSONB structure: {"building": "C5C", "room": "204"}
    const loc = row.location as { building?: string; room?: string };
    location = {
      building: loc.building ?? '',
      room: loc.room ?? '',
    };
  } else {
    // Fallback for old flat structure
    location = {
      building: String(row.building ?? ''),
      room: String(row.room ?? ''),
    };
  }

  return {
    id: String(row.id ?? ''),
    code: String(row.code ?? ''),
    name: String(row.name ?? ''),
    color: String(row.color ?? ''),
    location,
    schedule: [], // Will be populated separately from class_times table
    createdAt: parseDate(row.created_at ?? row.createdAt),
  };
};

export const mapDeadlineRow = (row: Row): Deadline => ({
  id: String(row.id ?? ''),
  title: String(row.title ?? ''),
  unitCode: String(row.unit_code ?? row.unitCode ?? ''),
  dueDate: parseDate(row.due_date ?? row.dueDate ?? row.due_at), // Handle both due_date and legacy due_at
  priority: row.priority as Deadline['priority'],
  type: row.type as Deadline['type'],
  completed: Boolean(row.completed),
  createdAt: parseDate(row.created_at ?? row.createdAt),
});

export const mapEventRow = (row: Row): Event => ({
  id: String(row.id ?? ''),
  title: String(row.title ?? ''),
  description: String(row.description ?? ''),
  date: parseDate(row.event_date ?? row.date), // Handle both event_date and legacy date
  time: String(row.event_time ?? row.time ?? ''),
  location: String(row.location ?? ''),
  building: row.building ? String(row.building) : undefined,
  category: row.category as Event['category'],
  imageUrl: row.image_url ? String(row.image_url) : undefined,
});

export const mapNotificationRow = (row: Row): Notification => ({
  id: String(row.id ?? ''),
  title: String(row.title ?? ''),
  message: String(row.message ?? ''),
  type: row.type as Notification['type'],
  read: Boolean(row.read),
  createdAt: parseDate(row.created_at ?? row.createdAt),
  link: row.link ? String(row.link) : undefined,
  relatedId: row.related_id ? String(row.related_id) : undefined,
});

export const serializeUnit = (unit: Unit) => ({
  id: unit.id,
  code: unit.code,
  name: unit.name,
  color: unit.color,
  location: unit.location, // JSONB field stores the nested location object
  created_at: unit.createdAt.toISOString(),
});

export const serializeDeadline = (deadline: Deadline) => ({
  id: deadline.id,
  title: deadline.title,
  unit_code: deadline.unitCode,
  due_date: deadline.dueDate.toISOString(),
  priority: deadline.priority,
  type: deadline.type,
  completed: deadline.completed,
  created_at: deadline.createdAt.toISOString(),
});

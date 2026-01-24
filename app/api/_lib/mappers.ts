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
  unitId: row.unit_id ? String(row.unit_id) : undefined,
  building: row.building ? String(row.building) : undefined,
  room: row.room ? String(row.room) : undefined,
  color: row.color ? String(row.color) : undefined,
  dueDate: parseDate(row.due_date ?? row.dueDate),
  priority: row.priority as Deadline['priority'],
  type: row.type as Deadline['type'],
  completed: Boolean(row.completed),
  createdAt: parseDate(row.created_at ?? row.createdAt),
});

export const mapEventRow = (row: Row): Event => {
  // Parse start_at (required in new schema)
  const startAt = parseDate(row.start_at ?? row.startAt ?? row.event_date ?? row.date);

  // Derive legacy date/time for backward compatibility
  const date = startAt;
  const time = row.all_day
    ? ''
    : startAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return {
    id: String(row.id ?? ''),
    userId: row.user_id ? String(row.user_id) : null, // null for public events
    title: String(row.title ?? ''),
    description: String(row.description ?? ''),
    location: String(row.location ?? ''),
    building: row.building ? String(row.building) : undefined,
    room: row.room ? String(row.room) : undefined,
    category: row.category as Event['category'],
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    // Primary time fields
    startAt,
    endAt: row.end_at ? parseDate(row.end_at) : undefined,
    allDay: Boolean(row.all_day ?? false),
    // Legacy fields (computed)
    date,
    time,
  };
};

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

export const serializeUnit = (unit: Omit<Unit, 'schedule'> & { user_id?: string }) => ({
  id: unit.id,
  user_id: unit.user_id, // Security: Required for user-scoped data
  code: unit.code,
  name: unit.name,
  color: unit.color,
  location: unit.location, // JSONB field stores the nested location object
  created_at: unit.createdAt.toISOString(),
});

export const serializeDeadline = (deadline: Deadline & { user_id?: string }) => ({
  id: deadline.id,
  user_id: deadline.user_id, // Security: Required for user-scoped data
  title: deadline.title,
  unit_code: deadline.unitCode,
  unit_id: deadline.unitId, // Optional: FK to units table
  building: deadline.building, // For exams: building code
  room: deadline.room, // For exams: room number
  color: deadline.color, // Custom color override
  due_date: deadline.dueDate.toISOString(),
  priority: deadline.priority,
  type: deadline.type,
  completed: deadline.completed,
  created_at: deadline.createdAt.toISOString(),
});

export const serializeEvent = (event: Event & { user_id?: string }) => ({
  id: event.id,
  user_id: event.user_id, // Security: Required for user-owned events (null for public)
  title: event.title,
  description: event.description,
  location: event.location,
  building: event.building,
  category: event.category,
  image_url: event.imageUrl,
  // Primary time fields (no more event_date/event_time)
  start_at: event.startAt.toISOString(),
  end_at: event.endAt?.toISOString(),
  all_day: event.allDay,
});

/**
 * Public Events Types
 *
 * Types for university-wide public events that are visible to all users.
 * These events cannot be edited by regular users and can be copied to personal calendar.
 */

export interface PublicEvent {
  id: string;
  title: string;
  description: string;
  // Time
  startAt: Date;
  endAt?: Date;
  allDay: boolean;
  // Location
  location: string;
  building?: string;
  room?: string;
  // Metadata
  category: 'Career' | 'Social' | 'Academic' | 'Free Food';
  imageUrl?: string;
  // Featured/priority
  isFeatured: boolean;
  priority: number;
  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
}

export interface PublicEventFromDB {
  id: string;
  title: string;
  description: string;
  start_at: string;
  end_at?: string | null;
  all_day: boolean;
  location: string;
  building?: string | null;
  room?: string | null;
  category: string;
  image_url?: string | null;
  is_featured: boolean;
  priority: number;
  created_at: string;
  updated_at?: string | null;
}

/**
 * Transform database row to PublicEvent
 */
export function transformPublicEvent(row: PublicEventFromDB): PublicEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startAt: new Date(row.start_at),
    endAt: row.end_at ? new Date(row.end_at) : undefined,
    allDay: row.all_day,
    location: row.location,
    building: row.building ?? undefined,
    room: row.room ?? undefined,
    category: row.category as PublicEvent['category'],
    imageUrl: row.image_url ?? undefined,
    isFeatured: row.is_featured,
    priority: row.priority,
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  };
}

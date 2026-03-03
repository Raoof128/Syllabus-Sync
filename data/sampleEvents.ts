// Sample events for demonstration purposes
// These events will be seeded when a new user starts the app

import { Event } from '@/lib/types';

// Building IDs from the campus building list
const BUILDINGS = {
  library: 'LIB',
  ubar: 'UBAR',
  theatre: 'MQTH',
  sportHub: 'SPORT',
  wally: 'WALLYS',
  libCafe: 'LIBCAFE',
  lotus: 'LOTUS',
  lachlanBuilding: 'LACH',
  incubator: 'INCUB',
  dlc: 'DLC',
};

// Helper to create dates relative to "today" (March 4, 2026 onwards)
const createDate = (daysFromNow: number, hour: number, minute: number = 0): Date => {
  const date = new Date();
  // Set to March 4, 2026 as base (current date is March 3, 2026)
  date.setFullYear(2026, 2, 4); // March is month 2 (0-indexed)
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);
  return date;
};

export const sampleEvents: Omit<Event, 'id' | 'date' | 'time'>[] = [
  // Academic Events
  {
    title: 'Research Skills Workshop',
    description:
      'Learn essential research methodology and academic writing skills. Perfect for thesis students and researchers.',
    startAt: createDate(1, 10, 0), // March 5, 10:00 AM
    endAt: createDate(1, 12, 0),
    location: 'Library Level 3, Room 301',
    building: BUILDINGS.library,
    room: '301',
    category: 'Academic',
    color: '#10B981',
    allDay: false,
    notificationEnabled: false,
  },

  // Free Food Events
  {
    title: 'Free Pizza Friday',
    description: 'Join us for free pizza! Hosted by the Student Association. All students welcome.',
    startAt: createDate(2, 12, 30), // March 6, 12:30 PM
    endAt: createDate(2, 14, 0),
    location: "Wally's Walk Courtyard",
    building: BUILDINGS.wally,
    category: 'Free Food',
    color: '#F59E0B',
    allDay: false,
    notificationEnabled: false,
  },

  // Career Events
  {
    title: 'Tech Industry Career Fair',
    description:
      'Meet recruiters from top tech companies including Google, Microsoft, and Atlassian. Bring your resume!',
    startAt: createDate(3, 9, 0), // March 7, 9:00 AM
    endAt: createDate(3, 16, 0),
    location: 'Macquarie Theatre',
    building: BUILDINGS.theatre,
    category: 'Career',
    color: '#3B82F6',
    allDay: false,
    notificationEnabled: false,
  },

  // Social Events
  {
    title: 'International Student Mixer',
    description:
      'Meet fellow international students! Games, music, and free refreshments. A great way to make new friends.',
    startAt: createDate(4, 17, 0), // March 8, 5:00 PM
    endAt: createDate(4, 20, 0),
    location: 'UniBar',
    building: BUILDINGS.ubar,
    category: 'Social',
    color: '#8B5CF6',
    allDay: false,
    notificationEnabled: false,
  },
];

export default sampleEvents;

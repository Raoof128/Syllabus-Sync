// data/sampleUnits.ts
import { Unit, Deadline } from '@/lib/types';
import { addDays, setHours, setMinutes } from 'date-fns';

// Helper to create dates relative to today for demo purposes
const today = new Date();
const createDate = (daysFromNow: number, hours: number, minutes: number = 0): Date => {
  return setMinutes(setHours(addDays(today, daysFromNow), hours), minutes);
};

// Use stable IDs to prevent hydration issues
export const sampleUnits: Unit[] = [
  {
    id: 'unit-comp2310',
    code: 'COMP2310',
    name: 'Networking',
    color: '#A6192E',
    location: {
      building: 'C5C',
      room: '204',
    },
    schedule: [
      {
        id: 'schedule-comp2310-mon',
        day: 'Monday',
        startTime: '09:00',
        endTime: '11:00',
      },
      {
        id: 'schedule-comp2310-thu',
        day: 'Thursday',
        startTime: '14:00',
        endTime: '16:00',
      },
    ],
    createdAt: new Date('2025-01-01'),
  },
  {
    id: 'unit-comp3300',
    code: 'COMP3300',
    name: 'Data Privacy',
    color: '#002A45',
    location: {
      building: 'W6A',
      room: '105',
    },
    schedule: [
      {
        id: 'schedule-comp3300-wed',
        day: 'Wednesday',
        startTime: '14:00',
        endTime: '16:00',
      },
    ],
    createdAt: new Date('2025-01-01'),
  },
  {
    id: 'unit-engl100',
    code: 'ENGL100',
    name: 'Academic Writing',
    color: '#FFB81C',
    location: {
      building: 'E7A',
      room: '301',
    },
    schedule: [
      {
        id: 'schedule-engl100-fri',
        day: 'Friday',
        startTime: '10:00',
        endTime: '12:00',
      },
    ],
    createdAt: new Date('2025-01-01'),
  },
];

export const sampleDeadlines: Deadline[] = [
  {
    id: 'deadline-1',
    title: 'Assignment 1',
    unitCode: 'COMP2310',
    dueDate: createDate(2, 23, 59), // In 2 days at 11:59 PM
    priority: 'Urgent',
    type: 'Assignment',
    completed: false,
    createdAt: new Date('2025-01-01'),
  },
  {
    id: 'deadline-2',
    title: 'Quiz Week 4',
    unitCode: 'COMP3300',
    dueDate: createDate(5, 14, 0), // In 5 days at 2:00 PM
    priority: 'High',
    type: 'Quiz',
    completed: false,
    createdAt: new Date('2025-01-01'),
  },
  {
    id: 'deadline-3',
    title: 'Presentation',
    unitCode: 'ENGL100',
    dueDate: createDate(10, 9, 0), // In 10 days at 9:00 AM
    priority: 'Medium',
    type: 'Presentation',
    completed: false,
    createdAt: new Date('2025-01-01'),
  },
  {
    id: 'deadline-4',
    title: 'Final Report',
    unitCode: 'COMP2310',
    dueDate: createDate(21, 23, 59), // In 3 weeks at 11:59 PM
    priority: 'Low',
    type: 'Assignment',
    completed: false,
    createdAt: new Date('2025-01-01'),
  },
];

// data/sampleUnits.ts
import { Unit, Deadline } from '@/lib/types';

const getDate = (daysFromNow: number, hours = 9, minutes = 0): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hours, minutes, 0, 0);
  return date;
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
      { id: 'comp2310-lecture', day: 'Monday', startTime: '09:00', endTime: '11:00' },
      { id: 'comp2310-tutorial', day: 'Wednesday', startTime: '14:00', endTime: '15:00' },
    ],
    createdAt: getDate(-14),
  },
  {
    id: 'unit-math1001',
    code: 'MATH1001',
    name: 'Foundations of Mathematics',
    color: '#002A45',
    location: {
      building: 'C3C',
      room: '112',
    },
    schedule: [
      { id: 'math1001-lecture', day: 'Tuesday', startTime: '10:00', endTime: '12:00' },
      { id: 'math1001-workshop', day: 'Thursday', startTime: '13:00', endTime: '14:30' },
    ],
    createdAt: getDate(-21),
  },
  {
    id: 'unit-hist2002',
    code: 'HIST2002',
    name: 'Modern Europe: 1789-1914 (Honours Stream A)',
    color: '#FFB81C',
    location: {
      building: 'W6A',
      room: '301',
    },
    schedule: [
      { id: 'hist2002-lecture', day: 'Friday', startTime: '16:00', endTime: '18:00' },
    ],
    createdAt: getDate(-30),
  },
];

export const sampleDeadlines: Deadline[] = [
  {
    id: 'deadline-comp2310-assignment-1',
    title: 'Assignment 1: Network Fundamentals',
    unitCode: 'COMP2310',
    dueDate: getDate(3, 23, 59),
    priority: 'High',
    type: 'Assignment',
    completed: false,
    createdAt: getDate(-7, 10, 0),
  },
  {
    id: 'deadline-math1001-quiz-1',
    title: 'Quiz 1: Linear Algebra Basics',
    unitCode: 'MATH1001',
    dueDate: getDate(7, 18, 0),
    priority: 'Medium',
    type: 'Quiz',
    completed: false,
    createdAt: getDate(-5, 9, 30),
  },
  {
    id: 'deadline-hist2002-essay-1',
    title: 'Essay 1: Revolution, Reform & Resilience (1200 words)',
    unitCode: 'HIST2002',
    dueDate: getDate(-2, 17, 0),
    priority: 'Low',
    type: 'Presentation',
    completed: true,
    createdAt: getDate(-20, 12, 15),
  },
];

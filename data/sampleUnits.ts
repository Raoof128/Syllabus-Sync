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
    id: '550e8400-e29b-41d4-a716-446655440100',
    code: 'COMP2310',
    name: 'Networking',
    color: '#A6192E',
    location: {
      building: 'C5C',
      room: '204',
    },
    schedule: [
      {
        id: '550e8400-e29b-41d4-a716-446655440101',
        day: 'Monday',
        startTime: '09:00',
        endTime: '11:00',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440102',
        day: 'Wednesday',
        startTime: '14:00',
        endTime: '15:00',
      },
    ],
    createdAt: getDate(-14),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440200',
    code: 'MATH1001',
    name: 'Foundations of Mathematics',
    color: '#002A45',
    location: {
      building: 'C3C',
      room: '112',
    },
    schedule: [
      {
        id: '550e8400-e29b-41d4-a716-446655440201',
        day: 'Tuesday',
        startTime: '10:00',
        endTime: '12:00',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440202',
        day: 'Thursday',
        startTime: '13:00',
        endTime: '14:30',
      },
    ],
    createdAt: getDate(-21),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440300',
    code: 'HIST2002',
    name: 'Modern Europe: 1789-1914 (Honours Stream A)',
    color: '#FFB81C',
    location: {
      building: 'W6A',
      room: '301',
    },
    schedule: [
      {
        id: '550e8400-e29b-41d4-a716-446655440301',
        day: 'Friday',
        startTime: '16:00',
        endTime: '18:00',
      },
    ],
    createdAt: getDate(-30),
  },
];

export const sampleDeadlines: Deadline[] = [
  // Assignments
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Assignment 1: Network Fundamentals',
    unitCode: 'COMP2310',
    dueDate: getDate(3, 23, 59),
    priority: 'High',
    type: 'Assignment',
    completed: false,
    createdAt: getDate(-7, 10, 0),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    title: 'Assignment 2: TCP/IP Protocol Analysis',
    unitCode: 'COMP2310',
    dueDate: getDate(10, 23, 59),
    priority: 'Medium',
    type: 'Assignment',
    completed: false,
    createdAt: getDate(-3, 14, 0),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    title: 'Problem Set 1: Derivatives & Integrals',
    unitCode: 'MATH1001',
    dueDate: getDate(5, 17, 0),
    priority: 'Medium',
    type: 'Assignment',
    completed: false,
    createdAt: getDate(-4, 11, 0),
  },
  // Exams
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    title: 'Midterm Exam',
    unitCode: 'COMP2310',
    dueDate: getDate(14, 9, 0),
    priority: 'Urgent',
    type: 'Exam',
    completed: false,
    createdAt: getDate(-10, 8, 0),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    title: 'Final Exam',
    unitCode: 'MATH1001',
    dueDate: getDate(28, 14, 0),
    priority: 'High',
    type: 'Exam',
    completed: false,
    createdAt: getDate(-7, 9, 0),
  },
  // Quizzes
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Quiz 1: Linear Algebra Basics',
    unitCode: 'MATH1001',
    dueDate: getDate(7, 18, 0),
    priority: 'Medium',
    type: 'Quiz',
    completed: false,
    createdAt: getDate(-5, 9, 30),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    title: 'Quiz 2: Network Security Concepts',
    unitCode: 'COMP2310',
    dueDate: getDate(6, 14, 0),
    priority: 'Medium',
    type: 'Quiz',
    completed: false,
    createdAt: getDate(-2, 10, 0),
  },
  // Completed items (showing progress)
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    title: 'Essay 1: Revolution, Reform & Resilience',
    unitCode: 'HIST2002',
    dueDate: getDate(-2, 17, 0),
    priority: 'Low',
    type: 'Presentation',
    completed: true,
    createdAt: getDate(-20, 12, 15),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440009',
    title: 'Lab Report 1: Network Topologies',
    unitCode: 'COMP2310',
    dueDate: getDate(-5, 23, 59),
    priority: 'Medium',
    type: 'Assignment',
    completed: true,
    createdAt: getDate(-14, 9, 0),
  },
];

// data/sampleNotifications.ts
import { Notification } from '@/lib/types';
import { subHours, subMinutes } from 'date-fns';

const now = new Date();

export const sampleNotifications: Notification[] = [
  {
    id: 'notif-1',
    title: 'Assignment Due Soon!',
    message: 'COMP2310 Assignment 1 is due in 2 days. Don\'t forget to submit!',
    type: 'deadline',
    read: false,
    createdAt: subMinutes(now, 30),
    link: '/calendar',
    relatedId: 'deadline-1',
  },
  {
    id: 'notif-2',
    title: 'Event Starting Soon',
    message: 'Study Skills Workshop starts at 2:00 PM today in Library Room 204',
    type: 'event',
    read: false,
    createdAt: subHours(now, 1),
    link: '/feed',
    relatedId: 'event-1',
  },
  {
    id: 'notif-3',
    title: 'Class Reminder',
    message: 'COMP2310 Networking class tomorrow at 9:00 AM in C5C Room 204',
    type: 'class',
    read: false,
    createdAt: subHours(now, 3),
    link: '/home',
    relatedId: 'unit-comp2310',
  },
  {
    id: 'notif-4',
    title: 'Free Pizza Tonight!',
    message: 'Don\'t miss Free Pizza Night at 6:00 PM in the Student Lounge (C5C)',
    type: 'event',
    read: true,
    createdAt: subHours(now, 5),
    link: '/feed',
    relatedId: 'event-2',
  },
  {
    id: 'notif-5',
    title: 'Quiz Coming Up',
    message: 'COMP3300 Quiz Week 4 is scheduled for 5 days from now',
    type: 'deadline',
    read: true,
    createdAt: subHours(now, 8),
    link: '/calendar',
    relatedId: 'deadline-2',
  },
  {
    id: 'notif-6',
    title: 'Career Fair Tomorrow',
    message: 'Career Fair 2026 is happening tomorrow at 12:00 PM. Bring your resume!',
    type: 'event',
    read: true,
    createdAt: subHours(now, 12),
    link: '/feed',
    relatedId: 'event-3',
  },
  {
    id: 'notif-7',
    title: 'Welcome to Syllabus Sync!',
    message: 'Start by adding your units and tracking your deadlines. Good luck with your studies!',
    type: 'system',
    read: true,
    createdAt: subHours(now, 24),
    link: '/home',
  },
];


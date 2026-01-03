// data/sampleNotifications.ts
import { Notification } from '@/lib/types';

// Helper to get dates relative to today
const getDate = (hoursAgo: number): Date => {
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  return date;
};

export const sampleNotifications: Notification[] = [
  {
    id: 'notif-1',
    title: 'Welcome to Syllabus Sync!',
    message: 'Get started by adding your units and deadlines to stay organized this semester.',
    type: 'system',
    read: false,
    createdAt: getDate(0),
    link: '/home',
  },
  {
    id: 'notif-2',
    title: 'Career Fair Tomorrow',
    message: 'Don\'t miss the Career Fair 2026 at Campus Hub. Meet top employers!',
    type: 'event',
    read: false,
    createdAt: getDate(2),
    link: '/feed',
  },
  {
    id: 'notif-3',
    title: 'Free Pizza Today!',
    message: 'Free Pizza Friday is happening now at the Library Courtyard.',
    type: 'event',
    read: false,
    createdAt: getDate(1),
    link: '/feed',
  },
  {
    id: 'notif-4',
    title: 'Study Skills Workshop',
    message: 'Reminder: Study Skills Workshop starts tomorrow at 2:00 PM.',
    type: 'event',
    read: true,
    createdAt: getDate(12),
    link: '/feed',
  },
  {
    id: 'notif-5',
    title: 'New Feature: Campus Map',
    message: 'Navigate campus easily with our new interactive map feature.',
    type: 'system',
    read: true,
    createdAt: getDate(24),
    link: '/map',
  },
];

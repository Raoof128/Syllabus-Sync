// lib/types/index.ts

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface Unit {
  id: string;
  code: string; // "COMP2310"
  name: string; // "Networking"
  color: string; // "#A6192E"
  location: {
    building: string; // "C5C"
    room: string; // "204"
  };
  schedule: ClassTime[];
  createdAt: Date;
}

export interface ClassTime {
  id: string;
  day: DayOfWeek;
  startTime: string; // "09:00"
  endTime: string; // "11:00"
}

export interface Deadline {
  id: string;
  title: string; // "Assignment 1"
  unitCode: string; // "COMP2310"
  dueDate: Date;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  type: 'Assignment' | 'Exam' | 'Quiz' | 'Presentation';
  completed: boolean;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string; // "2:00 PM"
  location: string; // "Library Room 204"
  building?: string; // "C5C" - for map navigation
  category: 'Career' | 'Social' | 'Academic' | 'Free Food';
  imageUrl?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'deadline' | 'event' | 'class' | 'system';
  read: boolean;
  createdAt: Date;
  link?: string; // Navigation link
  relatedId?: string; // Related deadline/event/unit ID
}

export type StressLevel = 'Low' | 'Busy' | 'High';

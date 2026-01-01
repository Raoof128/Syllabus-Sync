import { Event } from '@/lib/types';
import { addDays, setHours, setMinutes } from 'date-fns';

// Helper to create dates relative to today for demo purposes
const today = new Date();
const createDate = (daysFromNow: number, hours: number, minutes: number = 0): Date => {
  return setMinutes(setHours(addDays(today, daysFromNow), hours), minutes);
};

export const sampleEvents: Event[] = [
  {
    id: 'event-1',
    title: 'Study Skills Workshop',
    description:
      'Learn effective study techniques and time management strategies to excel in your studies.',
    date: createDate(0, 14, 0), // Today at 2:00 PM
    time: '2:00 PM',
    location: 'Library Room 204',
    building: 'C3C',
    category: 'Academic',
  },
  {
    id: 'event-2',
    title: 'Free Pizza Night',
    description:
      'Join us for free pizza and soft drinks! Meet other students and make new friends.',
    date: createDate(0, 18, 0), // Today at 6:00 PM
    time: '6:00 PM',
    location: 'Student Lounge',
    building: 'C5C',
    category: 'Free Food',
  },
  {
    id: 'event-3',
    title: 'Career Fair 2026',
    description:
      'Meet potential employers, learn about internship opportunities, and network with industry professionals.',
    date: createDate(1, 12, 0), // Tomorrow at 12:00 PM
    time: '12:00 PM',
    location: 'Hub Courtyard',
    building: 'C7A',
    category: 'Career',
  },
  {
    id: 'event-4',
    title: 'Coffee & Chat - International Students',
    description:
      'A casual meetup for international students to share experiences and support each other.',
    date: createDate(1, 15, 30), // Tomorrow at 3:30 PM
    time: '3:30 PM',
    location: 'Campus Hub Cafe',
    building: 'C7A',
    category: 'Social',
  },
  {
    id: 'event-5',
    title: 'Python Coding Workshop',
    description:
      'Hands-on workshop covering Python basics and data analysis with pandas. Bring your laptop!',
    date: createDate(2, 10, 0), // In 2 days at 10:00 AM
    time: '10:00 AM',
    location: 'C5C Lab 3',
    building: 'C5C',
    category: 'Academic',
  },
  {
    id: 'event-6',
    title: 'Tech Industry Panel Discussion',
    description:
      'Hear from senior engineers at leading tech companies about career paths and industry trends.',
    date: createDate(3, 16, 0), // In 3 days at 4:00 PM
    time: '4:00 PM',
    location: 'Lecture Theatre 350',
    building: 'C5C',
    category: 'Career',
  },
  {
    id: 'event-7',
    title: 'Board Games Night',
    description: 'Unwind with board games, card games, and good company. All skill levels welcome!',
    date: createDate(4, 19, 0), // In 4 days at 7:00 PM
    time: '7:00 PM',
    location: 'Student Recreation Room',
    building: 'C7A',
    category: 'Social',
  },
  {
    id: 'event-8',
    title: 'Resume & Cover Letter Workshop',
    description:
      'Get expert feedback on your resume and learn how to write compelling cover letters.',
    date: createDate(5, 13, 0), // In 5 days at 1:00 PM
    time: '1:00 PM',
    location: 'Careers Office',
    building: 'W3A',
    category: 'Career',
  },
  {
    id: 'event-9',
    title: 'BBQ & Sports Day',
    description:
      'Free BBQ lunch followed by friendly sports competitions. Form your team or join one on the day!',
    date: createDate(7, 12, 0), // In 7 days at 12:00 PM
    time: '12:00 PM',
    location: 'University Oval',
    building: 'Sports',
    category: 'Free Food',
  },
  {
    id: 'event-10',
    title: 'Movie Night - Classic Films',
    description:
      'Enjoy a classic film screening with free popcorn and drinks. This week: The Shawshank Redemption.',
    date: createDate(10, 19, 30), // In 10 days at 7:30 PM
    time: '7:30 PM',
    location: 'Arts Theatre',
    building: 'W6A',
    category: 'Social',
  },
];

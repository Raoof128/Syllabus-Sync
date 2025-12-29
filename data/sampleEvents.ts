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
    category: 'Academic',
  },
  {
    id: 'event-2',
    title: 'Free Pizza Night',
    description:
      'Join us for free pizza and soft drinks! Meet other students and make new friends.',
    date: createDate(0, 18, 0), // Today at 6:00 PM
    time: '6:00 PM',
    location: 'Student Lounge (Building C5C)',
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
    category: 'Academic',
  },
  {
    id: 'event-6',
    title: 'Tech Industry Panel Discussion',
    description:
      'Hear from senior engineers at leading tech companies about career paths and industry trends.',
    date: createDate(2, 16, 0), // In 2 days at 4:00 PM
    time: '4:00 PM',
    location: 'Lecture Theatre C5C 350',
    category: 'Career',
  },
  {
    id: 'event-7',
    title: 'Breakfast Club - Free Breakfast',
    description: 'Start your day right with a free healthy breakfast! First 100 students only.',
    date: createDate(3, 8, 0), // In 3 days at 8:00 AM
    time: '8:00 AM',
    location: 'Student Dining Hall',
    category: 'Free Food',
  },
  {
    id: 'event-8',
    title: 'Board Games Night',
    description: 'Unwind with board games, card games, and good company. All skill levels welcome!',
    date: createDate(3, 19, 0), // In 3 days at 7:00 PM
    time: '7:00 PM',
    location: 'Student Recreation Room',
    category: 'Social',
  },
  {
    id: 'event-9',
    title: 'Resume & Cover Letter Workshop',
    description:
      'Get expert feedback on your resume and learn how to write compelling cover letters.',
    date: createDate(5, 13, 0), // In 5 days at 1:00 PM
    time: '1:00 PM',
    location: 'Careers Office (W3A 140)',
    category: 'Career',
  },
  {
    id: 'event-10',
    title: 'Academic Writing Skills Seminar',
    description:
      'Improve your essay writing, critical analysis, and referencing skills for university assignments.',
    date: createDate(5, 11, 0), // In 5 days at 11:00 AM
    time: '11:00 AM',
    location: 'Library Seminar Room',
    category: 'Academic',
  },
  {
    id: 'event-11',
    title: 'BBQ & Sports Day',
    description:
      'Free BBQ lunch followed by friendly sports competitions. Form your team or join one on the day!',
    date: createDate(7, 12, 0), // In 7 days at 12:00 PM
    time: '12:00 PM',
    location: 'University Oval',
    category: 'Free Food',
  },
  {
    id: 'event-12',
    title: 'Mental Health & Wellbeing Workshop',
    description:
      'Learn practical strategies to manage stress, improve mental health, and maintain wellbeing.',
    date: createDate(7, 14, 0), // In 7 days at 2:00 PM
    time: '2:00 PM',
    location: 'Wellbeing Centre',
    category: 'Academic',
  },
  {
    id: 'event-13',
    title: 'Networking Mixer - Alumni & Students',
    description:
      'Connect with successful alumni working in various industries. Refreshments provided.',
    date: createDate(8, 17, 0), // In 8 days at 5:00 PM
    time: '5:00 PM',
    location: 'Alumni Hall',
    category: 'Career',
  },
  {
    id: 'event-14',
    title: 'Movie Night - Classic Films',
    description:
      'Enjoy a classic film screening with free popcorn and drinks. This week: The Shawshank Redemption.',
    date: createDate(10, 19, 30), // In 10 days at 7:30 PM
    time: '7:30 PM',
    location: 'Arts Theatre',
    category: 'Social',
  },
  {
    id: 'event-15',
    title: 'Free Lunch - Cultural Food Festival',
    description:
      'Sample cuisines from around the world! Featuring dishes from 15+ countries. First 200 students.',
    date: createDate(14, 12, 0), // In 14 days at 12:00 PM
    time: '12:00 PM',
    location: 'Campus Green',
    category: 'Free Food',
  },
];

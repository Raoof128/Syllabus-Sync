import dayjs from 'dayjs';
import { Event } from '@/lib/types';

// Helper to get dates relative to today
const getDate = (daysFromNow: number): Date => {
  return dayjs().add(daysFromNow, 'day').toDate();
};

// Helper to create an event with proper startAt/endAt from time string
const createEvent = (
  id: string,
  title: string,
  description: string,
  translationKey: string,
  descriptionKey: string,
  daysFromNow: number,
  time: string,
  location: string,
  building: string,
  category: Event['category'],
): Event => {
  const date = dayjs(getDate(daysFromNow)).startOf('day');

  // Parse start time from time string (e.g., "10:00 AM - 4:00 PM")
  const timeMatch = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let startAt = date;

  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const meridiem = timeMatch[3].toUpperCase();

    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    startAt = date.hour(hours).minute(minutes).second(0).millisecond(0);
  }

  return {
    id,
    title,
    description,
    translationKey,
    descriptionKey,
    startAt: startAt.toDate(),
    endAt: undefined,
    allDay: false,
    date: startAt.toDate(), // Computed for backward compatibility
    time,
    location,
    building,
    category,
  };
};

export const sampleEvents: Event[] = [
  createEvent(
    'event-1',
    'Career Fair 2026',
    'Meet top employers and explore career opportunities across various industries.',
    'event_careerFair2026_title',
    'event_careerFair2026_desc',
    2,
    '10:00 AM - 4:00 PM',
    'Campus Hub, Main Hall',
    'C7A',
    'Career',
  ),
  createEvent(
    'event-2',
    'Free Pizza Friday',
    'Join us for free pizza and networking with fellow students!',
    'event_freePizzaFriday_title',
    'event_freePizzaFriday_desc',
    0,
    '12:00 PM - 2:00 PM',
    'Library Courtyard',
    'C3C',
    'Free Food',
  ),
  createEvent(
    'event-3',
    'Study Skills Workshop',
    'Learn effective study techniques and time management strategies.',
    'event_studySkillsWorkshop_title',
    'event_studySkillsWorkshop_desc',
    1,
    '2:00 PM - 4:00 PM',
    'Library Room 204',
    'C3C',
    'Academic',
  ),
  createEvent(
    'event-4',
    'International Food Festival',
    'Celebrate diversity with food from around the world. Free samples available!',
    'event_internationalFoodFestival_title',
    'event_internationalFoodFestival_desc',
    3,
    '11:00 AM - 3:00 PM',
    'Campus Hub Courtyard',
    'C7A',
    'Free Food',
  ),
  createEvent(
    'event-5',
    'Tech Networking Night',
    'Connect with industry professionals and learn about tech careers.',
    'event_techNetworkingNight_title',
    'event_techNetworkingNight_desc',
    5,
    '6:00 PM - 8:00 PM',
    'Engineering Building, Room E101',
    'E7A',
    'Career',
  ),
  createEvent(
    'event-6',
    'Student Club Welcome Day',
    'Discover clubs and societies on campus. Free snacks provided!',
    'event_studentClubWelcomeDay_title',
    'event_studentClubWelcomeDay_desc',
    0,
    '10:00 AM - 3:00 PM',
    'Campus Hub',
    'C7A',
    'Social',
  ),
  createEvent(
    'event-7',
    'Research Seminar: AI in Healthcare',
    'Explore cutting-edge research on artificial intelligence applications in medicine.',
    'event_researchSeminarAI_title',
    'event_researchSeminarAI_desc',
    4,
    '3:00 PM - 5:00 PM',
    'Wallumattagal Building, Lecture Hall',
    'W6A',
    'Academic',
  ),
  createEvent(
    'event-8',
    'Movie Night: Sci-Fi Marathon',
    'Join us for a night of classic science fiction films with free popcorn!',
    'event_movieNightSciFi_title',
    'event_movieNightSciFi_desc',
    6,
    '7:00 PM - 11:00 PM',
    'Campus Hub Theatre',
    'C7A',
    'Social',
  ),
  createEvent(
    'event-9',
    'Resume Writing Workshop',
    'Get expert tips on crafting the perfect resume for your dream job.',
    'event_resumeWritingWorkshop_title',
    'event_resumeWritingWorkshop_desc',
    7,
    '1:00 PM - 3:00 PM',
    'Careers Centre',
    'W3A',
    'Career',
  ),
  createEvent(
    'event-10',
    'Free Coffee Morning',
    'Start your day right with free coffee and pastries!',
    'event_freeCoffeeMorning_title',
    'event_freeCoffeeMorning_desc',
    1,
    '8:00 AM - 10:00 AM',
    'Library Café',
    'C3C',
    'Free Food',
  ),
  createEvent(
    'event-11',
    'Alumni Panel: Careers in Data & Policy',
    'Hear short talks from alumni working in analytics, public policy, and consulting. Q&A plus networking with light refreshments.',
    'event_alumniPanel_title',
    'event_alumniPanel_desc',
    -1,
    '5:30 PM - 6:30 PM',
    'Library Seminar Room',
    'LIB',
    'Career',
  ),
];

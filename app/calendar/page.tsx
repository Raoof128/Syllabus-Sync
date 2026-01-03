// app/calendar/page.tsx
import { Metadata } from 'next';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import CalendarClient from './CalendarClient';

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Calendar`,
  description: 'Track upcoming deadlines and manage assignment dates.',
  openGraph: {
    title: `${APP_CONFIG.name} - Calendar`,
    description: 'Track upcoming deadlines and manage assignment dates.',
    type: 'website',
    images: [
      {
        url: `${UNIVERSITY_CONFIG.website}/MQ_Logo_Final.png`,
        alt: `${APP_CONFIG.name} logo`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [`${UNIVERSITY_CONFIG.website}/MQ_Logo_Final.png`],
  },
};

export default function CalendarPage() {
  return <CalendarClient />;
}
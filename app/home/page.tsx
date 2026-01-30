// app/home/page.tsx
import { Metadata } from 'next';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'Dashboard',
  description:
    'Your personalized academic dashboard for Macquarie University. Track classes, deadlines, events, and manage your university schedule in one place.',
  openGraph: {
    title: `Dashboard | ${APP_CONFIG.name} - ${UNIVERSITY_CONFIG.name}`,
    description:
      'Your personalized academic dashboard for Macquarie University. Track classes, deadlines, events, and manage your university schedule in one place.',
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

export default function HomePage() {
  return (
    <section className="container mx-auto p-6 max-w-7xl" aria-label="Dashboard overview">
      <HomeClient initialUser={null} />
    </section>
  );
}

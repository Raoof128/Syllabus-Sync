// app/home/page.tsx
import { Metadata } from 'next';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Home`,
  description: "Dashboard overview for units, deadlines, and today's schedule.",
  openGraph: {
    title: `${APP_CONFIG.name} - Home`,
    description: "Dashboard overview for units, deadlines, and today's schedule.",
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
  return <HomeClient />;
}

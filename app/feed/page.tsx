// app/feed/page.tsx
import { Metadata } from 'next';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import FeedClient from './FeedClient';

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Campus Feed`,
  description: 'Stay updated with the latest campus events, announcements, and activities.',
  openGraph: {
    title: `${APP_CONFIG.name} - Campus Feed`,
    description: 'Stay updated with the latest campus events, announcements, and activities.',
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

export default function FeedPage() {
  return <FeedClient />;
}

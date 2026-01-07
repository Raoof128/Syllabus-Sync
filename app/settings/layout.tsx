// app/settings/layout.tsx
import { Metadata } from 'next';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Settings`,
  description: 'Manage profile preferences, data, and notifications.',
  openGraph: {
    title: `${APP_CONFIG.name} - Settings`,
    description: 'Manage profile preferences, data, and notifications.',
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
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

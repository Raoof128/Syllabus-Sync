// app/login/page.tsx
import { Metadata } from 'next';
import { APP_CONFIG } from '@/lib/config';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Login`,
  description: 'Sign in to access your Syllabus Sync account.',
  openGraph: {
    title: `${APP_CONFIG.name} - Login`,
    description: 'Sign in to access your Syllabus Sync account.',
    type: 'website',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return <LoginClient />;
}

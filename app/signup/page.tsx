// app/signup/page.tsx
import { Metadata } from 'next';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import SignupClient from './SignupClient';

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Sign Up`,
  description: 'Create your Syllabus Sync account.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupPage() {
  return <SignupClient />;
}

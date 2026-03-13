import type { Metadata } from 'next';
import { AboutSettingsContent } from './AboutSettingsContent';

export const metadata: Metadata = {
  title: 'About | Syllabus Sync',
  description: 'About Syllabus Sync application',
};

export default function AboutSettingsPage() {
  return <AboutSettingsContent />;
}

import type { Metadata } from 'next';
import { ExperienceSettingsContent } from './ExperienceSettingsContent';

export const metadata: Metadata = {
  title: 'Experience Settings | Syllabus Sync',
  description: 'Manage your gamification and experience preferences',
};

export default function ExperienceSettingsPage() {
  return <ExperienceSettingsContent />;
}

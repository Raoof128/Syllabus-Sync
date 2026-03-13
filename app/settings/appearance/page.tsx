import type { Metadata } from 'next';
import { AppearanceSettingsContent } from './AppearanceSettingsContent';

export const metadata: Metadata = {
  title: 'Appearance Settings | Syllabus Sync',
  description: 'Customize your theme and language preferences',
};

export default function AppearanceSettingsPage() {
  return <AppearanceSettingsContent />;
}

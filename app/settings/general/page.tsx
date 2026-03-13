import type { Metadata } from 'next';
import { GeneralSettingsContent } from './GeneralSettingsContent';

export const metadata: Metadata = {
  title: 'General Settings | Syllabus Sync',
  description: 'Manage your notification and map preferences',
};

export default function GeneralSettingsPage() {
  return <GeneralSettingsContent />;
}

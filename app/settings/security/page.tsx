import type { Metadata } from 'next';
import { PrivacySettingsPage } from './PrivacySettingsPage';

export const metadata: Metadata = {
  title: 'Privacy & Security Settings | Syllabus Sync',
  description: 'Manage your privacy and security preferences',
};

export default function SecuritySettingsPageWrapper() {
  return <PrivacySettingsPage />;
}

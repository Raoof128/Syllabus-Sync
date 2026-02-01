// app/manage-profiles/page.tsx
'use client';

import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { ProfileHeader } from './components/ProfileHeader';
import { PersonalInfoCard } from './components/PersonalInfoCard';
import { AcademicInfoCard } from './components/AcademicInfoCard';
import { ReminderSettings } from './components/ReminderSettings';
import { ProfileSkeleton } from './components/ProfileSkeleton';
import { useProfileManager } from './hooks/useProfileManager';
import { Button } from '@/components/ui/mq/button';
import { Save, Loader2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MagicCard } from '@/components/ui/MagicCard';

export default function ManageProfilesPage() {
  const { t } = useTypedTranslation();
  const router = useRouter();

  // One hook call replaces 50 lines of state logic
  const {
    currentProfile,
    formData,
    isSaving,
    isProfileLoading,
    hasLoaded,
    handleFieldChange,
    saveProfile,
  } = useProfileManager();

  if (isProfileLoading && !hasLoaded) return <ProfileSkeleton />;

  if (!currentProfile) {
    // Show empty state / sign in prompt if loaded but no profile
    if (hasLoaded) {
      return (
        <div className="container mx-auto p-6 max-w-4xl">
          <MagicCard isLiquidEnhanced>
            <div className="mq-magic-card-content bg-mq-card-background border border-mq-border">
              <div className="text-center py-12">
                <div className="text-mq-content-tertiary">
                  <User className="h-16 w-16 mx-auto mb-4" />
                </div>
                <h2 className="text-mq-xl font-semibold text-mq-content mb-2">
                  {t('noProfilesYet')}
                </h2>
                <p className="text-mq-content-secondary mb-6 max-w-md mx-auto">
                  {t('signInToManageProfile')}
                </p>
                <Button onClick={() => router.push('/login')}>{t('signIn')}</Button>
              </div>
            </div>
          </MagicCard>
        </div>
      );
    }
    return <ProfileSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:p-6 max-w-4xl space-y-6">
      {/* 1. Header & Avatar */}
      <ProfileHeader profile={currentProfile} isSaving={isSaving} />

      {/* 2. Form Sections */}
      <PersonalInfoCard
        data={formData}
        email={currentProfile.email}
        onChange={handleFieldChange}
        disabled={isSaving}
        isStudentIdLocked={!!currentProfile.studentId}
      />

      <AcademicInfoCard data={formData} onChange={handleFieldChange} disabled={isSaving} />

      {/* 3. Notifications */}
      <ReminderSettings disabled={isSaving} />

      {/* 4. Save Action */}
      <div className="flex justify-center pt-2">
        <Button
          onClick={saveProfile}
          disabled={isSaving}
          size="lg"
          className="shadow-lg flex items-center gap-2"
        >
          {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
          {isSaving ? t('saving') : t('saveChanges')}
        </Button>
      </div>
    </div>
  );
}

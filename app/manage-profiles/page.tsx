'use client';

import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { ProfileHeader } from './components/ProfileHeader';
import { PersonalInfoCard } from './components/PersonalInfoCard';
import { AcademicInfoCard } from './components/AcademicInfoCard';
import { ReminderSettings } from './components/ReminderSettings';
import { useProfileManager } from './hooks/useProfileManager';
import { Button } from '@/components/ui/mq/button';
import { Save, Loader2, User as UserIcon } from 'lucide-react'; // Renamed User to UserIcon to avoid conflict
import { MagicCard } from '@/components/ui/MagicCard';
import { useRouter } from 'next/navigation';
import { ProfileSkeleton } from './components/ProfileSkeleton';

export default function ManageProfilesPage() {
  const { t } = useTypedTranslation();
  const router = useRouter();
  const {
    currentProfile,
    form,
    saveProfile,
    isSaving,
    isDirty,
    isValid,
    isProfileLoading,
    hasLoaded,
  } = useProfileManager();

  if (isProfileLoading && !hasLoaded) return <ProfileSkeleton />;

  if (!currentProfile) {
    if (hasLoaded) {
      return (
        <div className="container mx-auto p-6 max-w-4xl">
          <MagicCard isLiquidEnhanced>
            <div className="mq-magic-card-content bg-mq-card-background border border-mq-border">
              <div className="text-center py-12">
                <div className="text-mq-content-tertiary">
                  <UserIcon className="h-16 w-16 mx-auto mb-4" />
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
      <ProfileHeader profile={currentProfile} isSaving={isSaving} />

      {/* Pass the FORM object down to cards */}
      <PersonalInfoCard form={form} email={currentProfile.email} disabled={isSaving} />

      <AcademicInfoCard form={form} disabled={isSaving} />

      {/* Reminders stay separate from Zod form for instant toggling */}
      <ReminderSettings disabled={isSaving} />

      {/* Save Button only shows if form is dirty (changed) */}
      {isDirty && (
        <div className="flex justify-center pt-2 animate-in fade-in slide-in-from-bottom-4">
          <Button
            onClick={saveProfile}
            disabled={isSaving || !isValid}
            size="lg"
            className="shadow-lg flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
            {isSaving ? t('saving') : t('saveChanges')}
          </Button>
        </div>
      )}
    </div>
  );
}

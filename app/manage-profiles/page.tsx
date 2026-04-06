'use client';

import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { ProfileHeader } from './components/ProfileHeader';
import { PersonalInfoCard } from './components/PersonalInfoCard';
import { AcademicInfoCard } from './components/AcademicInfoCard';
import { SecurityCard } from './components/SecurityCard';
import { useProfileManager } from './hooks/useProfileManager';
import { Button } from '@/components/ui/mq/button';
import { Save, Loader2, User as UserIcon, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { MagicCard } from '@/components/ui/MagicCard';
import { cn } from '@/lib/utils';
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
    hasLoaded,
    reloadProfile,
    isProfileLoading,
  } = useProfileManager();

  // Show skeleton until the DB fetch completes — prevents stale localStorage data from flashing
  if (!hasLoaded) return <ProfileSkeleton />;

  if (!currentProfile) {
    return (
      <div className="container mx-auto max-w-4xl px-3 py-4 sm:p-6">
        <MagicCard isLiquidEnhanced>
          <div className="mq-magic-card-content bg-mq-card-background border border-mq-border">
            <div className="text-center py-10 sm:py-12">
              <div className="text-mq-content-tertiary">
                <UserIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4" />
              </div>
              <h2 className="text-mq-lg sm:text-mq-xl font-semibold text-mq-content mb-2">
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

  return (
    <div className="container mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-6 lg:py-8">
      {/* Back to Home */}
      <div className="mb-4 sm:mb-6">
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-sm text-mq-content-secondary hover:text-mq-content transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('home')}
        </Link>
      </div>

      <div className="space-y-4 sm:space-y-5">
        <ProfileHeader profile={currentProfile} isSaving={isSaving} />

        {/* Pass the FORM object down to cards */}
        <PersonalInfoCard form={form} email={currentProfile.email} disabled={isSaving} />

        <AcademicInfoCard form={form} disabled={isSaving} />

        {/* Account Security & Sessions */}
        <SecurityCard />

        {/* Reload button — subtle at the bottom */}
        <div className="flex justify-center pt-1 pb-16">
          <button
            type="button"
            onClick={reloadProfile}
            disabled={isProfileLoading || isSaving}
            className="flex items-center gap-1.5 text-xs text-mq-content-tertiary hover:text-mq-content-secondary transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn('h-3 w-3', isProfileLoading && 'animate-spin')} />
            {isProfileLoading ? t('reloading') : t('reloadFromServer')}
          </button>
        </div>
      </div>

      {/* Sticky Save Bar — appears when form has changes */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-mq-card-background/95 backdrop-blur-md border-t border-mq-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            <div className="container mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-sm text-mq-content-secondary hidden sm:block">
                {t('unsavedChanges')}
              </p>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => form.reset()}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none"
                >
                  {t('discard')}
                </Button>
                <Button
                  onClick={saveProfile}
                  disabled={isSaving || !isValid}
                  size="sm"
                  className="flex-1 sm:flex-none flex items-center gap-2 shadow-md"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSaving ? t('saving') : t('saveChanges')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

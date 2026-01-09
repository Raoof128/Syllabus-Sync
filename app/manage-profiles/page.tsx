'use client';

import { useState } from 'react';
import { User, Plus, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/mq/card';
import { Button } from '@/components/ui/mq/button';
import { useProfilesStore } from '@/lib/store/profilesStore';
import dynamic from 'next/dynamic';

// Dynamically import ProfileCard for better code splitting
const ProfileCard = dynamic(() => import('@/components/ProfileCard'), {
  loading: () => {
    // We can't use the hook here because it's not a component body, but this is a fallback.
    // We can just return a simple div or assume 'Loading profile...' is fine for fallback.
    return <div className="flex items-center justify-center p-4">Loading profile...</div>;
  },
});
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/mq/input';
import { Label } from '@/components/ui/label';
import { UserProfile } from '@/lib/store/profilesStore';
import { toastUtils } from '@/lib/utils/toast';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { MagicCard } from '@/components/ui/MagicCard';
import { useGamificationStore, showXPEarnedNotification } from '@/components/gamification';
import { apiRequest } from '@/lib/utils/api';

export default function ManageProfilesPage() {
  const { t, language } = useTranslation();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    course: '',
    year: '',
  });

  const {
    profiles,
    currentProfileId,
    addProfile,
    updateProfile,
    deleteProfile,
    setCurrentProfile,
  } = useProfilesStore();

  // Gamification store
  const { isDemo, refreshProfile, settings } = useGamificationStore();

  // Check if profile is complete (all required fields filled)
  const isProfileComplete = (data: typeof formData) => {
    return data.name && data.email && data.studentId && data.course && data.year;
  };

  // Award XP for completing profile (one-time bonus)
  const awardProfileCompletionXP = async () => {
    if (isDemo) return; // Skip for demo users

    try {
      const response = await apiRequest<{
        message: string;
        result: { xpAwarded: number; leveledUp: boolean; newLevel: number };
      }>('/api/gamification/award-xp', {
        method: 'POST',
        body: JSON.stringify({
          eventType: 'profile_completed',
          metadata: { source: 'manage-profiles' },
        }),
      });

      // Show XP notification if enabled
      if (settings.showXPNotifications) {
        showXPEarnedNotification(response.result.xpAwarded, 'Profile Completed', language);
      }

      // Refresh profile to update XP display
      await refreshProfile();
    } catch (error) {
      // Silently ignore if already awarded (409 conflict)
      if (error instanceof Error && !error.message.includes('already awarded')) {
        console.error('Failed to award profile completion XP:', error);
      }
    }
  };

  const handleAddProfile = async () => {
    if (formData.name && formData.email && formData.studentId) {
      // Check if this is the first complete profile
      const isFirstCompleteProfile = profiles.length === 0 && isProfileComplete(formData);

      addProfile({
        ...formData,
        preferences: {
          notifications: true,
          emailReminders: true,
          pushNotifications: false,
        },
      });

      setFormData({
        name: '',
        email: '',
        studentId: '',
        course: '',
        year: '',
      });
      setShowAddDialog(false);
      toastUtils.success(t('profileCreated'), t('profileCreatedMsg'));

      // Award XP for first complete profile
      if (isFirstCompleteProfile) {
        await awardProfileCompletionXP();
      }
    }
  };

  const handleEditProfile = (profile: UserProfile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      email: profile.email,
      studentId: profile.studentId,
      course: profile.course,
      year: profile.year,
    });
    setShowAddDialog(true);
  };

  const handleUpdateProfile = async () => {
    if (editingProfile && formData.name && formData.email) {
      // Check if we're completing a previously incomplete profile
      const wasIncomplete = !editingProfile.course || !editingProfile.year;
      const isNowComplete = isProfileComplete(formData);
      const shouldAwardXP = wasIncomplete && isNowComplete;

      updateProfile(editingProfile.id, {
        ...formData,
        preferences: editingProfile.preferences,
      });

      setEditingProfile(null);
      setFormData({
        name: '',
        email: '',
        studentId: '',
        course: '',
        year: '',
      });
      setShowAddDialog(false);
      toastUtils.success(t('profileUpdated'), t('profileUpdatedMsg'));

      // Award XP if profile is now complete
      if (shouldAwardXP) {
        await awardProfileCompletionXP();
      }
    }
  };

  const handleDeleteProfile = (id: string) => {
    deleteProfile(id);
    toastUtils.success(t('profileDeleted'), t('profileDeletedMsg'));
  };

  const handleSetCurrentProfile = (id: string) => {
    setCurrentProfile(id);
    toastUtils.success(t('profileSwitched'), t('profileSwitchedMsg'));
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-mq-3xl font-bold text-mq-content mb-2">{t('manageProfiles')}</h1>
        <p className="text-mq-content">{t('manageProfilesDesc')}</p>
      </header>

      <MagicCard isLiquidEnhanced>
        <div className="mq-magic-card-content p-0">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Users className="h-5 w-5" aria-hidden="true" />
                {t('allProfiles', { count: profiles.length })}
              </h2>
              {profiles.length > 0 && (
                <Button size="sm" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('createProfile')}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {profiles.length === 0 ? (
                <div className="text-center py-12">
                  <User className="h-16 w-16 text-mq-content-tertiary mx-auto mb-4" />
                  <h3 className="text-mq-xl font-semibold text-mq-content mb-2">
                    {t('noProfilesYet')}
                  </h3>
                  <p className="text-mq-content-secondary mb-6 max-w-md mx-auto">
                    {t('createFirstProfile')}
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('createProfile')}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profiles.map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      isCurrent={profile.id === currentProfileId}
                      onEdit={handleEditProfile}
                      onDelete={handleDeleteProfile}
                      onSetCurrent={handleSetCurrentProfile}
                      onUpdate={updateProfile}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MagicCard>

      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) setEditingProfile(null);
        }}
      >
        <DialogContent className="sm:max-w-md" aria-describedby="profile-form-description">
          <DialogHeader>
            <DialogTitle>{editingProfile ? t('editProfile') : t('createNewProfile')}</DialogTitle>
            <p id="profile-form-description" className="text-mq-sm text-mq-content-secondary">
              {editingProfile ? t('updateProfileDesc') : t('fillProfileDetails')}
            </p>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (editingProfile) {
                handleUpdateProfile();
              } else {
                handleAddProfile();
              }
            }}
          >
            <div>
              <Label htmlFor="profile-name">{t('fullName')}</Label>
              <Input
                id="profile-name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('enterFullName')}
                required
                aria-describedby="name-help"
              />
              <p id="name-help" className="sr-only">
                {t('enterLegalName')}
              </p>
            </div>

            <div>
              <Label htmlFor="profile-email">{t('emailAddress')}</Label>
              <Input
                id="profile-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('emailPlaceholderExample')}
                required
                aria-describedby="email-help"
              />
              <p id="email-help" className="sr-only">
                {t('enterEmailDesc')}
              </p>
            </div>

            <div>
              <Label htmlFor="profile-student-id">{t('studentId')}</Label>
              <Input
                id="profile-student-id"
                name="studentId"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder="12345678"
                required
                aria-describedby="student-id-help"
              />
              <p id="student-id-help" className="sr-only">
                {t('enterStudentIdDesc')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profile-course">{t('course')}</Label>
                <Input
                  id="profile-course"
                  name="course"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  placeholder={t('coursePlaceholder')}
                  aria-describedby="course-help"
                />
                <p id="course-help" className="sr-only">
                  {t('enterCourseDesc')}
                </p>
              </div>

              <div>
                <Label htmlFor="profile-year">{t('year')}</Label>
                <Input
                  id="profile-year"
                  name="year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder={t('yearPlaceholder')}
                  aria-describedby="year-help"
                />
                <p id="year-help" className="sr-only">
                  {t('enterYearDesc')}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setShowAddDialog(false);
                  setEditingProfile(null);
                }}
              >
                {t('cancel')}
              </Button>
              <Button type="submit">
                {editingProfile ? t('updateProfile') : t('createProfile')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

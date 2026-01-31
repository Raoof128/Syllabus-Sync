'use client';

import { memo, useEffect, useState, useSyncExternalStore, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Button } from '@/components/ui/mq/button';
import { User, Loader2, Pencil, Check, X } from 'lucide-react';
import { useProfilesStore } from '@/lib/store/profilesStore';
import { toastUtils } from '@/lib/utils/toast';
import type { TranslationKey } from '@/lib/i18n/translations';
import { MagicCard } from '@/components/ui/MagicCard';
import { Input } from '@/components/ui/mq/input';
import { Label } from '@/components/ui/label';
import { BRAND_COLORS } from '@/lib/config';
import Image from 'next/image';

type AccountSettingsProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

// Helper for detecting client-side rendering without setState in effect
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const AccountSettings = memo(({ t }: AccountSettingsProps) => {
  const isClient = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const { profiles, currentProfileId, isLoading, hasLoaded, fetchProfile, updateProfile } =
    useProfilesStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    course: '',
    year: '',
  });

  // Fetch profile from database on mount
  useEffect(() => {
    if (!hasLoaded && !isLoading) {
      fetchProfile();
    }
  }, [hasLoaded, isLoading, fetchProfile]);

  // Get current profile
  const currentProfile = currentProfileId
    ? profiles.find((p) => p.id === currentProfileId) || null
    : null;

  // Initialize form data when profile loads
  useEffect(() => {
    if (currentProfile && !isEditing) {
      setFormData({
        name: currentProfile.name || '',
        studentId: currentProfile.studentId || '',
        course: currentProfile.course || '',
        year: currentProfile.year || '',
      });
    }
  }, [currentProfile, isEditing]);

  const handleStartEdit = useCallback(() => {
    if (currentProfile) {
      setFormData({
        name: currentProfile.name || '',
        studentId: currentProfile.studentId || '',
        course: currentProfile.course || '',
        year: currentProfile.year || '',
      });
      setIsEditing(true);
    }
  }, [currentProfile]);

  const handleCancelEdit = useCallback(() => {
    if (currentProfile) {
      setFormData({
        name: currentProfile.name || '',
        studentId: currentProfile.studentId || '',
        course: currentProfile.course || '',
        year: currentProfile.year || '',
      });
    }
    setIsEditing(false);
  }, [currentProfile]);

  const handleSaveProfile = useCallback(async () => {
    if (!currentProfile || !formData.name) return;

    setIsSaving(true);
    try {
      // Only include studentId if it's being set for the first time (was empty/null)
      // The database prevents modifying student_id once it's set
      const updates: Parameters<typeof updateProfile>[1] = {
        name: formData.name,
        course: formData.course,
        year: formData.year,
        preferences: currentProfile.preferences,
      };

      // Only send studentId if it wasn't previously set
      if (!currentProfile.studentId && formData.studentId) {
        updates.studentId = formData.studentId;
      }

      const result = await updateProfile(currentProfile.id, updates);

      if (result) {
        setIsEditing(false);
        toastUtils.success(t('profileUpdated'), t('profileUpdatedMsg'));
      } else {
        toastUtils.error(t('error'), t('failedToUpdateProfile'));
      }
    } catch {
      toastUtils.error(t('error'), t('failedToUpdateProfile'));
    } finally {
      setIsSaving(false);
    }
  }, [currentProfile, formData, updateProfile, t]);

  // Loading state
  if (!isClient || (isLoading && !hasLoaded)) {
    return (
      <MagicCard data-testid="account-settings">
        <Card className="mq-magic-card-content bg-mq-card-background border border-mq-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" aria-hidden="true" />
              <span>{t('account')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </MagicCard>
    );
  }

  // No profile state
  if (!currentProfile) {
    return (
      <MagicCard data-testid="account-settings">
        <Card className="mq-magic-card-content bg-mq-card-background border border-mq-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" aria-hidden="true" />
              <span>{t('account')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <User className="h-12 w-12 mx-auto mb-3" />
              <p className="text-mq-content-secondary text-sm">{t('signInToManageProfile')}</p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => (window.location.href = '/login')}
              >
                {t('signIn')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </MagicCard>
    );
  }

  return (
    <MagicCard data-testid="account-settings">
      <Card className="mq-magic-card-content bg-mq-card-background border border-mq-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" aria-hidden="true" />
              <span id="account-heading">{t('account')}</span>
            </div>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStartEdit}
                className="text-mq-content-secondary hover:text-mq-primary"
                aria-label={t('editProfile')}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" role="region" aria-labelledby="account-heading">
          {/* Profile Avatar */}
          <div className="flex items-center gap-4 pb-4 border-b border-mq-border">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden shadow-mq"
              style={{
                backgroundColor: currentProfile.avatar ? 'transparent' : BRAND_COLORS.primary,
              }}
            >
              {currentProfile.avatar ? (
                <Image
                  src={currentProfile.avatar}
                  alt={currentProfile.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-2xl">
                  {currentProfile.name ? currentProfile.name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-mq-content">
                {currentProfile.name || t('guest')}
              </h3>
              <p className="text-sm text-mq-content-secondary">{currentProfile.email}</p>
              {currentProfile.avatar?.startsWith('data:') && (
                <p className="mt-1 text-xs text-mq-warning">{t('avatarLocalOnlyWarning')}</p>
              )}
            </div>
          </div>

          {/* Profile Fields */}
          {isEditing ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveProfile();
              }}
            >
              <div>
                <Label htmlFor="account-name">{t('fullName')}</Label>
                <Input
                  id="account-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('enterFullName')}
                  required
                  disabled={isSaving}
                />
              </div>

              <div>
                <Label htmlFor="account-student-id">{t('studentId')}</Label>
                <Input
                id="account-student-id"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder={t('studentIdPlaceholder')}
                disabled={isSaving}
              />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="account-course">{t('course')}</Label>
                  <Input
                    id="account-course"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    placeholder={t('coursePlaceholder')}
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <Label htmlFor="account-year">{t('year')}</Label>
                  <Input
                    id="account-year"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder={t('yearPlaceholder')}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  type="button"
                  disabled={isSaving}
                  onClick={handleCancelEdit}
                  size="sm"
                >
                  <X className="h-4 w-4 mr-1" />
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={isSaving} size="sm">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      {t('saving')}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      {t('save')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border">
                <p className="text-mq-xs text-mq-content-tertiary">{t('fullName')}</p>
                <p className="text-mq-sm text-mq-content">{currentProfile.name || '-'}</p>
              </div>

              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border">
                <p className="text-mq-xs text-mq-content-tertiary">{t('studentId')}</p>
                <p className="text-mq-sm text-mq-content">{currentProfile.studentId || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border">
                  <p className="text-mq-xs text-mq-content-tertiary">{t('course')}</p>
                  <p className="text-mq-sm text-mq-content">{currentProfile.course || '-'}</p>
                </div>

                <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border">
                  <p className="text-mq-xs text-mq-content-tertiary">{t('year')}</p>
                  <p className="text-mq-sm text-mq-content">{currentProfile.year || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </MagicCard>
  );
});

AccountSettings.displayName = 'AccountSettings';

export default AccountSettings;

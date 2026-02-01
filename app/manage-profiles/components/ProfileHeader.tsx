'use client';

import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { UserProfile, useProfilesStore } from '@/lib/store/profilesStore';
import { MagicCard } from '@/components/ui/MagicCard';
import { Camera, Mail, IdCard, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { BRAND_COLORS } from '@/lib/config';
import { toastUtils } from '@/lib/utils/toast';
import { useState } from 'react';

interface ProfileHeaderProps {
  profile: UserProfile;
  isSaving: boolean;
}

export function ProfileHeader({ profile, isSaving: isFormSaving }: ProfileHeaderProps) {
  const { t } = useTypedTranslation();
  const { updateProfile } = useProfilesStore();
  const [isAvatarSaving, setIsAvatarSaving] = useState(false);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Security Check: 2MB Limit
    if (file.size > 2 * 1024 * 1024) {
      toastUtils.error(t('error'), 'File size exceeds 2MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      setIsAvatarSaving(true);
      try {
        await updateProfile(profile.id, { avatar: result });
        toastUtils.success(t('profileUpdated'), t('avatarUpdated'));
      } catch {
        toastUtils.error(t('error'), t('failedToUpdateProfile'));
      } finally {
        setIsAvatarSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <MagicCard isLiquidEnhanced className="mb-4 sm:mb-6">
      <div className="mq-magic-card-content bg-mq-card-background border border-mq-border">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-6">
          {/* Avatar Section */}
          <div className="relative group">
            <label className="cursor-pointer block">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden shadow-lg ring-4 ring-mq-background"
                style={{
                  backgroundColor: profile.avatar ? 'transparent' : BRAND_COLORS.primary,
                }}
              >
                {isAvatarSaving ? (
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                ) : profile.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={profile.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-white font-bold text-3xl">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              {!isAvatarSaving && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                aria-label={t('changeAvatar')}
                disabled={isFormSaving || isAvatarSaving}
              />
            </label>
          </div>

          {/* Profile Summary */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-mq-content mb-1">
              {profile.name || t('guest')}
            </h1>
            <p className="text-mq-content-secondary flex items-center justify-center sm:justify-start gap-2">
              <Mail className="h-4 w-4" />
              {profile.email}
            </p>
            {profile.studentId && (
              <p className="text-mq-content-tertiary text-sm mt-1 flex items-center justify-center sm:justify-start gap-2">
                <IdCard className="h-4 w-4" />
                <span>
                  {t('idPrefix')}
                  {profile.studentId}
                </span>
              </p>
            )}
            {profile.avatar?.startsWith('data:') && (
              <p className="mt-2 text-xs text-mq-warning">{t('avatarLocalOnlyWarning')}</p>
            )}
          </div>
        </div>
      </div>
    </MagicCard>
  );
}

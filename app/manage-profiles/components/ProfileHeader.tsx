'use client';

import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
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
    // Reset input immediately so the same file can be re-selected after failure
    event.target.value = '';
    if (!file) return;

    // Security Check: 2MB Limit
    if (file.size > 2 * 1024 * 1024) {
      toastUtils.error(t('error'), t('fileSizeExceedsLimit' as TranslationKey));
      return;
    }

    const profileId = profile.id;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      setIsAvatarSaving(true);
      try {
        const updated = await updateProfile(profileId, { avatar: result });
        if (updated) {
          toastUtils.success(t('profileUpdated'), t('avatarUpdated'));
        }
        // If null, upload failed — store already shows error toast and reverts
      } catch {
        toastUtils.error(t('error'), t('failedToUpdateProfile'));
      } finally {
        setIsAvatarSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <MagicCard isLiquidEnhanced>
      <div className="mq-magic-card-content bg-mq-card-background border border-mq-border overflow-hidden">
        {/* Gradient Banner */}
        <div
          className="h-28 sm:h-36 relative"
          style={{
            background: `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, #c62040 40%, #e8304a 70%, ${BRAND_COLORS.accent}40 100%)`,
          }}
        >
          {/* Decorative pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 80%, white 1px, transparent 1px),
                radial-gradient(circle at 80% 20%, white 1px, transparent 1px),
                radial-gradient(circle at 50% 50%, white 0.5px, transparent 0.5px)`,
              backgroundSize: '60px 60px, 80px 80px, 40px 40px',
            }}
          />
          {/* Bottom fade to card background */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--c-card-background)] to-transparent" />
        </div>

        {/* Profile content overlapping the banner */}
        <div className="px-4 sm:px-6 pb-5 -mt-12 sm:-mt-14 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            {/* Avatar Section */}
            <div className="relative group shrink-0">
              <label className="cursor-pointer block">
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center overflow-hidden shadow-lg ring-4 ring-mq-card-background"
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
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Camera className="w-6 h-6 text-white" />
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
            <div className="flex-1 min-w-0 text-center sm:text-left pb-0.5">
              <h1 className="text-xl sm:text-2xl font-bold text-mq-content mb-1.5 break-words">
                {profile.name || t('user')}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                <p className="text-mq-content-secondary flex items-center justify-center sm:justify-start gap-1.5 text-sm min-w-0">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-mq-content-tertiary" />
                  <span className="break-all">{profile.email}</span>
                </p>
                {profile.studentId && (
                  <p className="text-mq-content-tertiary text-sm flex items-center justify-center sm:justify-start gap-1.5 min-w-0">
                    <IdCard className="h-3.5 w-3.5 shrink-0" />
                    <span className="break-all">
                      {t('idPrefix')}
                      {profile.studentId}
                    </span>
                  </p>
                )}
              </div>
              {profile.avatar?.startsWith('data:') && (
                <p className="mt-2 text-xs text-mq-warning">{t('avatarLocalOnlyWarning')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </MagicCard>
  );
}

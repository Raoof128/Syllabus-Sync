// components/ProfileCard.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/mq/card';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';
import { User, Mail, Calendar, Settings, Edit, Trash2, Check, Camera } from 'lucide-react';
import { UserProfile } from '@/lib/store/profilesStore';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { LiquidGlassCard, SubCard } from '@/components/ui/LiquidGlassCard';

interface ProfileCardProps {
  profile: UserProfile;
  isCurrent: boolean;
  onEdit: (profile: UserProfile) => void;
  onDelete?: (id: string) => void;
  onSetCurrent: (id: string) => void;
  onUpdate: (id: string, updates: Partial<UserProfile>) => void;
}

const ProfileCard = React.memo(
  ({ profile, isCurrent, onEdit, onDelete, onSetCurrent, onUpdate }: ProfileCardProps) => {
    const { t } = useTranslation();
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          onUpdate(profile.id, { avatar: result });
        };
        reader.readAsDataURL(file);
      }
    };

    const togglePreference = (key: keyof typeof profile.preferences) => {
      onUpdate(profile.id, {
        preferences: {
          ...profile.preferences,
          [key]: !profile.preferences[key],
        },
      });
    };

    return (
      <LiquidGlassCard liquidGlass className={cn(isCurrent && 'ring-2 ring-mq-primary')}>
        <Card
          className={cn(
            'relative transition-all duration-300 border-0 shadow-none bg-transparent',
            isCurrent ? 'bg-mq-primary/5' : '',
          )}
        >
          <CardHeader className="flex flex-col sm:flex-row items-start justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative group cursor-pointer">
                <label className="cursor-pointer">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-mq-primary flex items-center justify-center text-white font-bold text-mq-large overflow-hidden">
                    {profile.avatar ? (
                      <Image
                        src={profile.avatar}
                        alt={profile.name}
                        width={64}
                        height={64}
                        className="w-full h-full rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <User className="w-6 h-6 sm:w-8 sm:h-8" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    aria-label={t('changeAvatar')}
                  />
                </label>

                {isCurrent && (
                  <Badge className="absolute -top-1 -right-1 bg-mq-success text-white text-xs">
                    {t('current')}
                  </Badge>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base text-mq-content">
                  {profile.name}
                </h3>
                <p className="text-xs sm:text-sm text-mq-content-secondary">{profile.email}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-mq-content-tertiary">
                  <span>
                    {t('idPrefix')}
                    {profile.studentId}
                  </span>
                  <span>•</span>
                  <span>
                    {profile.course} • {profile.year}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-1 self-end sm:self-auto">
              {!isCurrent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(profile)}
                  className="h-8 w-8 p-0 text-mq-content-secondary hover:text-mq-primary"
                  aria-label={t('editProfileAria', { name: profile.name })}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSetCurrent(profile.id)}
                className="h-8 w-8 p-0 text-mq-content-secondary hover:text-mq-success"
                aria-label={t('useProfileAria', { name: profile.name })}
              >
                <Check className="w-4 h-4" />
              </Button>
              {!isCurrent && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirm(true)}
                  className="h-8 w-8 p-0 text-mq-error hover:text-mq-error/80"
                  aria-label={t('deleteProfileAria', { name: profile.name })}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-2">
              <SubCard className="flex items-center justify-between border border-mq-border">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-mq-content-tertiary" />
                  <span className="text-sm text-mq-content-secondary">
                    {t('emailNotifications')}
                  </span>
                </div>
                <button
                  role="switch"
                  aria-checked={profile.preferences.notifications}
                  onClick={() => togglePreference('notifications')}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-mq-primary focus:ring-offset-2',
                    profile.preferences.notifications
                      ? 'bg-mq-success'
                      : 'bg-mq-background-tertiary',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-mq-background transition-transform shadow-sm',
                      profile.preferences.notifications ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </button>
              </SubCard>
              <SubCard className="flex items-center justify-between border border-mq-border">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-mq-content-tertiary" />
                  <span className="text-sm text-mq-content-secondary">{t('emailReminders')}</span>
                </div>
                <button
                  role="switch"
                  aria-checked={profile.preferences.emailReminders}
                  onClick={() => togglePreference('emailReminders')}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-mq-primary focus:ring-offset-2',
                    profile.preferences.emailReminders
                      ? 'bg-mq-success'
                      : 'bg-mq-background-tertiary',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-mq-background transition-transform shadow-sm',
                      profile.preferences.emailReminders ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </button>
              </SubCard>
              <SubCard className="flex items-center justify-between border border-mq-border">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-mq-content-tertiary" />
                  <span className="text-sm text-mq-content-secondary">
                    {t('pushNotifications')}
                  </span>
                </div>
                <button
                  role="switch"
                  aria-checked={profile.preferences.pushNotifications}
                  onClick={() => togglePreference('pushNotifications')}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-mq-primary focus:ring-offset-2',
                    profile.preferences.pushNotifications
                      ? 'bg-mq-success'
                      : 'bg-mq-background-tertiary',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-mq-background transition-transform shadow-sm',
                      profile.preferences.pushNotifications ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </button>
              </SubCard>
            </div>
          </CardContent>

          <div className="px-4 pb-4">
            <label className="flex items-center justify-center gap-2 w-full p-2 text-sm font-medium text-mq-content-secondary bg-mq-card-background hover:bg-mq-hover-background rounded-mq border border-mq-border cursor-pointer transition-colors">
              <Camera className="h-4 w-4" />
              <span>{t('changeAvatar')}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                aria-label={t('changeAvatar')}
              />
            </label>
            {profile.avatar?.startsWith('data:') && (
              <p className="mt-2 text-xs text-mq-warning">{t('avatarLocalOnlyWarning')}</p>
            )}
          </div>

          {deleteConfirm && onDelete && (
            <div className="m-4 mt-0 p-4 bg-mq-error/10 border border-mq-error/20 rounded-mq">
              <p className="text-sm text-mq-error mb-3 font-medium">{t('deleteProfileConfirm')}</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(false)}>
                  {t('cancel')}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onDelete(profile.id);
                    setDeleteConfirm(false);
                  }}
                >
                  {t('deleteProfile')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </LiquidGlassCard>
    );
  },
);

ProfileCard.displayName = 'ProfileCard';

export default ProfileCard;

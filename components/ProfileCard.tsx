// components/ProfileCard.tsx
'use client';

/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, Settings, Edit, Trash2, Check, Camera } from 'lucide-react';
import { UserProfile } from '@/lib/store/profilesStore';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface ProfileCardProps {
  profile: UserProfile;
  isCurrent: boolean;
  onEdit: (profile: UserProfile) => void;
  onDelete: (id: string) => void;
  onSetCurrent: (id: string) => void;
}

const ProfileCard = React.memo(
  ({ profile, isCurrent, onEdit, onDelete, onSetCurrent }: ProfileCardProps) => {
    const { t } = useTranslation();
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAvatarUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    return (
      <Card
        className={cn(
          'relative transition-all duration-300',
          isCurrent
            ? 'ring-2 ring-mq-primary bg-mq-primary/5 shadow-mq-lg'
            : 'hover:shadow-mq-lg hover:-translate-y-1 hover:bg-mq-background-secondary',
        )}
      >
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-mq-primary flex items-center justify-center text-white font-bold text-mq-large">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profile.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8" />
                )}
              </div>
              {isCurrent && (
                <Badge className="absolute -top-1 -right-1 bg-mq-success text-white text-xs">
                  {t('current')}
                </Badge>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-mq-content">{profile.name}</h3>
              <p className="text-sm text-mq-content-secondary">{profile.email}</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-mq-content-tertiary">
                <span>{t('idPrefix')}{profile.studentId}</span>
                <span>•</span>
                <span>
                  {profile.course} • {profile.year}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-1">
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
            {!isCurrent && (
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-mq-content-tertiary" />
                <span className="text-sm text-mq-content-secondary">{t('emailNotifications')}</span>
              </div>
              <div
                className={cn(
                  'w-10 h-5 rounded-full transition-colors',
                  profile.preferences.notifications ? 'bg-mq-success' : 'bg-mq-background-tertiary',
                )}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-mq-content-tertiary" />
                <span className="text-sm text-mq-content-secondary">{t('emailReminders')}</span>
              </div>
              <div
                className={cn(
                  'w-10 h-5 rounded-full transition-colors',
                  profile.preferences.emailReminders ? 'bg-mq-success' : 'bg-mq-background-tertiary',
                )}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-mq-content-tertiary" />
                <span className="text-sm text-mq-content-secondary">{t('pushNotifications')}</span>
              </div>
              <div
                className={cn(
                  'w-10 h-5 rounded-full transition-colors',
                  profile.preferences.pushNotifications ? 'bg-mq-success' : 'bg-mq-background-tertiary',
                )}
              />
            </div>
          </div>
        </CardContent>

        <label className="flex items-center gap-2 px-3 py-2 border border-mq-border rounded-mq hover:bg-mq-hover-background cursor-pointer text-sm text-mq-content-secondary transition-colors m-4 mt-0">
          <Camera className="h-4 w-4" />
          <span>{t('changeAvatar')}</span>
          <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </label>

        {deleteConfirm && (
          <div className="m-4 mt-0 p-4 bg-mq-error/10 border border-mq-error/20 rounded-mq">
            <p className="text-sm text-mq-error mb-3 font-medium">
              {t('deleteProfileConfirm')}
            </p>
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
    );
  },
);

ProfileCard.displayName = 'ProfileCard';

export default ProfileCard;

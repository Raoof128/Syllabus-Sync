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

interface ProfileCardProps {
  profile: UserProfile;
  isCurrent: boolean;
  onEdit: (profile: UserProfile) => void;
  onDelete: (id: string) => void;
  onSetCurrent: (id: string) => void;
}

const ProfileCard = React.memo(
  ({ profile, isCurrent, onEdit, onDelete, onSetCurrent }: ProfileCardProps) => {
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
            ? 'ring-2 ring-blue-500 bg-blue-50 shadow-lg'
            : 'hover:shadow-lg hover:-translate-y-1',
        )}
      >
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-mq-charcoal-900 flex items-center justify-center text-white font-bold text-mq-large">
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
                <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs">
                  Current
                </Badge>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-mq-content">{profile.name}</h3>
              <p className="text-sm text-mq-content-secondary">{profile.email}</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-mq-content-tertiary">
                <span>ID: {profile.studentId}</span>
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
                className="h-8 w-8 p-0"
                aria-label={`Edit ${profile.name}`}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSetCurrent(profile.id)}
              className="h-8 w-8 p-0"
              aria-label={`Use ${profile.name}`}
            >
              <Check className="w-4 h-4" />
            </Button>
            {!isCurrent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirm(true)}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                aria-label={`Delete ${profile.name}`}
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
                <span className="text-sm text-mq-content-secondary">Email Notifications</span>
              </div>
              <div
                className={cn(
                  'w-10 h-5 rounded-full transition-colors',
                  profile.preferences.notifications ? 'bg-green-500' : 'bg-mq-background-tertiary',
                )}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-mq-content-tertiary" />
                <span className="text-sm text-mq-content-secondary">Email Reminders</span>
              </div>
              <div
                className={cn(
                  'w-10 h-5 rounded-full transition-colors',
                  profile.preferences.emailReminders ? 'bg-green-500' : 'bg-mq-background-tertiary',
                )}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-mq-content-tertiary" />
                <span className="text-sm text-mq-content-secondary">Push Notifications</span>
              </div>
              <div
                className={cn(
                  'w-10 h-5 rounded-full transition-colors',
                  profile.preferences.pushNotifications ? 'bg-green-500' : 'bg-mq-background-tertiary',
                )}
              />
            </div>
          </div>
        </CardContent>

        <label className="flex items-center gap-2 px-3 py-2 border border-mq-border rounded-lg hover:bg-mq-hover-background cursor-pointer text-sm">
          <Camera className="h-4 w-4" />
          <span>Change Avatar</span>
          <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </label>

        {deleteConfirm && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-900 mb-3">
              Are you sure you want to delete this profile? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(profile.id);
                  setDeleteConfirm(false);
                }}
              >
                Delete Profile
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

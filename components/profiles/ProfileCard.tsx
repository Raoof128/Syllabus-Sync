// components/profiles/ProfileCard.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  User,
  Mail,
  Calendar,
  Settings,
  Edit,
  Trash2,
  Check,
  Camera
} from 'lucide-react';
import { UserProfile } from '@/lib/store/profilesStore';
import { cn } from '@/lib/utils';

interface ProfileCardProps {
  profile: UserProfile;
  isCurrent: boolean;
  onEdit: (profile: UserProfile) => void;
  onDelete: (id: string) => void;
  onSetCurrent: (id: string) => void;
}

export default function ProfileCard({
  profile,
  isCurrent,
  onEdit,
  onDelete,
  onSetCurrent
}: ProfileCardProps) {
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
    <Card className={cn(
      'relative transition-all duration-200',
      isCurrent ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
    )}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={profile.name}
                  width={64}
                  height={64}
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

          {/* Profile Info */}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{profile.name}</h3>
            <p className="text-sm text-gray-600">{profile.email}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
              <span>ID: {profile.studentId}</span>
              <span>•</span>
              <span>{profile.course} • {profile.year}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(profile)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>

          {!isCurrent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirm(true)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Preferences */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Email Notifications</span>
            </div>
            <div className={cn(
              'w-10 h-5 rounded-full transition-colors',
              profile.preferences.notifications
                ? 'bg-green-500'
                : 'bg-gray-300'
            )} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Email Reminders</span>
            </div>
            <div className={cn(
              'w-10 h-5 rounded-full transition-colors',
              profile.preferences.emailReminders
                ? 'bg-green-500'
                : 'bg-gray-300'
            )} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Push Notifications</span>
            </div>
            <div className={cn(
              'w-10 h-5 rounded-full transition-colors',
              profile.preferences.pushNotifications
                ? 'bg-green-500'
                : 'bg-gray-300'
            )} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {!isCurrent && (
            <Button
              onClick={() => onSetCurrent(profile.id)}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              Use This Profile
            </Button>
          )}

          {/* Avatar Upload */}
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer text-sm">
            <Camera className="h-4 w-4" />
            <span>Change Avatar</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-900 mb-3">
              Are you sure you want to delete this profile? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(false)}
              >
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
      </CardContent>
    </Card>
  );
}

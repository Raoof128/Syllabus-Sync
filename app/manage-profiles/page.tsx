'use client';

import { useState } from 'react';
import { User, Plus, Users, Check, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/mq/card';
import { Button } from '@/components/ui/mq/button';
import { useProfilesStore } from '@/lib/store/profilesStore';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import ProfileCard for better code splitting
const ProfileCard = dynamic(() => import('@/components/ProfileCard'), {
  loading: () => <div className="flex items-center justify-center p-4">Loading profile...</div>,
});
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/mq/input';
import { Label } from '@/components/ui/label';
import { UserProfile } from '@/lib/store/profilesStore';
import { toastUtils } from '@/lib/utils/toast';

export default function ManageProfilesPage() {
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

  const currentProfile = profiles.find((profile) => profile.id === currentProfileId);

  const handleAddProfile = () => {
    if (formData.name && formData.email && formData.studentId) {
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
      toastUtils.success('Profile Created', 'Your new profile has been created successfully.');
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

  const handleUpdateProfile = () => {
    if (editingProfile && formData.name && formData.email) {
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
      toastUtils.success('Profile Updated', 'Your profile has been updated successfully.');
    }
  };

  const handleDeleteProfile = (id: string) => {
    deleteProfile(id);
    toastUtils.success('Profile Deleted', 'The profile has been deleted successfully.');
  };

  const handleSetCurrentProfile = (id: string) => {
    setCurrentProfile(id);
    toastUtils.success('Profile Switched', 'Your current profile has been changed.');
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
              Manage Profiles
            </h1>
            <p className="text-gray-900 dark:text-slate-100">Edit and manage your user profiles.</p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)} aria-label="Create new profile">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Profile
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="flex items-center justify-between text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" aria-hidden="true" />
                  All Profiles ({profiles.length})
                </div>
              </h2>
            </CardHeader>
            <CardContent>
              {profiles.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
                    No Profiles Yet
                  </h3>
                  <p className="text-gray-600 dark:text-slate-400 mb-4">
                    Create your first profile to get started.
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Profile
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profiles.map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      isCurrent={profile.id === currentProfileId}
                      onEdit={handleEditProfile}
                      onDelete={handleDeleteProfile}
                      onSetCurrent={handleSetCurrentProfile}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Check className="h-5 w-5" aria-hidden="true" />
              Current Profile
            </h2>
          </CardHeader>
          <CardContent>
            {currentProfile ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xl">
                    {currentProfile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{currentProfile.name}</h3>
                    <p className="text-gray-600 dark:text-slate-400">{currentProfile.email}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-500">
                      {currentProfile.course} • {currentProfile.year}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-slate-500">Student ID:</span>
                    <p className="font-medium">{currentProfile.studentId}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-slate-500">Member Since:</span>
                    <p className="font-medium">
                      {new Date(currentProfile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
                  No Profile Selected
                </h3>
                <p className="text-gray-600 dark:text-slate-400 mb-4">
                  Select or create a profile to get started.
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) setEditingProfile(null);
        }}
      >
        <DialogContent className="sm:max-w-md" aria-describedby="profile-form-description">
          <DialogHeader>
            <DialogTitle>{editingProfile ? 'Edit Profile' : 'Create New Profile'}</DialogTitle>
            <p id="profile-form-description" className="text-sm text-gray-600 dark:text-slate-400">
              {editingProfile
                ? 'Update your profile information.'
                : 'Fill in your details to create a new profile.'}
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
              <Label htmlFor="profile-name">Full Name</Label>
              <Input
                id="profile-name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                required
                aria-describedby="name-help"
              />
              <p id="name-help" className="sr-only">
                Enter your full legal name
              </p>
            </div>

            <div>
              <Label htmlFor="profile-email">Email Address</Label>
              <Input
                id="profile-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@mq.edu.au"
                required
                aria-describedby="email-help"
              />
              <p id="email-help" className="sr-only">
                Enter your university email address
              </p>
            </div>

            <div>
              <Label htmlFor="profile-student-id">Student ID</Label>
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
                Enter your 8-digit student ID number
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profile-course">Course</Label>
                <Input
                  id="profile-course"
                  name="course"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  placeholder="e.g., Bachelor of IT"
                  aria-describedby="course-help"
                />
                <p id="course-help" className="sr-only">
                  Enter your degree program name
                </p>
              </div>

              <div>
                <Label htmlFor="profile-year">Year</Label>
                <Input
                  id="profile-year"
                  name="year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="e.g., 2nd Year"
                  aria-describedby="year-help"
                />
                <p id="year-help" className="sr-only">
                  Enter your current year of study
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
                Cancel
              </Button>
              <Button type="submit">{editingProfile ? 'Update Profile' : 'Create Profile'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

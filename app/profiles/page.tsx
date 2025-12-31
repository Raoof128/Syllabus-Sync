// app/profiles/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users,
  Plus,
  User,
  Mail,
  BookOpen,
  Calendar,
  Check,
  Settings
} from 'lucide-react';
import { useProfilesStore } from '@/lib/store/profilesStore';
import { UserProfile } from '@/lib/store/profilesStore';
import ProfileCard from '@/components/profiles/ProfileCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ProfilesPage() {
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

      // Reset form
      setFormData({
        name: '',
        email: '',
        studentId: '',
        course: '',
        year: '',
      });
      setShowAddDialog(false);
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
    }
  };

  const handleDeleteProfile = (id: string) => {
    deleteProfile(id);
  };

  const handleSetCurrentProfile = (id: string) => {
    setCurrentProfile(id);
  };


  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profiles</h1>
        <p className="text-gray-600">
          Manage user profiles and application settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Current Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                      {currentProfile.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{currentProfile.name}</h3>
                      <p className="text-gray-600">{currentProfile.email}</p>
                      <p className="text-sm text-gray-500">
                        {currentProfile.course} • {currentProfile.year}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Student ID:</span>
                      <p className="font-medium">{currentProfile.studentId}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Member Since:</span>
                      <p className="font-medium">
                        {new Date(currentProfile.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Profile Selected</h3>
                  <p className="text-gray-600 mb-4">
                    Create or select a profile to get started.
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Profiles */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Profiles ({profiles.length})
              </CardTitle>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Profile
              </Button>
            </CardHeader>
            <CardContent>
              {profiles.length > 0 ? (
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
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Profiles Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first profile to personalize your experience.
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

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Profile Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Total Profiles</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{profiles.length}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Active Profile</span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {currentProfile ? currentProfile.name : 'None'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">Current Theme</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Export Profile Data
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Advanced Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Profile Dialog */}
      <Dialog open={showAddDialog || !!editingProfile} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) setEditingProfile(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProfile ? 'Edit Profile' : 'Create New Profile'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@mq.edu.au"
              />
            </div>

            <div>
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder="12345678"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="course">Course</Label>
                <Input
                  id="course"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  placeholder="e.g., Bachelor of IT"
                />
              </div>

              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="e.g., 2nd Year"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setShowAddDialog(false);
                setEditingProfile(null);
              }}>
                Cancel
              </Button>
              <Button onClick={editingProfile ? handleUpdateProfile : handleAddProfile}>
                {editingProfile ? 'Update Profile' : 'Create Profile'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


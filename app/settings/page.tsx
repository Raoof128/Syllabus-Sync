'use client';

import { useState } from 'react';
import {
  User,
  Bell,
  Palette,
  Shield,
  Info,
  Mail,
  Calendar,
  Plus,
  Users,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useProfilesStore } from '@/lib/store/profilesStore';
import dynamic from 'next/dynamic';

// Dynamically import ProfileCard for better code splitting
const ProfileCard = dynamic(() => import('@/components/ProfileCard'), {
  loading: () => <div className="flex items-center justify-center p-4">Loading profile...</div>,
});
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserProfile } from '@/lib/store/profilesStore';
import { toastUtils } from '@/lib/utils/toast';

export default function SettingsPage() {
  const [clearing, setClearing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    course: '',
    year: '',
  });

  const units = useUnitsStore((state) => state.units);
  const removeUnit = useUnitsStore((state) => state.removeUnit);
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const removeDeadline = useDeadlinesStore((state) => state.removeDeadline);

  const {
    profiles,
    currentProfileId,
    addProfile,
    updateProfile,
    deleteProfile,
    setCurrentProfile,
  } = useProfilesStore();

  const currentProfile = profiles.find((profile) => profile.id === currentProfileId);

  const handleClearAllData = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAllData = () => {
    setClearing(true);
    units.forEach((unit) => removeUnit(unit.id));
    deadlines.forEach((deadline) => removeDeadline(deadline.id));
    localStorage.removeItem('units-storage');
    localStorage.removeItem('deadlines-storage');
    localStorage.removeItem('notifications-storage');
    localStorage.removeItem('seed-disabled');
    localStorage.removeItem('units-seeded');
    localStorage.removeItem('deadlines-seeded');
    localStorage.setItem('seed-disabled', 'true');
    setClearing(false);
    setShowClearConfirm(false);
    toastUtils.success(
      'Data Cleared',
      'All units, deadlines, and data have been cleared successfully.',
    );
  };

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
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your preferences and account settings.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="flex items-center justify-between text-lg font-semibold">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" aria-hidden="true" />
                Profiles ({profiles.length})
              </div>
              <Button size="sm" onClick={() => setShowAddDialog(true)} aria-label="Add new profile">
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Add Profile
              </Button>
            </h2>
          </CardHeader>
          <CardContent>
            {profiles.length === 0 ? (
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
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
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

                <div className="grid grid-cols-1 gap-3 text-sm">
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
                <p className="text-gray-600 mb-4">Select or create a profile to get started.</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">Deadline Reminders</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Get notified before assignments are due
                  </p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Coming Soon</Badge>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">Class Reminders</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Reminder 15 minutes before each class
                  </p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Coming Soon</Badge>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">Event Updates</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Updates about campus events</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Coming Soon</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Dark Mode</h4>
                  <p className="text-sm text-gray-600">Switch to dark theme</p>
                </div>
                <div className="w-10 h-5 bg-gray-200 rounded-full opacity-50" />
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Language</h4>
                  <p className="text-sm text-gray-600">Choose your preferred language</p>
                </div>
                <div className="w-10 h-5 bg-gray-200 rounded-full opacity-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Data Storage</h4>
                  <p className="text-sm text-gray-600">Currently using local storage</p>
                </div>
                <div className="w-10 h-5 bg-green-500 rounded-full opacity-50" />
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Export Data</h4>
                  <p className="text-sm text-gray-600">Download all your data as JSON</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Coming Soon</Badge>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Clear All Data</h4>
                  <p className="text-sm text-gray-600">Delete all stored data from app</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAllData}
                  disabled={clearing}
                >
                  {clearing ? 'Clearing...' : 'Clear'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => (window.location.href = '/home')}
            >
              Home
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => (window.location.href = '/calendar')}
            >
              Calendar
            </Button>
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
            <p id="profile-form-description" className="text-sm text-gray-600">
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
                variant="outline"
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

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clear All Data</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all data? This action cannot be undone and will remove
              all units, deadlines, and profiles.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmClearAllData} disabled={clearing}>
              {clearing ? 'Clearing...' : 'Clear All Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

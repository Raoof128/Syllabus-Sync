// app/settings/page.tsx
"use client";

import {
    Settings,
    User,
    Bell,
    Palette,
    Shield,
    Database,
    Clock,
    Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
    return (
        <div className="container mx-auto p-6 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Settings
                </h1>
                <p className="text-gray-600">
                    Manage your preferences and account settings.
                </p>
            </div>

            {/* Development Notice */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="text-sm text-blue-900">
                        <strong>Coming soon:</strong> Full settings functionality will be available with the database integration in Week 3-4.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Settings - 2 columns */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Student Name</h4>
                                        <p className="text-sm text-gray-600 mt-1">Your display name across the app</p>
                                    </div>
                                    <Badge className="bg-yellow-100 text-yellow-800">Coming Soon</Badge>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Student ID</h4>
                                        <p className="text-sm text-gray-600 mt-1">Your Macquarie University ID</p>
                                    </div>
                                    <Badge className="bg-yellow-100 text-yellow-800">Coming Soon</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notifications */}
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
                                        <h4 className="font-semibold text-gray-900">Deadline Reminders</h4>
                                        <p className="text-sm text-gray-600 mt-1">Get notified before assignments are due</p>
                                    </div>
                                    <div className="w-10 h-5 bg-gray-200 rounded-full opacity-50"></div>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Class Reminders</h4>
                                        <p className="text-sm text-gray-600 mt-1">Reminder 15 minutes before each class</p>
                                    </div>
                                    <div className="w-10 h-5 bg-gray-200 rounded-full opacity-50"></div>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Event Updates</h4>
                                        <p className="text-sm text-gray-600 mt-1">Updates about campus events</p>
                                    </div>
                                    <div className="w-10 h-5 bg-gray-200 rounded-full opacity-50"></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Appearance */}
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
                                        <p className="text-sm text-gray-600 mt-1">Switch to dark theme</p>
                                    </div>
                                    <div className="w-10 h-5 bg-gray-200 rounded-full opacity-50"></div>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Language</h4>
                                        <p className="text-sm text-gray-600 mt-1">Choose your preferred language</p>
                                    </div>
                                    <span className="text-sm text-gray-500">English</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Privacy & Security */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Privacy & Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Data Storage</h4>
                                        <p className="text-sm text-gray-600 mt-1">Currently using local storage</p>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800">Local</Badge>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Export Data</h4>
                                        <p className="text-sm text-gray-600 mt-1">Download all your data as JSON</p>
                                    </div>
                                    <Badge className="bg-yellow-100 text-yellow-800">Coming Soon</Badge>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Clear All Data</h4>
                                        <p className="text-sm text-gray-600 mt-1">Delete all stored data from the app</p>
                                    </div>
                                    <Badge className="bg-yellow-100 text-yellow-800">Coming Soon</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - 1 column */}
                <div className="space-y-6">
                    {/* Data Sync */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                Data Sync
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-gray-900">Local Storage Active</span>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p>• Units: Saved locally</p>
                                    <p>• Deadlines: Saved locally</p>
                                    <p>• Events: Sample data</p>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Clock className="h-4 w-4" />
                                    <span>Cloud sync coming soon</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Settings Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Development
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-900">In Progress</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Full settings functionality will be available with database integration.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* About */}
                    <Card>
                        <CardHeader>
                            <CardTitle>About</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Version</span>
                                    <span className="font-mono text-gray-900">0.1.0</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Phase</span>
                                    <span className="text-gray-900">Development</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Last Update</span>
                                    <span className="text-gray-900">Dec 27, 2025</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

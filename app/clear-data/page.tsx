'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/mq/card';
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react';

export default function ClearDataPage() {
  const [isCleared, setIsCleared] = useState(false);
  const router = useRouter();

  const clearAllData = () => {
    if (typeof window !== 'undefined') {
      // Clear all localStorage
      localStorage.clear();

      // Also clear sessionStorage
      sessionStorage.clear();

      setIsCleared(true);

      // Reload after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl mt-20">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-mq-warning" />
            <div>
              <CardTitle>Clear All Data</CardTitle>
              <CardDescription>
                This will remove all stored data including units, deadlines, events, and notifications
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isCleared ? (
            <>
              <div className="p-4 bg-mq-warning/10 border border-mq-warning/20 rounded-lg">
                <p className="text-sm text-mq-content">
                  <strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted from this browser.
                </p>
              </div>

              <div className="space-y-2 text-sm text-mq-content-secondary">
                <p>The following will be cleared:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>All units and their schedules</li>
                  <li>All deadlines and tasks</li>
                  <li>All notifications</li>
                  <li>User preferences and settings</li>
                  <li>Profile information</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={clearAllData}
                  variant="primary"
                  className="flex-1 bg-mq-error hover:bg-mq-error/90"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 space-y-4">
              <RefreshCw className="h-12 w-12 text-mq-success mx-auto animate-spin" />
              <div>
                <p className="text-lg font-semibold text-mq-success">Data Cleared Successfully!</p>
                <p className="text-sm text-mq-content-secondary mt-2">Redirecting to home page...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


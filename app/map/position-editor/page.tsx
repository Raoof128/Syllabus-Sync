'use client';

import dynamic from 'next/dynamic';

// Dynamically import the editor to avoid SSR issues with Leaflet
const PositionEditorClient = dynamic(() => import('./PositionEditorClient'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-red-600 border-t-transparent mx-auto" />
        <p className="text-gray-600 dark:text-gray-400">Loading Position Editor...</p>
      </div>
    </div>
  ),
});

export default function PositionEditorPage() {
  return <PositionEditorClient />;
}

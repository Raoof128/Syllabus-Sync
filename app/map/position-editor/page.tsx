'use client';

import dynamic from 'next/dynamic';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';

function PositionEditorLoading() {
  const { t } = useTypedTranslation();

  return (
    <div className="flex h-screen w-full items-center justify-center bg-mq-background">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-mq-primary border-t-transparent mx-auto" />
        <p className="text-mq-content-secondary">{t('loadingPositionEditor')}</p>
      </div>
    </div>
  );
}

// Dynamically import the editor to avoid SSR issues with Leaflet
const PositionEditorClient = dynamic(
  () => import('@/features/map/position-editor/PositionEditorClient'),
  {
    ssr: false,
    loading: () => <PositionEditorLoading />,
  },
);

export default function PositionEditorPage() {
  return <PositionEditorClient />;
}

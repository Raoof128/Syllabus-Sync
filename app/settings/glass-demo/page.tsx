'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function GlassDemoPage() {
  // Demo removed — route retained as a lightweight redirect back to Settings
  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <header className="mb-6">
        <h1 className="text-mq-2xl font-semibold text-mq-content">Liquid Glass demo</h1>
        <p className="text-mq-sm text-mq-content-secondary mt-2">This demo has been removed.</p>
      </header>
      <div>
        <Link href="/settings" className="text-mq-primary underline">Back to Settings</Link>
      </div>
    </div>
  );
}

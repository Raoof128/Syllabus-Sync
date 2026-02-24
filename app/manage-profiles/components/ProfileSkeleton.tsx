'use client';

import { Loader2 } from 'lucide-react';

export function ProfileSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl px-3 py-4 sm:p-6">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mq-primary" />
      </div>
    </div>
  );
}

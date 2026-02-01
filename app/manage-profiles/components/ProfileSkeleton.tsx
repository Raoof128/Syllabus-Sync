'use client';

import { Loader2 } from 'lucide-react';

export function ProfileSkeleton() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mq-primary" />
      </div>
    </div>
  );
}

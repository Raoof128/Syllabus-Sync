'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/mq/card';

function LoadingPlaceholder() {
  return (
    <div className="animate-pulse">
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader>
          <div className="h-6 w-32 bg-mq-background-tertiary rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-mq-background-tertiary rounded" />
            <div className="h-10 w-full bg-mq-background-tertiary rounded" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-24 bg-mq-background-tertiary rounded" />
            <div className="h-24 w-full bg-mq-background-tertiary rounded" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-16 bg-mq-background-tertiary rounded" />
              <div className="h-10 w-full bg-mq-background-tertiary rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-mq-background-tertiary rounded" />
              <div className="h-10 w-full bg-mq-background-tertiary rounded" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-4 w-20 bg-mq-background-tertiary rounded" />
            <div className="h-10 w-full bg-mq-background-tertiary rounded" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-20 bg-mq-background-tertiary rounded" />
            <div className="h-10 w-full bg-mq-background-tertiary rounded" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <div className="h-10 w-20 bg-mq-background-tertiary rounded" />
            <div className="h-10 w-20 bg-mq-background-tertiary rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoadingPlaceholder;

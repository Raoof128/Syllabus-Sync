// app/error.tsx
'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { errorHandler } from '@/lib/utils/errorHandling';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    errorHandler.logError(error, 'App Error Boundary', 'high');
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center">
        <AlertTriangle className="h-16 w-16 text-mq-error mx-auto mb-4" />
        <h1 className="text-mq-2xl font-bold text-mq-content mb-2">Something went wrong!</h1>
        <p className="text-mq-content-secondary mb-8 max-w-md">
          An unexpected error occurred. Please try again or return to the home page.
        </p>

        <div className="flex gap-4 justify-center">
          <Button onClick={reset} variant="secondary" className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Try Again
          </Button>
          <Button asChild>
            <Link href="/home" className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

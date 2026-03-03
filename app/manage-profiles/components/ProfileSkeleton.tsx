'use client';

export function ProfileSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-6 lg:py-8">
      {/* Back link skeleton */}
      <div className="mb-4 sm:mb-6">
        <div className="h-4 w-20 rounded bg-mq-border animate-pulse" />
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Profile Header Skeleton */}
        <div className="rounded-mq-lg border border-mq-border bg-mq-card-background overflow-hidden">
          {/* Banner */}
          <div className="h-28 sm:h-36 bg-gradient-to-br from-mq-primary/20 via-mq-primary/10 to-transparent animate-pulse" />
          {/* Avatar + Info */}
          <div className="px-4 sm:px-6 pb-5 -mt-10 sm:-mt-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-mq-border animate-pulse ring-4 ring-mq-card-background" />
              <div className="flex-1 space-y-2 text-center sm:text-left pb-1">
                <div className="h-6 w-40 rounded bg-mq-border animate-pulse mx-auto sm:mx-0" />
                <div className="h-4 w-56 rounded bg-mq-border/60 animate-pulse mx-auto sm:mx-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Personal Info Skeleton */}
        <div className="rounded-mq-lg border border-mq-border bg-mq-card-background p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-mq-border animate-pulse" />
            <div className="h-5 w-32 rounded bg-mq-border animate-pulse" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3.5 w-20 rounded bg-mq-border/60 animate-pulse" />
                <div className="h-10 w-full rounded-mq bg-mq-border/40 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Academic Info Skeleton */}
        <div className="rounded-mq-lg border border-mq-border bg-mq-card-background p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-mq-border animate-pulse" />
            <div className="h-5 w-36 rounded bg-mq-border animate-pulse" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3.5 w-16 rounded bg-mq-border/60 animate-pulse" />
                <div className="h-10 w-full rounded-mq bg-mq-border/40 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Notification Skeleton */}
        <div className="rounded-mq-lg border border-mq-border bg-mq-card-background p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-mq-border animate-pulse" />
            <div className="h-5 w-44 rounded bg-mq-border animate-pulse" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-mq border border-mq-border/50">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-mq-border/50 animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 w-28 rounded bg-mq-border animate-pulse" />
                  <div className="h-3 w-40 rounded bg-mq-border/40 animate-pulse" />
                </div>
              </div>
              <div className="h-6 w-11 rounded-full bg-mq-border/50 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

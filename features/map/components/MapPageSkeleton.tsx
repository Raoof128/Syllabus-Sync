"use client";

import { useTypedTranslation } from "@/lib/hooks/useTypedTranslation";

// Skeleton loader for map page - mimics map layout
export function MapPageSkeleton() {
  const { t } = useTypedTranslation();
  return (
    <div className="container mx-auto max-w-7xl animate-pulse px-3 py-4 sm:p-4">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="mb-2 h-10 w-40 rounded-mq bg-mq-background-secondary sm:w-48" />
        <div className="h-5 w-full max-w-72 rounded-mq bg-mq-background-secondary" />
      </div>

      {/* Search skeleton */}
      <div className="mb-4 space-y-4">
        <div className="h-10 bg-mq-background-secondary rounded-mq-lg border border-mq-border" />
        <div className="h-24 bg-mq-info/10 rounded-mq-lg border border-mq-info/20" />
      </div>

      {/* Map skeleton with fixed dimensions to prevent CLS */}
      <div className="bg-mq-card-background rounded-mq-lg border border-mq-border p-4 mb-6">
        <div className="h-8 bg-mq-background-secondary rounded-mq w-48 mb-4" />
        <div className="h-96 md:h-[clamp(420px,55vh,600px)] lg:h-[clamp(500px,60vh,720px)] max-h-[70vh] bg-mq-background-secondary rounded-mq-lg flex items-center justify-center">
          <div className="text-mq-content-tertiary">{t("loadingMap")}</div>
        </div>
      </div>

      {/* Building grid skeleton */}
      <div className="bg-mq-card-background rounded-mq-lg border border-mq-border p-4">
        <div className="h-8 bg-mq-background-secondary rounded-mq w-48 mb-4" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-20 bg-mq-background-secondary rounded-mq-lg"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// app/home/loading.tsx
import { Metadata } from 'next';

// Skeleton loader for home page - provides meaningful first paint
export default function HomeLoading() {
  return (
    <div className="container mx-auto p-6 max-w-7xl animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div
          className="h-10 bg-mq-background-secondary rounded-mq w-64 mb-2"
          style={{ color: 'var(--mq-content)' }}
        />
        <div
          className="h-5 bg-mq-background-secondary rounded-mq w-96"
          style={{ color: 'var(--mq-content)' }}
        />
      </div>

      {/* Widget grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 bg-mq-background-secondary rounded-mq-lg border border-mq-border"
          />
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="h-64 bg-mq-background-secondary rounded-mq-lg border border-mq-border" />
        </div>
        <div className="space-y-4">
          <div className="h-40 bg-mq-background-secondary rounded-mq-lg border border-mq-border" />
          <div className="h-40 bg-mq-background-secondary rounded-mq-lg border border-mq-border" />
        </div>
      </div>
    </div>
  );
}

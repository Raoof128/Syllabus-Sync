// app/home/loading.tsx

// Skeleton loader for home page - provides meaningful first paint
export default function HomeLoading() {
  return (
    <div
      role="status"
      aria-label="Loading dashboard"
      aria-busy="true"
      className="container mx-auto p-6 max-w-7xl animate-pulse"
    >
      {/* Header skeleton (Greeting + Right side action) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="space-y-2">
          <div className="h-8 bg-mq-background-secondary rounded-mq w-48" />
          <div className="h-4 bg-mq-background-secondary rounded-mq w-64" />
        </div>
        <div className="h-10 w-32 bg-mq-background-secondary rounded-mq" />
      </div>

      {/* KPI Strip skeleton (3 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-mq-background-secondary rounded-mq-xl border border-mq-border"
          />
        ))}
      </div>

      {/* Week Heat Strip skeleton */}
      <div className="h-40 bg-mq-background-secondary rounded-mq-xl border border-mq-border mb-6" />

      {/* Main Dashboard Grid skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="h-96 bg-mq-background-secondary rounded-mq-xl border border-mq-border" />
        <div className="h-96 bg-mq-background-secondary rounded-mq-xl border border-mq-border" />
      </div>
    </div>
  );
}

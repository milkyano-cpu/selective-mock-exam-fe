export default function DashboardLoading() {
  return (
    <div className="w-full animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 w-32 rounded-lg bg-slate-200/70 dark:bg-slate-800" />
          <div className="mt-2 h-8 w-64 rounded-lg bg-slate-200/70 dark:bg-slate-800" />
        </div>
        <div className="h-10 w-28 rounded-xl bg-slate-200/70 dark:bg-slate-800" />
      </div>

      {/* Content skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-36 rounded-2xl border border-slate-200/60 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40"
          />
        ))}
      </div>

      <div className="h-64 rounded-2xl border border-slate-200/60 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40" />
    </div>
  );
}

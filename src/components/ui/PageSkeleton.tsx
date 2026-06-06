export function PageSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3.5 w-24 rounded-lg bg-slate-200/70 dark:bg-slate-800" />
          <div className="h-7 w-56 rounded-lg bg-slate-200/70 dark:bg-slate-800" />
        </div>
        <div className="h-9 w-24 rounded-xl bg-slate-200/70 dark:bg-slate-800" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-slate-200/60 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40"
          />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl border border-slate-200/60 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40"
          />
        ))}
      </div>
    </div>
  );
}

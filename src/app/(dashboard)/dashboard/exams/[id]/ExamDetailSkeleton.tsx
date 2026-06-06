type ExamDetailSkeletonProps = {
  variant: 'staff' | 'student';
};

const pulse = 'animate-pulse bg-slate-100 dark:bg-slate-800';

function Line({ className }: { className: string }) {
  return <div className={`${pulse} rounded-lg ${className}`} />;
}

function StaffSkeleton() {
  return (
    <div className="min-w-0 flex flex-col gap-5 overflow-x-hidden lg:flex-row lg:items-start">
      <div className="flex flex-col gap-4 lg:w-64 lg:shrink-0">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">
              <div className={`${pulse} h-9 w-9 shrink-0 rounded-xl`} />
              <div className="flex-1 space-y-2">
                <Line className="h-2.5 w-16" />
                <Line className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <Line className="h-3 w-20" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between gap-3">
                  <Line className="h-3 w-14" />
                  <Line className="h-3 w-6" />
                </div>
                <Line className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <Line className="h-7 w-16" />
            <Line className="h-7 w-16" />
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-5">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Line className="h-4 w-32" />
              <Line className="h-3 w-72 max-w-full" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Line key={index} className="h-7 w-16" />
              ))}
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="grid grid-cols-[1.4fr_1fr_1fr_0.7fr_0.8fr] gap-4 px-4 py-4">
                <Line className="h-4 w-4/5" />
                <Line className="h-4 w-3/4" />
                <Line className="h-4 w-2/3" />
                <Line className="h-4 w-12" />
                <Line className="h-4 w-14" />
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <Line className="h-4 w-28" />
            <Line className="h-9 w-28" />
          </div>
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row">
            <Line className="h-9 flex-1" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Line key={index} className="h-7 w-14" />
              ))}
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3 px-4 py-3.5">
                <div className={`${pulse} h-6 w-6 shrink-0 rounded-full`} />
                <div className="flex-1 space-y-2">
                  <Line className="h-4 w-4/5" />
                  <div className="flex gap-2">
                    <Line className="h-5 w-20" />
                    <Line className="h-5 w-16" />
                    <Line className="h-5 w-14" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StudentSkeleton() {
  return (
    <div className="min-w-0 flex-1">
      <section className="w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-6 dark:border-slate-800 dark:bg-slate-950/40 sm:px-8 sm:py-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <Line className="h-7 w-28 rounded-full" />
              <Line className="h-8 w-72 max-w-full" />
              <Line className="h-3 w-32" />
              <div className="space-y-2">
                <Line className="h-4 w-full max-w-xl" />
                <Line className="h-4 w-4/5 max-w-lg" />
              </div>
            </div>
            <div className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 lg:w-40">
              <Line className="h-3 w-24" />
              <Line className="mt-3 h-4 w-20" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 sm:px-8 sm:py-8 xl:grid-cols-[minmax(0,1.35fr)_320px]">
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className={`${pulse} h-10 w-10 rounded-2xl`} />
                  <Line className="mt-4 h-3 w-16" />
                  <Line className="mt-3 h-5 w-24" />
                  <Line className="mt-2 h-3 w-28" />
                </div>
              ))}
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <div className="flex items-center gap-3">
                <div className={`${pulse} h-9 w-9 rounded-2xl`} />
                <div className="space-y-2">
                  <Line className="h-3 w-24" />
                  <Line className="h-4 w-44" />
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50">
                    <div className={`${pulse} h-7 w-7 shrink-0 rounded-full`} />
                    <Line className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className={`${pulse} h-9 w-9 rounded-2xl`} />
                    <div className="space-y-2">
                      <Line className="h-3 w-20" />
                      <Line className="h-4 w-36" />
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    <Line className="h-12 w-full" />
                    <Line className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className={`${pulse} h-9 w-9 rounded-2xl`} />
              <div className="space-y-2">
                <Line className="h-3 w-24" />
                <Line className="h-4 w-32" />
              </div>
            </div>
            <div className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex justify-between gap-3">
                  <Line className="h-4 w-24" />
                  <Line className="h-4 w-16" />
                </div>
              ))}
            </div>
            <Line className="mt-4 h-16 w-full rounded-2xl" />
            <Line className="mt-5 h-12 w-full rounded-2xl" />
          </div>
        </div>
      </section>
    </div>
  );
}

export function ExamDetailSkeleton({ variant }: ExamDetailSkeletonProps) {
  return (
    <div className="min-w-0 w-full space-y-5 overflow-x-hidden animate-pulse">
      <div className="h-10 w-24 rounded-xl bg-slate-100 dark:bg-slate-800" />
      {variant === 'student' ? <StudentSkeleton /> : <StaffSkeleton />}
    </div>
  );
}

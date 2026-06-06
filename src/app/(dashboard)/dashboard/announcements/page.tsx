'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  announcementService,
  type AnnouncementItem,
} from '@/features/announcements/services/announcement.service';
import { showApiErrorAlert, showClientErrorAlert } from '@/lib/errorAlert';
import { AccessDeniedScreen } from '@/components/feedback/AccessDeniedScreen';
import {
  Megaphone,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const PAGE_LIMIT = 20;

function formatDateTime(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AnnouncementsPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFeed = useCallback(async (pg: number) => {
    setIsLoading(true);
    try {
      const res = await announcementService.feed({ page: pg, limit: PAGE_LIMIT });
      if (res.success) {
        setItems(res.data);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      } else {
        setItems([]);
        showClientErrorAlert('Failed to load. Please refresh and try again.', 'Failed to load');
      }
    } catch (err: unknown) {
      setItems([]);
      showApiErrorAlert(err, user?.role, { context: 'load' });
    } finally {
      setIsLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    void fetchFeed(page);
  }, [page, fetchFeed]);

  if (!user || (user.role !== 'STUDENT' && user.role !== 'PARENT')) {
    return <AccessDeniedScreen />;
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      <header className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Announcements
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Latest updates from your tutors and admins.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-4 sm:px-6 py-5">
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                </div>
              </div>
            ))
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
              <Megaphone size={40} className="mb-3" />
              <p className="font-bold text-lg">No announcements yet</p>
              <p className="mt-1 text-sm">You will see school-wide updates here.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="px-4 sm:px-6 py-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    item.priority === 'URGENT'
                      ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                      : 'bg-[#0A9AE2]/10 text-[#0A9AE2]'
                  }`}>
                    <Megaphone size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{item.title}</h3>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        item.priority === 'URGENT'
                          ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {item.priority}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{item.message}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>By {item.authorName}</span>
                      <span>{formatDateTime(item.sentAt ?? item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{total} announcement{total !== 1 ? 's' : ''}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  notificationService,
  type NotificationItem,
} from '@/features/notifications/services/notification.service';
import { useNotificationStore } from '@/features/notifications/store/notification.store';
import {
  Bell, CheckCheck, ChevronLeft, ChevronRight, FileQuestion,
  Filter, MessageSquare, Map, ClipboardList,
} from 'lucide-react';
import { AccessDeniedScreen } from '@/components/feedback/AccessDeniedScreen';

const PAGE_LIMIT = 20;

function timeAgo(dateStr: string): string {
  const timestamp = new Date(dateStr).getTime();
  if (!Number.isFinite(timestamp)) return 'Just now';
  const diff = Date.now() - timestamp;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function NotificationsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const storeMarkAsRead = useNotificationStore((s) => s.markAsRead);
  const storeMarkAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const storeSetUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = useCallback(async (pg: number, unreadOnly: boolean) => {
    setIsLoading(true);
    try {
      const res = await notificationService.list({
        page: pg,
        limit: PAGE_LIMIT,
        unreadOnly: unreadOnly || undefined,
      });
      if (res.success) {
        setItems(res.data);
        setTotalPages(res.meta.totalPages);
        setTotal(res.meta.total);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications(page, filter === 'unread');
  }, [page, filter, fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    storeMarkAsRead(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    );
    try { await notificationService.markAsRead(id); } catch { /* silent */ }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await handleMarkAsRead(item.id);
    }
    const url = typeof item.data?.url === 'string'
      ? item.data.url
      : item.type === 'QUESTION_PENDING_APPROVAL'
        ? '/dashboard/questions?status=PENDING_APPROVAL'
        : item.type === 'FORUM_REPLY' && typeof item.data?.threadId === 'string'
          ? `/dashboard/forum/${item.data.threadId}`
          : item.type.startsWith('PATHWAY_')
            ? '/dashboard/pathways'
            : undefined;
    if (url) {
      router.push(url);
    }
  };

  const handleMarkAllAsRead = async () => {
    storeMarkAllAsRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() })));
    try { await notificationService.markAllAsRead(); } catch { /* silent */ }
    // Refresh count
    try {
      const res = await notificationService.unreadCount();
      storeSetUnreadCount(res.count);
    } catch { /* silent */ }
  };

  if (!user) {
    return <AccessDeniedScreen />;
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      <header className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          Notifications <span className="text-[#0A9AE2]">.</span>
        </h1>
        <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
          Stay updated with the latest activity.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 sm:px-6 py-4 gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <div className="flex gap-1">
              {(['all', 'unread'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setPage(1); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    filter === f
                      ? 'bg-[#0A9AE2] text-white'
                      : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  {f === 'all' ? 'All' : 'Unread'}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0A9AE2] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
          >
            <CheckCheck size={14} /> Mark all as read
          </button>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 sm:px-6 py-4">
                <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                </div>
              </div>
            ))
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
              <Bell size={40} className="mb-3" />
              <p className="font-bold text-lg">No notifications</p>
              <p className="text-sm mt-1">
                {filter === 'unread' ? "You're all caught up!" : "Nothing here yet."}
              </p>
            </div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => { void handleNotificationClick(n); }}
                className={`flex w-full items-start gap-4 px-4 sm:px-6 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                  !n.isRead ? 'bg-blue-50/40 dark:bg-blue-500/5' : ''
                }`}
              >
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  n.type === 'QUESTION_PENDING_APPROVAL'
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                    : n.type === 'FORUM_REPLY'
                      ? 'bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400'
                      : n.type === 'PATHWAY_OVERDUE'
                        ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                        : n.type.startsWith('PATHWAY_')
                          ? 'bg-[#0A9AE2]/10 text-[#0A9AE2]'
                          : n.type === 'PRACTICE_ASSIGNED'
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {n.type === 'QUESTION_PENDING_APPROVAL' ? <FileQuestion size={20} />
                    : n.type === 'FORUM_REPLY' ? <MessageSquare size={20} />
                    : n.type.startsWith('PATHWAY_') ? <Map size={20} />
                    : n.type === 'PRACTICE_ASSIGNED' ? <ClipboardList size={20} />
                    : <Bell size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${!n.isRead ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-600 dark:text-slate-400'}`}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#0A9AE2]"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">{timeAgo(n.createdAt)}</p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {total} notification{total !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

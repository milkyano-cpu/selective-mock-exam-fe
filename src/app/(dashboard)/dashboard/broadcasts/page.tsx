'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  announcementService,
  type AnnouncementItem,
  type AnnouncementPriority,
  type AnnouncementTarget,
} from '@/features/announcements/services/announcement.service';
import { DeleteConfirmModal } from '@/features/subjects/components/DeleteConfirmModal';
import { AccessDeniedScreen } from '@/components/feedback/AccessDeniedScreen';
import {
  Megaphone,
  Plus,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
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

export default function BroadcastsPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    priority: 'NORMAL' as AnnouncementPriority,
    target: ['STUDENT'] as AnnouncementTarget[],
    scheduledAt: '',
  });

  const fetchAnnouncements = useCallback(async (pg: number) => {
    setIsLoading(true);
    setListError(null);
    try {
      const res = await announcementService.list({ page: pg, limit: PAGE_LIMIT });
      if (res.success) {
        setItems(res.data);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      } else {
        setItems([]);
        setListError(res.message || 'Failed to load broadcasts');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setItems([]);
      setListError(msg || 'Failed to load broadcasts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAnnouncements(page);
  }, [page, fetchAnnouncements]);

  const targetLabel = useMemo(() => (targets: AnnouncementTarget[]) => {
    if (targets.length === 2) return 'Students + Parents';
    return targets[0] === 'PARENT' ? 'Parents' : 'Students';
  }, []);

  const toggleTarget = (value: AnnouncementTarget) => {
    setForm((prev) => ({
      ...prev,
      target: prev.target.includes(value)
        ? prev.target.filter((v) => v !== value)
        : [...prev.target, value],
    }));
  };

  const resetForm = () => {
    setForm({
      title: '',
      message: '',
      priority: 'NORMAL',
      target: ['STUDENT'],
      scheduledAt: '',
    });
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.target.length === 0) {
      setErrorMsg('Select at least one target audience');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await announcementService.create({
        title: form.title,
        message: form.message,
        priority: form.priority,
        target: form.target,
        ...(form.scheduledAt ? { scheduledAt: new Date(form.scheduledAt).toISOString() } : {}),
      });

      if (res.success) {
        setSuccessMsg(res.message);
        resetForm();
        setIsModalOpen(false);
        void fetchAnnouncements(page);
      } else {
        setErrorMsg(res.message || 'Failed to create broadcast');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorMsg(msg || 'Failed to create broadcast');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await announcementService.remove(deletingId);
      void fetchAnnouncements(page);
    } catch {
      // mdwClient interceptor fires the toast
    } finally {
      setDeletingId(null);
      setIsDeleting(false);
    }
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'TUTOR')) {
    return <AccessDeniedScreen />;
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1 sm:gap-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Broadcasts <span className="text-[#0A9AE2]">.</span>
          </h1>
          <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
            Send announcements to students, parents, or both.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0A9AE2] text-white text-sm font-bold rounded-xl shadow-sm shadow-blue-100 hover:bg-[#0864B6] transition-all dark:shadow-none"
        >
          <Plus size={16} /> New Broadcast
        </button>
      </header>

      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
          {successMsg}
        </div>
      )}

      {listError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {listError}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
                <th className="px-6 py-3.5 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3.5 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Target</th>
                <th className="px-6 py-3.5 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3.5 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Schedule / Sent</th>
                {user.role === 'ADMIN' && <th className="px-6 py-3.5 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: user.role === 'ADMIN' ? 6 : 5 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" style={{ width: j === 0 ? '70%' : '45%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={user.role === 'ADMIN' ? 6 : 5} className="px-6 py-16 text-center">
                    <Megaphone size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="font-bold text-slate-400 dark:text-slate-500">No broadcasts yet</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{item.message}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{targetLabel(item.target)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        item.priority === 'URGENT'
                          ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        item.status === 'SENT'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {item.status === 'SCHEDULED' ? formatDateTime(item.scheduledAt) : formatDateTime(item.sentAt)}
                    </td>
                    {user.role === 'ADMIN' && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setDeletingId(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{total} broadcast{total !== 1 ? 's' : ''}</p>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">New Broadcast</h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Send now or schedule for later.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {errorMsg && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">{errorMsg}</div>}

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-900 dark:text-slate-100">Title</label>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-[#0A9AE2] focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-900 dark:text-slate-100">Message</label>
                <textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} required rows={5} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-[#0A9AE2] focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-100">Priority</label>
                  <div className="flex gap-2">
                    {(['NORMAL', 'URGENT'] as const).map((priority) => (
                      <button key={priority} type="button" onClick={() => setForm((p) => ({ ...p, priority }))} className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${form.priority === priority ? 'bg-[#0A9AE2] text-white' : 'border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'}`}>
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-100">Schedule</label>
                  <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-[#0A9AE2] focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-900 dark:text-slate-100">Target Audience</label>
                <div className="flex gap-2">
                  {(['STUDENT', 'PARENT'] as const).map((target) => (
                    <button key={target} type="button" onClick={() => toggleTarget(target)} className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${form.target.includes(target) ? 'bg-[#0A9AE2] text-white' : 'border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'}`}>
                      {target === 'STUDENT' ? 'Students' : 'Parents'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] py-3 font-bold text-white hover:bg-[#0864B6] disabled:opacity-60">
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Megaphone size={16} /> {form.scheduledAt ? 'Schedule Broadcast' : 'Send Broadcast'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={onConfirmDelete}
        title="Delete Broadcast"
        message="Are you sure you want to delete this broadcast? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
}

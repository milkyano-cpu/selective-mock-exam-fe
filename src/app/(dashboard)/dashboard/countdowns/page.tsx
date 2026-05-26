'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { countdownService } from '@/features/countdowns/services/countdown.service';
import type { CountdownItem } from '@/features/countdowns/types/countdowns.types';
import { DeleteConfirmModal } from '@/features/subjects/components/DeleteConfirmModal';
import {
  Clock3,
  ShieldAlert,
  Plus,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2,
  CheckCircle2,
} from 'lucide-react';

const PAGE_LIMIT = 20;

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CountdownsPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<CountdownItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CountdownItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    targetAt: '',
  });

  const activeCountdownId = useMemo(
    () => items.find((item) => item.isActive && !item.isExpired)?.id ?? null,
    [items]
  );

  const fetchCountdowns = useCallback(async (pg: number) => {
    setIsLoading(true);
    setListError(null);

    try {
      const res = await countdownService.list({ page: pg, limit: PAGE_LIMIT });
      if (res.success) {
        setItems(res.data);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      } else {
        setItems([]);
        setListError(res.message || 'Failed to load countdowns');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setItems([]);
      setListError(msg || 'Failed to load countdowns');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchCountdowns(page);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [page, fetchCountdowns]);

  const resetForm = () => {
    setForm({ title: '', targetAt: '' });
    setEditingItem(null);
    setErrorMsg(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: CountdownItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      targetAt: toDateTimeLocal(item.targetAt),
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        title: form.title.trim(),
        targetAt: new Date(form.targetAt).toISOString(),
      };

      const res = editingItem
        ? await countdownService.update(editingItem.id, payload)
        : await countdownService.create(payload);

      if (res.success) {
        setSuccessMsg(res.message);
        setIsModalOpen(false);
        resetForm();
        void fetchCountdowns(page);
      } else {
        setErrorMsg(res.message || 'Failed to save countdown');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorMsg(msg || 'Failed to save countdown');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (id: string) => {
    if (activeCountdownId && activeCountdownId !== id) {
      setErrorMsg('Only one countdown can be active at a time. Delete or edit the current active countdown first.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await countdownService.activate(id);
      if (res.success) {
        setSuccessMsg(res.message);
        void fetchCountdowns(page);
      } else {
        setErrorMsg(res.message || 'Failed to activate countdown');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorMsg(msg || 'Failed to activate countdown');
    }
  };

  const handleDeactivate = async (id: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await countdownService.deactivate(id);
      if (res.success) {
        setSuccessMsg(res.message);
        void fetchCountdowns(page);
      } else {
        setErrorMsg(res.message || 'Failed to deactivate countdown');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorMsg(msg || 'Failed to deactivate countdown');
    }
  };

  const onConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await countdownService.remove(deletingId);
      if (res.success) {
        setSuccessMsg(res.message);
        setDeletingId(null);
        void fetchCountdowns(page);
      } else {
        setErrorMsg(res.message || 'Failed to delete countdown');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorMsg(msg || 'Failed to delete countdown');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Access Denied</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1 sm:gap-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Countdown <span className="text-[#0A9AE2]">.</span>
          </h1>
          <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
            Create multiple exam countdowns and choose the single active countdown shown to students.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-[#0A9AE2] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-100 transition-all hover:bg-[#0864B6] dark:shadow-none"
        >
          <Plus size={16} /> New Countdown
        </button>
      </header>

      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
          {successMsg}
        </div>
      )}

      {(listError || errorMsg) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {listError || errorMsg}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60">
                <th className="px-6 py-3.5 text-left text-xs font-black uppercase tracking-wider text-slate-500">Exam</th>
                <th className="px-6 py-3.5 text-left text-xs font-black uppercase tracking-wider text-slate-500">Target Time</th>
                <th className="px-6 py-3.5 text-left text-xs font-black uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-black uppercase tracking-wider text-slate-500">Updated</th>
                <th className="px-6 py-3.5 text-right text-xs font-black uppercase tracking-wider text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 5 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-6 py-4">
                        <div className="h-4 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" style={{ width: cellIndex === 0 ? '70%' : '45%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Clock3 size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="font-bold text-slate-400 dark:text-slate-500">No countdowns yet</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const hasAnotherActiveCountdown = Boolean(activeCountdownId && activeCountdownId !== item.id);
                  const isActivateDisabled = item.isExpired || hasAnotherActiveCountdown;
                  const statusText = item.isExpired
                    ? 'Expired'
                    : item.isActive
                      ? 'Active'
                      : 'Inactive';
                  const statusClassName = item.isExpired
                    ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                    : item.isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {item.isActive && !item.isExpired ? 'Shown on student Home' : 'Not shown to students'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{formatDateTime(item.targetAt)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusClassName}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{formatDateTime(item.updatedAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => item.isActive ? void handleDeactivate(item.id) : void handleActivate(item.id)}
                            disabled={isActivateDisabled}
                            title={
                              hasAnotherActiveCountdown
                                ? 'Only one countdown can be active at a time'
                                : item.isExpired
                                  ? 'Expired countdowns cannot be activated'
                                  : item.isActive
                                    ? 'Deactivate this countdown'
                                    : 'Activate countdown'
                            }
                            className={[
                              'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50',
                              item.isActive
                                ? 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10',
                            ].join(' ')}
                          >
                            <CheckCircle2 size={13} /> {item.isActive ? 'Inactive' : 'Activate'}
                          </button>
                          <button
                            onClick={() => setDeletingId(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{total} countdown{total !== 1 ? 's' : ''}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">{editingItem ? 'Edit Countdown' : 'New Countdown'}</h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Set exam title and target date-time.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {errorMsg && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-900 dark:text-slate-100">Exam Label</label>
                <input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-[#0A9AE2] focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  placeholder="Selective High School Mock Test"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-900 dark:text-slate-100">Target Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.targetAt}
                  onChange={(event) => setForm((prev) => ({ ...prev, targetAt: event.target.value }))}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-[#0A9AE2] focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] py-3 font-bold text-white hover:bg-[#0864B6] disabled:opacity-60"
                >
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Clock3 size={16} /> Save Countdown</>}
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
        title="Delete Countdown"
        message="Are you sure you want to delete this countdown? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
}

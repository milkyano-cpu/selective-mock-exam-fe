'use client';

import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import { X, Loader2, Map, Trash2 } from 'lucide-react';
import { pathwayPlansService } from '../services/pathway-plans.service';
import type { PathwayPlanDetail, PathwayPlanListItem } from '../types/pathway-plans.types';

interface EditPathwayPlanModalProps {
  isOpen: boolean;
  plan: PathwayPlanDetail | PathwayPlanListItem | null;
  onClose: () => void;
  onUpdated: (plan: PathwayPlanListItem) => void;
  onDelete: () => void;
}

// Convert an ISO datetime to the yyyy-MM-dd value a <input type="date"> expects.
function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function EditPathwayPlanModal({
  isOpen,
  plan,
  onClose,
  onUpdated,
  onDelete,
}: EditPathwayPlanModalProps) {
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && plan) {
      setName(plan.name);
      setDueDate(toDateInputValue(plan.dueDate));
      setError(null);
    }
  }, [isOpen, plan]);

  const handleSave = async () => {
    if (!plan) return;
    if (!name.trim()) {
      setError('Please enter a plan name');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const res = await pathwayPlansService.update(plan.id, {
        name: name.trim(),
        // Empty string clears the due date; otherwise send an ISO datetime.
        dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : null,
      });
      if (res.success) {
        onUpdated(res.data);
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.message ?? 'Failed to update plan'
          : 'Failed to update plan'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0A9AE2]/10">
              <Map size={20} className="text-[#0A9AE2]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Edit Plan</h2>
              <p className="text-xs text-slate-400">Rename or change the due date</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-6 pb-6">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
              Plan name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 transition-all focus:border-[#0A9AE2] focus:outline-none focus:ring-2 focus:ring-[#0A9AE2]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
              Due date <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 transition-all focus:border-[#0A9AE2] focus:outline-none focus:ring-2 focus:ring-[#0A9AE2]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500 dark:bg-red-900/20">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <Trash2 size={14} />
              Delete
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0659AA] disabled:opacity-60"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : null}
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

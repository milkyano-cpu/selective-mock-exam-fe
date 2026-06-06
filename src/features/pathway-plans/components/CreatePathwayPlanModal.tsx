'use client';

import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import { X, Loader2, Map } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { adminService } from '@/features/admin/services/admin.service';
import type { UserItem } from '@/features/admin/services/admin.service';
import { pathwayPlansService } from '../services/pathway-plans.service';
import type { PathwayPlanListItem } from '../types/pathway-plans.types';

interface CreatePathwayPlanModalProps {
  isOpen: boolean;
  /** Optional pre-selected student (e.g. when launched from a student context). */
  defaultStudentId?: string;
  onClose: () => void;
  onCreated: (plan: PathwayPlanListItem, intent: 'link' | 'done') => void;
}

export function CreatePathwayPlanModal({
  isOpen,
  defaultStudentId,
  onClose,
  onCreated,
}: CreatePathwayPlanModalProps) {
  const [students, setStudents] = useState<UserItem[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState(defaultStudentId ?? '');
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStudentsLoading(true);
    adminService
      .listUsers({ role: 'STUDENT', limit: 100 })
      .then((res) => {
        if (res.success) setStudents(res.data);
      })
      .catch(() => { /* mdwClient interceptor fires the toast */ })
      .finally(() => setStudentsLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setStudentId(defaultStudentId ?? '');
  }, [isOpen, defaultStudentId]);

  const reset = () => {
    setName('');
    setStudentId(defaultStudentId ?? '');
    setDueDate('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async (intent: 'link' | 'done') => {
    if (!name.trim()) {
      setError('Please enter a plan name');
      return;
    }
    if (!studentId) {
      setError('Please select a student');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const res = await pathwayPlansService.create({
        name: name.trim(),
        studentId,
        // date input gives YYYY-MM-DD; send an ISO datetime with offset.
        ...(dueDate ? { dueDate: new Date(`${dueDate}T00:00:00`).toISOString() } : {}),
      });
      if (res.success) {
        onCreated(res.data, intent);
        reset();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.message ?? 'Failed to create plan'
          : 'Failed to create plan'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0A9AE2]/10">
              <Map size={20} className="text-[#0A9AE2]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">New Plan</h2>
              <p className="text-xs text-slate-400">Create a learning plan for a student</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-6 pb-6">
          {/* Plan name */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
              Plan name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Semester 1 Prep"
              maxLength={120}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 transition-all focus:border-[#0A9AE2] focus:outline-none focus:ring-2 focus:ring-[#0A9AE2]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Student */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
              Student
            </label>
            {studentsLoading ? (
              <div className="flex items-center gap-2 py-2 text-sm text-slate-400">
                <Loader2 size={14} className="animate-spin" />
                Loading students…
              </div>
            ) : (
              <SearchableSelect
                value={studentId}
                onChange={setStudentId}
                placeholder="Select a student…"
                searchPlaceholder="Search by name…"
                emptyText="No students found."
                options={students.map((s) => ({
                  value: s.id,
                  label: s.fullName,
                  searchText: s.email,
                }))}
              />
            )}
          </div>

          {/* Due date (optional) */}
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

          {/* Actions: offer "Link Pathway Now" or "Done" */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => submit('done')}
              disabled={isSaving}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {isSaving ? 'Saving…' : 'Create & Done'}
            </button>
            <button
              type="button"
              onClick={() => submit('link')}
              disabled={isSaving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0659AA] disabled:opacity-60"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : null}
              Create & Add Pathway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

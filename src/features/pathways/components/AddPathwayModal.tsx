'use client';

import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import { X, Loader2, BookOpen } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { subjectsService } from '@/features/subjects/services/subjects.service';
import { pathwaysService } from '../services/pathways.service';
import type { Subject } from '@/features/subjects/types/subjects.types';
import type { PathwayDetail } from '../types/pathways.types';

interface AddPathwayModalProps {
  isOpen: boolean;
  studentId: string;
  onClose: () => void;
  onCreated: (pathway: PathwayDetail) => void;
}

export function AddPathwayModal({
  isOpen,
  studentId,
  onClose,
  onCreated,
}: AddPathwayModalProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [threshold, setThreshold] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsFetching(true);
    subjectsService
      .listSubjects({ limit: 100 })
      .then((res) => {
        if (res.success) setSubjects(res.data);
      })
      .finally(() => setIsFetching(false));
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedSubjectId) {
      setError('Please select a subject');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await pathwaysService.create({
        studentId,
        subjectId: selectedSubjectId,
        thresholdCorrect: threshold,
      });
      if (res.success) {
        onCreated(res.data);
        handleClose();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.message ?? 'Failed to create pathway'
          : 'Failed to create pathway'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedSubjectId('');
    setThreshold(3);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0A9AE2]/10 flex items-center justify-center">
              <BookOpen size={20} className="text-[#0A9AE2]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Add Pathway</h2>
              <p className="text-xs text-slate-400">Assign a subject to this student</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Subject selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject
            </label>
            {isFetching ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                <Loader2 size={14} className="animate-spin" />
                Loading subjects…
              </div>
            ) : (
              <SearchableSelect
                value={selectedSubjectId}
                onChange={setSelectedSubjectId}
                placeholder="Select subject…"
                searchPlaceholder="Search subject…"
                emptyText="No subjects found."
                options={subjects.map((s) => ({
                  value: s.id,
                  label: s.name,
                  searchText: s.description ?? '',
                }))}
              />
            )}
          </div>

          {/* Threshold input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Pass Threshold
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Minimum correct answers needed to unlock the next topic
            </p>
            <input
              type="number"
              min={1}
              max={20}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-[#0A9AE2] focus:outline-none focus:ring-2 focus:ring-[#0A9AE2]/20 transition-all"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || isFetching}
              className="flex-1 py-2.5 rounded-xl bg-[#0A9AE2] hover:bg-[#0659AA] text-white text-sm font-bold disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
              {isLoading ? 'Creating…' : 'Create Pathway'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

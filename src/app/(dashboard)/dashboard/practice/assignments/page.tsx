'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { isAxiosError } from 'axios';
import {
  ClipboardList,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Search,
  Loader2,
  AlertCircle,
  User,
  BookOpen,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { practiceService } from '@/features/practice/services/practice.service';
import type { AssignmentSummary, PracticeStatus } from '@/features/practice/types/practice.types';

const PAGE_LIMIT = 20;

const STATUS_OPTIONS: { value: PracticeStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ScoreChip({ score }: { score: number }) {
  const cls =
    score >= 70
      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      : score >= 50
      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
  return (
    <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${cls}`}>
      {Math.round(score)}%
    </span>
  );
}

export default function PracticeAssignmentsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<PracticeStatus | ''>('');
  const [searchName, setSearchName] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Guard: only TUTOR and ADMIN
  useEffect(() => {
    if (user && user.role !== 'TUTOR' && user.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await practiceService.listAssignments({
        page,
        limit: PAGE_LIMIT,
        status: statusFilter || undefined,
      });
      if (res.success) {
        // client-side name filter
        const filtered = searchName
          ? res.data.filter((a) =>
              a.studentName.toLowerCase().includes(searchName.toLowerCase())
            )
          : res.data;
        setAssignments(filtered);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      }
    } catch (err) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.message || 'Failed to load assignments'
          : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, searchName]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchName(searchInput.trim());
    setPage(1);
  };

  if (!user || (user.role !== 'TUTOR' && user.role !== 'ADMIN')) return null;

  return (
    <div className="w-full space-y-6">

        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Practice Assignments
            </h1>
            <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
              Curated practice sets assigned to students
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard/practice/assignments/new')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-100 transition-all hover:bg-[#0864B6] dark:shadow-none"
            >
              <Plus size={16} />
              New Assignment
            </button>
          </div>
        </header>

        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Assignments', value: total },
            {
              label: 'Completed',
              value: assignments.filter((a) => a.status === 'COMPLETED').length,
            },
            {
              label: 'In Progress',
              value: assignments.filter((a) => a.status === 'IN_PROGRESS').length,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-5 py-4"
            >
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by student name…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A9AE2]/30"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#0A9AE2] text-white text-sm font-bold hover:bg-[#0659AA] transition-colors"
            >
              Search
            </button>
          </form>

          {/* Status dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStatusDropdown((p) => !p)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-w-[148px]"
            >
              <span className="flex-1 text-left">
                {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'All statuses'}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            <AnimatePresence>
              {showStatusDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 overflow-hidden"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setStatusFilter(opt.value as PracticeStatus | '');
                        setPage(1);
                        setShowStatusDropdown(false);
                      }}
                      className={[
                        'w-full text-left px-4 py-2.5 text-sm font-medium transition-colors',
                        statusFilter === opt.value
                          ? 'bg-[#0A9AE2]/10 text-[#0A9AE2]'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800',
                      ].join(' ')}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-sm font-bold text-red-600 dark:text-red-400">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={32} className="animate-spin text-[#0A9AE2]" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
                <ClipboardList size={22} className="text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                No assignments found
              </p>
              <button
                type="button"
                onClick={() => router.push('/dashboard/practice/assignments/new')}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0A9AE2] hover:underline"
              >
                <Plus size={14} />
                Create your first assignment
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {assignments.map((a, idx) => (
                <motion.div
                  key={a.sessionId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {/* Status icon */}
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    {a.status === 'COMPLETED' ? (
                      <CheckCircle2 size={18} className="text-green-500" />
                    ) : (
                      <Clock size={18} className="text-amber-500" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-slate-400 flex-shrink-0" />
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                          {a.studentName}
                        </span>
                      </div>
                      {a.topicName && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <div className="flex items-center gap-1">
                            <BookOpen size={11} className="text-slate-400" />
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {a.topicName}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {a.subjectName && `${a.subjectName} · `}
                      {a.questionCount}Q · {formatDate(a.startedAt)}
                      {a.endedAt && ` → ${formatDate(a.endedAt)}`}
                    </p>
                  </div>

                  {/* Score / status chip */}
                  {a.status === 'COMPLETED' && a.scorePercent !== null ? (
                    <ScoreChip score={a.scorePercent} />
                  ) : (
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-2.5 py-1 rounded-lg flex-shrink-0">
                      In Progress
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
    </div>
  );
}

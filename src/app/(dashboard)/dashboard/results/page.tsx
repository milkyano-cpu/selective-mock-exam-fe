'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { AlertCircle, BarChart3, Clock, FileText, Loader2, Target, Trophy, Users } from 'lucide-react';
import { analyticsService } from '@/features/analytics/services/analytics.service';
import type { ExamHistoryItem, StudentAnalytics } from '@/features/analytics/types/analytics.types';
import { useAuthStore } from '@/features/auth/store/auth.store';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(seconds: number) {
  if (seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

function scoreClass(score: number | null) {
  if (score === null) return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300';
  if (score >= 75) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
  if (score >= 50) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
  return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
}

function StudentResultCard({ student }: { student: StudentAnalytics }) {
  const latestExam = student.examHistory[0] ?? null;
  const weakestTopic = student.topicPerformance[0] ?? null;
  const strongestTopic = [...student.topicPerformance].sort((a, b) => b.scoreAvg - a.scoreAvg)[0] ?? null;

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A9AE2] text-lg font-black text-white">
            {student.studentName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">{student.studentName}</h2>
            <p className="text-xs font-bold text-slate-400">{student.totalExams} completed exam{student.totalExams !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${scoreClass(student.overallAvg)}`}>
          {student.overallAvg !== null ? `${student.overallAvg.toFixed(0)} avg` : 'No score yet'}
        </span>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/50">
          <FileText size={18} className="text-[#0A9AE2]" />
          <p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100">{student.totalExams}</p>
          <p className="text-xs font-bold text-slate-400">Exams</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/50">
          <Clock size={18} className="text-emerald-500" />
          <p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100">{formatTime(student.totalTimeSeconds)}</p>
          <p className="text-xs font-bold text-slate-400">Study time</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/50">
          <Trophy size={18} className="text-amber-500" />
          <p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100">{student.rankingLevel ? student.rankingLevel.replaceAll('_', ' ') : '-'}</p>
          <p className="text-xs font-bold text-slate-400">Ranking band</p>
        </div>
      </div>

      <div className="grid gap-4 px-5 pb-5 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 size={15} className="text-[#FF6900]" />
            <p className="text-sm font-black text-slate-900 dark:text-slate-100">Recent exam results</p>
          </div>
          {student.examHistory.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm font-bold text-slate-400 dark:border-slate-800">No exam results yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {student.examHistory.slice(0, 5).map((exam: ExamHistoryItem) => (
                <div key={exam.sessionId} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{exam.examTitle}</p>
                      {exam.examType === 'ASSIGNMENT' && (
                        <span className="shrink-0 rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                          Assignment
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-400">{formatDate(exam.takenAt)} · {formatTime(exam.totalTimeSeconds ?? 0)}</p>
                  </div>
                  <span className={`shrink-0 rounded-xl px-2.5 py-1 text-xs font-black ${scoreClass(exam.finalScore)}`}>
                    {exam.finalScore !== null ? exam.finalScore.toFixed(0) : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="mb-2 flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Target size={15} />
              <p className="text-xs font-black uppercase tracking-wide">Strength</p>
            </div>
            <p className="text-sm font-black text-emerald-950 dark:text-emerald-100">{strongestTopic?.topicName ?? 'Keep completing exams'}</p>
            {strongestTopic && <p className="mt-1 text-xs font-bold text-emerald-700/75 dark:text-emerald-300/75">{Math.round(strongestTopic.scoreAvg)}% · {strongestTopic.subjectName}</p>}
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
            <div className="mb-2 flex items-center gap-2 text-rose-700 dark:text-rose-300">
              <AlertCircle size={15} />
              <p className="text-xs font-black uppercase tracking-wide">Needs focus</p>
            </div>
            <p className="text-sm font-black text-rose-950 dark:text-rose-100">{weakestTopic?.topicName ?? 'No weak topic data yet'}</p>
            {weakestTopic && <p className="mt-1 text-xs font-bold text-rose-700/75 dark:text-rose-300/75">{Math.round(weakestTopic.scoreAvg)}% · {weakestTopic.subjectName}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ParentResultsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [children, setChildren] = useState<StudentAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'PARENT') {
      router.replace('/dashboard');
    }
  }, [router, user]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await analyticsService.getChildrenAnalytics();
        if (res.success) {
          setChildren(res.data);
        } else {
          setError(res.message || 'Failed to load student results');
        }
      } catch (err) {
        setError(isAxiosError(err) ? err.response?.data?.message || 'Failed to load student results' : 'Failed to load student results');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'PARENT') {
      load();
    }
  }, [user?.role]);

  const totals = useMemo(() => {
    const exams = children.reduce((sum, child) => sum + child.totalExams, 0);
    const time = children.reduce((sum, child) => sum + child.totalTimeSeconds, 0);
    const scored = children.filter((child) => child.overallAvg !== null);
    const avg = scored.length > 0 ? scored.reduce((sum, child) => sum + (child.overallAvg ?? 0), 0) / scored.length : null;
    return { exams, time, avg };
  }, [children]);

  if (!user || user.role !== 'PARENT') return null;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-44 rounded-lg bg-slate-200/70 dark:bg-slate-800" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl border border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl border border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#0A9AE2]">Parent reports</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Exam Results</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Track linked students&apos; exam scores, study time, strengths, and focus areas.</p>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <Users size={18} className="text-[#0A9AE2]" />
          <p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100">{children.length}</p>
          <p className="text-xs font-bold text-slate-400">Linked students</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <FileText size={18} className="text-[#FF6900]" />
          <p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100">{totals.exams}</p>
          <p className="text-xs font-bold text-slate-400">Completed exams</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <Trophy size={18} className="text-amber-500" />
          <p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100">{totals.avg !== null ? `${totals.avg.toFixed(0)}%` : '-'}</p>
          <p className="text-xs font-bold text-slate-400">Family average</p>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-white py-20 text-center dark:border-slate-700 dark:bg-slate-900">
          <Users size={36} className="text-slate-300 dark:text-slate-600" />
          <p className="mt-4 text-base font-black text-slate-700 dark:text-slate-200">No linked students yet</p>
          <p className="mt-1 max-w-sm text-sm font-medium text-slate-400">Add or link a student account to start seeing exam results here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {children.map((child) => (
            <StudentResultCard key={child.studentId} student={child} />
          ))}
        </div>
      )}
    </div>
  );
}

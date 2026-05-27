'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { analyticsService } from '@/features/analytics/services/analytics.service';
import { adminService, type UserItem } from '@/features/admin/services/admin.service';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/SearchableSelect';
import type {
  MyAnalytics,
  Leaderboard,
  RankingLevel,
  TopicPerformanceItem,
  ExamHistoryItem,
} from '@/features/analytics/types/analytics.types';
import {
  Trophy,
  Clock,
  FileText,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Medal,
  Users,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// ── Constants ────────────────────────────────────────────────────────────────

const RANKING_CONFIG: Record<RankingLevel, { label: string; color: string; bg: string; border: string }> = {
  SUPERIOR:      { label: 'Superior',      color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-300 dark:border-yellow-700' },
  ABOVE_AVERAGE: { label: 'Above Average', color: 'text-green-700 dark:text-green-400',  bg: 'bg-green-100 dark:bg-green-900/30',  border: 'border-green-300 dark:border-green-700' },
  HIGH_AVERAGE:  { label: 'High Average',  color: 'text-teal-700 dark:text-teal-400',    bg: 'bg-teal-100 dark:bg-teal-900/30',    border: 'border-teal-300 dark:border-teal-700' },
  AVERAGE:       { label: 'Average',       color: 'text-blue-700 dark:text-blue-400',    bg: 'bg-blue-100 dark:bg-blue-900/30',    border: 'border-blue-300 dark:border-blue-700' },
  LOW_AVERAGE:   { label: 'Low Average',   color: 'text-slate-600 dark:text-slate-400',  bg: 'bg-slate-100 dark:bg-slate-800',     border: 'border-slate-300 dark:border-slate-600' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Score history chart (Recharts) ────────────────────────────────────────────

type ScoreChartPoint = {
  index: number;
  shortLabel: string;
  examTitle: string;
  score: number;
  takenAt: string;
};

function ScoreChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ScoreChartPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100">{point.examTitle}</p>
      <p className="mt-0.5 text-[10px] font-medium text-slate-400">{formatDate(point.takenAt)}</p>
      <p className="mt-1 text-base font-black text-[#FF6900]">{point.score.toFixed(0)}<span className="text-[10px] text-slate-400">/100</span></p>
    </div>
  );
}

function ScoreLineChart({ history }: { history: ExamHistoryItem[] }) {
  const scored = history
    .filter((h): h is ExamHistoryItem & { finalScore: number } => h.finalScore !== null)
    .slice()
    .reverse();

  if (scored.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/50">
        <p className="text-xs font-medium text-slate-400">Need at least 2 exams to show trend</p>
      </div>
    );
  }

  const data: ScoreChartPoint[] = scored.map((h, index) => ({
    index,
    shortLabel: h.examTitle.length > 12 ? `${h.examTitle.slice(0, 12)}…` : h.examTitle,
    examTitle: h.examTitle,
    score: h.finalScore,
    takenAt: h.takenAt,
  }));

  return (
    <div className="h-56 w-full overflow-hidden rounded-2xl bg-slate-50/60 px-2 pb-2 pt-4 dark:bg-slate-800/40">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6900" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#FF6900" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} vertical={false} />
          <XAxis
            dataKey="shortLabel"
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip content={<ScoreChartTooltip />} cursor={{ stroke: '#FF6900', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#FF6900"
            strokeWidth={2.5}
            fill="url(#scoreGrad)"
            dot={{ r: 4, fill: '#FF6900', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#FF6900', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Topic bar ─────────────────────────────────────────────────────────────────

function TopicBar({ topic }: { topic: TopicPerformanceItem }) {
  const pct = Math.round(topic.scoreAvg);
  const color = pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="min-w-0">
            <span className="block truncate text-xs font-semibold text-slate-700 dark:text-slate-300">{topic.topicName}</span>
            <span className="text-[10px] font-medium text-slate-400">{topic.subjectName}</span>
          </div>
          <span className={`ml-2 shrink-0 text-xs font-black ${pct >= 75 ? 'text-green-600 dark:text-green-400' : pct >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
            {pct}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="shrink-0 text-[10px] font-medium text-slate-400">{topic.attemptCount}x</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PerformancePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isStaffViewer = user?.role === 'ADMIN' || user?.role === 'TUTOR';

  const [analytics, setAnalytics] = useState<MyAnalytics | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [lbExamId, setLbExamId] = useState<string>('');
  const [lbLoading, setLbLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(!isStaffViewer);
  const [error, setError] = useState<string | null>(null);

  // ── Staff (admin/tutor) student selector state ──────────────────────────
  const [students, setStudents] = useState<UserItem[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Load student list for admin/tutor
  useEffect(() => {
    if (!isStaffViewer) return;

    let cancelled = false;
    setIsLoadingStudents(true);
    adminService
      .listUsers({ role: 'STUDENT', page: 1, limit: 100 })
      .then((res) => {
        if (!cancelled && res.success) setStudents(res.data);
      })
      .catch(() => {
        // mdwClient interceptor handles toast feedback
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStudents(false);
      });

    return () => { cancelled = true; };
  }, [isStaffViewer]);

  // Load analytics: staff = by selected student; otherwise = self
  useEffect(() => {
    if (isStaffViewer && !selectedStudentId) {
      setAnalytics(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = isStaffViewer
          ? await analyticsService.getStudentAnalytics(selectedStudentId)
          : await analyticsService.getMyAnalytics();
        if (cancelled) return;
        if (res.success) setAnalytics(res.data);
        else setError(res.message);
      } catch (err) {
        if (cancelled) return;
        setError(isAxiosError(err) ? err.response?.data?.message || 'Failed to load analytics' : 'Failed to load analytics');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();

    return () => { cancelled = true; };
  }, [isStaffViewer, selectedStudentId]);

  // Leaderboard uses a single all-time ranking, optionally scoped to one exam.
  useEffect(() => {
    const load = async () => {
      setLbLoading(true);
      try {
        const res = await analyticsService.getLeaderboard('ALL_TIME', lbExamId || undefined);
        if (res.success) setLeaderboard(res.data);
      } catch {
        // non-critical — keep previous leaderboard
      } finally {
        setLbLoading(false);
      }
    };
    load();
  }, [lbExamId]);

  // Build unique exam options for leaderboard filter from analytics history
  const examFilterOptions = useMemo<SearchableSelectOption[]>(() => {
    if (!analytics) return [];
    const seen = new Set<string>();
    const options: SearchableSelectOption[] = [];
    for (const h of analytics.examHistory) {
      if (!seen.has(h.examId)) {
        seen.add(h.examId);
        options.push({ value: h.examId, label: h.examTitle, searchText: h.examTitle });
      }
    }
    return options;
  }, [analytics]);

  // Reset exam filter when switching student (staff) or when filter exam no longer in current student's history
  useEffect(() => {
    if (lbExamId && !examFilterOptions.some((o) => o.value === lbExamId)) {
      setLbExamId('');
    }
  }, [examFilterOptions, lbExamId]);

  // For staff viewer, highlight the selected student in leaderboard;
  // for student viewer, highlight themselves.
  const highlightedStudentId = isStaffViewer ? selectedStudentId : user?.id;

  const studentOptions = useMemo<SearchableSelectOption[]>(
    () => students.map((s) => ({ value: s.id, label: s.fullName || s.email, searchText: `${s.fullName ?? ''} ${s.email}` })),
    [students]
  );

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId]
  );

  // ── Staff selector header (shown above all states) ──────────────────────
  const staffSelector = isStaffViewer ? (
    <header className="space-y-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-400">Performance</p>
        <h1 className="mt-0.5 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Student Analytics</h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Pick a student to view their performance, history, and topic breakdown.
        </p>
      </div>
      <div className="max-w-md">
        <SearchableSelect
          value={selectedStudentId}
          options={studentOptions}
          onChange={setSelectedStudentId}
          placeholder={isLoadingStudents ? 'Loading students…' : 'Select a student'}
          searchPlaceholder="Search by name or email…"
          emptyText={isLoadingStudents ? 'Loading…' : 'No students found.'}
          disabled={isLoadingStudents || studentOptions.length === 0}
        />
        {selectedStudent && (
          <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            Viewing <span className="font-bold text-slate-700 dark:text-slate-300">{selectedStudent.fullName || selectedStudent.email}</span>
            {' · '}
            <span className="uppercase">{selectedStudent.tier}</span>
          </p>
        )}
      </div>
    </header>
  ) : null;

  // Staff hasn't picked a student yet → empty state with selector
  if (isStaffViewer && !selectedStudentId) {
    return (
      <div className="w-full space-y-5">
        {staffSelector}
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-white py-20 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/20">
            <Users size={26} className="text-violet-600 dark:text-violet-400" />
          </div>
          <p className="mt-4 text-base font-bold text-slate-700 dark:text-slate-300">Select a student to begin</p>
          <p className="mt-1 max-w-xs text-sm font-medium text-slate-400">
            Use the dropdown above to choose a student. Their exam history, score trend, and topic breakdown will appear here.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {staffSelector}
        <div className="space-y-6 animate-pulse">
          {!isStaffViewer && (
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-7 w-40 rounded-lg bg-slate-200/70 dark:bg-slate-800" />
                <div className="h-4 w-60 rounded bg-slate-100 dark:bg-slate-800/60" />
              </div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl border border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-900" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-72 rounded-2xl border border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-900" />
            <div className="h-72 rounded-2xl border border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-900" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full space-y-5">
        {staffSelector}
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle size={16} /> {error}
        </div>
      </div>
    );
  }

  const rankConfig = analytics?.rankingLevel ? RANKING_CONFIG[analytics.rankingLevel as RankingLevel] : null;

  // ── Empty state (selected student/self has no exam data yet) ────────────
  if (!analytics || analytics.totalExams === 0) {
    return (
      <div className="w-full space-y-5">
        {isStaffViewer ? staffSelector : (
          <header>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-400">Performance</p>
            <h1 className="mt-0.5 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Analytics</h1>
          </header>
        )}
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-white py-20 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/20">
            <TrendingUp size={26} className="text-violet-600 dark:text-violet-400" />
          </div>
          <p className="mt-4 text-base font-bold text-slate-700 dark:text-slate-300">No data yet</p>
          <p className="mt-1 max-w-xs text-sm font-medium text-slate-400">
            {isStaffViewer
              ? 'This student has not completed any exam yet. Charts and ranking will appear once they have results.'
              : 'Complete at least one exam to see your performance analytics and leaderboard ranking.'}
          </p>
          {!isStaffViewer && (
            <button
              onClick={() => router.push('/dashboard/exams')}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-100 transition-all hover:bg-[#0864B6] dark:shadow-none"
            >
              Go to Exams <ChevronRight size={15} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">

      {/* ── Header ── */}
      {isStaffViewer ? staffSelector : (
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-400">Performance</p>
          <h1 className="mt-0.5 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Analytics</h1>
        </header>
      )}

      {/* ── Body ── */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">

        {/* ════════════════ LEFT COLUMN ════════════════ */}
        <div className="flex flex-col gap-5 lg:flex-1">

          {/* Stat cards row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Overall avg */}
            <div className="col-span-2 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:col-span-2">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-[#FF6900]">
                <div className="text-center">
                  <p className="text-lg font-black leading-none text-slate-900 dark:text-slate-100">
                    {analytics.overallAvg !== null ? analytics.overallAvg.toFixed(0) : '—'}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400">/100</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Avg Score</p>
                {rankConfig && (
                  <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-black ${rankConfig.color} ${rankConfig.bg}`}>
                    <Trophy size={10} /> {rankConfig.label}
                  </span>
                )}
              </div>
            </div>
            {/* Total exams */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <FileText size={15} className="text-blue-600 dark:text-blue-400" />
              </div>
              <p className="mt-2 text-xl font-black text-slate-900 dark:text-slate-100">{analytics.totalExams}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Exams</p>
            </div>
            {/* Total time */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20">
                <Clock size={15} className="text-green-600 dark:text-green-400" />
              </div>
              <p className="mt-2 text-xl font-black text-slate-900 dark:text-slate-100">{formatTime(analytics.totalTimeSeconds)}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Studied</p>
            </div>
          </div>

          {/* Score history chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-[#FF6900]" />
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">Score History</p>
              </div>
              <p className="text-xs font-medium text-slate-400">{analytics.examHistory.length} exam{analytics.examHistory.length !== 1 ? 's' : ''}</p>
            </div>
            <ScoreLineChart history={analytics.examHistory} />

            {/* Recent exams list */}
            {analytics.examHistory.length > 0 && (
              <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {analytics.examHistory.slice(0, 5).map((h) => {
                  const rc = h.rankingLevel ? RANKING_CONFIG[h.rankingLevel as RankingLevel] : null;
                  return (
                    <div key={h.sessionId} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">{h.examTitle}</p>
                        <p className="text-[10px] text-slate-400">{formatDate(h.takenAt)}</p>
                      </div>
                      <div className="ml-3 flex shrink-0 items-center gap-2">
                        {rc && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${rc.color} ${rc.bg}`}>{rc.label}</span>
                        )}
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                          {h.finalScore !== null ? `${h.finalScore.toFixed(0)}` : '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Topic performance */}
          {analytics.topicPerformance.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">Topic Breakdown</p>
                <span className="text-xs font-medium text-slate-400">Weakest → Strongest</span>
              </div>
              <div className="space-y-3.5">
                {analytics.topicPerformance.map((t) => (
                  <TopicBar key={t.topicId} topic={t} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ════════════════ RIGHT COLUMN: Leaderboard ════════════════ */}
        <div className="flex flex-col gap-4 lg:w-72 lg:shrink-0">
          <div className="relative z-10 overflow-visible rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Trophy size={15} className="text-amber-500" />
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">Leaderboard</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {lbExamId ? 'Per Mock' : 'Overall'}
              </span>
            </div>

            {/* Exam selector */}
            {examFilterOptions.length > 0 && (
              <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                <SearchableSelect
                  value={lbExamId}
                  options={[{ value: '', label: 'All exams (overall)' }, ...examFilterOptions]}
                  onChange={setLbExamId}
                  placeholder="All exams (overall)"
                  searchPlaceholder="Search exams…"
                  emptyText="No exams found."
                  triggerClassName="text-xs"
                />
              </div>
            )}

            {/* List */}
            {lbLoading ? (
              <div className="divide-y divide-slate-100 animate-pulse dark:divide-slate-800">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-2.5 px-4 py-2.5">
                    <div className="h-6 w-6 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/5 rounded bg-slate-100 dark:bg-slate-800" />
                      <div className="h-2.5 w-2/5 rounded bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <div className="h-4 w-8 rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                ))}
              </div>
            ) : !leaderboard || leaderboard.entries.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-xs font-medium text-slate-400">No leaderboard data yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaderboard.entries.slice(0, 10).map((entry) => {
                  const isHighlighted = entry.studentId === highlightedStudentId;
                  const medalColor = entry.rank === 1 ? 'text-yellow-500' : entry.rank === 2 ? 'text-slate-400' : entry.rank === 3 ? 'text-amber-600' : null;
                  return (
                    <div
                      key={entry.studentId}
                      className={`flex items-center gap-2.5 px-4 py-2.5 transition-colors ${isHighlighted ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                        {medalColor ? (
                          <Medal size={16} className={medalColor} />
                        ) : (
                          <span className="text-xs font-bold text-slate-400">{entry.rank}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-xs font-bold ${isHighlighted ? 'text-[#FF6900]' : 'text-slate-800 dark:text-slate-200'}`}>
                          {isHighlighted && !isStaffViewer ? 'You' : entry.studentName}
                        </p>
                        <p className="text-[10px] text-slate-400">{entry.totalExams} exam{entry.totalExams !== 1 ? 's' : ''}</p>
                      </div>
                      <span className={`shrink-0 text-sm font-black ${isHighlighted ? 'text-[#FF6900]' : 'text-slate-900 dark:text-slate-100'}`}>
                        {entry.score.toFixed(0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* My rank callout if not in top 10 — only for student viewing themselves */}
            {!isStaffViewer && leaderboard && leaderboard.myRank.rank !== null && leaderboard.myRank.rank > 10 && leaderboard.myRank.studentName && (
              <>
                <div className="flex items-center justify-center py-1">
                  <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">• • •</span>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5 bg-orange-50 px-4 py-2.5 dark:bg-orange-900/10">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                      <span className="text-xs font-bold text-[#FF6900]">{leaderboard.myRank.rank}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-[#FF6900]">You</p>
                      <p className="text-[10px] text-slate-400">{leaderboard.myRank.totalExams} exam{leaderboard.myRank.totalExams !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="shrink-0 text-sm font-black text-[#FF6900]">{leaderboard.myRank.score?.toFixed(0)}</span>
                  </div>
                </div>
              </>
            )}

            {!isStaffViewer && leaderboard && leaderboard.myRank.rank === null && (
              <div className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
                <p className="text-center text-xs font-medium text-slate-400">Complete an exam to rank</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

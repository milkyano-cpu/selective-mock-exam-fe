'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAxiosError } from 'axios';
import {
  AlertTriangle, Award, BarChart3, ChevronDown, Clock, FileText, Search, Target, Trophy, Users,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, Cell, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { analyticsService } from '@/features/analytics/services/analytics.service';
import type {
  ChildSummary,
  Leaderboard as LeaderboardType,
  StudentAnalytics,
} from '@/features/analytics/types/analytics.types';
import { useAuthStore } from '@/features/auth/store/auth.store';

const RANKING_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SUPERIOR: { label: 'Superior', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  ABOVE_AVERAGE: { label: 'Above Average', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  HIGH_AVERAGE: { label: 'High Average', color: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/30' },
  AVERAGE: { label: 'Average', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  LOW_AVERAGE: { label: 'Low Average', color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/30' },
};

function formatTime(seconds: number) {
  if (seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

function tierBadgeClass(tier: 'BASIC' | 'STANDARD' | 'PREMIUM', isActive: boolean) {
  if (isActive) return 'bg-white/20 text-white';
  if (tier === 'PREMIUM') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
  if (tier === 'STANDARD') return 'bg-[#0A9AE2]/10 text-[#0A9AE2] dark:bg-[#0A9AE2]/20';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
}

function MetricCard({ icon: Icon, label, value, tone }: {
  icon: typeof FileText;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:p-5">
      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg lg:mb-3 lg:h-10 lg:w-10 lg:rounded-xl ${tone}`}>
        <Icon size={16} className="lg:hidden" /><Icon size={18} className="hidden lg:block" />
      </div>
      <p className="text-xl font-black text-slate-900 dark:text-slate-100 lg:text-2xl">{value}</p>
      <p className="text-[11px] font-bold text-slate-400 lg:text-xs">{label}</p>
    </div>
  );
}

function ChildSelectorDropdown({
  children,
  selectedId,
  onSelect,
}: {
  children: ChildSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = children.find((c) => c.studentId === selectedId) ?? null;

  const filtered = useMemo(() => {
    if (!search.trim()) return children;
    const q = search.toLowerCase();
    return children.filter((c) => c.studentName.toLowerCase().includes(q));
  }, [children, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="relative w-full sm:w-72" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left transition-colors hover:border-[#0A9AE2] dark:border-slate-700 dark:bg-slate-900 dark:hover:border-[#0A9AE2]"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selected && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-[10px] font-black text-white">
              {selected.studentName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
              {selected?.studentName ?? 'Select student'}
            </p>
            {selected && (
              <span className={`text-[10px] font-black uppercase tracking-wide ${tierBadgeClass(selected.tier, false)}`}>
                {selected.tier}
              </span>
            )}
          </div>
        </div>
        <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {children.length > 2 && (
            <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800">
                <Search size={14} className="shrink-0 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student..."
                  className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder-slate-400 outline-none dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
            </div>
          )}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-center text-xs font-medium text-slate-400">No students found</li>
            ) : (
              filtered.map((child) => {
                const isActive = child.studentId === selectedId;
                return (
                  <li key={child.studentId}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(child.studentId);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${
                        isActive
                          ? 'bg-[#0A9AE2]/5 dark:bg-[#0A9AE2]/10'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-[10px] font-black text-white">
                        {child.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm ${isActive ? 'font-black text-[#0A9AE2]' : 'font-bold text-slate-800 dark:text-slate-200'}`}>
                          {child.studentName}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${tierBadgeClass(child.tier, false)}`}>
                        {child.tier}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function StudentResultsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardType | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'PARENT') {
      router.replace('/dashboard');
    }
  }, [router, user]);

  // Tahap 1 — Load list of children + leaderboard
  useEffect(() => {
    if (user?.role !== 'PARENT') return;

    let cancelled = false;
    const load = async () => {
      setIsLoadingList(true);
      setError(null);
      try {
        const [childRes, lbRes] = await Promise.all([
          analyticsService.getChildren(),
          analyticsService.getLeaderboard('ALL_TIME'),
        ]);
        if (cancelled) return;
        if (childRes.success) {
          setChildren(childRes.data);
          // Honor ?student= query param if it points to a linked child
          const requestedId = searchParams.get('student');
          const initial =
            (requestedId && childRes.data.find((c) => c.studentId === requestedId)?.studentId) ||
            childRes.data[0]?.studentId ||
            null;
          setSelectedId((prev) => prev ?? initial);
        } else {
          setError(childRes.message || 'Failed to load linked students');
        }
        if (lbRes.success) setLeaderboard(lbRes.data);
      } catch (err) {
        if (cancelled) return;
        setError(isAxiosError(err) ? err.response?.data?.message || 'Failed to load linked students' : 'Failed to load linked students');
      } finally {
        if (!cancelled) setIsLoadingList(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.role, searchParams]);

  // Tahap 2 — Load analytics for the currently selected child
  useEffect(() => {
    if (!selectedId) {
      setAnalytics(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoadingAnalytics(true);
      setError(null);
      try {
        const res = await analyticsService.getChildAnalytics(selectedId);
        if (cancelled) return;
        if (res.success) {
          setAnalytics(res.data);
        } else {
          setError(res.message || 'Failed to load analytics');
          setAnalytics(null);
        }
      } catch (err) {
        if (cancelled) return;
        setError(isAxiosError(err) ? err.response?.data?.message || 'Failed to load analytics' : 'Failed to load analytics');
        setAnalytics(null);
      } finally {
        if (!cancelled) setIsLoadingAnalytics(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const selectedChildSummary = useMemo(
    () => children.find((c) => c.studentId === selectedId) ?? null,
    [children, selectedId],
  );

  const scoreTrendData = useMemo(() => {
    if (!analytics) return [];
    return (analytics.examHistory ?? [])
      .slice()
      .sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime())
      .map((h) => ({
        examFull: h.examTitle,
        examType: h.examType === 'MOCK_EXAM' ? 'Mock Exam' : 'Assignment',
        score: h.finalScore ?? 0,
        bestScore: h.bestScore ?? h.finalScore ?? 0,
        attempts: h.totalAttempts,
        date: new Date(h.takenAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }));
  }, [analytics]);

  const subjectPerf = analytics?.subjectPerformance ?? [];
  const weakTopics = (analytics?.topicPerformance ?? []).filter((t) => t.scoreAvg < 50);
  const childRank = leaderboard?.entries.find((e) => e.studentId === selectedId) ?? null;

  if (!user || user.role !== 'PARENT') return null;

  if (isLoadingList) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Student Results</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Detailed performance breakdown for each linked student.
          </p>
        </header>
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-48 rounded-full bg-slate-200/50 dark:bg-slate-800/50" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl border border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-900" />
            ))}
          </div>
          <div className="h-64 rounded-2xl border border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Student Results</h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Detailed performance breakdown for each linked student.
        </p>
      </header>

      {children.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-white py-20 text-center dark:border-slate-700 dark:bg-slate-900">
          <Users size={36} className="text-slate-300 dark:text-slate-600" />
          <p className="mt-4 text-base font-black text-slate-700 dark:text-slate-200">No linked students found</p>
          <p className="mt-1 max-w-sm text-sm font-medium text-slate-400">Contact your administrator to link a student account.</p>
        </div>
      ) : (
        <>
          {/* Child selector dropdown with search */}
          <ChildSelectorDropdown
            children={children}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Tahap 2 — Analytics for selected child */}
          {isLoadingAnalytics && !analytics ? (
            <div className="space-y-4 animate-pulse">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl border border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-900" />
                ))}
              </div>
              <div className="h-64 rounded-2xl border border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-900" />
            </div>
          ) : analytics ? (
            <>
              {/* Top Metric Cards */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                <MetricCard icon={FileText} label="Completed exams" value={analytics.totalExams} tone="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300" />
                <MetricCard icon={Trophy} label="Average score" value={analytics.overallAvg !== null ? `${analytics.overallAvg.toFixed(0)}%` : '-'} tone="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300" />
                <MetricCard icon={Clock} label="Study time" value={formatTime(analytics.totalTimeSeconds)} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300" />
                <MetricCard icon={Target} label="Subjects covered" value={subjectPerf.length} tone="bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300" />
              </div>

              {/* Summary + Ranking + Weak Topics */}
              <div className="grid gap-4 lg:grid-cols-3">
                {/* Summary */}
                <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-black text-sm">
                      {analytics.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 dark:text-slate-100 truncate">{analytics.studentName}</p>
                      <p className="text-[11px] font-medium text-slate-400">{analytics.totalExams} exams · {formatTime(analytics.totalTimeSeconds)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Average</p>
                      <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                        {analytics.overallAvg !== null ? `${analytics.overallAvg.toFixed(0)}%` : '-'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Ranking</p>
                      <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                        {analytics.rankingLevel ? RANKING_CONFIG[analytics.rankingLevel]?.label ?? '-' : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Leaderboard Position */}
                <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2 mb-3">
                    <Award size={16} className="text-[#FF6900]" />
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Leaderboard Position</p>
                  </div>
                  {!childRank ? (
                    <div className="flex items-center justify-center h-[100px]">
                      <p className="text-sm text-slate-400">Not ranked yet</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[100px] gap-2">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-full text-xl font-black ${
                        childRank.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                        childRank.rank === 2 ? 'bg-slate-100 text-slate-600' :
                        childRank.rank === 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        #{childRank.rank}
                      </div>
                      <p className="text-xs font-bold text-slate-500">Score: <span className="text-[#0A9AE2] font-black">{childRank.score.toFixed(0)}</span></p>
                      {childRank.rankingLevel && RANKING_CONFIG[childRank.rankingLevel] && (
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-black ${RANKING_CONFIG[childRank.rankingLevel]!.bg} ${RANKING_CONFIG[childRank.rankingLevel]!.color}`}>
                          {RANKING_CONFIG[childRank.rankingLevel]!.label}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Weak Topics */}
                <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Needs Attention</p>
                  </div>
                  {weakTopics.length === 0 ? (
                    <div className="flex items-center justify-center h-[100px]">
                      <div className="text-center">
                        <Target size={24} className="mx-auto text-emerald-400 mb-1" />
                        <p className="text-xs font-bold text-slate-500">All topics on track!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[110px] overflow-y-auto">
                      {weakTopics.slice(0, 5).map((t) => (
                        <div key={t.topicId} className="flex items-center justify-between gap-2 rounded-lg bg-red-50/50 px-3 py-1.5 dark:bg-red-500/5">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{t.topicName}</span>
                          <span className="text-[11px] font-black text-red-500 shrink-0">{t.scoreAvg.toFixed(0)}%</span>
                        </div>
                      ))}
                      {weakTopics.length > 5 && (
                        <p className="text-[10px] font-bold text-slate-400 text-center">+{weakTopics.length - 5} more</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Score Trend Chart */}
              {scoreTrendData.length > 0 && (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-4">
                    <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Score Trend</h2>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {analytics.studentName}&apos;s exam scores over time
                    </p>
                  </div>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <AreaChart data={scoreTrendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <defs>
                          <linearGradient id="scoreGradientResults" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0A9AE2" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#0A9AE2" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0]!.payload;
                          return (
                            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                              <p className="text-xs font-black text-slate-900 dark:text-slate-100">{d.examFull}</p>
                              <p className="mt-0.5 text-[10px] font-bold text-slate-400">{d.examType} · {d.date}</p>
                              <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1">
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Score</p>
                                <p className="text-[10px] font-black text-[#0A9AE2] text-right">{d.score}%</p>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Best Score</p>
                                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 text-right">{d.bestScore}%</p>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Attempts</p>
                                <p className="text-[10px] font-black text-slate-700 dark:text-slate-200 text-right">{d.attempts}</p>
                              </div>
                            </div>
                          );
                        }} />
                        <Area type="monotone" dataKey="score" stroke="#0A9AE2" strokeWidth={2.5} fill="url(#scoreGradientResults)" dot={{ r: 4, fill: '#0A9AE2', strokeWidth: 0 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Subject Performance Bar Chart */}
              {subjectPerf.length > 0 && (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-4">
                    <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Subject Performance</h2>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Average score per subject for {analytics.studentName}
                    </p>
                  </div>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart
                        data={subjectPerf.map((s) => ({
                          subject: s.subjectName.length > 10 ? s.subjectName.slice(0, 10) + '…' : s.subjectName,
                          score: Math.round(s.scoreAvg),
                        }))}
                        margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} />
                        <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                          {subjectPerf.map((s, i) => (
                            <Cell key={i} fill={s.scoreAvg >= 70 ? '#10b981' : s.scoreAvg >= 50 ? '#f59e0b' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-400">≥70% Strong</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-[10px] font-bold text-slate-400">50-69% Average</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-[10px] font-bold text-slate-400">&lt;50% Weak</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Exam History */}
              {analytics.examHistory.length > 0 && (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-3 flex items-center gap-2">
                    <BarChart3 size={16} className="text-[#FF6900]" />
                    <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Recent exam results</h2>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {analytics.examHistory.slice(0, 8).map((exam) => (
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
                          <p className="text-xs font-medium text-slate-400">
                            {new Date(exam.takenAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })} · {formatTime(exam.totalTimeSeconds ?? 0)} · {exam.totalAttempts} attempt{exam.totalAttempts !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-xl px-2.5 py-1 text-xs font-black ${
                          exam.finalScore === null
                            ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                            : exam.finalScore >= 75
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : exam.finalScore >= 50
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                        }`}>
                          {exam.finalScore !== null ? exam.finalScore.toFixed(0) : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Writing Performance — PREMIUM only */}
              {(analytics.writingPerformance ?? []).length > 0 && (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-violet-500" />
                      <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Writing Performance</h2>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                      Essay scoring breakdown by criterion for {analytics.studentName}
                    </p>
                  </div>
                  <div className="space-y-4">
                    {analytics.writingPerformance!.slice(0, 5).map((item) => (
                      <div key={item.sessionId} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-3">
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-slate-100">{item.examTitle}</p>
                            <p className="text-[11px] font-medium text-slate-400">
                              {new Date(item.takenAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          {item.bandLabel && (
                            <span className="inline-flex w-fit items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                              {item.bandLabel}
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {item.criteria.map((c) => (
                            <div key={c.criterionName} className="flex items-center gap-3">
                              <p className="min-w-0 flex-1 truncate text-xs font-bold text-slate-700 dark:text-slate-300">{c.criterionName}</p>
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                  <div
                                    className={`h-full rounded-full ${
                                      c.scorePercent >= 70 ? 'bg-emerald-500' : c.scorePercent >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${Math.min(100, c.scorePercent)}%` }}
                                  />
                                </div>
                                <span className="w-12 text-right text-[11px] font-black text-slate-900 dark:text-slate-100">
                                  {c.score}/{c.maxScore}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : selectedChildSummary ? (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white py-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-400">No analytics available for {selectedChildSummary.studentName}.</p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function StudentResultsPage() {
  return (
    <Suspense fallback={<div className="h-screen" />}>
      <StudentResultsView />
    </Suspense>
  );
}

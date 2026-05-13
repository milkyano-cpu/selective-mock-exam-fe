'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { analyticsService } from '@/features/analytics/services/analytics.service';
import type { MyAnalytics, Leaderboard, StudentAnalytics } from '@/features/analytics/types/analytics.types';
import {
  TrendingUp,
  Users,
  Trophy,
  Clock,
  Target,
  AlertTriangle,
  Award,
  ChevronDown,
  FileText,
  BookOpen,
  ClipboardList,
  LibraryBig,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const RANKING_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SUPERIOR: { label: 'Superior', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  ABOVE_AVERAGE: { label: 'Above Average', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  HIGH_AVERAGE: { label: 'High Average', color: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/30' },
  AVERAGE: { label: 'Average', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  LOW_AVERAGE: { label: 'Low Average', color: 'text-slate-700 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
};

function StudentPerformanceAnalytics() {
  const [analytics, setAnalytics] = useState<MyAnalytics | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef?.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const analyticsRes = await analyticsService.getMyAnalytics();
        if (analyticsRes.success) setAnalytics(analyticsRes.data);
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (isLoading || !analytics) return;
    const fetchLeaderboard = async () => {
      setIsLeaderboardLoading(true);
      try {
        const res = await analyticsService.getLeaderboard('ALL_TIME', selectedExamId || undefined);
        if (res.success) setLeaderboard(res.data);
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        setIsLeaderboardLoading(false);
      }
    };
    fetchLeaderboard();
  }, [selectedExamId, isLoading, analytics]);

  const uniqueExams = useMemo(() => {
    if (!analytics) return [];
    const map = new Map<string, { id: string, title: string }>();
    analytics.examHistory.forEach(h => {
      if (!map.has(h.examId)) {
        map.set(h.examId, { id: h.examId, title: h.examTitle });
      }
    });
    return Array.from(map.values());
  }, [analytics]);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-[2rem] bg-slate-200/50 dark:bg-slate-800/50" />;
  }

  if (!analytics || !leaderboard) {
    return null;
  }

  const { totalExams, overallAvg, totalTimeSeconds, examHistory, topicPerformance } = analytics;
  const chrono = [...examHistory].sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime());
  const recentScores = chrono.slice(-7);

  // Strength and Weakness
  const sortedTopics = [...topicPerformance].sort((a, b) => b.scoreAvg - a.scoreAvg);
  const strengths = sortedTopics.filter(t => t.scoreAvg >= 70).slice(0, 3);
  const weaknesses = [...sortedTopics].sort((a, b) => a.scoreAvg - b.scoreAvg).slice(0, 3).filter(t => t.scoreAvg < 70);

  const formatTime = (seconds: number) => {
    if (seconds === 0) return '0m';
    if (seconds < 60) return `${seconds}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr] xl:grid-cols-[minmax(350px,400px)_minmax(0,1fr)]">
      
      {/* Analytics Card */}
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="text-[#0A9AE2]" /> Analytics
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Your overall performance overview</p>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 text-center">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-slate-400">Total Exams</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{totalExams}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 text-center">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-slate-400">Avg Score</p>
            <p className="mt-1 text-2xl font-black text-[#0A9AE2]">{overallAvg?.toFixed(1) ?? '0'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 text-center">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-slate-400">Time Spent</p>
            <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">{formatTime(totalTimeSeconds)}</p>
          </div>
        </div>

        {/* Strength & Weakness */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
            <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-500">
              <Target size={14} /> Strengths
            </h3>
            {strengths.length > 0 ? (
              <div className="flex flex-col gap-2">
                {strengths.map(t => (
                  <div key={t.topicId} className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-emerald-900 dark:text-emerald-300" title={t.topicName}>{t.topicName}</span>
                    <span className="shrink-0 text-xs font-black text-emerald-600 dark:text-emerald-400">{Math.round(t.scoreAvg)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-medium text-emerald-600/60 dark:text-emerald-500/60">Keep practicing to build your strengths!</p>
            )}
          </div>
          
          <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 dark:border-rose-900/30 dark:bg-rose-900/10">
            <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-rose-700 dark:text-rose-500">
              <AlertTriangle size={14} /> Needs Focus
            </h3>
            {weaknesses.length > 0 ? (
              <div className="flex flex-col gap-2">
                {weaknesses.map(t => (
                  <div key={t.topicId} className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-rose-900 dark:text-rose-300" title={t.topicName}>{t.topicName}</span>
                    <span className="shrink-0 text-xs font-black text-rose-600 dark:text-rose-400">{Math.round(t.scoreAvg)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-medium text-rose-600/60 dark:text-rose-500/60">No major weak spots found yet!</p>
            )}
          </div>
        </div>
          
        {/* Score Trend */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 mt-auto">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-slate-400">Score Trend (Last 7 Exams)</p>
          <div className="mt-6 flex h-20 items-end gap-2 px-2">
            {recentScores.map((s, i) => {
              const height = Math.max(5, s.finalScore ?? 0);
              return (
                <div key={i} className="group relative flex flex-1 flex-col items-center justify-end h-full">
                  <div 
                    className="w-full max-w-[1.5rem] rounded-t-md bg-gradient-to-t from-[#0A9AE2]/20 to-[#0A9AE2] transition-all group-hover:to-[#0A9AE2]/80 dark:from-[#0A9AE2]/20 dark:to-[#0A9AE2]"
                    style={{ height: `${height}%` }}
                  />
                  <div className="absolute -top-8 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white shadow-xl group-hover:block dark:bg-white dark:text-slate-900">
                    {s.finalScore?.toFixed(0)}
                  </div>
                </div>
              );
            })}
            {Array.from({ length: Math.max(0, 7 - recentScores.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div className="w-full max-w-[1.5rem] rounded-t-md bg-slate-100 dark:bg-slate-800/50" style={{ height: '10%' }} />
              </div>
            ))}
          </div>
          <div className="mt-2 border-t border-dashed border-slate-200 pt-2 text-center text-[10px] font-bold text-slate-400 dark:border-slate-700">
            Oldest → Newest
          </div>
        </div>
      </div>

      {/* Leaderboard Card */}
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 flex flex-col">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="text-[#FF6900]" /> Global Leaderboard
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">See how you rank among all students</p>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:border-[#0A9AE2] focus:outline-none focus:ring-2 focus:ring-[#0A9AE2]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/50"
            >
              <span className="truncate max-w-[150px]">
                {selectedExamId ? uniqueExams.find(e => e.id === selectedExamId)?.title || 'Unknown Exam' : 'Overall Ranking'}
              </span>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                <button
                  onClick={() => {
                    setSelectedExamId('');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors ${
                    selectedExamId === ''
                      ? 'bg-[#0A9AE2]/10 text-[#0A9AE2]'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50'
                  }`}
                >
                  Overall Ranking
                </button>
                {uniqueExams.length > 0 && <div className="my-1 border-t border-slate-100 dark:border-slate-700/50"></div>}
                <div className="max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {uniqueExams.map(ex => (
                    <button
                      key={ex.id}
                      onClick={() => {
                        setSelectedExamId(ex.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors ${
                        selectedExamId === ex.id
                          ? 'bg-[#0A9AE2]/10 text-[#0A9AE2]'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="block truncate" title={ex.title}>{ex.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 relative min-h-[200px]">
          {isLeaderboardLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0A9AE2] border-t-transparent"></div>
            </div>
          )}
          {leaderboard.entries.length === 0 && !isLeaderboardLoading ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 text-sm font-medium text-slate-400 dark:border-slate-800">
              No data yet
            </div>
          ) : (
            leaderboard.entries.map((entry, index) => {
              const rankConfig = entry.rankingLevel ? RANKING_CONFIG[entry.rankingLevel] : null;
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;
              
              return (
                <div
                  key={entry.studentId}
                  className={`flex items-center gap-4 rounded-2xl border p-4 transition-all ${isFirst ? 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-white dark:border-yellow-900/50 dark:from-yellow-900/20 dark:to-slate-900' : 'border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900'}`}
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-black text-lg ${isFirst ? 'bg-yellow-400 text-yellow-950 shadow-sm shadow-yellow-200 dark:bg-yellow-500 dark:shadow-none' : isSecond ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' : isThird ? 'bg-orange-200 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800/80 dark:text-slate-500'}`}>
                    {entry.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`truncate font-bold ${isFirst ? 'text-yellow-900 dark:text-yellow-400' : 'text-slate-900 dark:text-slate-100'}`}>
                      {entry.studentName}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      {rankConfig && (
                        <span className={`rounded-md px-1.5 py-0.5 font-bold ${rankConfig.bg} ${rankConfig.color}`}>
                          {rankConfig.label}
                        </span>
                      )}
                      <span className="hidden text-slate-300 dark:text-slate-600 sm:inline">·</span>
                      <span className="font-medium text-slate-500 dark:text-slate-400">
                        {entry.totalExams} Exams
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`text-2xl font-black tracking-tight ${isFirst ? 'text-yellow-600 dark:text-yellow-500' : 'text-slate-900 dark:text-slate-100'}`}>
                      {entry.score.toFixed(0)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function formatRoleTime(seconds: number) {
  if (seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

function RoleMetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
        <Icon size={22} />
      </div>
      <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0A9AE2]/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
        <Icon size={22} />
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-black text-slate-900 dark:text-slate-100">{title}</h3>
          <p className="mt-1 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <ChevronRight size={18} className="mt-1 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-[#0A9AE2]" />
      </div>
    </Link>
  );
}

function AdminDashboard({ firstName }: { firstName: string }) {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#0A9AE2]">Admin control center</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Welcome back, <span className="text-[#0A9AE2]">{firstName}</span>! 👋
        </h1>
        <p className="max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
          Manage users, exam content, question approvals, practice assignments, and platform communication from one dashboard.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RoleMetricCard icon={Users} label="User management" value="Active" tone="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300" />
        <RoleMetricCard icon={FileText} label="Exam workflow" value="Ready" tone="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300" />
        <RoleMetricCard icon={Trophy} label="Question bank" value="Live" tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300" />
        <RoleMetricCard icon={TrendingUp} label="Analytics" value="Student" tone="bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <QuickActionCard icon={Users} title="Manage users" description="Create staff accounts and review registered students or parents." href="/dashboard/users" tone="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300" />
        <QuickActionCard icon={FileText} title="Build exams" description="Create mock exams, attach published questions, and manage submissions." href="/dashboard/exams" tone="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300" />
        <QuickActionCard icon={Trophy} title="Review question bank" description="Import CSV questions, approve submitted items, and publish reusable content." href="/dashboard/questions" tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300" />
        <QuickActionCard icon={ClipboardList} title="Assign practice" description="Create targeted practice sessions for students from published MCQ questions." href="/dashboard/practice/assignments" tone="bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-300" />
        <QuickActionCard icon={BookOpen} title="Manage subjects" description="Keep subjects and topics ready for practice, analytics, and imports." href="/dashboard/subjects" tone="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300" />
        <QuickActionCard icon={CreditCard} title="Billing overview" description="Open billing tools for subscription and payment related follow-up." href="/dashboard/billing" tone="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" />
      </div>
    </div>
  );
}

function TutorDashboard({ firstName }: { firstName: string }) {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#0A9AE2]">Tutor workspace</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Welcome back, <span className="text-[#0A9AE2]">{firstName}</span>! 👋
        </h1>
        <p className="max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
          Jump into grading, exam authoring, question creation, and targeted student practice.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RoleMetricCard icon={FileText} label="Mock exams" value="Open" tone="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300" />
        <RoleMetricCard icon={ClipboardList} label="Practice tasks" value="Assign" tone="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300" />
        <RoleMetricCard icon={Trophy} label="Question bank" value="Create" tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300" />
        <RoleMetricCard icon={BookOpen} label="AI Rubrics" value="Guide" tone="bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <QuickActionCard icon={FileText} title="Exam submissions" description="Open exams and review sessions that need tutor attention." href="/dashboard/exams" tone="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300" />
        <QuickActionCard icon={ClipboardList} title="Practice assignments" description="Assign focused practice from reusable question bank content." href="/dashboard/practice/assignments" tone="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300" />
        <QuickActionCard icon={Trophy} title="Create questions" description="Draft, import, submit, and manage questions for exams or practice." href="/dashboard/questions" tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300" />
        <QuickActionCard icon={BookOpen} title="AI Rubrics" description="Maintain essay grading aiRubrics for AI and manual review consistency." href="/dashboard/ai-rubrics" tone="bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300" />
        <QuickActionCard icon={LibraryBig} title="Passages" description="Manage reusable passages for reading comprehension questions." href="/dashboard/passages" tone="bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-300" />
        <QuickActionCard icon={Users} title="Students" description="View linked student cards and progress snapshots." href="/dashboard/students" tone="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" />
      </div>
    </div>
  );
}

function ParentDashboard({ firstName }: { firstName: string }) {
  const [children, setChildren] = useState<StudentAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await analyticsService.getChildrenAnalytics();
        if (res.success) setChildren(res.data);
      } catch {
        setChildren([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const totalExams = children.reduce((sum, child) => sum + child.totalExams, 0);
  const totalTime = children.reduce((sum, child) => sum + child.totalTimeSeconds, 0);
  const scoredChildren = children.filter((child) => child.overallAvg !== null);
  const familyAverage = scoredChildren.length > 0
    ? scoredChildren.reduce((sum, child) => sum + (child.overallAvg ?? 0), 0) / scoredChildren.length
    : null;
  const latestExam = children.flatMap((child) =>
    child.examHistory.map((exam) => ({ ...exam, studentName: child.studentName }))
  ).sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime())[0] ?? null;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#0A9AE2]">Parent dashboard</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Welcome, <span className="text-[#0A9AE2]">{firstName}</span>!
        </h1>
        <p className="max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
          Monitor linked students, review mock exam results, and identify the next topics that need focus.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RoleMetricCard icon={Users} label="Linked students" value={isLoading ? '...' : children.length} tone="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300" />
        <RoleMetricCard icon={FileText} label="Completed exams" value={isLoading ? '...' : totalExams} tone="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300" />
        <RoleMetricCard icon={Trophy} label="Family average" value={isLoading ? '...' : familyAverage !== null ? `${familyAverage.toFixed(0)}%` : '-'} tone="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300" />
        <RoleMetricCard icon={Clock} label="Study time" value={isLoading ? '...' : formatRoleTime(totalTime)} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Recent result</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Latest completed mock exam across linked students.</p>
            </div>
            <Link href="/dashboard/results" className="rounded-xl bg-[#0A9AE2] px-3 py-2 text-xs font-black text-white transition-colors hover:bg-[#0864B6]">
              View all
            </Link>
          </div>
          {latestExam ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
              <p className="text-sm font-black text-slate-900 dark:text-slate-100">{latestExam.examTitle}</p>
              <p className="mt-1 text-xs font-bold text-slate-400">{latestExam.studentName}</p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">Score</p>
                  <p className="text-3xl font-black text-[#FF6900]">{latestExam.finalScore !== null ? latestExam.finalScore.toFixed(0) : '-'}</p>
                </div>
                <p className="text-xs font-bold text-slate-400">{formatRoleTime(latestExam.totalTimeSeconds ?? 0)}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm font-bold text-slate-400 dark:border-slate-800">
              No completed exam results yet.
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <QuickActionCard icon={TrendingUp} title="Exam Results" description="Open detailed score history, strengths, and weak areas." href="/dashboard/results" tone="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const userDisplayName = user?.fullName || user?.name || 'User';
  const firstName = userDisplayName.split(' ')[0];

  if (user?.role === 'ADMIN') {
    return <AdminDashboard firstName={firstName} />;
  }

  if (user?.role === 'TUTOR') {
    return <TutorDashboard firstName={firstName} />;
  }

  if (user?.role === 'PARENT') {
    return <ParentDashboard firstName={firstName} />;
  }


  return (
    <div className="min-w-0 max-w-full overflow-x-hidden">
      <StudentPerformanceAnalytics />
    </div>
  );
}


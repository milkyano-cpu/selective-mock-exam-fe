'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { BannerCarousel } from '@/components/dashboard/BannerCarousel';
import { examService } from '@/features/exams/services/exams.service';
import type { SessionSummary } from '@/features/exams/types/exams.types';
import { analyticsService } from '@/features/analytics/services/analytics.service';
import type { MyAnalytics, Leaderboard } from '@/features/analytics/types/analytics.types';
import {
  Zap,
  TrendingUp,
  Users,
  Trophy,
  Clock,
  Target,
  AlertTriangle,
  Award,
  ChevronDown,
} from 'lucide-react';

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
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr] xl:grid-cols-[minmax(350px,400px)_minmax(0,1fr)]">
      
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

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const userDisplayName = user?.fullName || user?.name || 'User';
  const firstName = userDisplayName.split(' ')[0];

  if (user?.role === 'ADMIN') {
    return (
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back, <span className="text-[#0A9AE2]">{firstName}</span>! 👋
            </h1>
            <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
              Here is what&apos;s happening with Aspire Academics today.
            </p>
          </div>
        </header>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 text-center shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 lg:p-20">
          <div className="w-20 h-20 bg-[#0A9AE2]/10 text-[#0A9AE2] rounded-3xl flex items-center justify-center mx-auto mb-8">
            <TrendingUp size={40} />
          </div>
          <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Platform Overview</h2>
          <p className="mx-auto max-w-md text-lg font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            This administrative dashboard allows you to manage users, update exam content, and monitor platform revenue.
          </p>
          
          <div className="mt-12 inline-flex items-center gap-3 px-6 py-3 bg-orange-50 text-orange-600 rounded-2xl font-black text-sm uppercase tracking-widest border border-orange-100">
            <Zap size={18} /> Analytics Under Construction
          </div>
        </div>
      </div>
    );
  }

  if (user?.role === 'TUTOR') {
    return (
      <div className="space-y-8">
        <BannerCarousel />
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back, <span className="text-[#0A9AE2]">{firstName}</span>! 👋
            </h1>
            <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
              Here is what&apos;s happening with your classes today.
            </p>
          </div>
        </header>
      </div>
    );
  }

  if (user?.role === 'PARENT') {
    return (
      <div className="space-y-8">
        <BannerCarousel />
        {/* Welcome Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Parent Dashboard <span className="text-[#0A9AE2]">.</span>
            </h1>
            <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
              Monitor students&apos; progress and manage accounts.
            </p>
          </div>
        </header>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 text-center shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 lg:p-20">
          <div className="w-20 h-20 bg-[#0A9AE2]/10 text-[#0A9AE2] rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3">
            <Users size={40} />
          </div>
          <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Welcome, {firstName}!</h2>
          <p className="mx-auto max-w-md text-lg font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            This specialized dashboard allows you to track mock exam results, analyze performance trends, and manage student subscriptions.
          </p>
          
          <div className="mt-12 inline-flex items-center gap-3 px-6 py-3 bg-orange-50 text-orange-600 rounded-2xl font-black text-sm uppercase tracking-widest border border-orange-100">
            <Zap size={18} /> Feature Under Construction
          </div>
        </div>

        {/* Quick Preview Grid for Parent */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50 pointer-events-none">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-2 font-bold text-slate-900 dark:text-slate-100">Linked Students</h3>
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Coming soon: View all registered students under your account.</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-2 font-bold text-slate-900 dark:text-slate-100">Recent Reports</h3>
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Coming soon: Download performance reports for your students.</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden sm:space-y-6">
      <div className="min-w-0 space-y-6">
        <header className="relative min-w-0 px-5 pt-5 pb-2 sm:px-6 sm:pt-6">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#0A9AE2]">Student quest board</p>
              <h1 className="mt-1 break-words text-[clamp(1.55rem,4vw,2.1rem)] font-black leading-tight tracking-tight text-slate-900 dark:text-slate-100">
                Welcome back, <span className="text-[#0A9AE2]">{firstName}</span>
              </h1>
              <p className="mt-1 max-w-2xl break-words text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                Your current exam status, weak spots, and review queue in one glance.
              </p>
            </div>
          </div>
        </header>

        <div className="px-5 sm:px-6">
          <StudentPerformanceAnalytics />
        </div>
      </div>
    </div>
  );
}


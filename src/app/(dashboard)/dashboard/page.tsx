'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { analyticsService } from '@/features/analytics/services/analytics.service';
import { showApiErrorAlert } from '@/lib/errorAlert';
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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Label, BarChart, Bar, Legend } from 'recharts';

const SUBJECT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#e11d48'];

const RANKING_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SUPERIOR: { label: 'Superior', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  ABOVE_AVERAGE: { label: 'Above Average', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  HIGH_AVERAGE: { label: 'High Average', color: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/30' },
  AVERAGE: { label: 'Average', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  LOW_AVERAGE: { label: 'Low Average', color: 'text-slate-700 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
};

function TopicMasteryChart({ strongList, averageList, weakList, total }: {
  strongList: { topicId: string; topicName: string; subjectName: string; scoreAvg: number }[];
  averageList: { topicId: string; topicName: string; subjectName: string; scoreAvg: number }[];
  weakList: { topicId: string; topicName: string; subjectName: string; scoreAvg: number }[];
  total: number;
}) {
  const [expanded, setExpanded] = useState<'strong' | 'average' | 'weak' | null>(null);

  const handleClick = (category: 'strong' | 'average' | 'weak') => {
    setExpanded(expanded === category ? null : category);
  };

  const expandedList = expanded === 'strong' ? strongList : expanded === 'average' ? averageList : expanded === 'weak' ? weakList : [];
  const expandedColor = expanded === 'strong' ? 'emerald' : expanded === 'average' ? 'amber' : 'red';
  const expandedLabel = expanded === 'strong' ? 'Strong Topics' : expanded === 'average' ? 'Average Topics' : 'Weak Topics';

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400 mb-2 text-center">Topic Mastery</p>
      <div className="flex items-center gap-4">
        <div className="h-[120px] w-[120px] shrink-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Strong', value: strongList.length },
                  { name: 'Average', value: averageList.length },
                  { name: 'Weak', value: weakList.length },
                ].filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={50}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {strongList.length > 0 && <Cell fill="#10b981" />}
                {averageList.length > 0 && <Cell fill="#f59e0b" />}
                {weakList.length > 0 && <Cell fill="#ef4444" />}
                <Label
                  value={total.toString()}
                  position="center"
                  style={{ fontSize: '16px', fontWeight: 900 }}
                  className="fill-slate-900 dark:fill-slate-100"
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5">
          <button
            type="button"
            onClick={() => handleClick('strong')}
            className={`w-full flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors ${expanded === 'strong' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Strong (≥70%)</span>
            </div>
            <span className="text-xs font-black text-emerald-600">{strongList.length}</span>
          </button>
          <button
            type="button"
            onClick={() => handleClick('average')}
            className={`w-full flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors ${expanded === 'average' ? 'bg-amber-100 dark:bg-amber-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Average (50-69%)</span>
            </div>
            <span className="text-xs font-black text-amber-600">{averageList.length}</span>
          </button>
          <button
            type="button"
            onClick={() => handleClick('weak')}
            className={`w-full flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors ${expanded === 'weak' ? 'bg-red-100 dark:bg-red-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Weak (&lt;50%)</span>
            </div>
            <span className="text-xs font-black text-red-600">{weakList.length}</span>
          </button>
        </div>
      </div>

      {/* Expanded topic list */}
      {expanded && expandedList.length > 0 && (
        <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
          <p className={`text-[10px] font-black uppercase tracking-wide mb-2 text-${expandedColor}-600 dark:text-${expandedColor}-400`}>
            {expandedLabel}
          </p>
          <div className="space-y-1 max-h-[140px] overflow-y-auto scrollbar-hide">
            {expandedList.sort((a, b) => b.scoreAvg - a.scoreAvg).map((t) => (
              <div key={t.topicId} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-1.5 dark:bg-slate-900">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{t.topicName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{t.subjectName}</p>
                </div>
                <span className={`text-[11px] font-black shrink-0 text-${expandedColor}-600`}>{Math.round(t.scoreAvg)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StudentPerformanceAnalytics() {
  const [analytics, setAnalytics] = useState<MyAnalytics | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentUser = useAuthStore((state) => state.user);

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
        showApiErrorAlert(err, currentUser?.role, { context: 'load' });
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
        showApiErrorAlert(err, currentUser?.role, { context: 'load' });
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

  if (isLoading || !analytics || !leaderboard) {
    return (
      <div className="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-2 animate-pulse">
        {/* Analytics skeleton */}
        <div className="rounded-[2rem] border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 flex flex-col gap-6">
          <div>
            <div className="h-6 w-32 rounded-lg bg-slate-200/70 dark:bg-slate-800" />
            <div className="mt-2 h-4 w-52 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <div className="mx-auto h-3 w-16 rounded bg-slate-200/70 dark:bg-slate-700" />
                <div className="mx-auto mt-3 h-7 w-10 rounded bg-slate-200/70 dark:bg-slate-700" />
              </div>
            ))}
          </div>
          <div className="h-[120px] rounded-2xl bg-slate-50 dark:bg-slate-800/30" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-28 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10" />
            <div className="h-28 rounded-2xl bg-rose-50/50 dark:bg-rose-900/10" />
          </div>
          <div className="h-[180px] rounded-2xl bg-slate-50 dark:bg-slate-800/30" />
        </div>
        {/* Leaderboard skeleton */}
        <div className="rounded-[2rem] border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 flex flex-col gap-3">
          <div className="mb-3">
            <div className="h-6 w-44 rounded-lg bg-slate-200/70 dark:bg-slate-800" />
            <div className="mt-2 h-4 w-56 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="h-12 w-12 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800/80" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 rounded bg-slate-200/70 dark:bg-slate-700" />
                <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800/60" />
              </div>
              <div className="h-7 w-10 rounded bg-slate-200/70 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { totalExams, overallAvg, totalTimeSeconds, examHistory, topicPerformance } = analytics;
  const chrono = [...examHistory].sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime());

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
    <div className="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
      
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

        {/* Personal Analytics Donut - Strengths vs Weaknesses */}
        {topicPerformance.length > 0 && (() => {
          const strongList = topicPerformance.filter(t => t.scoreAvg >= 70);
          const averageList = topicPerformance.filter(t => t.scoreAvg >= 50 && t.scoreAvg < 70);
          const weakList = topicPerformance.filter(t => t.scoreAvg < 50);
          const total = topicPerformance.length;

          return <TopicMasteryChart strongList={strongList} averageList={averageList} weakList={weakList} total={total} />;
        })()}

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
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-4">Mock Exam Scores</p>
          {chrono.length > 0 ? (
            <ResponsiveContainer width="100%" height={140} minWidth={0} minHeight={0}>
              <AreaChart
                data={chrono.map((s) => ({
                  name: s.examTitle.length > 12 ? s.examTitle.slice(0, 12) + '…' : s.examTitle,
                  score: s.finalScore ?? 0,
                  fullName: s.examTitle,
                }))}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A9AE2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0A9AE2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#fff',
                  }}
                  formatter={(value) => [`${value}%`, 'Score']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#0A9AE2"
                  strokeWidth={2}
                  fill="url(#scoreGradient)"
                  dot={{ r: 3, fill: '#0A9AE2', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#0A9AE2', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[140px] items-center justify-center">
              <p className="text-xs font-medium text-slate-400">No exams completed yet</p>
            </div>
          )}
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
            (() => {
              const myRank = leaderboard.myRank?.rank;
              const isInTop10 = myRank != null && myRank <= 10;
              const top10 = leaderboard.entries.slice(0, 10);
              const showMyEntry = !isInTop10 && myRank != null && leaderboard.myRank.studentName;

              return (
                <>
                  {top10.map((entry) => {
                    const rankConfig = entry.rankingLevel ? RANKING_CONFIG[entry.rankingLevel] : null;
                    const isFirst = entry.rank === 1;
                    const isSecond = entry.rank === 2;
                    const isThird = entry.rank === 3;
                    const isMe = entry.studentId === currentUser?.id;

                    return (
                      <div
                        key={entry.studentId}
                        className={`flex items-center gap-4 rounded-2xl border p-4 transition-all ${isFirst ? 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-white dark:border-yellow-900/50 dark:from-yellow-900/20 dark:to-slate-900' : isMe ? 'border-[#0A9AE2]/30 bg-[#0A9AE2]/5 dark:border-[#0A9AE2]/40 dark:bg-[#0A9AE2]/10' : 'border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900'}`}
                      >
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-black text-lg ${isFirst ? 'bg-yellow-400 text-yellow-950 shadow-sm shadow-yellow-200 dark:bg-yellow-500 dark:shadow-none' : isSecond ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' : isThird ? 'bg-orange-200 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800/80 dark:text-slate-500'}`}>
                          {entry.rank}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className={`truncate font-bold ${isFirst ? 'text-yellow-900 dark:text-yellow-400' : 'text-slate-900 dark:text-slate-100'}`}>
                            {entry.studentName}{isMe && ' (You)'}
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
                  })}

                  {/* Show current student's position if outside top 10 */}
                  {showMyEntry && (
                    <>
                      <div className="flex items-center justify-center py-1">
                        <span className="text-xs font-bold text-slate-300 dark:text-slate-600">• • •</span>
                      </div>
                      <div
                        className="flex items-center gap-4 rounded-2xl border border-[#0A9AE2]/30 bg-[#0A9AE2]/5 p-4 dark:border-[#0A9AE2]/40 dark:bg-[#0A9AE2]/10"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0A9AE2]/10 font-black text-lg text-[#0A9AE2]">
                          {leaderboard.myRank.rank}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-bold text-[#0A9AE2] dark:text-[#0A9AE2]">
                            {leaderboard.myRank.studentName} (You)
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                            {leaderboard.myRank.rankingLevel && RANKING_CONFIG[leaderboard.myRank.rankingLevel] && (
                              <span className={`rounded-md px-1.5 py-0.5 font-bold ${RANKING_CONFIG[leaderboard.myRank.rankingLevel]!.bg} ${RANKING_CONFIG[leaderboard.myRank.rankingLevel]!.color}`}>
                                {RANKING_CONFIG[leaderboard.myRank.rankingLevel]!.label}
                              </span>
                            )}
                            <span className="hidden text-slate-300 dark:text-slate-600 sm:inline">·</span>
                            <span className="font-medium text-slate-500 dark:text-slate-400">
                              {leaderboard.myRank.totalExams} Exams
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-2xl font-black tracking-tight text-[#0A9AE2]">
                            {leaderboard.myRank.score?.toFixed(0)}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              );
            })()
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

function MiniStatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 ${color}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">{value.toLocaleString()}</p>
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 truncate">{label}</p>
      </div>
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

function AdminLeaderboardCard() {
  const [entries, setEntries] = useState<import('@/features/analytics/types/analytics.types').LeaderboardEntry[]>([]);
  const [exams, setExams] = useState<{ id: string; title: string }[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch exams list once
  useEffect(() => {
    const loadExams = async () => {
      try {
        const { examService } = await import('@/features/exams/services/exams.service');
        const res = await examService.list({ limit: 50 });
        if (res.success) {
          setExams(res.data.map((e) => ({ id: e.id, title: e.title })));
        }
      } catch {
        // silent
      }
    };
    loadExams();
  }, []);

  // Fetch leaderboard when exam selection changes
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await analyticsService.getLeaderboard('ALL_TIME', selectedExamId || undefined);
        if (res.success) setEntries(res.data.entries.slice(0, 5));
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [selectedExamId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award size={14} className="text-[#FF6900]" />
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Leaderboard</p>
        </div>
        {/* Exam selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="truncate max-w-[70px]">{selectedExamId ? exams.find(e => e.id === selectedExamId)?.title || 'Exam' : 'Global'}</span>
            <ChevronDown size={10} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-44 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => { setSelectedExamId(''); setIsDropdownOpen(false); }}
                className={`w-full px-3 py-2 text-left text-[11px] font-bold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${!selectedExamId ? 'text-[#0A9AE2]' : 'text-slate-700 dark:text-slate-300'}`}
              >
                Global Ranking
              </button>
              {exams.map((exam) => (
                <button
                  key={exam.id}
                  type="button"
                  onClick={() => { setSelectedExamId(exam.id); setIsDropdownOpen(false); }}
                  className={`w-full px-3 py-2 text-left text-[11px] font-bold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 truncate ${selectedExamId === exam.id ? 'text-[#0A9AE2]' : 'text-slate-700 dark:text-slate-300'}`}
                >
                  {exam.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2 py-1">
              <div className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800" />
              <div className="h-3 flex-1 rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-3 w-8 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="h-[110px] flex items-center justify-center">
          <span className="text-xs text-slate-400">No ranking data yet</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry) => {
            const rankCfg = entry.rankingLevel ? RANKING_CONFIG[entry.rankingLevel] : null;
            return (
              <div key={entry.studentId} className="flex items-center gap-2">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                  entry.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                  entry.rank === 2 ? 'bg-slate-100 text-slate-600' :
                  entry.rank === 3 ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {entry.rank}
                </span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate flex-1">
                  {entry.studentName}
                </span>
                {rankCfg && (
                  <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black shrink-0 ${rankCfg.bg} ${rankCfg.color}`}>
                    {rankCfg.label}
                  </span>
                )}
                <span className="text-[11px] font-black text-[#0A9AE2] shrink-0">
                  {entry.score.toFixed(0)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DashboardMetricSkeleton() {
  return (
    <div className="flex h-[130px] animate-pulse flex-col items-center justify-center gap-3">
      <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
      <div className="h-3 w-28 rounded bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}

function AdminDashboard({ firstName }: { firstName: string }) {
  const [stats, setStats] = useState<import('@/features/admin/services/admin.service').AdminDashboardStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { adminService } = await import('@/features/admin/services/admin.service');
        const res = await adminService.getStats();
        if (res.success) setStats(res.data);
      } catch {
        // silent
      } finally {
        setIsStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#0A9AE2]">Admin control center</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Welcome back, <span className="text-[#0A9AE2]">{firstName}</span>! 👋
        </h1>
        {/* <p className="max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
          Manage users, exam content, question approvals, practice assignments, and platform communication from one dashboard.
        </p> */}
      </header>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Student Gender Pie Chart */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400 mb-2">Students by Gender</p>
          {isStatsLoading ? (
            <DashboardMetricSkeleton />
          ) : stats?.studentGender ? (
            <>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Male', value: stats.studentGender.male, fill: '#3b82f6' },
                        { name: 'Female', value: stats.studentGender.female, fill: '#ec4899' },
                        ...(stats.studentGender.unspecified > 0 ? [{ name: 'N/A', value: stats.studentGender.unspecified, fill: '#94a3b8' }] : []),
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#ec4899" />
                      {stats.studentGender.unspecified > 0 && <Cell fill="#94a3b8" />}
                      <Label
                        value={stats.totalStudents.toString()}
                        position="center"
                        style={{ fontSize: '16px', fontWeight: 900 }}
                        className="fill-slate-900 dark:fill-slate-100"
                      />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Male {stats.studentGender.male}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-pink-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Female {stats.studentGender.female}</span>
                </div>
                {stats.studentGender.unspecified > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">N/A {stats.studentGender.unspecified}</span>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
        {/* Students by Tier Pie Chart */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400 mb-2">Students by Tier</p>
          {isStatsLoading ? (
            <DashboardMetricSkeleton />
          ) : stats?.studentTier ? (
            <>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Basic', value: stats.studentTier.basic },
                        { name: 'Standard', value: stats.studentTier.standard },
                        { name: 'Premium', value: stats.studentTier.premium },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {stats.studentTier.basic > 0 && <Cell fill="#94a3b8" />}
                      {stats.studentTier.standard > 0 && <Cell fill="#f59e0b" />}
                      {stats.studentTier.premium > 0 && <Cell fill="#8b5cf6" />}
                      <Label
                        value={stats.totalStudents.toString()}
                        position="center"
                        style={{ fontSize: '16px', fontWeight: 900 }}
                        className="fill-slate-900 dark:fill-slate-100"
                      />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Basic {stats.studentTier.basic}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Standard {stats.studentTier.standard}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-violet-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Premium {stats.studentTier.premium}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
        {/* Exam Participation Pie Chart */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400 mb-2">Exam Participation</p>
          {isStatsLoading ? (
            <DashboardMetricSkeleton />
          ) : stats?.examParticipation ? (
            <>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Participated', value: stats.examParticipation.participated },
                        { name: 'Not yet', value: stats.examParticipation.notParticipated },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {stats.examParticipation.participated > 0 && <Cell fill="#10b981" />}
                      {stats.examParticipation.notParticipated > 0 && <Cell fill="#e2e8f0" />}
                      <Label
                        value={`${stats.totalStudents > 0 ? Math.round((stats.examParticipation.participated / stats.totalStudents) * 100) : 0}%`}
                        position="center"
                        style={{ fontSize: '14px', fontWeight: 900 }}
                        className="fill-slate-900 dark:fill-slate-100"
                      />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Joined {stats.examParticipation.participated}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Not yet {stats.examParticipation.notParticipated}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
        {/* Top Students Leaderboard Mini */}
        <AdminLeaderboardCard />
      </div>

      {/* Monthly Student Registrations Bar Chart */}
      {!isStatsLoading && stats?.monthlyRegistrations && stats.monthlyRegistrations.length > 0 && (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">New Students per Month</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Registration trend by gender (last 6 months)</p>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart
                data={stats.monthlyRegistrations.map((m) => ({
                  month: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
                  Male: m.male,
                  Female: m.female,
                }))}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                <Bar dataKey="Male" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Female" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
}

function TutorDashboard({ firstName }: { firstName: string }) {
  const [stats, setStats] = useState<import('@/features/admin/services/admin.service').AdminDashboardStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { adminService } = await import('@/features/admin/services/admin.service');
        const res = await adminService.getStats();
        if (res.success) setStats(res.data);
      } catch {
        // silent — tutor may not have access to all stats
      } finally {
        setIsStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#0A9AE2]">Tutor workspace</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Welcome back, <span className="text-[#0A9AE2]">{firstName}</span>! 👋
        </h1>
        {/* <p className="max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
          Monitor student progress, review exam results, and manage question content.
        </p> */}
      </header>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Student Gender Pie Chart */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400 mb-2">Students by Gender</p>
          {isStatsLoading ? (
            <DashboardMetricSkeleton />
          ) : stats?.studentGender ? (
            <>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Male', value: stats.studentGender.male, fill: '#3b82f6' },
                        { name: 'Female', value: stats.studentGender.female, fill: '#ec4899' },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {stats.studentGender.male > 0 && <Cell fill="#3b82f6" />}
                      {stats.studentGender.female > 0 && <Cell fill="#ec4899" />}
                      <Label
                        value={stats.totalStudents.toString()}
                        position="center"
                        style={{ fontSize: '16px', fontWeight: 900 }}
                        className="fill-slate-900 dark:fill-slate-100"
                      />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Male {stats.studentGender.male}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-pink-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Female {stats.studentGender.female}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
        {/* Students by Tier */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400 mb-2">Students by Tier</p>
          {isStatsLoading ? (
            <DashboardMetricSkeleton />
          ) : stats?.studentTier ? (
            <>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Basic', value: stats.studentTier.basic },
                        { name: 'Standard', value: stats.studentTier.standard },
                        { name: 'Premium', value: stats.studentTier.premium },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {stats.studentTier.basic > 0 && <Cell fill="#94a3b8" />}
                      {stats.studentTier.standard > 0 && <Cell fill="#f59e0b" />}
                      {stats.studentTier.premium > 0 && <Cell fill="#8b5cf6" />}
                      <Label
                        value={stats.totalStudents.toString()}
                        position="center"
                        style={{ fontSize: '16px', fontWeight: 900 }}
                        className="fill-slate-900 dark:fill-slate-100"
                      />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Basic {stats.studentTier.basic}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Standard {stats.studentTier.standard}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-violet-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Premium {stats.studentTier.premium}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
        {/* Exam Participation */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400 mb-2">Exam Participation</p>
          {isStatsLoading ? (
            <DashboardMetricSkeleton />
          ) : stats?.examParticipation ? (
            <>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Participated', value: stats.examParticipation.participated },
                        { name: 'Not yet', value: stats.examParticipation.notParticipated },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {stats.examParticipation.participated > 0 && <Cell fill="#10b981" />}
                      {stats.examParticipation.notParticipated > 0 && <Cell fill="#e2e8f0" />}
                      <Label
                        value={`${stats.totalStudents > 0 ? Math.round((stats.examParticipation.participated / stats.totalStudents) * 100) : 0}%`}
                        position="center"
                        style={{ fontSize: '14px', fontWeight: 900 }}
                        className="fill-slate-900 dark:fill-slate-100"
                      />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Joined {stats.examParticipation.participated}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Not yet {stats.examParticipation.notParticipated}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
        {/* Leaderboard */}
        <AdminLeaderboardCard />
      </div>

      {/* Monthly Student Registrations Bar Chart */}
      {!isStatsLoading && stats?.monthlyRegistrations && stats.monthlyRegistrations.length > 0 && (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">New Students per Month</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Registration trend by gender (last 6 months)</p>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart
                data={stats.monthlyRegistrations.map((m) => ({
                  month: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
                  Male: m.male,
                  Female: m.female,
                }))}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                <Bar dataKey="Male" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Female" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function ParentDashboard({ firstName }: { firstName: string }) {
  const [children, setChildren] = useState<StudentAnalytics[]>([]);
  const [leaderboard, setLeaderboard] = useState<import('@/features/analytics/types/analytics.types').Leaderboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [childRes, lbRes] = await Promise.all([
          analyticsService.getChildrenAnalytics(),
          analyticsService.getLeaderboard('ALL_TIME'),
        ]);
        if (childRes.success) setChildren(childRes.data);
        if (lbRes.success) setLeaderboard(lbRes.data);
      } catch {
        setChildren([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const selectedChild = children[selectedChildIdx] ?? null;

  // Score trend data for selected child
  const scoreTrendData = selectedChild?.examHistory
    .slice()
    .sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime())
    .map((h) => ({
      exam: h.examTitle.length > 12 ? h.examTitle.slice(0, 12) + '…' : h.examTitle,
      score: h.finalScore ?? 0,
      date: new Date(h.takenAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })) ?? [];

  // Subject performance for selected child
  const subjectPerf = selectedChild?.subjectPerformance ?? [];

  // Weak topics (score < 50%)
  const weakTopics = selectedChild?.topicPerformance.filter((t) => t.scoreAvg < 50) ?? [];

  // Find child's rank in leaderboard
  const getChildRank = (studentId: string) => {
    if (!leaderboard) return null;
    const entry = leaderboard.entries.find((e) => e.studentId === studentId);
    return entry ?? null;
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-64 animate-pulse rounded-[2rem] bg-slate-200/50 dark:bg-slate-800/50" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#0A9AE2]">Parent dashboard</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Welcome, <span className="text-[#0A9AE2]">{firstName}</span>!
        </h1>
        <p className="max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
          Monitor your children&apos;s progress, exam scores, and identify areas that need attention.
        </p>
      </header>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {children.map((child, idx) => (
            <button
              key={child.studentId}
              onClick={() => setSelectedChildIdx(idx)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                idx === selectedChildIdx
                  ? 'bg-[#0A9AE2] text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {child.studentName}
            </button>
          ))}
        </div>
      )}

      {/* Top Metric Cards — per selected child */}
      {selectedChild && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <RoleMetricCard icon={FileText} label="Completed exams" value={selectedChild.totalExams} tone="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300" />
          <RoleMetricCard icon={Trophy} label="Average score" value={selectedChild.overallAvg !== null ? `${selectedChild.overallAvg.toFixed(0)}%` : '-'} tone="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300" />
          <RoleMetricCard icon={Clock} label="Study time" value={formatRoleTime(selectedChild.totalTimeSeconds)} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300" />
          <RoleMetricCard icon={Target} label="Subjects covered" value={selectedChild.subjectPerformance.length} tone="bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300" />
        </div>
      )}

      {children.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <Users className="mx-auto mb-3 text-slate-300" size={40} />
          <p className="font-bold text-slate-500">No linked students yet.</p>
          <p className="text-sm text-slate-400 mt-1">Students will appear here once linked to your account.</p>
        </div>
      ) : selectedChild && (
        <>
          {/* Child Comparison Cards + Ranking */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Child Summary Card */}
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-black text-sm">
                  {selectedChild.studentName.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-slate-100">{selectedChild.studentName}</p>
                  <p className="text-[11px] font-medium text-slate-400">{selectedChild.totalExams} exams · {formatRoleTime(selectedChild.totalTimeSeconds)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Average</p>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {selectedChild.overallAvg !== null ? `${selectedChild.overallAvg.toFixed(0)}%` : '-'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Ranking</p>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {selectedChild.rankingLevel ? RANKING_CONFIG[selectedChild.rankingLevel]?.label ?? '-' : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Ranking Position */}
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 mb-3">
                <Award size={16} className="text-[#FF6900]" />
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Leaderboard Position</p>
              </div>
              {(() => {
                const rank = getChildRank(selectedChild.studentId);
                if (!rank) return (
                  <div className="flex items-center justify-center h-[100px]">
                    <p className="text-sm text-slate-400">Not ranked yet</p>
                  </div>
                );
                return (
                  <div className="flex flex-col items-center justify-center h-[100px] gap-2">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-full text-xl font-black ${
                      rank.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      rank.rank === 2 ? 'bg-slate-100 text-slate-600' :
                      rank.rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      #{rank.rank}
                    </div>
                    <p className="text-xs font-bold text-slate-500">Score: <span className="text-[#0A9AE2] font-black">{rank.score.toFixed(0)}</span></p>
                    {rank.rankingLevel && RANKING_CONFIG[rank.rankingLevel] && (
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-black ${RANKING_CONFIG[rank.rankingLevel]!.bg} ${RANKING_CONFIG[rank.rankingLevel]!.color}`}>
                        {RANKING_CONFIG[rank.rankingLevel]!.label}
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Weak Topics Alert */}
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
                <div className="space-y-1.5 max-h-[110px] overflow-y-auto scrollbar-hide">
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
                  {selectedChild.studentName}&apos;s exam scores over time
                </p>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={scoreTrendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0A9AE2" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0A9AE2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} />
                    <Area type="monotone" dataKey="score" stroke="#0A9AE2" strokeWidth={2.5} fill="url(#scoreGradient)" dot={{ r: 4, fill: '#0A9AE2', strokeWidth: 0 }} />
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
                  Average score per subject for {selectedChild.studentName}
                </p>
              </div>
              <div className="h-[200px]">
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

          {/* Multi-child comparison (if >1 child) */}
          {children.length > 1 && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4">
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Children Comparison</h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Side-by-side performance overview</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {children.map((child) => {
                  const childRank = getChildRank(child.studentId);
                  return (
                    <div key={child.studentId} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-black text-xs">
                          {child.studentName.charAt(0)}
                        </div>
                        <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{child.studentName}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Average</span>
                          <span className="font-black text-slate-900 dark:text-slate-100">{child.overallAvg !== null ? `${child.overallAvg.toFixed(0)}%` : '-'}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Exams</span>
                          <span className="font-black text-slate-900 dark:text-slate-100">{child.totalExams}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Rank</span>
                          <span className="font-black text-[#0A9AE2]">{childRank ? `#${childRank.rank}` : '-'}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Study time</span>
                          <span className="font-black text-slate-900 dark:text-slate-100">{formatRoleTime(child.totalTimeSeconds)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
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


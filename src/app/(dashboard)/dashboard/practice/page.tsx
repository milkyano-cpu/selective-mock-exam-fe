'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { isAxiosError } from 'axios';
import {
  BookMarked,
  ChevronRight,
  Clock,
  CheckCircle2,
  Loader2,
  Target,
  RotateCcw,
  TrendingDown,
  Play,
  Layers,
  AlertCircle,
  ClipboardList,
  Zap,
  Sparkles,
  Award,
  BarChart3,
  ArrowUpRight,
  LockKeyhole,
} from 'lucide-react';
import { subjectsService } from '@/features/subjects/services/subjects.service';
import { practiceService } from '@/features/practice/services/practice.service';
import { analyticsService } from '@/features/analytics/services/analytics.service';
import type { Subject, Topic } from '@/features/subjects/types/subjects.types';
import type { FreePracticeTopic, PracticeSessionSummary, DifficultyFilter, QuestionCount } from '@/features/practice/types/practice.types';
import type { TopicPerformanceItem } from '@/features/analytics/types/analytics.types';

const DIFFICULTY_OPTIONS: DifficultyFilter[] = ['ALL', 'EASY', 'MEDIUM', 'HARD'];
const COUNT_OPTIONS: QuestionCount[] = [5, 10, 15, 20];

const DIFFICULTY_COLORS: Record<DifficultyFilter, string> = {
  ALL: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  EASY: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HARD: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

type ModalTarget =
  | { kind: 'topic'; topicId: string; name: string }
  | { kind: 'subject'; subjectId: string; name: string };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-500 w-8 text-right">{Math.round(score)}%</span>
    </div>
  );
}

function Toggle({
  enabled,
  onToggle,
  label,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button type="button" onClick={onToggle} className="flex items-center gap-3 w-full text-left">
      <div
        className={[
          'w-9 h-5 rounded-full transition-colors flex-shrink-0 relative',
          enabled ? 'bg-[#0A9AE2]' : 'bg-slate-200 dark:bg-slate-700',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
            enabled ? 'translate-x-4' : 'translate-x-0.5',
          ].join(' ')}
        />
      </div>
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
    </button>
  );
}

export default function PracticeHubPage() {
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  const [sessions, setSessions] = useState<PracticeSessionSummary[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [freeTopics, setFreeTopics] = useState<FreePracticeTopic[]>([]);
  const [hasFullPracticeAccess, setHasFullPracticeAccess] = useState(true);

  const [topicPerformance, setTopicPerformance] = useState<TopicPerformanceItem[]>([]);

  // Start modal state
  const [startModal, setStartModal] = useState<ModalTarget | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('ALL');
  const [questionCount, setQuestionCount] = useState<QuestionCount>(10);
  const [excludeCompleted, setExcludeCompleted] = useState(false);
  const [incorrectOnly, setIncorrectOnly] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Weak-area batch modal
  const [showWeakAreaModal, setShowWeakAreaModal] = useState(false);
  const [weakAreaCount, setWeakAreaCount] = useState<QuestionCount>(10);
  const [isStartingWeakArea, setIsStartingWeakArea] = useState(false);
  const [weakAreaError, setWeakAreaError] = useState<string | null>(null);

  const loadSubjects = useCallback(async () => {
    try {
      const res = await subjectsService.listSubjects({ limit: 100, publishedOnly: true });
      if (res.success) {
        setSubjects(res.data);
        if (res.data.length > 0) setSelectedSubjectId(res.data[0].id);
      }
    } finally {
      setIsLoadingSubjects(false);
    }
  }, []);

  const loadTopics = useCallback(async (subjectId: string) => {
    setIsLoadingTopics(true);
    try {
      const res = await subjectsService.listTopics(subjectId, { limit: 100, publishedOnly: true });
      if (res.success) setTopics(res.data);
    } finally {
      setIsLoadingTopics(false);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const res = await practiceService.list({ limit: 20 });
      if (res.success) setSessions(res.data);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  const loadAccess = useCallback(async () => {
    try {
      const res = await practiceService.getAccess();
      if (res.success) {
        setHasFullPracticeAccess(res.data.fullPracticeAccess);
        setFreeTopics(res.data.freeTopics);
      }
    } catch {
      setHasFullPracticeAccess(true);
    }
  }, []);

  const loadPerformance = useCallback(async () => {
    try {
      const res = await analyticsService.getMyAnalytics();
      if (res.success) setTopicPerformance(res.data.topicPerformance ?? []);
    } catch {
      // analytics is non-critical
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSubjects();
      void loadAccess();
      void loadSessions();
      void loadPerformance();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSubjects, loadAccess, loadSessions, loadPerformance]);

  useEffect(() => {
    if (!selectedSubjectId) return;
    const timer = window.setTimeout(() => {
      void loadTopics(selectedSubjectId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedSubjectId, loadTopics]);

  const perfMap = new Map(topicPerformance.map((p) => [p.topicId, p]));
  const freeTopicIds = new Set(freeTopics.map((topic) => topic.topicId));
  const isBasicLimited = !hasFullPracticeAccess;
  const isTopicAccessible = (topicId: string | null | undefined) =>
    !isBasicLimited || (topicId ? freeTopicIds.has(topicId) : false);
  const lockedPracticeMessage = 'Basic members can only practice the first topic in each subject.';

  const inProgressSessionMap = new Map(
    sessions.filter((s) => s.status === 'IN_PROGRESS' && s.topicId).map((s) => [s.topicId!, s])
  );

  const tutorSessions = sessions.filter((s) => s.sourceType === 'TUTOR_ASSIGNED');
  const selfSessions = sessions.filter((s) => s.sourceType !== 'TUTOR_ASSIGNED');

  const openModal = (target: ModalTarget) => {
    setStartModal(target);
    setDifficulty('ALL');
    setQuestionCount(10);
    setExcludeCompleted(false);
    setIncorrectOnly(false);
    setStartError(null);
  };

  const handleStartOrResume = (topicId: string, topicName: string) => {
    if (!isTopicAccessible(topicId)) {
      setStartError(lockedPracticeMessage);
      return;
    }
    const existing = inProgressSessionMap.get(topicId);
    if (existing) {
      router.push(`/dashboard/practice/sessions/${existing.sessionId}`);
      return;
    }
    openModal({ kind: 'topic', topicId, name: topicName });
  };

  const handleStartSubject = (subjectId: string, subjectName: string) => {
    if (isBasicLimited) {
      setStartError(lockedPracticeMessage);
      return;
    }
    openModal({ kind: 'subject', subjectId, name: subjectName });
  };

  const handleConfirmStart = async () => {
    if (!startModal || isStarting) return;
    setIsStarting(true);
    setStartError(null);
    try {
      const res = await practiceService.start({
        ...(startModal.kind === 'topic'
          ? { topicId: startModal.topicId }
          : { subjectId: startModal.subjectId }),
        difficulty,
        questionCount,
        excludeCompleted: excludeCompleted || undefined,
        incorrectOnly: incorrectOnly || undefined,
      });
      if (res.success) {
        router.push(`/dashboard/practice/sessions/${res.data.sessionId}`);
      }
    } catch (error) {
      if (isAxiosError(error)) {
        setStartError(error.response?.data?.message || 'Failed to start practice');
      } else {
        setStartError('An unexpected error occurred');
      }
    } finally {
      setIsStarting(false);
    }
  };

  const handleStartWeakArea = async () => {
    if (isBasicLimited) {
      setWeakAreaError(lockedPracticeMessage);
      return;
    }
    if (isStartingWeakArea) return;
    setIsStartingWeakArea(true);
    setWeakAreaError(null);
    try {
      const res = await practiceService.startWeakArea({ questionCount: weakAreaCount });
      if (res.success) {
        router.push(`/dashboard/practice/sessions/${res.data.sessionId}`);
      }
    } catch (error) {
      if (isAxiosError(error)) {
        setWeakAreaError(error.response?.data?.message || 'Failed to start session');
      } else {
        setWeakAreaError('An unexpected error occurred');
      }
    } finally {
      setIsStartingWeakArea(false);
    }
  };

  const weakTopics = topicPerformance.filter((p) => p.scoreAvg < 60).slice(0, 4);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) ?? null;
  const pendingTutorSessions = tutorSessions.filter((s) => s.status === 'IN_PROGRESS');
  const firstPendingTutorSession = pendingTutorSessions[0] ?? null;
  const firstPendingTutorSessionAccessible = firstPendingTutorSession
    ? isTopicAccessible(firstPendingTutorSession.topicId)
    : false;
  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED' && s.scorePercent !== null);
  const averageScore =
    completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.scorePercent ?? 0), 0) / completedSessions.length
      : null;
  const totalAnswered = sessions.reduce((sum, s) => sum + (s.status === 'COMPLETED' ? s.questionCount : 0), 0);
  const subjectQuestionTotal = topics.reduce((sum, topic) => sum + (topic._count?.questions ?? 0), 0);
  const subjectReadyTopics = topics.filter((topic) => (topic._count?.questions ?? 0) > 0).length;

  if (isLoadingSubjects) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 size={40} className="animate-spin text-[#0A9AE2]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-1 py-2 md:px-2 md:py-4">
      <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">

        {/* Header */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div className="relative bg-[#0b1526] px-5 py-5 text-white sm:min-h-[250px] md:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(10,154,226,0.42),transparent_28%),radial-gradient(circle_at_88%_26%,rgba(249,115,22,0.34),transparent_26%),linear-gradient(135deg,#0f172a_0%,#10233d_58%,#0b3d62_100%)]" />
              <div className="relative z-10 flex h-full flex-col justify-between gap-5 sm:gap-8">
                <div>
                  <div className="mb-3 sm:mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-blue-50 backdrop-blur sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
                    <Sparkles size={12} className="sm:hidden" /><Sparkles size={14} className="hidden sm:block" />
                    Smart practice hub
                  </div>
                  <h1 className="max-w-2xl text-xl font-black leading-tight tracking-normal sm:text-3xl md:text-5xl">
                    Pick the next drill that actually moves your score.
                  </h1>
                  <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-blue-100/80 sm:mt-4 sm:text-sm sm:leading-6 sm:text-blue-100 md:text-base">
                    Jump into tutor assignments, attack weaker topics, or build a custom practice set by subject.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="rounded-xl border border-white/15 bg-white/10 p-2.5 backdrop-blur sm:rounded-2xl sm:p-4">
                    <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[#0A9AE2] sm:mb-3 sm:h-9 sm:w-9 sm:rounded-xl">
                      <ClipboardList size={14} />
                    </div>
                    <p className="text-lg font-black sm:text-2xl">{pendingTutorSessions.length}</p>
                    <p className="mt-0.5 text-[10px] font-bold text-blue-100 sm:mt-1 sm:text-xs">Tutor tasks</p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-white/10 p-2.5 backdrop-blur sm:rounded-2xl sm:p-4">
                    <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white text-orange-500 sm:mb-3 sm:h-9 sm:w-9 sm:rounded-xl">
                      <Target size={14} />
                    </div>
                    <p className="text-lg font-black sm:text-2xl">{weakTopics.length}</p>
                    <p className="mt-0.5 text-[10px] font-bold text-blue-100 sm:mt-1 sm:text-xs">Weak areas</p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-white/10 p-2.5 backdrop-blur sm:rounded-2xl sm:p-4">
                    <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white text-emerald-500 sm:mb-3 sm:h-9 sm:w-9 sm:rounded-xl">
                      <Award size={14} />
                    </div>
                    <p className="text-lg font-black sm:text-2xl">{averageScore !== null ? `${Math.round(averageScore)}%` : '-'}</p>
                    <p className="mt-0.5 text-[10px] font-bold text-blue-100 sm:mt-1 sm:text-xs">Avg score</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-4 bg-slate-50 px-5 py-4 dark:bg-slate-900/70 sm:gap-5 sm:p-6 md:p-8">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Today&apos;s focus</p>
                {firstPendingTutorSession ? (
                  <div className="mt-3 rounded-2xl border border-[#0A9AE2]/20 bg-white p-3 shadow-sm dark:border-[#0A9AE2]/25 dark:bg-slate-950 sm:mt-4 sm:p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                          {firstPendingTutorSession.topicName ?? firstPendingTutorSession.subjectName ?? 'Tutor assignment'}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-400">
                          {firstPendingTutorSession.questionCount} questions - assigned {formatDate(firstPendingTutorSession.startedAt)}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${firstPendingTutorSessionAccessible ? 'bg-[#0A9AE2]/10 text-[#0A9AE2]' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>
                        {firstPendingTutorSessionAccessible ? 'Pending' : 'Locked'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (firstPendingTutorSessionAccessible) {
                          router.push(`/dashboard/practice/sessions/${firstPendingTutorSession.sessionId}`);
                        }
                      }}
                      disabled={!firstPendingTutorSessionAccessible}
                      className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-[#0A9AE2] text-xs font-black text-white transition-colors hover:bg-[#0659AA] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-400 sm:mt-4 sm:h-11 sm:text-sm"
                    >
                      {firstPendingTutorSessionAccessible ? 'Start Assignment' : 'Basic limit'} <ArrowUpRight size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/30 sm:mt-4 sm:p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-emerald-800 dark:text-emerald-200">No pending tutor tasks</p>
                        <p className="text-xs font-bold text-emerald-600/80 dark:text-emerald-300/80">Choose a topic below to keep momentum.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950 sm:rounded-2xl sm:p-4">
                  <div className="mb-1.5 flex items-center gap-1.5 text-slate-400 sm:mb-2 sm:gap-2">
                    <BarChart3 size={13} />
                    <span className="text-[10px] font-black uppercase sm:text-xs">Answered</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">{totalAnswered}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950 sm:rounded-2xl sm:p-4">
                  <div className="mb-1.5 flex items-center gap-1.5 text-slate-400 sm:mb-2 sm:gap-2">
                    <Clock size={13} />
                    <span className="text-[10px] font-black uppercase sm:text-xs">Active</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
                    {sessions.filter((s) => s.status === 'IN_PROGRESS').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {isBasicLimited && (
          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <LockKeyhole size={18} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">Basic practice access</p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  You can open the first topic in each subject. Standard and Premium unlock every practice mode.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push('/dashboard/billing')}
              className="flex h-10 items-center justify-center rounded-2xl bg-[#0A9AE2] px-4 text-xs font-black text-white transition-colors hover:bg-[#0659AA]"
            >
              Upgrade
            </button>
          </div>
        )}

        {/* Weak areas banner */}
        {weakTopics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl border border-orange-200 bg-white shadow-sm dark:border-orange-900/50 dark:bg-slate-900"
          >
            <div className="flex flex-col gap-4 border-b border-orange-100 bg-orange-50 px-5 py-4 dark:border-orange-900/40 dark:bg-orange-950/20 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white">
                  <TrendingDown size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-orange-900 dark:text-orange-100 sm:text-base">
                  Weak areas need a quick hit
                  </h2>
                  <p className="text-xs font-bold text-orange-600/80 dark:text-orange-300/80">Practice the topics that are currently pulling your average down.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowWeakAreaModal(true); setWeakAreaError(null); }}
                disabled={isBasicLimited}
                className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 text-xs font-black text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
              >
                {isBasicLimited ? <LockKeyhole size={14} /> : <Zap size={14} />}
                {isBasicLimited ? 'Standard unlocks this' : 'Practice All Weak Areas'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 sm:gap-3 sm:p-4 md:grid-cols-2 lg:grid-cols-4">
              {weakTopics.map((p) => {
                const accessible = isTopicAccessible(p.topicId);
                return (
                <button
                  key={p.topicId}
                  type="button"
                  onClick={() => handleStartOrResume(p.topicId, p.topicName)}
                  disabled={!accessible}
                  className="group rounded-xl border border-orange-100 bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:shadow-none dark:border-orange-900/40 dark:bg-slate-950 dark:hover:border-orange-700 sm:rounded-2xl sm:p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <Target size={17} className="text-orange-500" />
                    <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-black text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                      {Math.round(p.scoreAvg)}%
                    </span>
                  </div>
                  <p className="line-clamp-2 min-h-10 text-sm font-black text-slate-900 dark:text-slate-100">{p.topicName}</p>
                  <p className="mt-3 flex items-center gap-1 text-xs font-black text-orange-500">
                    {accessible ? 'Start drill' : 'Basic locked'} {accessible ? <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" /> : <LockKeyhole size={14} />}
                  </p>
                </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Topics grid */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Subject tabs */}
          <div className="border-b border-slate-100 p-4 dark:border-slate-800 md:p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#0A9AE2]">Choose your arena</p>
                <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white sm:text-2xl">Topic practice</h2>
              </div>
              {selectedSubject && (
                <button
                  type="button"
                  onClick={() => handleStartSubject(selectedSubject.id, selectedSubject.name)}
                  disabled={isBasicLimited}
                  className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white transition-colors hover:bg-[#0A9AE2] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 dark:bg-white dark:text-slate-950 dark:hover:bg-[#0A9AE2] dark:hover:text-white dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
                >
                  {isBasicLimited ? <LockKeyhole size={15} /> : <Play size={15} />}
                  {isBasicLimited ? 'Standard unlocks subject practice' : `Practice ${selectedSubject.name}`}
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
            {subjects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSubjectId(s.id)}
                className={[
                  'min-h-9 whitespace-nowrap rounded-xl border px-3 text-xs font-black transition-all sm:min-h-11 sm:rounded-2xl sm:px-4 sm:text-sm',
                  selectedSubjectId === s.id
                    ? 'border-[#0A9AE2] bg-[#0A9AE2] text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-[#0A9AE2]/40 hover:text-[#0A9AE2] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300',
                ].join(' ')}
              >
                {s.name}
              </button>
            ))}
            </div>
          </div>

          {/* Subject-wide practice row */}
          {selectedSubjectId && (() => {
            const subj = subjects.find((s) => s.id === selectedSubjectId);
            return subj ? (
              <div className="grid gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40 md:grid-cols-[1fr_auto] md:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A9AE2]/10 text-[#0A9AE2]">
                    <BookMarked size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100">{subj.name}</p>
                    <p className="text-xs font-bold text-slate-400">
                      {subjectReadyTopics} ready topics - {subjectQuestionTotal} questions available
                    </p>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 md:w-44">
                  <div
                    className="h-full rounded-full bg-[#0A9AE2]"
                    style={{ width: `${topics.length > 0 ? (subjectReadyTopics / topics.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ) : null;
          })()}

          {/* Topics list */}
          <div className="grid gap-2 p-3 sm:gap-3 sm:p-4 md:grid-cols-2 xl:grid-cols-3">
            {isLoadingTopics ? (
              <div className="col-span-full flex min-h-72 items-center justify-center">
                <Loader2 size={28} className="animate-spin text-[#0A9AE2]" />
              </div>
            ) : topics.length === 0 ? (
              <div className="col-span-full flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm font-bold text-slate-400 dark:border-slate-800">No topics available</div>
            ) : (
              topics.map((topic) => {
                const perf = perfMap.get(topic.id);
                const inProgress = inProgressSessionMap.get(topic.id);
                const questionCount_ = topic._count?.questions ?? 0;
                const accessible = isTopicAccessible(topic.id);
                const score = perf?.scoreAvg ?? null;
                const scoreTone =
                  score === null ? 'text-slate-400' : score >= 70 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-500';

                return (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group flex min-h-40 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:border-[#0A9AE2]/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 sm:min-h-48 sm:p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-[#0A9AE2]/10 group-hover:text-[#0A9AE2] dark:bg-slate-800">
                          <Layers size={19} />
                        </div>
                        {!accessible ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            <LockKeyhole size={11} /> Basic
                          </span>
                        ) : inProgress ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            Continue
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            {questionCount_}Q
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-2 min-h-11 text-base font-black leading-snug text-slate-950 dark:text-white">
                        {topic.name}
                      </p>
                      <div className="mt-4">
                        {score !== null ? (
                          <ScoreBar score={score} />
                        ) : (
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                            <BarChart3 size={14} />
                            No score history yet
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Current score</p>
                        <p className={`text-lg font-black ${scoreTone}`}>{score !== null ? `${Math.round(score)}%` : '-'}</p>
                      </div>
                    {inProgress ? (
                      <button
                        type="button"
                        onClick={() => accessible && router.push(`/dashboard/practice/sessions/${inProgress.sessionId}`)}
                        disabled={!accessible}
                        className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 text-xs font-black text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
                      >
                        {accessible ? <Play size={14} /> : <LockKeyhole size={14} />}
                        {accessible ? 'Resume' : 'Locked'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartOrResume(topic.id, topic.name)}
                        disabled={questionCount_ === 0 || !accessible}
                        className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#0A9AE2] px-4 text-xs font-black text-white transition-colors hover:bg-[#0659AA] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {accessible ? <Zap size={14} /> : <LockKeyhole size={14} />}
                        {accessible ? 'Start' : 'Locked'}
                      </button>
                    )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Tutor Assignments */}
        {!isLoadingSessions && tutorSessions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList size={16} className="text-[#0A9AE2]" />
              <h2 className="text-base font-black text-slate-700 dark:text-slate-300">
                Assignments from Tutor
              </h2>
              {tutorSessions.filter((s) => s.status === 'IN_PROGRESS').length > 0 && (
                <span className="text-xs font-black bg-[#0A9AE2] text-white px-2 py-0.5 rounded-full">
                  {tutorSessions.filter((s) => s.status === 'IN_PROGRESS').length} pending
                </span>
              )}
            </div>
            <div className="space-y-2">
              {tutorSessions.map((s) => {
                const accessible = isTopicAccessible(s.topicId);
                return (
                <div
                  key={s.sessionId}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-[#0A9AE2]/20 px-5 py-4 flex items-center gap-4"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#0A9AE2]/10 flex items-center justify-center flex-shrink-0">
                    {s.status === 'COMPLETED' ? (
                      <CheckCircle2 size={18} className="text-green-500" />
                    ) : (
                      <Clock size={18} className="text-[#0A9AE2]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                      {s.topicName ?? s.subjectName ?? 'General Practice'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {s.subjectName && `${s.subjectName} - `}{s.questionCount}Q - {formatDate(s.startedAt)}
                    </p>
                  </div>
                  {s.status === 'COMPLETED' && s.scorePercent !== null && (
                    <span
                      className={[
                        'text-sm font-black px-2.5 py-1 rounded-lg',
                        s.scorePercent >= 70
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : s.scorePercent >= 50
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
                      ].join(' ')}
                    >
                      {Math.round(s.scorePercent)}%
                    </span>
                  )}
                  {s.status === 'IN_PROGRESS' && accessible && (
                    <span className="text-xs font-bold text-[#0A9AE2] bg-[#0A9AE2]/10 px-2.5 py-1 rounded-lg flex-shrink-0">
                      Pending
                    </span>
                  )}
                  {!accessible && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg flex-shrink-0 dark:bg-slate-800 dark:text-slate-300">
                      <LockKeyhole size={12} /> Basic limit
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!accessible) return;
                      router.push(
                        s.status === 'COMPLETED'
                          ? `/dashboard/practice/sessions/${s.sessionId}/result`
                          : `/dashboard/practice/sessions/${s.sessionId}`
                      );
                    }}
                    disabled={!accessible}
                    className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {accessible ? <ChevronRight size={16} /> : <LockKeyhole size={14} />}
                  </button>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        <div>
          <h2 className="text-base font-black text-slate-700 dark:text-slate-300 mb-3">Recent Sessions</h2>
          {isLoadingSessions ? (
            <div className="flex justify-center py-8">
              <Loader2 size={28} className="animate-spin text-[#0A9AE2]" />
            </div>
          ) : selfSessions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center text-slate-400 text-sm">
              No practice sessions yet. Start your first session above!
            </div>
          ) : (
            <div className="space-y-2">
              {selfSessions.map((s) => {
                const accessible = isTopicAccessible(s.topicId);
                return (
                <div
                  key={s.sessionId}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-5 py-4 flex items-center gap-4"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    {s.status === 'COMPLETED' ? (
                      <CheckCircle2 size={18} className="text-green-500" />
                    ) : (
                      <Clock size={18} className="text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                      {s.topicName
                        ?? (s.subjectName ? `${s.subjectName} - All Topics` : 'Mixed Practice')}
                    </p>
                    <p className="text-xs text-slate-400">
                      {s.subjectName && !s.topicName && `${s.subjectName} - `}
                      {s.questionCount}Q - {s.difficulty} - {formatDate(s.startedAt)}
                    </p>
                  </div>
                  {s.status === 'COMPLETED' && s.scorePercent !== null && (
                    <span
                      className={[
                        'text-sm font-black px-2.5 py-1 rounded-lg',
                        s.scorePercent >= 70
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : s.scorePercent >= 50
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
                      ].join(' ')}
                    >
                      {Math.round(s.scorePercent)}%
                    </span>
                  )}
                  {s.status === 'IN_PROGRESS' && accessible && (
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-2.5 py-1 rounded-lg">
                      In Progress
                    </span>
                  )}
                  {!accessible && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg dark:bg-slate-800 dark:text-slate-300">
                      <LockKeyhole size={12} /> Basic limit
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!accessible) return;
                      router.push(
                        s.status === 'COMPLETED'
                          ? `/dashboard/practice/sessions/${s.sessionId}/result`
                          : `/dashboard/practice/sessions/${s.sessionId}`
                      );
                    }}
                    disabled={!accessible}
                    className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {accessible ? <ChevronRight size={16} /> : <LockKeyhole size={14} />}
                  </button>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Start Practice Modal */}
      <AnimatePresence>
        {startModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => !isStarting && setStartModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-[#0A9AE2]/10 flex items-center justify-center">
                  <Layers size={18} className="text-[#0A9AE2]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    {startModal.kind === 'topic' ? 'Practice Topic' : 'Practice Subject'}
                  </p>
                  <p className="font-black text-slate-900 dark:text-white text-sm leading-tight">
                    {startModal.name}
                  </p>
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-500 mb-2">Difficulty</p>
                <div className="flex gap-2 flex-wrap">
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={[
                        'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border-2',
                        difficulty === d
                          ? 'border-[#0A9AE2] bg-[#0A9AE2]/10 text-[#0A9AE2]'
                          : `border-transparent ${DIFFICULTY_COLORS[d]}`,
                      ].join(' ')}
                    >
                      {d === 'ALL' ? 'All levels' : d.charAt(0) + d.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question count */}
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-500 mb-2">Questions</p>
                <div className="flex gap-2">
                  {COUNT_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setQuestionCount(c)}
                      className={[
                        'flex-1 py-2 rounded-xl text-sm font-black transition-all border-2',
                        questionCount === c
                          ? 'border-[#0A9AE2] bg-[#0A9AE2]/10 text-[#0A9AE2]'
                          : 'border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-200 dark:hover:border-slate-600',
                      ].join(' ')}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="mb-5 space-y-2.5">
                <p className="text-xs font-bold text-slate-500">Filters</p>
                <Toggle
                  enabled={excludeCompleted}
                  onToggle={() => setExcludeCompleted((v) => !v)}
                  label="Skip questions I already mastered"
                />
                <Toggle
                  enabled={incorrectOnly}
                  onToggle={() => setIncorrectOnly((v) => !v)}
                  label="Only show questions I got wrong before"
                />
              </div>

              {startError && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span className="flex-1">{startError}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStartModal(null)}
                  disabled={isStarting}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStart}
                  disabled={isStarting}
                  className="flex-1 py-3 rounded-2xl bg-[#0A9AE2] hover:bg-[#0659AA] text-white text-sm font-black transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isStarting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RotateCcw size={14} />
                  )}
                  {isStarting ? 'Starting...' : 'Start'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weak Area Modal */}
      <AnimatePresence>
        {showWeakAreaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => !isStartingWeakArea && setShowWeakAreaModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Zap size={18} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Adaptive Practice
                  </p>
                  <p className="font-black text-slate-900 dark:text-white text-sm leading-tight">
                    Practice All Weak Areas
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Questions are automatically selected from your weakest topics across all subjects.
              </p>

              {/* Question count */}
              <div className="mb-5">
                <p className="text-xs font-bold text-slate-500 mb-2">Questions</p>
                <div className="flex gap-2">
                  {COUNT_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setWeakAreaCount(c)}
                      className={[
                        'flex-1 py-2 rounded-xl text-sm font-black transition-all border-2',
                        weakAreaCount === c
                          ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                          : 'border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-200 dark:hover:border-slate-600',
                      ].join(' ')}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {weakAreaError && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span className="flex-1">{weakAreaError}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWeakAreaModal(false)}
                  disabled={isStartingWeakArea}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartWeakArea}
                  disabled={isStartingWeakArea}
                  className="flex-1 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-black transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isStartingWeakArea ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Zap size={14} />
                  )}
                  {isStartingWeakArea ? 'Starting...' : 'Start'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

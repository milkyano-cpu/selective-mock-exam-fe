'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Trophy,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  BookOpen,
  Clock,
  Target,
} from 'lucide-react';
import { practiceService } from '@/features/practice/services/practice.service';
import { QuestionLatexRenderer } from '@/components/ui/QuestionLatexRenderer';
import type { PracticeSessionDetail, PracticeResultAnswer, QuestionCount } from '@/features/practice/types/practice.types';

function ScoreRing({ percent }: { percent: number }) {
  const r = 48;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * (1 - percent / 100);

  const color = percent >= 70 ? '#22c55e' : percent >= 50 ? '#f59e0b' : '#f87171';

  return (
    <div className="relative h-28 w-28 shrink-0 sm:h-36 sm:w-36">
      <div className="absolute inset-2 rounded-full bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.12)] dark:bg-slate-900" />
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dash}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">{Math.round(percent)}%</span>
        <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">score</span>
      </div>
    </div>
  );
}

function formatDuration(seconds: number) {
  if (seconds <= 0) return '0s';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
}

function getScoreTone(percent: number) {
  if (percent >= 70) {
    return {
      title: 'Strong finish',
      note: 'You are building real command here.',
      badge: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/60',
      progress: 'bg-emerald-500',
    };
  }
  if (percent >= 50) {
    return {
      title: 'Getting warmer',
      note: 'Review the misses, then run it back.',
      badge: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/60',
      progress: 'bg-amber-500',
    };
  }
  return {
    title: 'Practice logged',
    note: 'The review below shows exactly where to tighten up.',
    badge: 'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900/60',
    progress: 'bg-rose-500',
  };
}

function AnswerCard({ answer, index }: { answer: PracticeResultAnswer; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={[
        'rounded-2xl border p-4 transition-all',
        answer.isCorrect
          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30'
          : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {answer.isCorrect ? (
            <CheckCircle2 size={18} className="text-green-500" />
          ) : (
            <XCircle size={18} className="text-red-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-snug line-clamp-2">
            <span className="font-black text-slate-500 mr-1">Q{index + 1}.</span>
            <QuestionLatexRenderer text={answer.questionText} latexEnabled={answer.latexEnabled} />
          </p>

          <div className="flex flex-wrap gap-3 mt-2 text-xs font-bold">
            <span className="text-slate-500">
              Your answer:{' '}
              <span className={answer.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-500'}>
                {answer.studentAnswer || <em className="font-normal text-slate-400">skipped</em>}
              </span>
            </span>
            {!answer.isCorrect && (
              <span className="text-slate-500">
                Correct: <span className="text-green-600 dark:text-green-400">{answer.correctAnswer}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-slate-500">
              <Clock size={11} />
              {formatDuration(answer.timeSpentSeconds)}
            </span>
          </div>

          {answer.explanation && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 mt-2 text-xs font-bold text-[#0A9AE2] hover:text-[#0659AA] transition-colors"
            >
              <BookOpen size={11} />
              Explanation
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          )}

          {expanded && answer.explanation && (
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white/60 dark:bg-slate-800/60 rounded-xl p-3">
              <QuestionLatexRenderer text={answer.explanation} latexEnabled={answer.latexEnabled} fallbackClassName="whitespace-pre-wrap" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PracticeResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [session, setSession] = useState<PracticeSessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const loadSession = useCallback(async () => {
    try {
      const res = await practiceService.getSession(sessionId);
      if (!res.success) {
        setError('Failed to load results');
        return;
      }
      if (res.data.status === 'IN_PROGRESS') {
        router.replace(`/dashboard/practice/sessions/${sessionId}`);
        return;
      }
      setSession(res.data);
    } catch {
      setError('Failed to load results');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSession();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSession]);

  const handlePracticeAgain = async () => {
    if (isRetrying || !session) return;
    if (session.sourceType === 'PATHWAY') {
      router.push('/dashboard/practice');
      return;
    }
    setIsRetrying(true);
    try {
      if (session.sourceType === 'TUTOR_ASSIGNED') {
        // Retake with the same questions the tutor assigned
        const res = await practiceService.retake(session.sessionId);
        if (res.success) {
          router.push(`/dashboard/practice/sessions/${res.data.sessionId}`);
        }
      } else {
        if (!session.topicId && !session.subjectId) return;
        const res = await practiceService.start({
          topicId: session.topicId ?? undefined,
          subjectId: !session.topicId ? (session.subjectId ?? undefined) : undefined,
          difficulty: session.difficulty,
          questionCount: (session.questionCount as QuestionCount) ?? 10,
        });
        if (res.success) {
          router.push(`/dashboard/practice/sessions/${res.data.sessionId}`);
        }
      }
    } finally {
      setIsRetrying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 animate-pulse p-4">
        <div className="rounded-3xl border border-slate-200/60 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-7 w-40 rounded-lg bg-slate-200/70 dark:bg-slate-800" />
              <div className="h-4 w-56 rounded bg-slate-100 dark:bg-slate-800/60" />
            </div>
            <div className="h-20 w-20 rounded-full bg-slate-200/70 dark:bg-slate-800" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl border border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !session || !session.answers) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center gap-4">
        <AlertCircle size={36} className="text-red-400" />
        <p className="text-slate-600 dark:text-slate-300">{error ?? 'Results not available'}</p>
        <button
          type="button"
          onClick={() => router.push('/dashboard/practice')}
          className="px-5 py-2.5 rounded-xl bg-[#0A9AE2] text-white font-bold text-sm"
        >
          Back to Practice
        </button>
      </div>
    );
  }

  const answers: PracticeResultAnswer[] = session.answers;
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalQuestions = answers.length;
  const scorePercent = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const startedAtMs = new Date(session.startedAt).getTime();
  const endedAtMs = session.endedAt ? new Date(session.endedAt).getTime() : Number.NaN;
  const totalSessionSeconds = Number.isFinite(startedAtMs) && Number.isFinite(endedAtMs)
    ? Math.max(0, Math.round((endedAtMs - startedAtMs) / 1000))
    : 0;
  const scoreTone = getScoreTone(scorePercent);
  const practiceName = session.topicName
    ?? (session.subjectName ? `${session.subjectName} - All Topics` : 'Mixed Practice');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-3 sm:p-4 md:p-8">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => router.push('/dashboard/practice')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        {/* Score card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-[#0f172a] shadow-[0_24px_70px_rgba(15,23,42,0.12)] dark:border-slate-800 sm:mb-8 sm:rounded-[1.75rem]"
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a_0%,#12304a_52%,#075985_100%)]" />
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0A9AE2] via-emerald-400 to-amber-300" />
          <div className="relative p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-cyan-200 ring-1 ring-white/15 sm:h-12 sm:w-12">
                  <Trophy size={22} className="sm:hidden" />
                  <Trophy size={27} className="hidden sm:block" />
                </div>
                <div>
                  <h2 className="text-xl font-black leading-tight text-white sm:text-3xl">Practice Complete</h2>
                  <p className="mt-0.5 text-xs font-bold text-cyan-100/70 sm:mt-1 sm:text-sm">{practiceName}</p>
                </div>
              </div>

              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-black text-white ring-1 ring-white/15 sm:text-xs">
                <Target size={13} />
                {scoreTone.title}
              </span>
            </div>

            <div className="mt-5 grid gap-4 rounded-2xl bg-white p-3.5 shadow-xl shadow-slate-950/20 dark:bg-slate-950 sm:mt-6 sm:gap-5 sm:rounded-3xl sm:p-5 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
              <div className="flex justify-center sm:justify-start">
                <ScoreRing percent={scorePercent} />
              </div>

              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    {session.difficulty === 'ALL' ? 'All difficulties' : session.difficulty}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    {totalQuestions} questions
                  </span>
                </div>

                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
                      {correctCount}
                      <span className="text-base text-slate-400 sm:text-lg"> / {totalQuestions}</span>
                    </p>
                    <p className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-slate-400 sm:text-xs">questions correct</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-950 dark:text-white sm:text-2xl">{formatDuration(totalSessionSeconds)}</p>
                    <p className="mt-0.5 flex items-center justify-end gap-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400 sm:text-xs">
                      <Clock size={12} />
                      Total time
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wide text-slate-400">
                    <span>Accuracy</span>
                    <span>{Math.round(scorePercent)}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className={`h-full rounded-full ${scoreTone.progress}`} style={{ width: `${scorePercent}%` }} />
                  </div>
                </div>

                <p className="mt-3 text-sm font-medium leading-5 text-slate-500 dark:text-slate-400">{scoreTone.note}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/practice')}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 text-sm font-black text-white ring-1 ring-white/15 transition-colors hover:bg-white/15"
            >
              <ArrowLeft size={14} />
              Back to Practice
            </button>
            {session.sourceType !== 'PATHWAY' && (
              <button
                type="button"
                onClick={handlePracticeAgain}
                disabled={isRetrying || (session.sourceType !== 'TUTOR_ASSIGNED' && !session.topicId && !session.subjectId)}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/30 transition-colors hover:bg-cyan-300 disabled:opacity-60"
              >
                {isRetrying ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RotateCcw size={14} />
                )}
                {isRetrying ? 'Starting...' : 'Practice Again'}
              </button>
            )}
          </div>
          </div>
        </motion.div>

        {/* Answer review */}
        <div>
          <h3 className="text-base font-black text-slate-700 dark:text-slate-300 mb-3">
            Answer Review
          </h3>
          <div className="space-y-3">
            {answers.map((answer, idx) => (
              <motion.div
                key={answer.questionId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <AnswerCard answer={answer} index={idx} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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
} from 'lucide-react';
import { practiceService } from '@/features/practice/services/practice.service';
import { QuestionLatexRenderer } from '@/components/ui/QuestionLatexRenderer';
import type { PracticeSessionDetail, PracticeResultAnswer, QuestionCount } from '@/features/practice/types/practice.types';

function ScoreRing({ percent }: { percent: number }) {
  const r = 50;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * (1 - percent / 100);

  const color = percent >= 70 ? '#22c55e' : percent >= 50 ? '#f59e0b' : '#f87171';

  return (
    <div className="relative w-32 h-32 mx-auto">
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
        <span className="text-3xl font-black text-slate-900 dark:text-white">{Math.round(percent)}%</span>
        <span className="text-xs text-slate-400">score</span>
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
            <QuestionLatexRenderer text={answer.contentText} latex={answer.contentLatex} isLatexFormat={answer.isLatexFormat} />
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
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white/60 dark:bg-slate-800/60 rounded-xl p-3">
              {answer.explanation}
            </p>
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
    loadSession();
  }, [loadSession]);

  const handlePracticeAgain = async () => {
    if (isRetrying) return;
    if (session?.sourceType === 'TUTOR_ASSIGNED') {
      router.push('/dashboard/practice');
      return;
    }
    if (!session?.topicId && !session?.subjectId) return;
    setIsRetrying(true);
    try {
      const res = await practiceService.start({
        topicId: session.topicId ?? undefined,
        subjectId: !session.topicId ? (session.subjectId ?? undefined) : undefined,
        difficulty: session.difficulty,
        questionCount: (session.questionCount as QuestionCount) ?? 10,
      });
      if (res.success) {
        router.push(`/dashboard/practice/sessions/${res.data.sessionId}`);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 size={40} className="animate-spin text-[#0A9AE2]" />
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
  const summedQuestionTime = answers.reduce((sum, answer) => sum + answer.timeSpentSeconds, 0);
  const startedAtMs = new Date(session.startedAt).getTime();
  const endedAtMs = session.endedAt ? new Date(session.endedAt).getTime() : Number.NaN;
  const elapsedSeconds = Number.isFinite(startedAtMs) && Number.isFinite(endedAtMs)
    ? Math.max(0, Math.round((endedAtMs - startedAtMs) / 1000))
    : 0;
  const totalSessionSeconds = elapsedSeconds || summedQuestionTime;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">

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
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-8 text-center mb-6"
        >
          <div className="w-14 h-14 rounded-full bg-[#0A9AE2]/10 flex items-center justify-center mx-auto mb-3">
            <Trophy size={28} className="text-[#0A9AE2]" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Practice Complete!</h2>
          <p className="text-sm text-slate-400 mb-1">
            {session.topicName
              ?? (session.subjectName ? `${session.subjectName} — All Topics` : 'Mixed Practice')}
          </p>
          <p className="text-xs text-slate-400 mb-6">
            {session.difficulty === 'ALL' ? 'All difficulties' : session.difficulty} · {totalQuestions} questions
          </p>

          <ScoreRing percent={scorePercent} />

          <p className="text-slate-600 dark:text-slate-300 text-sm mt-5">
            <span className="font-black text-[#0A9AE2]">{correctCount}</span>{' '}
            of{' '}
            <span className="font-black">{totalQuestions}</span>{' '}
            questions correct
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="mb-2 flex items-center justify-center gap-2 text-slate-400">
                <Clock size={15} />
                <span className="text-xs font-black uppercase tracking-wide">Total session time</span>
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100">{formatDuration(totalSessionSeconds)}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="mb-2 flex items-center justify-center gap-2 text-slate-400">
                <Clock size={15} />
                <span className="text-xs font-black uppercase tracking-wide">Tracked question time</span>
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100">{formatDuration(summedQuestionTime)}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => router.push('/dashboard/practice')}
              className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} />
              Back to Practice
            </button>
            {session.sourceType !== 'TUTOR_ASSIGNED' && (
              <button
                type="button"
                onClick={handlePracticeAgain}
                disabled={isRetrying || (!session.topicId && !session.subjectId)}
                className="flex-1 py-3 rounded-2xl bg-[#0A9AE2] hover:bg-[#0659AA] text-white text-sm font-black transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isRetrying ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RotateCcw size={14} />
                )}
                {isRetrying ? 'Starting…' : 'Practice Again'}
              </button>
            )}
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

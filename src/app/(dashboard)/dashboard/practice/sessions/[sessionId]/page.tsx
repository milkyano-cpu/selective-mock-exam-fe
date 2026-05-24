'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  BookOpen,
  AlertCircle,
  Trophy,
  XCircle,
  Clock,
  Zap,
  Star,
  Crown,
} from 'lucide-react';
import { practiceService } from '@/features/practice/services/practice.service';
import { QuestionLatexRenderer } from '@/components/ui/QuestionLatexRenderer';
import type {
  PracticeSessionDetail,
  PracticeQuestion,
  AnswerPayload,
} from '@/features/practice/types/practice.types';

type AnswerState = Record<string, string>;
type TimeSpentState = Record<string, number>;

const DIFFICULTY_COLORS = {
  EASY: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HARD: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// Speed thresholds per difficulty (seconds) — answer must be correct AND under this time
const SPEED_THRESHOLD: Record<string, number> = {
  EASY: 15,
  MEDIUM: 30,
  HARD: 45,
};

interface StreakTier {
  threshold: number;
  icon: 'flame' | 'zap' | 'star' | 'crown';
  label: string;
  message: string;
  gradient: string;
  iconBg: string;
}

const STREAK_TIERS: StreakTier[] = [
  { threshold: 3, icon: 'flame', label: 'Nice streak!', message: '3 fast & correct in a row', gradient: 'from-amber-500 to-orange-500', iconBg: 'bg-white/20' },
  { threshold: 5, icon: 'zap', label: "You're on fire!", message: '5 fast & correct in a row', gradient: 'from-orange-500 to-red-500', iconBg: 'bg-white/20' },
  { threshold: 8, icon: 'star', label: 'Unstoppable!', message: '8 fast & correct in a row', gradient: 'from-red-500 to-pink-600', iconBg: 'bg-white/25' },
  { threshold: 12, icon: 'crown', label: 'Legendary!', message: '12 fast & correct in a row', gradient: 'from-purple-500 to-indigo-600', iconBg: 'bg-white/25' },
];

function getStreakTier(count: number): StreakTier | null {
  for (let i = STREAK_TIERS.length - 1; i >= 0; i--) {
    if (count >= STREAK_TIERS[i].threshold) return STREAK_TIERS[i];
  }
  return null;
}

function StreakIcon({ icon, size = 20 }: { icon: StreakTier['icon']; size?: number }) {
  const cls = 'text-white';
  switch (icon) {
    case 'flame': return <Trophy size={size} className={cls} />;
    case 'zap': return <Zap size={size} className={cls} />;
    case 'star': return <Star size={size} className={cls} />;
    case 'crown': return <Crown size={size} className={cls} />;
  }
}

function formatDuration(seconds: number) {
  if (seconds <= 0) return '0s';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
}

export default function PracticeSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [session, setSession] = useState<PracticeSessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [submittedSet, setSubmittedSet] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [streak, setStreak] = useState(0);
  const [activeToast, setActiveToast] = useState<StreakTier | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentQuestionElapsed, setCurrentQuestionElapsed] = useState(0);

  // Track time spent per question
  const questionStartTime = useRef<number>(0);
  const timeSpentMap = useRef<TimeSpentState>({});
  const hasActiveTiming = useRef(false);
  const sessionRef = useRef<PracticeSessionDetail | null>(null);
  const currentIdxRef = useRef(0);
  const submittedSetRef = useRef<Set<string>>(new Set());

  const STORAGE_KEY = `practice_answers_${sessionId}`;
  const TIME_STORAGE_KEY = `${STORAGE_KEY}_times`;
  const questionCount = session?.questions.length ?? 1;

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    currentIdxRef.current = currentIdx;
  }, [currentIdx]);

  useEffect(() => {
    submittedSetRef.current = submittedSet;
  }, [submittedSet]);

  const persistTimes = useCallback(() => {
    try {
      localStorage.setItem(TIME_STORAGE_KEY, JSON.stringify(timeSpentMap.current));
    } catch {}
  }, [TIME_STORAGE_KEY]);

  const startCurrentQuestionTimer = useCallback(() => {
    const activeSession = sessionRef.current;
    const currentQuestion = activeSession?.questions[currentIdxRef.current];
    questionStartTime.current = Date.now();
    hasActiveTiming.current = Boolean(
      currentQuestion && !submittedSetRef.current.has(currentQuestion.questionId)
    );
    setCurrentQuestionElapsed(currentQuestion ? timeSpentMap.current[currentQuestion.questionId] ?? 0 : 0);
  }, []);

  const recordCurrentQuestionTime = useCallback(() => {
    const activeSession = sessionRef.current;
    const currentQuestion = activeSession?.questions[currentIdxRef.current];
    if (!currentQuestion || submittedSetRef.current.has(currentQuestion.questionId) || !hasActiveTiming.current) {
      return;
    }

    const elapsed = Math.max(0, Math.floor((Date.now() - questionStartTime.current) / 1000));
    if (elapsed > 0) {
      timeSpentMap.current[currentQuestion.questionId] =
        (timeSpentMap.current[currentQuestion.questionId] ?? 0) + elapsed;
      persistTimes();
    }
    questionStartTime.current = Date.now();
    hasActiveTiming.current = false;
    setCurrentQuestionElapsed(timeSpentMap.current[currentQuestion.questionId] ?? 0);
  }, [persistTimes]);

  const loadSession = useCallback(async () => {
    try {
      const res = await practiceService.getSession(sessionId);
      if (!res.success) {
        setError('Failed to load practice session');
        return;
      }
      if (res.data.status === 'COMPLETED') {
        router.replace(`/dashboard/practice/sessions/${sessionId}/result`);
        return;
      }
      setSession(res.data);

      // Restore answers from localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AnswerState;
          setAnswers(parsed);
        }
        const storedSubmitted = localStorage.getItem(`${STORAGE_KEY}_submitted`);
        if (storedSubmitted) {
          const parsedSet = new Set<string>(JSON.parse(storedSubmitted));
          setSubmittedSet(parsedSet);
          // Fast forward to first unanswered question
          const firstUnanswered = res.data.questions.findIndex(q => !parsedSet.has(q.questionId));
          if (firstUnanswered !== -1) {
            setCurrentIdx(firstUnanswered);
          }
        }
        const storedTimes = localStorage.getItem(TIME_STORAGE_KEY);
        if (storedTimes) {
          timeSpentMap.current = JSON.parse(storedTimes) as TimeSpentState;
        }
      } catch {
        // ignore parse errors
      }
    } catch {
      setError('Failed to load practice session');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, router, STORAGE_KEY, TIME_STORAGE_KEY]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!session) return;
    startCurrentQuestionTimer();
  }, [currentIdx, session, submittedSet, startCurrentQuestionTimer]);

  useEffect(() => {
    if (!session) return;

    const timer = window.setInterval(() => {
      const currentQuestion = sessionRef.current?.questions[currentIdxRef.current];
      if (!currentQuestion || !hasActiveTiming.current) return;
      const stored = timeSpentMap.current[currentQuestion.questionId] ?? 0;
      const activeElapsed = Math.max(0, Math.floor((Date.now() - questionStartTime.current) / 1000));
      setCurrentQuestionElapsed(stored + activeElapsed);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [session]);

  useEffect(() => {
    const pauseTimer = () => recordCurrentQuestionTime();
    const resumeTimer = () => {
      if (document.visibilityState === 'visible') startCurrentQuestionTimer();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') pauseTimer();
      else resumeTimer();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', pauseTimer);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', pauseTimer);
    };
  }, [recordCurrentQuestionTime, startCurrentQuestionTimer]);

  const handleNextQuestion = useCallback(() => {
    setCurrentIdx((i) => Math.min(questionCount - 1, i + 1));
  }, [questionCount]);

  const handleAnswer = (questionId: string, optionKey: string) => {
    if (submittedSet.has(questionId)) return;
    const next = { ...answers, [questionId]: optionKey };
    setAnswers(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const handleSubmitQuestion = () => {
    const q = session?.questions[currentIdx];
    if (!q || !answers[q.questionId]) return;

    recordCurrentQuestionTime();

    const nextSubmitted = new Set(submittedSet);
    nextSubmitted.add(q.questionId);
    setSubmittedSet(nextSubmitted);

    const isEssay = q.type === 'ESSAY';
    const isCorrect = !isEssay && answers[q.questionId] === q.correctAnswer;
    const timeSpent = timeSpentMap.current[q.questionId] ?? 0;
    const speedLimit = SPEED_THRESHOLD[q.difficulty] ?? 30;

    if (!isEssay && isCorrect && timeSpent <= speedLimit) {
      const newStreak = streak + 1;
      setStreak(newStreak);

      // Check if we hit a new tier milestone
      const tier = getStreakTier(newStreak);
      if (tier && tier.threshold === newStreak) {
        // Clear previous toast timer
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setActiveToast(tier);
        toastTimer.current = setTimeout(() => {
          setActiveToast(null);
          toastTimer.current = null;
        }, 3000);
      }
    } else if (!isEssay) {
      setStreak(0);
    }

    try {
      localStorage.setItem(`${STORAGE_KEY}_submitted`, JSON.stringify(Array.from(nextSubmitted)));
    } catch {}
  };

  const handleSubmit = async () => {
    if (!session || isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirm(false);

    // Record time for current question if not yet submitted
    const currentQuestion = session.questions[currentIdx];
    if (currentQuestion && !submittedSet.has(currentQuestion.questionId)) {
      recordCurrentQuestionTime();
    }

    const submittedAnswers: AnswerPayload[] = session.questions.map((q) => ({
      questionId: q.questionId,
      studentAnswer: answers[q.questionId] ?? '',
      timeSpentSeconds: timeSpentMap.current[q.questionId] ?? 0,
    })).filter((a) => a.studentAnswer !== '');

    if (submittedAnswers.length === 0) {
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await practiceService.submit(sessionId, { answers: submittedAnswers });
      if (res.success) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(`${STORAGE_KEY}_submitted`);
        localStorage.removeItem(TIME_STORAGE_KEY);
        router.push(`/dashboard/practice/sessions/${sessionId}/result`);
      }
    } catch {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 animate-pulse p-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 rounded-lg bg-slate-200/70 dark:bg-slate-800" />
          <div className="h-8 w-20 rounded-xl bg-slate-200/70 dark:bg-slate-800" />
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="h-4 w-16 rounded bg-slate-200/70 dark:bg-slate-700" />
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
            <div className="h-4 w-5/6 rounded bg-slate-100 dark:bg-slate-800/60" />
          </div>
          <div className="space-y-2 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/30" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center gap-4">
        <AlertCircle size={36} className="text-red-400" />
        <p className="text-slate-600 dark:text-slate-300">{error ?? 'Session not found'}</p>
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

  const questions = session.questions;
  const totalQuestions = questions.length;
  const currentQuestion: PracticeQuestion = questions[currentIdx];
  const answeredCount = Object.keys(answers).filter((k) =>
    questions.some((q) => q.questionId === k)
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => router.push('/dashboard/practice')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold transition-colors"
          >
            <ArrowLeft size={16} />
            Exit
          </button>
          <div className="flex items-center gap-3">
            {streak >= 2 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-2.5 py-1 text-xs font-black text-orange-600 dark:from-amber-900/30 dark:to-orange-900/30 dark:text-orange-400">
                <Zap size={12} />
                {streak}x
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
              <Clock size={13} />
              {formatDuration(currentQuestionElapsed)}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {answeredCount} / {totalQuestions} answered
            </span>
            <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0A9AE2] rounded-full transition-all duration-300"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question dot indicators */}
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {questions.map((q, idx) => (
            <div
              key={q.questionId}
              className={[
                'w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center',
                idx === currentIdx
                  ? 'bg-[#0A9AE2] text-white scale-110 shadow-md'
                  : submittedSet.has(q.questionId)
                  ? (q.type === 'ESSAY' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : answers[q.questionId] === q.correctAnswer ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30')
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500',
              ].join(' ')}
            >
              {idx + 1}
            </div>
          ))}
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 mb-4"
          >
            {/* Topic + difficulty badge */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-[#0A9AE2]/10 flex items-center justify-center">
                <BookOpen size={12} className="text-[#0A9AE2]" />
              </div>
              <span className="text-xs font-bold text-[#0A9AE2] uppercase tracking-wide">
                {session.topicName}
              </span>
              <span
                className={[
                  'ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full',
                  DIFFICULTY_COLORS[currentQuestion.difficulty],
                ].join(' ')}
              >
                {currentQuestion.difficulty}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Q{currentIdx + 1}/{totalQuestions}
              </span>
            </div>

            {/* Passage */}
            {currentQuestion.passage && (() => {
              const pos = currentQuestion.passage.imageDisplayPosition ?? 'below';
              const hasImage = !!currentQuestion.passage.image?.url;
              const hasText = !!currentQuestion.passage.text;

              const imageBlock = hasImage ? (
                <figure className={pos === 'above' ? 'mb-3' : 'mt-3'}>
                  <img
                    src={currentQuestion.passage.image!.url!}
                    alt={currentQuestion.passage.image!.altText || currentQuestion.passage.image!.fileName}
                    className="max-h-64 rounded-xl border border-blue-100 object-contain dark:border-blue-900/40"
                  />
                  {currentQuestion.passage.image!.caption && (
                    <figcaption className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {currentQuestion.passage.image!.caption}
                    </figcaption>
                  )}
                </figure>
              ) : null;

              const textBlock = hasText ? (
                <div className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                  <QuestionLatexRenderer
                    text={currentQuestion.passage.text!}
                    latexEnabled={currentQuestion.latexEnabled}
                    fallbackClassName="whitespace-pre-wrap"
                  />
                </div>
              ) : null;

              return (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-900/10 mb-4">
                  {currentQuestion.passage.title && (
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                      {currentQuestion.passage.title}
                    </p>
                  )}
                  {pos === 'above' && imageBlock}
                  {pos === 'above' && textBlock}
                  {pos === 'inline' && (hasImage && hasText ? (
                    <div className="flex gap-4">
                      <div className="shrink-0">{imageBlock}</div>
                      <div className="flex-1">{textBlock}</div>
                    </div>
                  ) : (<>{textBlock}{imageBlock}</>))}
                  {pos === 'below' && textBlock}
                  {pos === 'below' && imageBlock}
                </div>
              );
            })()}

            {/* Question text */}
            <div className="text-slate-800 dark:text-slate-100 font-semibold text-base leading-relaxed mb-6">
              <QuestionLatexRenderer
                text={currentQuestion.questionText}
                latexEnabled={currentQuestion.latexEnabled}
              />
            </div>

            {currentQuestion.type === 'ESSAY' && currentQuestion.promptText && (
              <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-medium leading-relaxed text-slate-700 dark:border-blue-900/40 dark:bg-blue-900/10 dark:text-slate-300">
                <QuestionLatexRenderer text={currentQuestion.promptText} latexEnabled={currentQuestion.latexEnabled} fallbackClassName="whitespace-pre-wrap" />
              </div>
            )}

            {/* Images */}
            {currentQuestion.images?.length > 0 && (
              <div className="mb-4 space-y-3">
                {currentQuestion.images.map((img, i) => (
                  img.url ? (
                    <figure key={`${img.fileName}-${i}`}>
                      <img
                        src={img.url}
                        alt={img.altText || img.fileName}
                        className="w-full rounded-xl border border-slate-100 object-contain dark:border-slate-700"
                      />
                      {img.caption && (
                        <figcaption className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                          {img.caption}
                        </figcaption>
                      )}
                    </figure>
                  ) : null
                ))}
              </div>
            )}

            {/* MCQ Options */}
            {currentQuestion.type === 'MCQ' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((opt) => {
                  const isSelected = answers[currentQuestion.questionId] === opt.key;
                  const isSubmitted = submittedSet.has(currentQuestion.questionId);
                  const isCorrectAnswer = currentQuestion.correctAnswer === opt.key;

                  let buttonStyles = 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200';
                  let iconStyles = 'bg-slate-100 dark:bg-slate-700 text-slate-500';

                  if (isSubmitted) {
                    if (isCorrectAnswer) {
                      buttonStyles = 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-300 shadow-sm';
                      iconStyles = 'bg-emerald-500 text-white';
                    } else if (isSelected && !isCorrectAnswer) {
                      buttonStyles = 'border-rose-400 bg-rose-50/50 dark:bg-rose-900/10 text-rose-800 dark:text-rose-300 opacity-70';
                      iconStyles = 'bg-rose-500 text-white';
                    } else {
                      buttonStyles = 'border-slate-100 dark:border-slate-800 text-slate-400 opacity-50';
                    }
                  } else if (isSelected) {
                    buttonStyles = 'border-[#0A9AE2] bg-[#0A9AE2]/5 text-[#0659AA] dark:text-[#0A9AE2]';
                    iconStyles = 'bg-[#0A9AE2] text-white';
                  }

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleAnswer(currentQuestion.questionId, opt.key)}
                      disabled={isSubmitted}
                      className={[
                        'w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-150',
                        buttonStyles,
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'w-7 h-7 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 transition-all',
                          iconStyles,
                        ].join(' ')}
                      >
                        {isSubmitted && isCorrectAnswer ? (
                          <CheckCircle2 size={14} />
                        ) : isSubmitted && isSelected && !isCorrectAnswer ? (
                          <XCircle size={14} />
                        ) : isSelected ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          opt.key
                        )}
                      </span>
                      <span className="text-sm font-medium">
                        <QuestionLatexRenderer text={opt.text} latexEnabled={currentQuestion.latexEnabled} />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'ESSAY' && (
              <textarea
                value={answers[currentQuestion.questionId] ?? ''}
                onChange={(event) => handleAnswer(currentQuestion.questionId, event.target.value)}
                disabled={submittedSet.has(currentQuestion.questionId)}
                rows={10}
                placeholder="Write your response..."
                className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 text-sm font-medium leading-relaxed text-slate-800 outline-none transition-all focus:border-[#0A9AE2] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            )}

            {/* Inline Result Text */}
            {currentQuestion.type === 'MCQ' && submittedSet.has(currentQuestion.questionId) && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 flex items-center gap-2"
              >
                {answers[currentQuestion.questionId] === currentQuestion.correctAnswer ? (
                  <CheckCircle2 size={20} className="text-emerald-500" />
                ) : (
                  <XCircle size={20} className="text-rose-500" />
                )}
                <h4
                  className={[
                    'font-black text-base',
                    answers[currentQuestion.questionId] === currentQuestion.correctAnswer
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400',
                  ].join(' ')}
                >
                  {answers[currentQuestion.questionId] === currentQuestion.correctAnswer
                    ? 'Correct Answer!'
                    : 'Incorrect Answer!'}
                </h4>
              </motion.div>
            )}

            {/* Explanation box after submission */}
            {currentQuestion.type === 'MCQ' && submittedSet.has(currentQuestion.questionId) && currentQuestion.explanation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-5 rounded-2xl bg-blue-50/80 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800"
              >
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-bold text-blue-900 dark:text-blue-300">Explanation</span>
                </div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  <QuestionLatexRenderer text={currentQuestion.explanation} latexEnabled={currentQuestion.latexEnabled} />
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation / Action */}
        <div className="flex items-center justify-end">
          {!submittedSet.has(currentQuestion.questionId) ? (
            <button
              type="button"
              onClick={handleSubmitQuestion}
              disabled={!answers[currentQuestion.questionId]}
              className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-[#0A9AE2] hover:bg-[#0659AA] text-white text-sm font-bold transition-colors disabled:opacity-50"
            >
              Submit Answer
            </button>
          ) : currentIdx < totalQuestions - 1 ? (
            <button
              type="button"
              onClick={handleNextQuestion}
              className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold transition-colors dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              Next Question
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowConfirm(true);
              }}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black disabled:opacity-60 transition-colors shadow-lg shadow-emerald-500/30"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {isSubmitting ? 'Finishing…' : 'Finish Practice'}
            </button>
          )}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#0A9AE2]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-[#0A9AE2]" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">Submit practice?</h3>
              <p className="text-sm text-slate-400 mb-5">
                You have answered <strong className="text-slate-700 dark:text-slate-200">{answeredCount}</strong> of{' '}
                <strong className="text-slate-700 dark:text-slate-200">{totalQuestions}</strong> questions.
                {answeredCount < totalQuestions && (
                  <span className="block mt-1 text-amber-500 font-semibold">
                    {totalQuestions - answeredCount} unanswered question{totalQuestions - answeredCount !== 1 ? 's' : ''} will be skipped.
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Keep going
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-2xl bg-[#0A9AE2] hover:bg-[#0659AA] text-white text-sm font-black transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak Gamification Toast */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            key={activeToast.threshold}
            initial={{ opacity: 0, y: 60, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r ${activeToast.gradient} text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 font-black text-sm border border-white/20`}
          >
            <div className={`w-10 h-10 ${activeToast.iconBg} rounded-full flex items-center justify-center shrink-0`}>
              <StreakIcon icon={activeToast.icon} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black leading-tight">{activeToast.label}</span>
              <span className="text-xs font-semibold text-white/80">{activeToast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

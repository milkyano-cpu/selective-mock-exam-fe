'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { examService } from '@/features/exams/services/exams.service';
import { QuestionLatexRenderer } from '@/components/ui/QuestionLatexRenderer';
import type { ExamSession, SessionQuestion } from '@/features/exams/types/exams.types';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Send,
  Zap,
} from 'lucide-react';

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const FAST_ANSWER_SECONDS = 30;
const HEARTBEAT_INTERVAL_MS = 15000;
const IDLE_AFTER_MS = 60000;
const MOTIVATION_TIERS = [
  { threshold: 2, message: 'Nice pace!', emoji: '👍' },
  { threshold: 3, message: 'Good Job!', emoji: '🔥' },
  { threshold: 5, message: "You're on fire!", emoji: '⚡' },
  { threshold: 8, message: 'Unstoppable!', emoji: '🚀' },
  { threshold: 12, message: 'Speed Legend!', emoji: '💫' },
];

function QuestionContent({ question }: { question: SessionQuestion }) {
  const imageUrls = question.imageUrls?.length ? question.imageUrls : (question.imageUrl ? [question.imageUrl] : []);

  return (
    <div className="space-y-3">
      {question.passage && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-900/10">
          {question.passage.title && (
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              {question.passage.title}
            </p>
          )}
          <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
            {question.passage.content}
          </p>
        </div>
      )}
      <div className="text-base font-medium leading-relaxed text-slate-900 dark:text-slate-100">
        <QuestionLatexRenderer
          text={question.contentText}
          latex={question.contentLatex}
          isLatexFormat={question.isLatexFormat}
          fallbackClassName="whitespace-pre-wrap"
        />
      </div>
      {imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {imageUrls.map((imageUrl, index) => (
            <img
              key={`${imageUrl}-${index}`}
              src={imageUrl}
              alt={`Question illustration ${index + 1}`}
              className="max-h-48 rounded-2xl border border-slate-200 object-contain dark:border-slate-700"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubmitConfirmModal({
  isOpen,
  answeredCount,
  totalQuestions,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  answeredCount: number;
  totalQuestions: number;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-[#FF6900] dark:bg-orange-500/15">
          <Send size={24} />
        </div>
        <div className="mt-5 text-center">
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Submit exam now?</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            You have answered <span className="font-black text-slate-800 dark:text-slate-100">{answeredCount}</span> of{' '}
            <span className="font-black text-slate-800 dark:text-slate-100">{totalQuestions}</span> questions. After submission, you cannot return to this session.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6900] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-100 transition-all hover:brightness-105 disabled:opacity-60 dark:shadow-none"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Submit exam
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExamSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] = useState<ExamSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const questionStartRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatInFlightRef = useRef(false);
  const currentIndexRef = useRef(0);
  const timeLeftRef = useRef(0);
  const serverTimeOffsetRef = useRef(0);
  const questionTimeRef = useRef<Map<string, number>>(new Map());
  const lastActivityRef = useRef(Date.now());
  const fastStreakRef = useRef(0);
  const [motivationToast, setMotivationToast] = useState<{ message: string; emoji: string; streak: number } | null>(null);
  const motivationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Debounce autosave
  const sessionRef = useRef<ExamSession | null>(null);
  const debounceTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingSaveRef = useRef<Map<string, { answer: string; timeSpentSeconds: number; timeSpentDeltaSeconds: number }>>(new Map());

  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  // Request browser fullscreen for immersive exam experience
  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) {
      el.requestFullscreen().catch(() => {
        // Fullscreen denied or not supported — continue without it
      });
    }
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Load session
  const loadSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await examService.startSession(id);
      if (res.success) {
        const s = res.data;
        setSession(s);
        serverTimeOffsetRef.current = new Date(s.serverNow).getTime() - Date.now();
        setTimeLeft(s.secondsRemaining);
        startTimeRef.current = new Date(s.startTime).getTime();
        questionStartRef.current = Date.now();

        // Restore existing answers
        const existing = new Map<string, string>();
        const existingTimes = new Map<string, number>();
        s.questions.forEach((q) => {
          if (q.existingAnswer) {
            if (q.existingAnswer.studentAnswer.trim()) {
              existing.set(q.questionId, q.existingAnswer.studentAnswer);
            }
            existingTimes.set(q.questionId, q.existingAnswer.timeSpentSeconds);
          }
        });
        setAnswers(existing);
        questionTimeRef.current = existingTimes;
      } else {
        setError(res.message);
      }
    } catch (err) {
      const msg = isAxiosError(err) ? err.response?.data?.message || 'Failed to start exam' : 'Failed to start exam';
      // If already submitted, redirect to sessions list
      if (isAxiosError(err) && err.response?.data?.message?.includes('already submitted')) {
        router.push('/dashboard/exams');
        return;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => { loadSession(); }, [loadSession]);

  const getActiveQuestionId = useCallback(() => {
    const sess = sessionRef.current;
    return sess?.questions[currentIndexRef.current]?.questionId ?? null;
  }, []);

  const captureQuestionTime = useCallback((questionIdOverride?: string | null) => {
    const now = Date.now();
    const questionId = questionIdOverride ?? getActiveQuestionId();
    const delta = Math.max(0, Math.floor((now - questionStartRef.current) / 1000));
    const isIdle = document.hidden || now - lastActivityRef.current >= IDLE_AFTER_MS;

    questionStartRef.current = now;

    if (!questionId || delta <= 0) {
      return {
        questionId,
        questionTimeDeltaSeconds: 0,
        activeTimeDeltaSeconds: 0,
        idleTimeDeltaSeconds: 0,
        totalTimeSpentSeconds: questionId ? questionTimeRef.current.get(questionId) ?? 0 : 0,
      };
    }

    const previous = questionTimeRef.current.get(questionId) ?? 0;
    const total = previous + delta;
    questionTimeRef.current.set(questionId, total);

    return {
      questionId,
      questionTimeDeltaSeconds: delta,
      activeTimeDeltaSeconds: isIdle ? 0 : delta,
      idleTimeDeltaSeconds: isIdle ? delta : 0,
      totalTimeSpentSeconds: total,
    };
  }, [getActiveQuestionId]);

  const sendHeartbeat = useCallback(async (
    delta = captureQuestionTime(),
    options: { keepalive?: boolean } = {},
  ) => {
    const sess = sessionRef.current;
    if (!sess || (!options.keepalive && heartbeatInFlightRef.current)) return null;

    const payload = {
      activeQuestionId: delta.questionId,
      questionTimeDeltaSeconds: delta.questionTimeDeltaSeconds,
      activeTimeDeltaSeconds: delta.activeTimeDeltaSeconds,
      idleTimeDeltaSeconds: delta.idleTimeDeltaSeconds,
    };

    if (options.keepalive) {
      fetch(`/api/exams/sessions/${sess.sessionId}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        keepalive: true,
        body: JSON.stringify(payload),
      }).catch(() => {});
      return null;
    }

    heartbeatInFlightRef.current = true;
    try {
      const res = await examService.heartbeat(sess.sessionId, payload);
      if (res.success) {
        serverTimeOffsetRef.current = new Date(res.data.serverNow).getTime() - Date.now();
        setTimeLeft(res.data.secondsRemaining);
        if (res.data.activeQuestionId && res.data.questionTimeSpentSeconds !== null) {
          questionTimeRef.current.set(res.data.activeQuestionId, res.data.questionTimeSpentSeconds);
        }
      }
      return res;
    } catch {
      return null;
    } finally {
      heartbeatInFlightRef.current = false;
    }
  }, [captureQuestionTime]);

  // Stable save helper — no deps, uses only args
  const saveAnswer = useCallback(async (
    sessionId: string,
    questionId: string,
    answer: string,
    timeSpentSeconds: number,
    timeSpentDeltaSeconds = 0,
  ) => {
    try {
      await examService.submitAnswer(sessionId, { questionId, studentAnswer: answer, timeSpentSeconds, timeSpentDeltaSeconds });
    } catch {
      // Silent fail — answer already in local state
    }
  }, []);

  // Flush a single question's pending save immediately (e.g. on navigate away)
  const flushSave = useCallback((questionId: string) => {
    const timer = debounceTimersRef.current.get(questionId);
    if (timer) {
      clearTimeout(timer);
      debounceTimersRef.current.delete(questionId);
    }
    const pending = pendingSaveRef.current.get(questionId);
    if (pending) {
      pendingSaveRef.current.delete(questionId);
      const sess = sessionRef.current;
      if (sess) saveAnswer(sess.sessionId, questionId, pending.answer, pending.timeSpentSeconds, pending.timeSpentDeltaSeconds);
    }
  }, [saveAnswer]);

  // Flush all pending saves and await them (used before submit / time-up)
  const flushAllPending = useCallback(async () => {
    debounceTimersRef.current.forEach((timer) => clearTimeout(timer));
    debounceTimersRef.current.clear();
    const sess = sessionRef.current;
    if (!sess) return;
    const entries = Array.from(pendingSaveRef.current.entries());
    pendingSaveRef.current.clear();
    await Promise.allSettled(
      entries.map(([questionId, { answer, timeSpentSeconds, timeSpentDeltaSeconds }]) =>
        saveAnswer(sess.sessionId, questionId, answer, timeSpentSeconds, timeSpentDeltaSeconds)
      )
    );
  }, [saveAnswer]);

  const handleTimeUp = useCallback(async () => {
    await sendHeartbeat(captureQuestionTime());
    await flushAllPending();
    const sess = sessionRef.current;
    if (!sess) return;
    const totalTime = Math.max(0, Math.floor((Date.now() + serverTimeOffsetRef.current - startTimeRef.current) / 1000));
    try {
      const res = await examService.submitSession(sess.sessionId, { totalTimeSeconds: totalTime });
      if (res.success) {
        router.push(`/dashboard/exams/sessions/${sess.sessionId}/result`);
      }
    } catch {
      // Already submitted or error — redirect anyway
      router.push('/dashboard/exams');
    }
  }, [captureQuestionTime, flushAllPending, router, sendHeartbeat]);

  // Start timer
  useEffect(() => {
    if (!session) return;
    const expiresAtMs = new Date(session.expiresAt).getTime();
    const getRemaining = () => Math.max(0, Math.ceil((expiresAtMs - (Date.now() + serverTimeOffsetRef.current)) / 1000));
    setTimeLeft(getRemaining());

    timerRef.current = setInterval(() => {
      const remaining = getRemaining();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current!);
        }
        handleTimeUp();
      }
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session, handleTimeUp]);

  useEffect(() => {
    if (!session) return;

    heartbeatRef.current = setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [session, sendHeartbeat]);

  // Warn before leaving + best-effort flush via fetch+keepalive (axios doesn't work post-unload)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      const sess = sessionRef.current;
      if (!sess) return;
      debounceTimersRef.current.forEach((timer) => clearTimeout(timer));
      debounceTimersRef.current.clear();
      const delta = captureQuestionTime();
      sendHeartbeat(delta, { keepalive: true });
      pendingSaveRef.current.forEach(({ answer, timeSpentSeconds, timeSpentDeltaSeconds }, questionId) => {
        fetch(`/api/exams/sessions/${sess.sessionId}/answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          keepalive: true,
          body: JSON.stringify({ questionId, studentAnswer: answer, timeSpentSeconds, timeSpentDeltaSeconds }),
        }).catch(() => {});
      });
      pendingSaveRef.current.clear();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [captureQuestionTime, sendHeartbeat]);

  useEffect(() => {
    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        void sendHeartbeat(captureQuestionTime());
      } else {
        lastActivityRef.current = Date.now();
        questionStartRef.current = Date.now();
      }
    };

    window.addEventListener('mousemove', markActivity);
    window.addEventListener('keydown', markActivity);
    window.addEventListener('pointerdown', markActivity);
    window.addEventListener('touchstart', markActivity);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('mousemove', markActivity);
      window.removeEventListener('keydown', markActivity);
      window.removeEventListener('pointerdown', markActivity);
      window.removeEventListener('touchstart', markActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [captureQuestionTime, sendHeartbeat]);

  // Cleanup motivation timer
  useEffect(() => {
    return () => {
      if (motivationTimerRef.current) clearTimeout(motivationTimerRef.current);
    };
  }, []);

  // Keep sessionRef in sync so refs-based callbacks avoid stale closures
  useEffect(() => { sessionRef.current = session; }, [session]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      debounceTimersRef.current.forEach((timer) => clearTimeout(timer));
      debounceTimersRef.current.clear();
    };
  }, []);

  const handleSelectAnswer = (questionId: string, answer: string) => {
    if (!session) return;
    lastActivityRef.current = Date.now();
    setAnswers((prev) => new Map(prev).set(questionId, answer));

    const trackedTime = captureQuestionTime(questionId);
    const timeSpent = trackedTime.totalTimeSpentSeconds;

    // Speed streak tracking (MCQ only)
    const answeredQuestion = session.questions.find((q) => q.questionId === questionId);
    if (answeredQuestion?.type === 'MCQ') {
      if (trackedTime.questionTimeDeltaSeconds < FAST_ANSWER_SECONDS) {
        fastStreakRef.current += 1;
        const newStreak = fastStreakRef.current;
        const tier = [...MOTIVATION_TIERS].reverse().find((t) => newStreak >= t.threshold);
        if (tier) {
          if (motivationTimerRef.current) clearTimeout(motivationTimerRef.current);
          setMotivationToast({ message: tier.message, emoji: tier.emoji, streak: newStreak });
          motivationTimerRef.current = setTimeout(() => setMotivationToast(null), 3000);
        }
      } else {
        fastStreakRef.current = 0;
      }
    }

    // Store pending save
    pendingSaveRef.current.set(questionId, {
      answer,
      timeSpentSeconds: timeSpent,
      timeSpentDeltaSeconds: trackedTime.questionTimeDeltaSeconds,
    });

    // Cancel existing debounce for this question
    const existing = debounceTimersRef.current.get(questionId);
    if (existing) clearTimeout(existing);

    // 300ms for MCQ, 1000ms for essay
    const delay = answeredQuestion?.type === 'ESSAY' ? 1000 : 300;
    const timer = setTimeout(() => {
      debounceTimersRef.current.delete(questionId);
      const pending = pendingSaveRef.current.get(questionId);
      if (pending) {
        pendingSaveRef.current.delete(questionId);
        const sess = sessionRef.current;
        if (sess) saveAnswer(sess.sessionId, questionId, pending.answer, pending.timeSpentSeconds, pending.timeSpentDeltaSeconds);
      }
    }, delay);
    debounceTimersRef.current.set(questionId, timer);
  };

  const handleNavigate = (index: number) => {
    // Flush pending save for the question we're leaving
    const leavingQuestionId = session?.questions[currentIndex]?.questionId;
    if (leavingQuestionId) {
      const delta = captureQuestionTime(leavingQuestionId);
      void sendHeartbeat(delta);
      flushSave(leavingQuestionId);
    }
    questionStartRef.current = Date.now();
    setCurrentIndex(index);
  };

  const handleSubmit = () => {
    if (!session || isSubmitting) return;
    setSubmitError(null);
    setIsSubmitConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!session) return;

    setIsSubmitConfirmOpen(false);
    setIsSubmitting(true);
    setSubmitError(null);
    if (timerRef.current) clearInterval(timerRef.current);

    await sendHeartbeat(captureQuestionTime());
    await flushAllPending();

    const totalTime = Math.max(0, Math.floor((Date.now() + serverTimeOffsetRef.current - startTimeRef.current) / 1000));
    try {
      const res = await examService.submitSession(session.sessionId, { totalTimeSeconds: totalTime });
      if (res.success) {
        router.push(`/dashboard/exams/sessions/${session.sessionId}/result`);
      } else {
        setSubmitError(res.message);
      }
    } catch (err) {
      setSubmitError(isAxiosError(err) ? err.response?.data?.message || 'Failed to submit exam' : 'Failed to submit exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="mx-auto animate-spin text-[#FF6900]" />
          <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-[2rem] border border-red-200 bg-red-50 p-6 text-center dark:border-red-800/50 dark:bg-red-900/20">
          <AlertCircle size={32} className="mx-auto text-red-500 dark:text-red-400" />
          <p className="mt-3 text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={() => router.push('/dashboard/exams')}
            className="mt-4 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-400"
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const currentQuestion = session.questions[currentIndex];
  const answeredCount = answers.size;
  const totalQuestions = session.questions.length;
  const timerColor = timeLeft < 300 ? 'text-red-600 dark:text-red-400' : timeLeft < 600 ? 'text-orange-500' : 'text-slate-900 dark:text-slate-100';

  return (
    <div className="flex h-[100svh] flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Speed Streak Motivation Toast */}
      {motivationToast && (
        <div
          className="fixed left-1/2 top-4 z-[100] -translate-x-1/2"
          style={{ animation: 'motivationSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-white shadow-2xl shadow-emerald-500/25">
            <span className="text-2xl">{motivationToast.emoji}</span>
            <div>
              <p className="text-sm font-black tracking-tight">{motivationToast.message}</p>
              <p className="text-[11px] font-semibold text-emerald-100">
                {motivationToast.streak} fast answer{motivationToast.streak !== 1 ? 's' : ''} in a row!
              </p>
            </div>
            <Zap size={18} className="ml-1 text-emerald-200" />
          </div>
        </div>
      )}
      <style>{`
        @keyframes motivationSlideDown {
          from { opacity: 0; transform: translate(-50%, -1.5rem); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col p-3 sm:p-4 lg:p-6">
          <div className="mb-5 grid gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black text-slate-900 dark:text-slate-100 sm:text-2xl lg:text-[1.7rem]">
                {session.examTitle}
              </h1>
            </div>
            <div className="flex items-center justify-end lg:hidden">
              <div className={`flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-mono font-black shadow-sm dark:border-slate-700 dark:bg-slate-900 ${timerColor}`}>
                <Clock size={14} />
                <span className="text-sm tabular-nums sm:text-base">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>

          {/* Question number + saving indicator */}
          <div className="mb-4 lg:pr-[15.5rem]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                Question {currentIndex + 1} of {totalQuestions}
              </p>
            </div>
          </div>

          <div className="grid min-h-0 gap-6 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-start">
            {/* Main question area */}
            <main className="min-w-0 overflow-y-auto">
              <div className="w-full">
                <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-900 sm:flex sm:flex-wrap sm:justify-between sm:gap-3 sm:px-4">
                  <button
                    onClick={() => handleNavigate(currentIndex - 1)}
                    disabled={currentIndex === 0}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 sm:px-4"
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>

                  <div className="hidden items-center gap-1 overflow-x-auto max-w-xs sm:flex lg:hidden">
                    {session.questions.map((q, i) => {
                      const isAnswered = answers.has(q.questionId);
                      const isCurrent = i === currentIndex;
                      return (
                        <button
                          key={q.questionId}
                          onClick={() => handleNavigate(i)}
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${isCurrent ? 'bg-[#FF6900] text-white' : isAnswered ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-center text-xs font-semibold text-slate-400 sm:hidden">
                    {currentIndex + 1}/{totalQuestions}
                  </p>

                  {currentIndex < totalQuestions - 1 ? (
                    <button
                      onClick={() => handleNavigate(currentIndex + 1)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 sm:px-4"
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FF6900] px-3 py-2.5 text-sm font-bold text-white disabled:opacity-60 sm:px-4"
                    >
                      {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Submit
                    </button>
                  )}
                </div>

              {/* Question content */}
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-5 lg:p-6">
                <QuestionContent question={currentQuestion} />

                {/* MCQ Options */}
                {currentQuestion.type === 'MCQ' && currentQuestion.options && (
                  <div className="mt-5 space-y-2.5">
                    {currentQuestion.options.map((option) => {
                      const isSelected = answers.get(currentQuestion.questionId) === option.key;
                      return (
                        <button
                          key={option.key}
                          onClick={() => handleSelectAnswer(currentQuestion.questionId, option.key)}
                          className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${isSelected ? 'border-[#FF6900] bg-orange-50 dark:bg-orange-900/10' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800/50'}`}
                        >
                          <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors ${isSelected ? 'bg-[#FF6900] text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                            {option.key}
                          </span>
                          <span className={`text-sm font-medium ${isSelected ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                            <QuestionLatexRenderer text={option.text} isLatexFormat={currentQuestion.isLatexFormat} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Essay text area */}
                {currentQuestion.type === 'ESSAY' && (
                  <textarea
                    value={answers.get(currentQuestion.questionId) ?? ''}
                    onChange={(e) => handleSelectAnswer(currentQuestion.questionId, e.target.value)}
                    placeholder="Write your answer here..."
                    rows={5}
                    className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-[#FF6900] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                )}
              </div>

              {submitError && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
                  <AlertCircle size={15} /> {submitError}
                </div>
              )}
              </div>
            </main>

            {/* Question navigator (desktop sidebar) */}
            <aside className="hidden min-w-0 lg:block">
              <div className="sticky top-0 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className={`mb-4 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono font-black dark:border-slate-700 dark:bg-slate-800/60 ${timerColor}`}>
                  <Clock size={14} />
                  <span className="text-sm tabular-nums">{formatTime(timeLeft)}</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {answeredCount}/{totalQuestions} answered
                </p>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {session.questions.map((q, i) => {
                    const isAnswered = answers.has(q.questionId);
                    const isCurrent = i === currentIndex;
                    return (
                      <button
                        key={q.questionId}
                        onClick={() => handleNavigate(i)}
                        className={`aspect-square rounded-xl text-xs font-bold transition-colors ${isCurrent ? 'bg-[#FF6900] text-white shadow-sm' : isAnswered ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
      <SubmitConfirmModal
        isOpen={isSubmitConfirmOpen}
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
        isSubmitting={isSubmitting}
        onClose={() => setIsSubmitConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  );
}

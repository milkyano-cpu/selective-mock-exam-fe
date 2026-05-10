'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  BookOpen,
  AlertCircle,
  Trophy,
  XCircle,
} from 'lucide-react';
import { practiceService } from '@/features/practice/services/practice.service';
import { QuestionLatexRenderer } from '@/components/ui/QuestionLatexRenderer';
import type {
  PracticeSessionDetail,
  PracticeQuestion,
  AnswerPayload,
} from '@/features/practice/types/practice.types';

type AnswerState = Record<string, string>;

const DIFFICULTY_COLORS = {
  EASY: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HARD: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

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
  const [showToast, setShowToast] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Track time spent per question
  const questionStartTime = useRef<number>(Date.now());
  const timeSpentMap = useRef<Record<string, number>>({});

  const STORAGE_KEY = `practice_answers_${sessionId}`;

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
      } catch {
        // ignore parse errors
      }
    } catch {
      setError('Failed to load practice session');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, router, STORAGE_KEY]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Track time when question changes
  useEffect(() => {
    if (!session) return;
    const prevQuestion = session.questions[currentIdx - 1];
    if (prevQuestion) {
      const elapsed = Math.floor((Date.now() - questionStartTime.current) / 1000);
      timeSpentMap.current[prevQuestion.questionId] =
        (timeSpentMap.current[prevQuestion.questionId] ?? 0) + elapsed;
    }
    questionStartTime.current = Date.now();
  }, [currentIdx, session]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (countdown === 0) {
      setCountdown(null);
      if (currentIdx < (session?.questions.length ?? 1) - 1) {
        handleNextQuestion();
      } else {
        setShowConfirm(true);
      }
    }
    return () => clearTimeout(timer);
  }, [countdown, currentIdx, session]);

  const handleAnswer = (questionId: string, optionKey: string) => {
    if (submittedSet.has(questionId)) return;
    const next = { ...answers, [questionId]: optionKey };
    setAnswers(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const handleNextQuestion = useCallback(() => {
    setCountdown(null);
    setCurrentIdx((i) => Math.min((session?.questions.length ?? 1) - 1, i + 1));
  }, [session]);

  const handleSubmitQuestion = () => {
    const q = session?.questions[currentIdx];
    if (!q || !answers[q.questionId]) return;

    const elapsed = Math.floor((Date.now() - questionStartTime.current) / 1000);
    timeSpentMap.current[q.questionId] = (timeSpentMap.current[q.questionId] ?? 0) + elapsed;

    const nextSubmitted = new Set(submittedSet);
    nextSubmitted.add(q.questionId);
    setSubmittedSet(nextSubmitted);

    const isCorrect = answers[q.questionId] === q.correctAnswer;
    const timeSpent = timeSpentMap.current[q.questionId];

    if (isCorrect && timeSpent < 30 * 60) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak === 3) {
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
          setStreak(0);
        }, 4000);
      }
    } else {
      setStreak(0);
    }

    try {
      localStorage.setItem(`${STORAGE_KEY}_submitted`, JSON.stringify(Array.from(nextSubmitted)));
    } catch {}

    // UX Improvement: Start 3s countdown for auto-advance (only if not the last question)
    if (currentIdx < (session?.questions.length ?? 1) - 1) {
      setCountdown(3);
    }
  };

  const handleSubmit = async () => {
    if (!session || isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirm(false);

    // Record time for current question if not yet submitted
    const currentQuestion = session.questions[currentIdx];
    if (currentQuestion && !submittedSet.has(currentQuestion.questionId)) {
      const elapsed = Math.floor((Date.now() - questionStartTime.current) / 1000);
      timeSpentMap.current[currentQuestion.questionId] =
        (timeSpentMap.current[currentQuestion.questionId] ?? 0) + elapsed;
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
        router.push(`/dashboard/practice/sessions/${sessionId}/result`);
      }
    } catch {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 size={40} className="animate-spin text-[#0A9AE2]" />
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
                  ? (answers[q.questionId] === q.correctAnswer ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30')
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

            {/* Question text */}
            <div className="text-slate-800 dark:text-slate-100 font-semibold text-base leading-relaxed mb-6">
              <QuestionLatexRenderer
                text={currentQuestion.contentText}
                latex={currentQuestion.contentLatex}
                isLatexFormat={currentQuestion.isLatexFormat}
              />
            </div>

            {/* Images */}
            {currentQuestion.imageUrl && (
              <img
                src={currentQuestion.imageUrl}
                alt="Question"
                className="w-full rounded-xl mb-4 border border-slate-100 dark:border-slate-700"
              />
            )}
            {currentQuestion.imageUrls.length > 0 && (
              <div className="space-y-2 mb-4">
                {currentQuestion.imageUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Image ${i + 1}`}
                    className="w-full rounded-xl border border-slate-100 dark:border-slate-700"
                  />
                ))}
              </div>
            )}

            {/* MCQ Options */}
            {currentQuestion.options && (
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
                        <QuestionLatexRenderer text={opt.text} isLatexFormat={currentQuestion.isLatexFormat} />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Inline Result Text */}
            {submittedSet.has(currentQuestion.questionId) && (
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
            {submittedSet.has(currentQuestion.questionId) && currentQuestion.explanation && (
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
                  <QuestionLatexRenderer text={currentQuestion.explanation} isLatexFormat={currentQuestion.isLatexFormat} />
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
              Next Question {countdown !== null && `(Auto in ${countdown}s)`}
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setCountdown(null);
                setShowConfirm(true);
              }}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black disabled:opacity-60 transition-colors shadow-lg shadow-emerald-500/30"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {isSubmitting ? 'Finishing…' : `Finish Practice ${countdown !== null ? `(Auto in ${countdown}s)` : ''}`}
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
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 font-black text-sm border border-white/20"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <Trophy size={20} className="text-amber-100" />
            </div>
            <span>Incredible! 3 correct answers in under 30 minutes!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

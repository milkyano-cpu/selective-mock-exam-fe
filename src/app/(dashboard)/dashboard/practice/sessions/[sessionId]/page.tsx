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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const handleAnswer = (questionId: string, optionKey: string) => {
    const next = { ...answers, [questionId]: optionKey };
    setAnswers(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage full
    }
  };

  const handleNavigate = (dir: 'prev' | 'next') => {
    setCurrentIdx((i) => (dir === 'prev' ? Math.max(0, i - 1) : Math.min((session?.questions.length ?? 1) - 1, i + 1)));
  };

  const handleSubmit = async () => {
    if (!session || isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirm(false);

    // Record time for current question
    const currentQuestion = session.questions[currentIdx];
    if (currentQuestion) {
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
            <button
              key={q.questionId}
              type="button"
              onClick={() => setCurrentIdx(idx)}
              className={[
                'w-7 h-7 rounded-lg text-xs font-bold transition-all',
                idx === currentIdx
                  ? 'bg-[#0A9AE2] text-white scale-110'
                  : answers[q.questionId]
                  ? 'bg-[#0A9AE2]/20 text-[#0A9AE2]'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500',
              ].join(' ')}
            >
              {idx + 1}
            </button>
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
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleAnswer(currentQuestion.questionId, opt.key)}
                      className={[
                        'w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-150',
                        isSelected
                          ? 'border-[#0A9AE2] bg-[#0A9AE2]/5 text-[#0659AA] dark:text-[#0A9AE2]'
                          : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'w-7 h-7 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 transition-all',
                          isSelected
                            ? 'bg-[#0A9AE2] text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500',
                        ].join(' ')}
                      >
                        {isSelected ? <CheckCircle2 size={14} /> : opt.key}
                      </span>
                      <span className="text-sm font-medium">
                        <QuestionLatexRenderer text={opt.text} isLatexFormat={currentQuestion.isLatexFormat} />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleNavigate('prev')}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          {currentIdx < totalQuestions - 1 ? (
            <button
              type="button"
              onClick={() => handleNavigate('next')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0A9AE2] hover:bg-[#0659AA] text-white text-sm font-bold transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={answeredCount === 0 || isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0A9AE2] hover:bg-[#0659AA] text-white text-sm font-bold disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {isSubmitting ? 'Submitting…' : `Finish (${answeredCount}/${totalQuestions})`}
            </button>
          )}
        </div>

        {/* Also show submit button when not on last question but all answered */}
        {answeredCount === totalQuestions && currentIdx < totalQuestions - 1 && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-colors"
            >
              <CheckCircle2 size={14} />
              All answered — Submit
            </button>
          </div>
        )}
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
    </div>
  );
}

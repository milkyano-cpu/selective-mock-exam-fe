'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  BookOpen,
  Trophy,
  ArrowLeft,
} from 'lucide-react';
import { questionsService } from '@/features/questions/services/questions.service';
import { pathwaysService } from '@/features/pathways/services/pathways.service';
import { QuestionLatexRenderer } from '@/components/ui/QuestionLatexRenderer';
import type { Question } from '@/features/questions/types/questions.types';
import { FeaturePaywall } from '@/components/billing/FeaturePaywall';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { hasPremiumAccess } from '@/features/membership/access';

type AnswerState = Record<string, string>;

export default function PathwayPracticePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pathwayInfo, setPathwayInfo] = useState<{ pathwayId: string; nodeId: string } | null>(null);

  // Load questions for this practice session
  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      // Retrieve nodeId and other info stored when practice was started
      const storedNodeId = sessionStorage.getItem(`practice_node_${sessionId}`);
      const storedPathwayId = sessionStorage.getItem(`practice_pathway_${sessionId}`);
      const storedTopicId = sessionStorage.getItem(`practice_topic_${sessionId}`);

      if (storedNodeId && storedPathwayId) {
        setPathwayInfo({ pathwayId: storedPathwayId, nodeId: storedNodeId });
      }

      // Fetch published MCQ questions for the topic
      if (storedTopicId) {
        const res = await questionsService.list({
          topicId: storedTopicId,
          status: 'PUBLISHED',
          type: 'MCQ',
          limit: 10,
        });

        if (res.success) {
          setQuestions(res.data);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!user) return;
    if (user?.role === 'STUDENT' && !hasPremiumAccess(user)) {
      return;
    }
    const timer = window.setTimeout(() => {
      void loadQuestions();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadQuestions, user]);

  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  const handleAnswer = (questionId: string, optionKey: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const correctAnswers = questions.filter(
      (q) => answers[q.id] === q.correctAnswer
    ).length;
    const totalAttempts = totalQuestions;

    // Update pathway node progress
    if (pathwayInfo) {
      try {
        await pathwaysService.updateProgress(pathwayInfo.pathwayId, pathwayInfo.nodeId, {
          correctAnswers,
          totalAttempts,
        });
      } catch {
        // Progress update best-effort
      }
    }

    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  if (user?.role === 'STUDENT' && !hasPremiumAccess(user)) {
    return (
      <FeaturePaywall
        title="Pathway practice is for Premium students"
        description="Upgrade to Premium to continue pathway-based topic practice and progress tracking."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 size={40} className="animate-spin text-[#0A9AE2]" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
          <BookOpen size={32} className="text-slate-300" />
        </div>
        <h2 className="text-xl font-black text-slate-700 dark:text-slate-300 mb-2">
          No questions available
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          This topic doesn&apos;t have any practice questions yet.
        </p>
        <button
          type="button"
          onClick={() => router.push('/dashboard/pathways')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A9AE2] text-white font-bold text-sm"
        >
          <ArrowLeft size={15} />
          Back to Pathways
        </button>
      </div>
    );
  }

  // Results screen
  if (isSubmitted) {
    const correctAnswers = questions.filter((q) => answers[q.id] === q.correctAnswer).length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl p-8 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-[#0A9AE2]/10 flex items-center justify-center mx-auto mb-5">
            <Trophy size={36} className="text-[#0A9AE2]" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            Practice Complete!
          </h2>
          <p className="text-slate-400 text-sm mb-6">Here&apos;s how you did</p>

          {/* Score ring */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="12" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#0A9AE2"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - percentage / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {percentage}%
              </span>
              <span className="text-xs text-slate-400">score</span>
            </div>
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
            <span className="font-black text-[#0A9AE2]">{correctAnswers}</span> of{' '}
            <span className="font-black">{totalQuestions}</span> questions correct
          </p>

          {/* Answer review */}
          <div className="text-left space-y-2 mb-8 max-h-56 overflow-y-auto">
            {questions.map((q, idx) => {
              const userAnswer = answers[q.id];
              const isCorrect = userAnswer === q.correctAnswer;
              return (
                <div
                  key={q.id}
                  className={`flex items-start gap-2 p-2.5 rounded-xl text-xs ${
                    isCorrect
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  }`}
                >
                  <span className="font-black flex-shrink-0">Q{idx + 1}.</span>
                  <span className="flex-1 line-clamp-2">
                    <QuestionLatexRenderer text={q.questionText} latexEnabled={q.latexEnabled} />
                  </span>
                  <span className="flex-shrink-0 font-black">
                    {isCorrect ? '✓' : `✗ (${q.correctAnswer})`}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => router.push('/dashboard/pathways')}
            className="w-full py-3 rounded-2xl bg-[#0A9AE2] hover:bg-[#0659AA] text-white font-black transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Pathways
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => router.push('/dashboard/pathways')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold transition-colors"
          >
            <ArrowLeft size={16} />
            Exit
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">
              {currentIdx + 1} / {totalQuestions}
            </span>
            {/* Progress bar */}
            <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0A9AE2] rounded-full transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
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
            {/* Topic badge */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-[#0A9AE2]/10 flex items-center justify-center">
                <BookOpen size={12} className="text-[#0A9AE2]" />
              </div>
              <span className="text-xs font-bold text-[#0A9AE2] uppercase tracking-wide">
                {currentQuestion.topicName}
              </span>
              <span className="ml-auto text-xs font-medium text-slate-300 px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800">
                {currentQuestion.difficulty}
              </span>
            </div>

            {/* Question text */}
            <div className="text-slate-800 dark:text-slate-100 font-semibold text-base leading-relaxed mb-6">
              <QuestionLatexRenderer
                text={currentQuestion.questionText}
                latexEnabled={currentQuestion.latexEnabled}
              />
            </div>

            {/* MCQ Options */}
            {currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((opt) => {
                  const isSelected = answers[currentQuestion.id] === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleAnswer(currentQuestion.id, opt.key)}
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
                        <QuestionLatexRenderer text={opt.text} latexEnabled={currentQuestion.latexEnabled} />
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
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          {currentIdx < totalQuestions - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIdx((i) => Math.min(totalQuestions - 1, i + 1))}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0A9AE2] hover:bg-[#0659AA] text-white text-sm font-bold transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || answeredCount < totalQuestions}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0A9AE2] hover:bg-[#0659AA] text-white text-sm font-bold disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {isSubmitting ? 'Submitting…' : `Submit (${answeredCount}/${totalQuestions})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

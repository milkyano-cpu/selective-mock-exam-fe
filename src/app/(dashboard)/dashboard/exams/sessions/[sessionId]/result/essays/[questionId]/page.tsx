'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Clock,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { QuestionLatexRenderer } from '@/components/ui/QuestionLatexRenderer';
import { examService } from '@/features/exams/services/exams.service';
import type { SessionResultAnswer } from '@/features/exams/types/exams.types';

function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
}

function FeedbackList({
  title,
  entries,
  tone,
}: {
  title: string;
  entries: string[];
  tone: 'positive' | 'improvement';
}) {
  const isPositive = tone === 'positive';
  return (
    <section className={`rounded-2xl border p-5 ${isPositive ? 'border-emerald-100 bg-emerald-50/70 dark:border-emerald-900/30 dark:bg-emerald-900/10' : 'border-amber-100 bg-amber-50/70 dark:border-amber-900/30 dark:bg-amber-900/10'}`}>
      <h2 className={`text-sm font-black uppercase ${isPositive ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>{title}</h2>
      <ul className="mt-3 space-y-2">
        {entries.map((entry, index) => (
          <li key={index} className={`flex items-start gap-2 text-sm font-medium ${isPositive ? 'text-emerald-800 dark:text-emerald-200' : 'text-amber-800 dark:text-amber-200'}`}>
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>{entry}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function EssayFullReviewPage() {
  const { sessionId, questionId } = useParams<{ sessionId: string; questionId: string }>();
  const router = useRouter();
  const [answer, setAnswer] = useState<SessionResultAnswer | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadReview = async () => {
      try {
        const response = await examService.getResult(sessionId);
        if (isCancelled) return;
        if (!response.success) {
          setError(response.message);
          return;
        }

        const essay = response.data.answers.find(
          (item) => item.questionId === questionId && item.type === 'ESSAY'
        );
        if (!essay) {
          setError('Essay review not found.');
          return;
        }

        setExamTitle(response.data.examTitle);
        setAnswer(essay);
      } catch (err) {
        if (!isCancelled) {
          setError(isAxiosError(err) ? err.response?.data?.message || 'Failed to load essay review.' : 'Failed to load essay review.');
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    void loadReview();
    return () => {
      isCancelled = true;
    };
  }, [questionId, sessionId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !answer) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-6 md:px-8 md:py-10">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/exams/sessions/${sessionId}/result`)}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft size={16} /> Back to Results
        </button>
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle size={16} /> {error ?? 'Essay review not found.'}
        </div>
      </div>
    );
  }

  const feedback = answer.aiFeedback;
  const score = answer.overrideScore ?? answer.awardedMarks ?? answer.manualScore;
  const bandLabel = feedback?.bandLabel ?? (answer.reviewStatus === 'PENDING_REVIEW' ? 'Pending review' : 'Not assigned');
  const statusLabel =
    answer.reviewStatus === 'PENDING_REVIEW'
      ? 'Pending Review'
      : answer.isOverridden
        ? 'Tutor Reviewed'
        : answer.reviewStatus === 'MANUAL_GRADED'
          ? 'Manually Graded'
          : 'AI Graded';
  const overallFeedback = feedback?.overallFeedback ?? feedback?.feedback;
  const strengths = feedback?.strengths ?? [];
  const improvements = feedback?.improvements ?? [];
  const criterionScores = feedback?.criterionScores ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 md:px-8 md:py-10">
      <header className="space-y-4">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/exams/sessions/${sessionId}/result`)}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft size={16} /> Back to Results
        </button>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Essay Review</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{examTitle}</h1>
        </div>
      </header>

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm dark:border-blue-900/30 dark:bg-slate-900 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-900/10">
            <p className="text-xs font-black uppercase text-slate-400">Band</p>
            <p className="mt-2 text-lg font-black text-blue-700 dark:text-blue-300">{bandLabel}</p>
            {feedback?.bandDescriptor && <p className="mt-1 text-xs font-medium text-blue-700/80 dark:text-blue-300/80">{feedback.bandDescriptor}</p>}
          </div>
          <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-900/10">
            <p className="text-xs font-black uppercase text-slate-400">Score</p>
            <p className="mt-2 text-lg font-black text-blue-700 dark:text-blue-300">
              {answer.reviewStatus === 'PENDING_REVIEW' || score === null ? 'Pending' : `${score}/${answer.maxMarks}`}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-xs font-black uppercase text-slate-400">Status</p>
            <p className="mt-2 text-sm font-black text-slate-800 dark:text-slate-100">{statusLabel}</p>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
              <Clock size={12} /> {formatSeconds(answer.timeSpentSeconds)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-400">
          <FileText size={16} /> Question
        </div>
        <div className="mt-3 text-base font-medium text-slate-800 dark:text-slate-200">
          <QuestionLatexRenderer text={answer.questionText} latexEnabled={answer.latexEnabled} />
        </div>
        {answer.promptText && (
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
            <p className="text-xs font-black uppercase text-blue-600 dark:text-blue-400">Stimulus</p>
            <div className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <QuestionLatexRenderer text={answer.promptText} latexEnabled={answer.latexEnabled} />
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-black uppercase text-slate-400">
          <BookOpen size={16} /> Your Answer
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
          {answer.studentAnswer || <span className="italic text-slate-400">No answer submitted.</span>}
        </p>
      </section>

      {answer.reviewStatus === 'PENDING_REVIEW' && (
        <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-900/30 dark:bg-amber-900/10">
          <h2 className="text-sm font-black uppercase text-amber-700 dark:text-amber-300">Pending Review</h2>
          <p className="mt-2 text-sm font-medium text-amber-800 dark:text-amber-200">
            {feedback?.reason ?? 'This essay is awaiting manual review, so its final score and feedback are not available yet.'}
          </p>
        </section>
      )}

      {overallFeedback && (
        <section className="rounded-3xl border border-emerald-100 bg-white p-5 dark:border-emerald-900/30 dark:bg-slate-900 sm:p-6">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase text-emerald-700 dark:text-emerald-300">
            <Sparkles size={16} /> Overall Review
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">{overallFeedback}</p>
        </section>
      )}

      {(strengths.length > 0 || improvements.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {strengths.length > 0 && <FeedbackList title="Strengths" entries={strengths} tone="positive" />}
          {improvements.length > 0 && <FeedbackList title="Areas to Improve" entries={improvements} tone="improvement" />}
        </div>
      )}

      {criterionScores.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-black uppercase text-slate-700 dark:text-slate-200">Criterion Breakdown</h2>
            {feedback?.aiRubric && (
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {feedback.aiRubric.name} - {feedback.totalAwardedMarks ?? 0}/{feedback.totalPossibleMarks ?? feedback.aiRubric.totalMaxScore} marks
              </p>
            )}
          </div>
          <div className="mt-4 space-y-3">
            {criterionScores.map((criterion) => (
              <article key={criterion.criterionId} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">{criterion.criterionName}</h3>
                  <span className="shrink-0 rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {criterion.score}/{criterion.maxScore}
                  </span>
                </div>
                {criterion.feedback && <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">{criterion.feedback}</p>}
                {(criterion.strengths?.length ?? 0) > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400">Strengths</p>
                    <ul className="mt-1 space-y-1">
                      {criterion.strengths?.map((item, index) => (
                        <li key={index} className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(criterion.improvements?.length ?? 0) > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-black uppercase text-amber-600 dark:text-amber-400">Areas to Improve</p>
                    <ul className="mt-1 space-y-1">
                      {criterion.improvements?.map((item, index) => (
                        <li key={index} className="text-xs font-medium text-amber-700 dark:text-amber-300">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {(answer.isOverridden || answer.tutorFeedback) && (
        <section className="rounded-3xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-900/30 dark:bg-blue-900/10 sm:p-6">
          <h2 className="text-sm font-black uppercase text-blue-700 dark:text-blue-300">Tutor Review</h2>
          {answer.isOverridden && answer.overrideScore !== null && (
            <p className="mt-3 text-lg font-black text-blue-800 dark:text-blue-100">{answer.overrideScore}/{answer.maxMarks}</p>
          )}
          {(answer.overrideNotes || answer.tutorFeedback) && (
            <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-blue-700 dark:text-blue-300">
              {answer.overrideNotes ?? answer.tutorFeedback}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

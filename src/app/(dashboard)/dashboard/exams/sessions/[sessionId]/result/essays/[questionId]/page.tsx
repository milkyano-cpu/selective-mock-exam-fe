'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { QuestionLatexRenderer } from '@/components/ui/QuestionLatexRenderer';
import { examService } from '@/features/exams/services/exams.service';
import type { SessionResultAnswer } from '@/features/exams/types/exams.types';

function formatWritingType(writingType: string | null) {
  return (writingType?.replaceAll('_', ' ') ?? 'ESSAY').toUpperCase();
}

// Top-level strengths / areas-to-improve list (green checks / orange dashes).
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
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <h2 className={`text-xs font-black uppercase tracking-wider ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
        {title}
      </h2>
      <ul className="mt-3 space-y-2.5">
        {entries.map((entry, index) => (
          <li key={index} className={`flex items-start gap-2.5 text-sm font-medium ${isPositive ? 'text-green-700 dark:text-green-300' : 'text-amber-800 dark:text-amber-300'}`}>
            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black leading-none ${isPositive ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300'}`}>
              {isPositive ? '✓' : '→'}
            </span>
            <span>{entry}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Per-criterion list (small colored dots).
function CriterionPoints({
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
    <div className="mt-3">
      <p className={`text-[11px] font-black uppercase tracking-wider ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
        {title}
      </p>
      <ul className="mt-1.5 space-y-1">
        {entries.map((entry, index) => (
          <li key={index} className={`flex items-start gap-2 text-sm font-medium ${isPositive ? 'text-green-700 dark:text-green-300' : 'text-amber-800 dark:text-amber-300'}`}>
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${isPositive ? 'bg-green-400' : 'bg-amber-400'}`} />
            <span>{entry}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function EssayFullReviewPage() {
  const { sessionId, questionId } = useParams<{ sessionId: string; questionId: string }>();
  const router = useRouter();
  const [answer, setAnswer] = useState<SessionResultAnswer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEssay, setShowEssay] = useState(false);

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

  const goBack = () => router.push(`/dashboard/exams/sessions/${sessionId}/result`);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 animate-pulse md:px-8 md:py-10">
        <div className="h-4 w-32 rounded-lg bg-slate-100 dark:bg-slate-800" />
        <div className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (error || !answer) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 md:px-8 md:py-10">
        <button
          type="button"
          onClick={goBack}
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
  const isPending = answer.reviewStatus === 'PENDING_REVIEW';
  const score = answer.overrideScore ?? answer.awardedMarks ?? answer.manualScore;
  const bandLabel = feedback?.bandLabel ?? (isPending ? 'Pending review' : 'Not assigned');
  const writingType = formatWritingType(answer.writingType);
  const overallFeedback = feedback?.overallFeedback ?? feedback?.feedback;
  const strengths = feedback?.strengths ?? [];
  const improvements = feedback?.improvements ?? [];
  const criterionScores = feedback?.criterionScores ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 md:px-8 md:py-10">
      {/* Back link */}
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-800 dark:hover:text-slate-200"
      >
        <ArrowLeft size={16} /> Back to Results
      </button>

      {/* Question + stimulus */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Question {answer.order} <span className="mx-1">·</span> {writingType} <span className="mx-1">·</span> {answer.maxMarks} Marks
        </p>
        <div className="mt-3 text-[15px] font-medium leading-relaxed text-slate-800 dark:text-slate-200">
          <QuestionLatexRenderer text={answer.questionText} latexEnabled={answer.latexEnabled} />
        </div>
        {answer.promptText && (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-900/10">
            <p className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Stimulus</p>
            <div className="mt-2 text-sm font-semibold italic text-blue-800 dark:text-blue-200">
              <QuestionLatexRenderer text={answer.promptText} latexEnabled={answer.latexEnabled} />
            </div>
          </div>
        )}
      </section>

      {/* Score banner */}
      {isPending ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-900/10 sm:p-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1.5 text-xs font-black uppercase tracking-wide text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white/90" /> Pending Review
          </span>
          <p className="mt-3 text-sm font-medium text-amber-800 dark:text-amber-200">
            {feedback?.reason ?? 'This essay is awaiting manual review, so its final score and feedback are not available yet.'}
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 via-orange-50/60 to-white p-5 shadow-sm dark:border-orange-900/40 dark:from-orange-950/30 dark:via-orange-950/10 dark:to-slate-900 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF6900] px-3.5 py-1.5 text-xs font-black uppercase tracking-wide text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white/90" /> {bandLabel}
              </span>
              {feedback?.bandDescriptor && (
                <p className="mt-3 max-w-md text-sm font-semibold leading-relaxed text-orange-900/80 dark:text-orange-200/90">
                  {feedback.bandDescriptor}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-4xl font-black leading-none text-[#FF6900]">
                {score ?? '—'}
                <span className="ml-1 text-lg font-black text-orange-300 dark:text-orange-400/70">/ {answer.maxMarks}</span>
              </p>
              <p className="mt-1.5 text-[11px] font-black uppercase tracking-wider text-orange-400">Marks</p>
              <p className="text-[11px] font-black uppercase tracking-wider text-orange-400">{writingType}</p>
            </div>
          </div>
        </section>
      )}

      {/* Overall review */}
      {overallFeedback && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Review</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
            {overallFeedback}
          </p>
        </section>
      )}

      {/* Strengths */}
      {strengths.length > 0 && <FeedbackList title="Strengths" entries={strengths} tone="positive" />}

      {/* Areas to improve */}
      {improvements.length > 0 && <FeedbackList title="Areas to Improve" entries={improvements} tone="improvement" />}

      {/* Criterion breakdown — one main card wrapping nested purple criterion cards */}
      {criterionScores.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <h2 className="text-xs font-black uppercase tracking-wider text-violet-700 dark:text-violet-400">Criterion Breakdown</h2>
          <div className="mt-4 space-y-4">
            {criterionScores.map((criterion) => {
              const pct = criterion.maxScore > 0 ? Math.min(100, (criterion.score / criterion.maxScore) * 100) : 0;
              return (
                <article
                  key={criterion.criterionId}
                  className="rounded-2xl border border-violet-100 bg-purple-50 p-4 dark:border-violet-900/30 dark:bg-violet-950/10 sm:p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black text-violet-900 dark:text-violet-300">{criterion.criterionName}</h3>
                    <span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-black text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                      {criterion.score} / {criterion.maxScore}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-violet-900/30">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500" style={{ width: `${pct}%` }} />
                  </div>
                  {criterion.feedback && (
                    <p className="mt-3 text-sm font-medium leading-relaxed text-violet-900/90 dark:text-violet-200/90">{criterion.feedback}</p>
                  )}
                  {(criterion.strengths?.length ?? 0) > 0 && (
                    <CriterionPoints title="Strengths" entries={criterion.strengths ?? []} tone="positive" />
                  )}
                  {(criterion.improvements?.length ?? 0) > 0 && (
                    <CriterionPoints title="To Improve" entries={criterion.improvements ?? []} tone="improvement" />
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Tutor review (override / manual feedback) */}
      {(answer.isOverridden || answer.tutorFeedback) && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900/40 dark:bg-blue-900/10 sm:p-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Tutor Review</h2>
          {answer.isOverridden && answer.overrideScore !== null && (
            <p className="mt-2 text-lg font-black text-blue-800 dark:text-blue-100">{answer.overrideScore}/{answer.maxMarks}</p>
          )}
          {(answer.overrideNotes || answer.tutorFeedback) && (
            <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-blue-700 dark:text-blue-300">
              {answer.overrideNotes ?? answer.tutorFeedback}
            </p>
          )}
        </section>
      )}

      {/* Your essay (collapsible) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <button
          type="button"
          onClick={() => setShowEssay((v) => !v)}
          className="flex w-full items-center justify-between gap-3"
        >
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Your Essay</h2>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {showEssay ? <>Hide <ChevronUp size={14} /></> : <>Show <ChevronDown size={14} /></>}
          </span>
        </button>
        {showEssay && (
          <p className="mt-3 whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-slate-700 dark:text-slate-300">
            {answer.studentAnswer || <span className="italic text-slate-400">No answer submitted.</span>}
          </p>
        )}
      </section>
    </div>
  );
}

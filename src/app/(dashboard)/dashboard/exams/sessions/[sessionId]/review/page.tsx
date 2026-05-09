'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { isAxiosError } from 'axios';
import { examService } from '@/features/exams/services/exams.service';
import { QuestionLatexRenderer } from '@/components/ui/QuestionLatexRenderer';
import type { ReviewSession, ReviewSessionAnswer } from '@/features/exams/types/exams.types';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Save,
  Trophy,
} from 'lucide-react';

const RANKING_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SUPERIOR: { label: 'Superior', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  ABOVE_AVERAGE: { label: 'Above Average', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  HIGH_AVERAGE: { label: 'High Average', color: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/30' },
  AVERAGE: { label: 'Average', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  LOW_AVERAGE: { label: 'Low Average', color: 'text-slate-700 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
};

function formatSeconds(seconds: number | null) {
  if (seconds === null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isEssay(answer: ReviewSessionAnswer) {
  return answer.type === 'ESSAY';
}

function isPending(answer: ReviewSessionAnswer) {
  return answer.reviewStatus === 'PENDING_REVIEW';
}

function EssayReviewCard({
  answer,
  index,
  scoreValue,
  feedbackValue,
  onScoreChange,
  onFeedbackChange,
}: {
  answer: ReviewSessionAnswer;
  index: number;
  scoreValue: string;
  feedbackValue: string;
  onScoreChange: (value: string) => void;
  onFeedbackChange: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(index === 0);
  const pending = isPending(answer);
  const cardBorderClass = pending
    ? 'border-amber-200 dark:border-amber-800/50'
    : answer.manualScore !== null
      ? 'border-green-200 dark:border-green-800/50'
      : 'border-slate-200 dark:border-slate-800';
  const badgeClass = pending
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    : answer.manualScore !== null
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';

  return (
    <div className={`rounded-2xl border-2 ${cardBorderClass}`}>
      <button
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${badgeClass}`}>
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-sm font-medium text-slate-800 dark:text-slate-200">
            <QuestionLatexRenderer text={answer.contentText} latex={answer.contentLatex} isLatexFormat={answer.isLatexFormat} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            <span className={`font-semibold ${pending ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {pending ? 'Pending review' : answer.manualScore !== null ? 'Manually graded' : 'Ready to review'}
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="flex items-center gap-1 text-slate-400"><Clock size={10} />{formatSeconds(answer.timeSpentSeconds)}</span>
          </div>
        </div>
        <div className="shrink-0 text-slate-400">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-800">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Student Answer</p>
            <div className="mt-1 rounded-xl bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {answer.studentAnswer ? (
                <p className="whitespace-pre-wrap">{answer.studentAnswer}</p>
              ) : (
                <span className="italic text-slate-400">No answer submitted</span>
              )}
            </div>
          </div>

          {answer.aiFeedback?.feedback && (
            <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 dark:border-emerald-900/30 dark:bg-emerald-900/10">
              <p className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">AI Review</p>
              <p className="mt-1 text-sm font-medium text-emerald-800 dark:text-emerald-300">{answer.aiFeedback.feedback}</p>
              {(answer.aiFeedback.confidence || answer.aiFeedback.gradedAt) && (
                <p className="mt-2 text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80">
                  {answer.aiFeedback.confidence ? `Confidence: ${answer.aiFeedback.confidence}` : null}
                  {answer.aiFeedback.confidence && answer.aiFeedback.gradedAt ? ' · ' : null}
                  {answer.aiFeedback.gradedAt ? `Reviewed at ${formatDateTime(answer.aiFeedback.gradedAt)}` : null}
                </p>
              )}
              {answer.aiFeedback.rubric && (
                <div className="mt-3 rounded-lg bg-white/70 px-3 py-2 dark:bg-slate-900/40">
                  <p className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-300">
                    {answer.aiFeedback.rubric.name} · {answer.aiFeedback.totalAwardedMarks ?? 0}/{answer.aiFeedback.totalPossibleMarks ?? answer.aiFeedback.rubric.totalMaxScore} marks
                  </p>
                  {answer.aiFeedback.criterionScores.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {answer.aiFeedback.criterionScores.map((criterion) => (
                        <div key={criterion.criterionId} className="rounded-lg bg-emerald-100/60 px-2.5 py-2 dark:bg-emerald-950/30">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-black text-emerald-900 dark:text-emerald-200">{criterion.criterionName}</p>
                            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">{criterion.score}/{criterion.maxScore}</span>
                          </div>
                          {criterion.feedback && <p className="mt-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">{criterion.feedback}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {answer.aiFeedback?.reason && pending && (
            <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 dark:border-amber-900/30 dark:bg-amber-900/10">
              <p className="text-xs font-bold uppercase text-amber-500">Status</p>
              <p className="mt-1 text-sm font-medium text-amber-700 dark:text-amber-300">{answer.aiFeedback.reason}</p>
            </div>
          )}

          <div className="mt-4 grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Manual Score</label>
              <input
                type="number"
                min={0}
                max={answer.maxMarks}
                value={scoreValue}
                onChange={(event) => onScoreChange(event.target.value)}
                placeholder={`0 - ${answer.maxMarks}`}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 focus:border-[#FF6900] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <p className="mt-2 text-xs font-medium text-slate-400">Max marks: {answer.maxMarks}</p>
              {answer.awardedMarks !== null && (
                <p className="mt-1 text-xs font-medium text-slate-400">Current awarded marks: {answer.awardedMarks}/{answer.maxMarks}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Tutor Feedback</label>
              <textarea
                value={feedbackValue}
                onChange={(event) => onFeedbackChange(event.target.value)}
                rows={4}
                placeholder="Share guidance, corrections, or strengths shown in this answer..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 focus:border-[#FF6900] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function McqReviewCard({ answer, index }: { answer: ReviewSessionAnswer; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-2xl border-2 ${answer.isCorrect ? 'border-green-200 dark:border-green-800/50' : 'border-red-200 dark:border-red-800/50'}`}>
      <button onClick={() => setExpanded((value) => !value)} className="flex w-full items-start gap-3 p-4 text-left">
        <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${answer.isCorrect ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-sm font-medium text-slate-800 dark:text-slate-200">
            <QuestionLatexRenderer text={answer.contentText} latex={answer.contentLatex} isLatexFormat={answer.isLatexFormat} />
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className={`font-semibold ${answer.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {answer.isCorrect ? 'Correct' : 'Incorrect'}
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="flex items-center gap-1 text-slate-400"><Clock size={10} />{formatSeconds(answer.timeSpentSeconds)}</span>
          </div>
        </div>
        <div className="shrink-0 text-slate-400">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-800">
          {answer.options && (
            <div className="space-y-2">
              {answer.options.map((opt) => {
                const isStudentAnswer = answer.studentAnswer === opt.key;
                const isCorrectAnswer = answer.correctAnswer === opt.key;
                const isIncorrectAnswer = isStudentAnswer && !isCorrectAnswer;

                return (
                  <div
                    key={opt.key}
                    className={`flex items-start gap-2.5 rounded-xl px-3 py-2 text-sm ${isCorrectAnswer ? 'bg-green-50 dark:bg-green-900/20' : isIncorrectAnswer ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-black ${isCorrectAnswer ? 'bg-green-500 text-white' : isIncorrectAnswer ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                      {opt.key}
                    </span>
                    <span className={`font-medium ${isCorrectAnswer ? 'text-green-800 dark:text-green-300' : isIncorrectAnswer ? 'text-red-700 dark:text-red-300' : 'text-slate-600 dark:text-slate-400'}`}>
                      <QuestionLatexRenderer text={opt.text} isLatexFormat={answer.isLatexFormat} />
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {answer.explanation && (
            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800">
              <p className="text-xs font-bold uppercase text-slate-400">Explanation</p>
              <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-700 dark:text-slate-300">{answer.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SessionReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get('examId');

  const [review, setReview] = useState<ReviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({});
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});

  const loadReview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await examService.getReviewSession(sessionId);
      if (res.success) {
        setReview(res.data);
        const nextScores: Record<string, string> = {};
        const nextFeedback: Record<string, string> = {};
        res.data.answers.filter(isEssay).forEach((answer) => {
          nextScores[answer.questionId] = answer.manualScore !== null ? String(answer.manualScore) : '';
          nextFeedback[answer.questionId] = answer.tutorFeedback ?? '';
        });
        setScoreDrafts(nextScores);
        setFeedbackDrafts(nextFeedback);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message || 'Failed to load review session' : 'Failed to load review session');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReview();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadReview]);

  const essayAnswers = useMemo(() => review?.answers.filter(isEssay) ?? [], [review]);
  const pendingEssayCount = useMemo(() => essayAnswers.filter(isPending).length, [essayAnswers]);
  const gradedEssayCount = useMemo(() => essayAnswers.filter((answer) => answer.manualScore !== null).length, [essayAnswers]);

  const handleSave = async () => {
    if (!review) return;

    const grades = essayAnswers.flatMap((answer) => {
      const rawScore = scoreDrafts[answer.questionId]?.trim() ?? '';
      if (!rawScore) return [];

      const numericScore = Number(rawScore);
      if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > answer.maxMarks) {
        throw new Error(`Manual score for question ${answer.order} must be between 0 and ${answer.maxMarks}.`);
      }

      return [{
        questionId: answer.questionId,
        manualScore: numericScore,
        tutorFeedback: (feedbackDrafts[answer.questionId] ?? '').trim() || null,
      }];
    });

    if (grades.length === 0) {
      setError('Enter at least one manual score before saving.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await examService.submitManualGrades(sessionId, { grades });
      if (res.success) {
        setSuccessMsg(res.data.pendingReviewCount > 0 ? 'Manual grades saved. Some essay answers still need review.' : 'Manual grading completed successfully.');
        await loadReview();
      } else {
        setError(res.message);
      }
    } catch (err) {
      if (err instanceof Error && !isAxiosError(err)) {
        setError(err.message);
      } else {
        setError(isAxiosError(err) ? err.response?.data?.message || 'Failed to save manual grades' : 'Failed to save manual grades');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="mx-auto animate-spin text-[#FF6900]" />
          <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">Loading review session...</p>
        </div>
      </div>
    );
  }

  if (error && !review) {
    return (
      <div className="w-full max-w-4xl">
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle size={16} /> {error}
        </div>
      </div>
    );
  }

  if (!review) return null;

  const rankConfig = review.rankingLevel ? RANKING_CONFIG[review.rankingLevel] : null;

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => examId ? router.push(`/dashboard/exams/${examId}`) : router.push('/dashboard/exams')}
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-[#FF6900]">Manual Review</p>
          <h1 className="truncate text-xl font-black text-slate-900 dark:text-slate-100">{review.examTitle}</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {review.student.fullName} · {review.student.email}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF6900] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {isSaving ? 'Saving...' : 'Save Manual Grades'}
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-800/50 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Candidate</p>
            <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">{review.student.fullName}</p>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Submitted {formatDateTime(review.endTime)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs font-bold uppercase text-slate-400">Status</p>
              <p className="mt-1 text-sm font-black text-slate-900 dark:text-slate-100">{review.status}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs font-bold uppercase text-slate-400">Pending Essay</p>
              <p className="mt-1 text-sm font-black text-amber-600 dark:text-amber-400">{pendingEssayCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs font-bold uppercase text-slate-400">Reviewed Essay</p>
              <p className="mt-1 text-sm font-black text-green-600 dark:text-green-400">{gradedEssayCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs font-bold uppercase text-slate-400">Time Used</p>
              <p className="mt-1 flex items-center gap-1 text-sm font-black text-slate-900 dark:text-slate-100"><Clock size={14} className="text-slate-400" />{formatSeconds(review.totalTimeSeconds)}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-xs font-bold uppercase text-slate-400">Current Score</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{review.finalScore !== null ? review.finalScore.toFixed(1) : 'Pending'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-xs font-bold uppercase text-slate-400">Essay Questions</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{essayAnswers.length}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-xs font-bold uppercase text-slate-400">Ranking</p>
            {rankConfig ? (
              <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${rankConfig.color} ${rankConfig.bg}`}>
                <Trophy size={11} /> {rankConfig.label}
              </span>
            ) : (
              <p className="mt-1 text-sm font-black text-slate-500 dark:text-slate-400">Pending</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Answer Review</h2>
          <p className="text-xs font-medium text-slate-400">Scores are saved on a 0-100 scale per essay answer.</p>
        </div>

        {review.answers.map((answer, index) => (
          isEssay(answer) ? (
            <EssayReviewCard
              key={answer.questionId}
              answer={answer}
              index={index}
              scoreValue={scoreDrafts[answer.questionId] ?? ''}
              feedbackValue={feedbackDrafts[answer.questionId] ?? ''}
              onScoreChange={(value) => setScoreDrafts((prev) => ({ ...prev, [answer.questionId]: value }))}
              onFeedbackChange={(value) => setFeedbackDrafts((prev) => ({ ...prev, [answer.questionId]: value }))}
            />
          ) : (
            <McqReviewCard key={answer.questionId} answer={answer} index={index} />
          )
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF6900] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {isSaving ? 'Saving...' : 'Save Manual Grades'}
        </button>
      </div>
    </div>
  );
}

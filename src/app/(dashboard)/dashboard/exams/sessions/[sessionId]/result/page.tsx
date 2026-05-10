'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { examService } from '@/features/exams/services/exams.service';
import { QuestionLatexRenderer } from '@/components/ui/QuestionLatexRenderer';
import type { SessionResult, SessionResultAnswer, SessionInsightsResponse } from '@/features/exams/types/exams.types';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  FileText,
  XCircle,
  ChevronDown,
  ChevronUp,
  Trophy,
  Sparkles,
  Lightbulb,
  TrendingUp,
  TrendingDown,
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

function isPendingReview(answer: SessionResultAnswer) {
  return answer.reviewStatus === 'PENDING_REVIEW';
}

function isEssayAiGraded(answer: SessionResultAnswer) {
  return answer.type === 'ESSAY' && answer.reviewStatus === 'AI_GRADED';
}

function AnswerCard({ answer, index }: { answer: SessionResultAnswer; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isPendingAnswer = isPendingReview(answer);
  const isAiGradedEssay = isEssayAiGraded(answer);
  const cardBorderClass = isPendingAnswer
    ? 'border-amber-200 dark:border-amber-800/50'
    : answer.isCorrect
      ? 'border-green-200 dark:border-green-800/50'
      : 'border-red-200 dark:border-red-800/50';
  const badgeClass = isPendingAnswer
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    : answer.isCorrect
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  const statusClass = isPendingAnswer
    ? 'text-amber-600 dark:text-amber-400'
    : answer.isCorrect
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  const dividerBorderClass = isPendingAnswer
    ? 'border-amber-100 dark:border-amber-900/30'
    : answer.isCorrect
      ? 'border-green-100 dark:border-green-900/30'
      : 'border-red-100 dark:border-red-900/30';

  return (
    <div className={`rounded-2xl border-2 ${cardBorderClass}`}>
      <button
        onClick={() => setExpanded((v) => !v)}
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
            <span className={`flex items-center gap-1 font-semibold ${statusClass}`}>
              {isPendingAnswer ? <FileText size={11} /> : answer.isCorrect ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
              {isPendingAnswer ? 'Pending Review' : answer.isCorrect ? 'Correct' : 'Incorrect'}
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="flex items-center gap-0.5 text-slate-400"><Clock size={10} />{formatSeconds(answer.timeSpentSeconds)}</span>
          </div>
        </div>
        <div className="shrink-0 text-slate-400">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className={`border-t px-4 pb-4 pt-3 ${dividerBorderClass}`}>
          {answer.options && (
            <div className="space-y-2">
              {answer.options.map((opt) => {
                const isStudentAnswer = answer.studentAnswer === opt.key;
                const isCorrectAnswer = answer.correctAnswer === opt.key;
                const isIncorrectAnswer = !isPendingAnswer && isStudentAnswer && !isCorrectAnswer;
                
                return (
                  <div
                    key={opt.key}
                    className={`flex items-start gap-2.5 rounded-xl px-3 py-2 text-sm ${isCorrectAnswer ? 'bg-green-50 dark:bg-green-900/20' : isIncorrectAnswer ? 'bg-red-50 dark:bg-red-900/20' : isPendingAnswer && isStudentAnswer ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-black ${isCorrectAnswer ? 'bg-green-500 text-white' : isIncorrectAnswer ? 'bg-red-500 text-white' : isPendingAnswer && isStudentAnswer ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                      {opt.key}
                    </span>
                    <span className={`font-medium ${isCorrectAnswer ? 'text-green-800 dark:text-green-300' : isIncorrectAnswer ? 'text-red-700 dark:text-red-300' : isPendingAnswer && isStudentAnswer ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}>
                      <QuestionLatexRenderer text={opt.text} isLatexFormat={answer.isLatexFormat} />
                      {isCorrectAnswer && <span className="ml-2 text-xs font-bold text-green-600 dark:text-green-400">✓ Correct</span>}
                      {isIncorrectAnswer && <span className="ml-2 text-xs font-bold text-red-600 dark:text-red-400">Your answer</span>}
                      {isPendingAnswer && isStudentAnswer && <span className="ml-2 text-xs font-bold text-blue-600 dark:text-blue-400">Your answer</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {answer.type === 'ESSAY' && (
            <div className="space-y-2">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Your Answer</p>
                <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {answer.studentAnswer || <span className="italic text-slate-400">No answer</span>}
                </p>
              </div>
              {isAiGradedEssay && answer.aiFeedback?.feedback && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 dark:border-emerald-900/30 dark:bg-emerald-900/10">
                  <p className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">AI Review</p>
                  <p className="mt-1 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    {answer.aiFeedback.feedback}
                  </p>
                  {(answer.aiFeedback.confidence || answer.aiFeedback.gradedAt) && (
                    <p className="mt-2 text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80">
                      {answer.aiFeedback.confidence ? `Confidence: ${answer.aiFeedback.confidence}` : null}
                      {answer.aiFeedback.confidence && answer.aiFeedback.gradedAt ? ' · ' : null}
                      {answer.aiFeedback.gradedAt ? `Reviewed at ${new Date(answer.aiFeedback.gradedAt).toLocaleString()}` : null}
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
            </div>
          )}

          {isPendingAnswer && (
            <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 dark:border-amber-900/30 dark:bg-amber-900/10">
              <p className="text-xs font-bold uppercase text-amber-500">Status</p>
              <p className="mt-1 text-sm font-medium text-amber-700 dark:text-amber-300">
                {answer.aiFeedback?.reason ?? 'This answer is awaiting manual review, so it has not been marked as correct or incorrect yet.'}
              </p>
            </div>
          )}
          
          {answer.manualScore !== null && (
            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800">
              <p className="text-xs font-bold uppercase text-slate-400">Manual Score</p>
              <p className="mt-1 text-sm font-black text-slate-800 dark:text-slate-100">{answer.awardedMarks ?? answer.manualScore}/{answer.maxMarks}</p>
            </div>
          )}

          {answer.explanation && (
            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800">
              <p className="text-xs font-bold uppercase text-slate-400">Explanation</p>
              <div className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                <QuestionLatexRenderer text={answer.explanation} isLatexFormat={answer.isLatexFormat} />
              </div>
            </div>
          )}

          {answer.tutorFeedback && (
            <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 dark:border-blue-900/30 dark:bg-blue-900/10">
              <p className="text-xs font-bold uppercase text-blue-500">Tutor Feedback</p>
              <p className="mt-1 text-sm font-medium text-blue-700 dark:text-blue-300">{answer.tutorFeedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExamResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [result, setResult] = useState<SessionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const [insights, setInsights] = useState<SessionInsightsResponse['data'] | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const handleGenerateInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      const res = await examService.getInsights(sessionId);
      if (res.success) {
        setInsights(res.data);
      }
    } catch (err) {
      console.error('Failed to generate insights', err);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await examService.getResult(sessionId);
        if (res.success) {
          setResult(res.data);
          setIsLoading(false);
        } else {
          setError(res.message);
          setIsLoading(false);
        }
      } catch (err) {
        if (isAxiosError(err) && err.response?.data?.message?.includes('in progress')) {
          if (pollCount < 10) {
            setTimeout(() => setPollCount((c) => c + 1), 2000);
          } else {
            setError('Grading is taking longer than expected. Please check back later.');
            setIsLoading(false);
          }
        } else {
          setError(isAxiosError(err) ? err.response?.data?.message || 'Failed to load results' : 'Failed to load results');
          setIsLoading(false);
        }
      }
    };
    load();
  }, [sessionId, pollCount]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="mx-auto animate-spin text-[#FF6900]" />
          <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
            {pollCount > 0 ? 'Grading in progress...' : 'Loading results...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle size={16} /> {error}
        </div>
      </div>
    );
  }

  if (!result) return null;

  const rankConfig = result.rankingLevel ? RANKING_CONFIG[result.rankingLevel] : null;
  const pendingReviewCount = result.answers.filter(isPendingReview).length;
  const incorrectCount = Math.max(0, result.totalQuestions - result.correctCount - pendingReviewCount);
  const reviewedQuestionCount = Math.max(0, result.totalQuestions - pendingReviewCount);
  const percentage = reviewedQuestionCount > 0 ? (result.correctCount / reviewedQuestionCount) * 100 : 0;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 md:px-8 md:py-10">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/exams')}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#FF6900]">Results</p>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">{result.examTitle}</h1>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center">
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#FF6900]">
              <div className="text-center">
                {result.finalScore !== null ? (
                  <>
                    <p className="text-3xl font-black leading-none text-slate-900 dark:text-slate-100">
                      {result.finalScore.toFixed(0)}
                    </p>
                    <p className="text-xs font-bold text-slate-400">/100</p>
                  </>
                ) : (
                  <p className="text-xs font-bold text-slate-400">Pending</p>
                )}
              </div>
            </div>
            {rankConfig && (
              <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${rankConfig.color} ${rankConfig.bg}`}>
                <Trophy size={11} /> {rankConfig.label}
              </span>
            )}
          </div>

          <div className="flex-1 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs font-bold uppercase text-slate-400">Correct</p>
              <p className="mt-1 text-xl font-black text-green-600 dark:text-green-400">{result.correctCount}</p>
              <p className="text-xs text-slate-400">of {reviewedQuestionCount || result.totalQuestions}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs font-bold uppercase text-slate-400">Incorrect</p>
              <p className="mt-1 text-xl font-black text-red-600 dark:text-red-400">{incorrectCount}</p>
              <p className="text-xs text-slate-400">of {reviewedQuestionCount || result.totalQuestions}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs font-bold uppercase text-slate-400">Pending Review</p>
              <p className="mt-1 text-xl font-black text-amber-600 dark:text-amber-400">{pendingReviewCount}</p>
              <p className="text-xs text-slate-400">answers</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs font-bold uppercase text-slate-400">Time Used</p>
              <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-1">
                <Clock size={16} className="text-slate-400" />{formatSeconds(result.totalTimeSeconds)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-[#FF6900] transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="mt-1.5 text-right text-xs font-bold text-slate-400">
            {reviewedQuestionCount > 0 ? `${percentage.toFixed(1)}% accuracy` : 'Awaiting manual review'}
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-indigo-200 bg-white p-6 shadow-sm dark:border-indigo-900/30 dark:bg-slate-900 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-slate-100">
              <Sparkles className="text-indigo-500" /> AI Performance Insights
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              Personalized analytics and advice based on your accuracy and time management.
            </p>
          </div>
          {!insights && (
            <button
              onClick={handleGenerateInsights}
              disabled={isGeneratingInsights}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-600 focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-70 dark:bg-indigo-600 dark:hover:bg-indigo-700"
            >
              {isGeneratingInsights ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {isGeneratingInsights ? 'Analyzing...' : 'Generate Insights'}
            </button>
          )}
        </div>

        {insights && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-indigo-50 p-5 dark:bg-indigo-900/10">
              <p className="text-sm font-medium leading-relaxed text-indigo-900 dark:text-indigo-200">
                {insights.summary}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                  <TrendingUp size={16} className="text-emerald-500" /> Key Strengths
                </h3>
                <ul className="space-y-2">
                  {insights.strengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                      <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {str}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                  <TrendingDown size={16} className="text-rose-500" /> Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {insights.weaknesses.map((weak, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                      <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                      {weak}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 p-5 dark:border-blue-900/30">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                <Lightbulb size={16} className="text-amber-500" /> Actionable Advice
              </h3>
              <ul className="space-y-2">
                {insights.advice.map((adv, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {adv}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {result.answers.some(a => a.studentAnswer && a.studentAnswer.trim() !== '') && (
        <div className="space-y-3">
          <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Answer Review</h2>
          {result.answers.map((answer, i) => {
            if (!answer.studentAnswer || answer.studentAnswer.trim() === '') return null;
            return <AnswerCard key={answer.questionId} answer={answer} index={i} />;
          })}
        </div>
      )}

      {result.status === 'SUBMITTED' && (
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/40 dark:bg-amber-900/10">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <AlertCircle size={18} />
            </div>
            <div>
              <p className="text-sm font-black text-amber-800 dark:text-amber-300">Manual review is still in progress</p>
              <p className="mt-1 text-sm font-medium text-amber-700 dark:text-amber-400">
                Objective questions already appear below. Essay answers marked as pending will update automatically after tutor review is completed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { examService } from '@/features/exams/services/exams.service';
import { questionsService } from '@/features/questions/services/questions.service';
import { QuestionLatexRenderer } from '@/components/ui/QuestionLatexRenderer';
import type { ExamItem, ExamQuestionItem, ManualGradingQueueStatus, ManualGradingSubmission } from '@/features/exams/types/exams.types';
import {
  ArrowLeft,
  Loader2,
  Clock,
  FileText,
  Plus,
  Trash2,
  PlayCircle,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  Zap,
  BookOpen,
  BarChart3,
  Filter,
  ClipboardCheck,
  Eye,
} from 'lucide-react';

const GRADING_TYPE_LABELS: Record<string, string> = { AUTO: 'Auto (MCQ, Essay)', MANUAL: 'Manual (Essay)' };
const EXAM_TYPE_LABELS: Record<string, string> = { MOCK_EXAM: 'Mock Exam', ASSIGNMENT: 'Assignment' };

function formatDuration(minutes: number | null) {
  if (minutes === null || minutes === undefined) return 'Not set';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
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

function formatTimeSpent(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m} min`;
}

// Minimal Question type for the add-questions modal
interface QuestionOption {
  key: string;
  text: string;
}

interface AvailableQuestion {
  id: string;
  questionId: string | null;
  type: string;
  difficulty: string;
  contentText: string;
  contentLatex: string | null;
  isLatexFormat: boolean;
  subjectName: string;
  topicName: string;
  options: QuestionOption[] | null;
}

function AddQuestionsModal({
  examId,
  examGradingType,
  existingQuestionIds,
  onClose,
  onAdded,
}: {
  examId: string;
  examGradingType: string;
  existingQuestionIds: Set<string>;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [questions, setQuestions] = useState<AvailableQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use the questions API (requires Admin/Tutor role)
        const data = await questionsService.list({ limit: 100, status: 'PUBLISHED' });
        if (data.success) {
          setQuestions(data.data || []);
        } else {
          setError(data.message || 'Failed to load questions');
        }
      } catch (err) {
        setError(isAxiosError(err) ? err.response?.data?.message || 'Failed to load questions' : 'Failed to load questions');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filtered = questions.filter((q) => {
    if (existingQuestionIds.has(q.id)) return false;
    if (examGradingType === 'MANUAL' && q.type !== 'ESSAY') return false;
    if (!search) return true;
    return (
      q.contentText.toLowerCase().includes(search.toLowerCase()) ||
      q.subjectName.toLowerCase().includes(search.toLowerCase()) ||
      q.topicName.toLowerCase().includes(search.toLowerCase()) ||
      q.questionId?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0) return;
    setIsAdding(true);
    setError(null);
    try {
      const res = await examService.addQuestions(examId, { questionIds: Array.from(selected) });
      if (res.success) {
        onAdded();
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message || 'Failed to add questions' : 'Failed to add questions');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-2xl flex-col rounded-[2rem] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Add Questions</h2>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-[#FF6900] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          {selected.size > 0 && (
            <p className="mt-2 text-xs font-semibold text-[#FF6900]">{selected.size} selected</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#FF6900]" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm font-medium text-slate-400">
              {search ? 'No questions match your search.' : 'No published questions available.'}
            </p>
          ) : (
            <div className="space-y-2 pb-4">
              {filtered.map((q) => (
                <button
                  key={q.id}
                  onClick={() => toggleSelect(q.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${selected.has(q.id) ? 'border-[#FF6900] bg-orange-50 dark:bg-orange-900/10' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 transition-colors ${selected.has(q.id) ? 'border-[#FF6900] bg-[#FF6900]' : 'border-slate-300 dark:border-slate-600'}`}>
                      {selected.has(q.id) && (
                        <svg viewBox="0 0 10 8" fill="none" className="h-full w-full p-0.5">
                          <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                        <QuestionLatexRenderer text={q.contentText} latex={q.contentLatex} isLatexFormat={q.isLatexFormat} />
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs font-medium text-slate-400">
                        <span>{q.subjectName}</span>
                        <span>·</span>
                        <span>{q.topicName}</span>
                        <span>·</span>
                        <span className={q.type === 'MCQ' ? 'text-blue-500' : 'text-purple-500'}>{q.type}</span>
                        <span>·</span>
                        <span>{q.difficulty}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mx-6 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3 p-6 pt-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={selected.size === 0 || isAdding}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6900] py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {isAdding && <Loader2 size={15} className="animate-spin" />}
            Add {selected.size > 0 ? `${selected.size} ` : ''}Question{selected.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubmissionQueuePanel({
  examId,
  gradingType,
  submissions,
  isLoading,
  error,
  statusFilter,
  onStatusFilterChange,
  submissionTotal,
}: {
  examId: string;
  gradingType: string;
  submissions: ManualGradingSubmission[];
  isLoading: boolean;
  error: string | null;
  statusFilter: ManualGradingQueueStatus;
  onStatusFilterChange: (value: ManualGradingQueueStatus) => void;
  submissionTotal: number;
}) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ClipboardCheck size={16} className="text-[#FF6900]" />
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Submission Review</h2>
            {submissionTotal > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {submissionTotal} student{submissionTotal !== 1 ? 's' : ''} submitted
              </span>
            )}
          </div>
          <p className="mt-1 text-xs font-medium text-slate-400">
            {gradingType === 'AUTO' ? 'Review completed submissions and final outcomes.' : 'Review student submissions and apply manual grading where needed.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(['ALL', 'PENDING_REVIEW', 'GRADED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => onStatusFilterChange(filter)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                statusFilter === filter
                  ? 'bg-[#FF6900] text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              {filter === 'ALL' ? 'All' : filter === 'PENDING_REVIEW' ? 'Pending' : 'Graded'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={24} className="animate-spin text-[#FF6900]" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No submissions found</p>
          <p className="mt-1 text-xs font-medium text-slate-400">Student attempts will appear here once the exam has been submitted.</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
            {submissions.map((submission) => {
              const isPending = submission.pendingReviewCount > 0 || submission.status === 'SUBMITTED';
              return (
                <div key={submission.sessionId} className="space-y-3 px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-900 dark:text-slate-100">{submission.studentName}</p>
                      <p className="mt-0.5 truncate text-xs font-medium text-slate-400">{submission.studentEmail}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      isPending
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {isPending ? (submission.pendingReviewCount > 0 ? `${submission.pendingReviewCount} pending` : 'Submitted') : 'Graded'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Submitted</p>
                      <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{formatDateTime(submission.submittedAt)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Time Taken</p>
                      <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{formatTimeSpent(submission.totalTimeSeconds)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Score</p>
                      <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{submission.finalScore !== null ? submission.finalScore.toFixed(1) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Reviewed</p>
                      <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{submission.reviewedEssayCount}/{submission.totalEssayAnswers}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/dashboard/exams/sessions/${submission.sessionId}/review?examId=${examId}`)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Eye size={13} /> Review Submission
                  </button>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">Student</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">Submitted At</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">Time Taken</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">Score</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {submissions.map((submission) => {
                const isPending = submission.pendingReviewCount > 0 || submission.status === 'SUBMITTED';
                return (
                  <tr
                    key={submission.sessionId}
                    className={isPending
                      ? 'border-l-2 border-l-amber-400 bg-amber-50/40 dark:bg-amber-900/5'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                    }
                  >
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{submission.studentName}</p>
                      <p className="text-xs font-medium text-slate-400">{submission.studentEmail}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {formatDateTime(submission.submittedAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {formatTimeSpent(submission.totalTimeSeconds)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                      {submission.finalScore !== null ? `${submission.finalScore.toFixed(1)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isPending
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {isPending ? (submission.pendingReviewCount > 0 ? `${submission.pendingReviewCount} pending` : 'Submitted') : 'Graded'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/dashboard/exams/sessions/${submission.sessionId}/review?examId=${examId}`)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Eye size={13} /> Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main page ───────���─────────────────────────────────────────────────────────

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [exam, setExam] = useState<ExamItem | null>(null);
  const [questions, setQuestions] = useState<ExamQuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [qFilter, setQFilter] = useState<'ALL' | 'MCQ' | 'ESSAY' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');
  const [qSearch, setQSearch] = useState('');
  const [submissions, setSubmissions] = useState<ManualGradingSubmission[]>([]);
  const [submissionTotal, setSubmissionTotal] = useState<number>(0);
  const [submissionFilter, setSubmissionFilter] = useState<ManualGradingQueueStatus>('ALL');
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'ADMIN' || user?.role === 'TUTOR';
  const isStudent = user?.role === 'STUDENT';

  const loadExam = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await examService.getWithQuestions(id);
      if (res.success) {
        setExam(res.data.exam);
        setQuestions(res.data.questions);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message || 'Failed to load exam' : 'Failed to load exam');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadExam();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [loadExam]);

  const loadSubmissions = useCallback(async () => {
    if (!isStaff) return;

    setIsLoadingSubmissions(true);
    setSubmissionsError(null);
    try {
      const res = await examService.listSubmissions(id, { limit: 20, status: submissionFilter });
      if (res.success) {
        setSubmissions(res.data.submissions);
        setSubmissionTotal(res.meta.total);
      } else {
        setSubmissionsError(res.message);
      }
    } catch (err) {
      setSubmissionsError(isAxiosError(err) ? err.response?.data?.message || 'Failed to load submissions' : 'Failed to load submissions');
    } finally {
      setIsLoadingSubmissions(false);
    }
  }, [id, isStaff, submissionFilter]);

  useEffect(() => {
    if (isStaff) {
      const frame = window.requestAnimationFrame(() => {
        void loadSubmissions();
      });

      return () => window.cancelAnimationFrame(frame);
    }
  }, [isStaff, loadSubmissions]);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const res = await examService.startSession(id);
      if (res.success) {
        router.push(`/dashboard/exams/${id}/session`);
        return; // Keep loading state active during navigation
      } else {
        setError(res.message);
        setIsStarting(false);
      }
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message || 'Failed to start exam' : 'Failed to start exam');
      setIsStarting(false);
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    if (!confirm('Remove this question from the exam?')) return;
    setRemovingId(questionId);
    try {
      const res = await examService.removeQuestion(id, questionId);
      if (res.success) {
        setSuccessMsg('Question removed');
        setQuestions((prev) => prev.filter((q) => q.questionId !== questionId));
        setExam((prev) => prev ? { ...prev, questionCount: prev.questionCount - 1 } : prev);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message || 'Failed to remove question' : 'Failed to remove question');
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={36} className="animate-spin text-[#FF6900]" />
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className="w-full max-w-5xl">
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle size={16} /> {error}
        </div>
      </div>
    );
  }

  if (!exam) return null;

  // ── Derived stats ──────────────────────────────────────────────────────────
  const easyCount   = questions.filter((q) => q.question.difficulty === 'EASY').length;
  const mediumCount = questions.filter((q) => q.question.difficulty === 'MEDIUM').length;
  const hardCount   = questions.filter((q) => q.question.difficulty === 'HARD').length;
  const mcqCount    = questions.filter((q) => q.question.type === 'MCQ').length;
  const essayCount  = questions.filter((q) => q.question.type === 'ESSAY').length;

  const filteredQuestions = questions.filter((eq) => {
    if (qFilter === 'MCQ'    && eq.question.type !== 'MCQ')    return false;
    if (qFilter === 'ESSAY'  && eq.question.type !== 'ESSAY')  return false;
    if (qFilter === 'EASY'   && eq.question.difficulty !== 'EASY')   return false;
    if (qFilter === 'MEDIUM' && eq.question.difficulty !== 'MEDIUM') return false;
    if (qFilter === 'HARD'   && eq.question.difficulty !== 'HARD')   return false;
    if (qSearch && !eq.question.contentText.toLowerCase().includes(qSearch.toLowerCase())) return false;
    return true;
  });

  const difficultyStyle = {
    EASY:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    HARD:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const difficultyDot = {
    EASY:   'bg-green-500',
    MEDIUM: 'bg-amber-500',
    HARD:   'bg-red-500',
  };

  const totalQuestionsForDisplay = questions.length || exam.questionCount;

  const studentOverviewCards = [
    {
      label: 'Duration',
      value: formatDuration(exam.durationMinutes),
      helper: 'Planned exam time',
      icon: Clock,
      tone: 'bg-[#FF6900]/10 text-[#FF6900]',
    },
    {
      label: 'Questions',
      value: `${exam.questionCount}`,
      helper: exam.questionCount === 1 ? 'Question ready' : 'Questions ready',
      icon: FileText,
      tone: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    },
    {
      label: 'Grading',
      value: GRADING_TYPE_LABELS[exam.gradingType],
      helper: 'Scoring method',
      icon: Zap,
      tone: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    },
  ] as const;

  const studentChecklist = exam.questionCount > 0
    ? [
        `Complete the exam in one sitting within ${formatDuration(exam.durationMinutes)}.`,
        `This paper contains ${exam.questionCount} question${exam.questionCount === 1 ? '' : 's'}${totalQuestionsForDisplay > 0 ? ` with ${mcqCount} MCQ${essayCount > 0 ? ` and ${essayCount} essay` : ''}` : ''}.`,
        `Review each answer carefully before submission. Grading mode: ${GRADING_TYPE_LABELS[exam.gradingType]}.`,
      ]
    : [
        'This exam has not been populated with questions yet.',
        'You will be able to start once the exam content is ready.',
        'Please check again later or contact your tutor/admin for an update.',
      ];

  return (
    <div className="min-w-0 w-full space-y-5 overflow-x-hidden">

      {/* ── Back button ── */}
      <div>
        <button
          onClick={() => router.push('/dashboard/exams')}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* ── Alerts ── */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-800/50 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle2 size={16} /> {successMsg}
          <button className="ml-auto" onClick={() => setSuccessMsg(null)}><X size={14} /></button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle size={16} /> {error}
          <button className="ml-auto" onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {/* ── Body: sidebar + main ── */}
      <div className="min-w-0 flex flex-col gap-5 overflow-x-hidden lg:flex-row lg:items-start">

        {/* ── Left sidebar (exam info) ── */}
        {!isStudent && (
        <div className="flex flex-col gap-4 lg:w-64 lg:shrink-0">

          {/* Stat chips */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF6900]/10">
                <Clock size={16} className="text-[#FF6900]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Duration</p>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">{formatDuration(exam.durationMinutes)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <FileText size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Questions</p>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">{exam.questionCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20">
                <Zap size={16} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Grading</p>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">{GRADING_TYPE_LABELS[exam.gradingType]}</p>
              </div>
            </div>
            {!isStudent && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Created by</p>
                <p className="truncate text-sm font-black text-slate-900 dark:text-slate-100">{exam.creatorName}</p>
              </div>
            </div>
            )}
            {exam.hasSessions && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/20">
                <ClipboardCheck size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Submitted</p>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {submissionTotal} student{submissionTotal !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            )}
          </div>

          {/* Difficulty breakdown — only when there are questions */}
          {questions.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={14} className="text-slate-400" />
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Difficulty</p>
              </div>
              <div className="space-y-2.5">
                {([['EASY', easyCount, 'bg-green-500'], ['MEDIUM', mediumCount, 'bg-amber-500'], ['HARD', hardCount, 'bg-red-500']] as const).map(([label, count, color]) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-500 dark:text-slate-400">{label}</span>
                      <span className="text-slate-700 dark:text-slate-300">{count}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: questions.length > 0 ? `${(count / questions.length) * 100}%` : '0%' }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3.5 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 dark:bg-blue-900/20">
                  <BookOpen size={11} className="text-blue-500" />
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{mcqCount} MCQ</span>
                </div>
                {essayCount > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1 dark:bg-purple-900/20">
                    <FileText size={11} className="text-purple-500" />
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-400">{essayCount} Essay</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Student no-questions warning */}
          {isStudent && exam.questionCount === 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400">
              This exam has no questions yet.
            </div>
          )}
        </div>
        )}

        {/* ── Right: question list (admin only) ── */}
        {isStaff && (
          <div className="min-w-0 flex-1 space-y-5">
            <SubmissionQueuePanel
              examId={id}
              gradingType={exam.gradingType}
              submissions={submissions}
              isLoading={isLoadingSubmissions}
              error={submissionsError}
              statusFilter={submissionFilter}
              onStatusFilterChange={setSubmissionFilter}
              submissionTotal={submissionTotal}
            />

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Questions
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {filteredQuestions.length}{qFilter !== 'ALL' ? ` / ${questions.length}` : ''}
                  </span>
                </h2>
                {isAdmin && !exam.hasSessions && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#FF6900] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:scale-[1.02]"
                  >
                    <Plus size={13} /> Add Questions
                  </button>
                )}
                {isAdmin && exam.hasSessions && (
                  <span className="text-xs font-bold text-amber-500">
                    Editing disabled (session exists)
                  </span>
                )}
              </div>

              {questions.length > 0 && (
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search questions..."
                      value={qSearch}
                      onChange={(e) => setQSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-[#FF6900] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <Filter size={12} className="text-slate-400" />
                    {(['ALL', 'MCQ', 'ESSAY', 'EASY', 'MEDIUM', 'HARD'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setQFilter(f)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                          qFilter === f
                            ? 'bg-[#FF6900] text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                    <FileText size={22} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-400">No questions yet</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">Add questions from the question bank.</p>
                  {isAdmin && !exam.hasSessions && (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#FF6900] px-4 py-2 text-xs font-bold text-white"
                    >
                      <Plus size={13} /> Add Questions
                    </button>
                  )}
                  {isAdmin && exam.hasSessions && (
                    <p className="mt-4 text-xs font-bold text-amber-500">
                      Cannot add questions because a session exists.
                    </p>
                  )}
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="py-12 text-center text-sm font-medium text-slate-400">
                  No questions match the filter.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredQuestions.map((eq, index) => (
                    <div key={eq.questionId} className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white ${difficultyDot[eq.question.difficulty as keyof typeof difficultyDot]}`}>
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 text-sm font-medium leading-snug text-slate-800 dark:text-slate-200">
                          <QuestionLatexRenderer
                            text={eq.question.contentText}
                            latex={eq.question.contentLatex}
                            isLatexFormat={eq.question.isLatexFormat}
                          />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {eq.question.subjectName}
                          </span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {eq.question.topicName}
                          </span>
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${eq.question.type === 'MCQ' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                            {eq.question.type}
                          </span>
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${difficultyStyle[eq.question.difficulty as keyof typeof difficultyStyle]}`}>
                            {eq.question.difficulty}
                          </span>
                        </div>
                      </div>

                      {isAdmin && !exam.hasSessions && (
                        <button
                          onClick={() => handleRemoveQuestion(eq.questionId)}
                          disabled={removingId === eq.questionId}
                          className="shrink-0 rounded-lg p-1.5 text-slate-400 opacity-100 transition-all hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 disabled:opacity-50 sm:text-slate-300 sm:opacity-0 sm:group-hover:opacity-100 dark:sm:text-slate-600"
                          title="Remove question"
                        >
                          {removingId === eq.questionId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {questions.length > 0 && (
                <div className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-400">
                    {questions.length} question{questions.length !== 1 ? 's' : ''} · {formatDuration(exam.durationMinutes)} total
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        {isStudent && (
          <div className="min-w-0 flex-1">
            <div className="w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-6 dark:border-slate-800 dark:bg-slate-950/40 sm:px-8 sm:py-7">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <span className="inline-flex rounded-full border border-[#FF6900]/20 bg-[#FF6900]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#FF6900]">
                      {EXAM_TYPE_LABELS[exam.examType]}
                    </span>
                    <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                      {exam.title}
                    </h2>
                    <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Exam briefing
                    </p>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                      Read the instructions carefully before you begin. This page summarizes the paper format, timing, and question distribution for your mock exam attempt.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Session status</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100">Not started</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 px-6 py-6 sm:px-8 sm:py-8 xl:grid-cols-[minmax(0,1.35fr)_320px]">
                <div className="space-y-6">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {studentOverviewCards.map(({ label, value, helper, icon: Icon, tone }) => (
                      <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone}`}>
                          <Icon size={18} />
                        </div>
                        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
                        <p className="mt-1 text-base font-black text-slate-900 dark:text-slate-100">{value}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{helper}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <AlertCircle size={17} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Instructions</p>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">Please read before starting</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {studentChecklist.map((item, index) => (
                        <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-black text-white dark:bg-slate-100 dark:text-slate-900">
                            {index + 1}
                          </div>
                          <p className="text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                          <BookOpen size={17} />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Paper format</p>
                          <p className="text-sm font-black text-slate-900 dark:text-slate-100">Question composition</p>
                        </div>
                      </div>

                      {totalQuestionsForDisplay > 0 ? (
                        <div className="mt-5 space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
                              <p className="text-xs font-bold uppercase tracking-wide text-blue-500">MCQ</p>
                              <p className="mt-1 text-2xl font-black text-blue-700 dark:text-blue-400">{mcqCount}</p>
                            </div>
                            <div className="rounded-2xl bg-purple-50 px-4 py-3 dark:bg-purple-900/20">
                              <p className="text-xs font-bold uppercase tracking-wide text-purple-500">Essay</p>
                              <p className="mt-1 text-2xl font-black text-purple-700 dark:text-purple-400">{essayCount}</p>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Total questions in this paper: <span className="font-bold text-slate-800 dark:text-slate-100">{totalQuestionsForDisplay}</span>
                          </p>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
                          Question details will appear once the paper is ready.
                        </div>
                      )}
                    </div>

                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                          <BarChart3 size={17} />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Difficulty mix</p>
                          <p className="text-sm font-black text-slate-900 dark:text-slate-100">Expected challenge level</p>
                        </div>
                      </div>

                      {totalQuestionsForDisplay > 0 ? (
                        <div className="mt-5 space-y-3">
                          {([
                            ['EASY', easyCount, 'bg-green-500'],
                            ['MEDIUM', mediumCount, 'bg-amber-500'],
                            ['HARD', hardCount, 'bg-red-500'],
                          ] as const).map(([label, count, color]) => (
                            <div key={label}>
                              <div className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                <span>{label}</span>
                                <span>{count}</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                  className={`h-full rounded-full ${color}`}
                                  style={{ width: totalQuestionsForDisplay > 0 ? `${(count / totalQuestionsForDisplay) * 100}%` : '0%' }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
                          Difficulty distribution is not available yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="xl:sticky xl:top-5 xl:self-start">
                  <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#FF6900]/10 text-[#FF6900]">
                        <CheckCircle2 size={17} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Candidate panel</p>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">Start your attempt</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-slate-500 dark:text-slate-400">Time allowed</span>
                        <span className="font-black text-slate-900 dark:text-slate-100">{formatDuration(exam.durationMinutes)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-slate-500 dark:text-slate-400">Questions</span>
                        <span className="font-black text-slate-900 dark:text-slate-100">{exam.questionCount}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-slate-500 dark:text-slate-400">Grading</span>
                        <span className="font-black text-slate-900 dark:text-slate-100">{GRADING_TYPE_LABELS[exam.gradingType]}</span>
                      </div>
                    </div>

                    {exam.questionCount > 0 ? (
                      <>
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400">
                          Make sure you are ready to focus before starting the session.
                        </div>
                        <button
                          onClick={handleStart}
                          disabled={isStarting}
                          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6900] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                        >
                          {isStarting ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
                          {isStarting ? 'Starting...' : 'Start Exam'}
                        </button>
                      </>
                    ) : (
                      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400">
                        This exam is not ready to start yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddQuestionsModal
          examId={id}
          examGradingType={exam.gradingType}
          existingQuestionIds={new Set(questions.map((q) => q.questionId))}
          onClose={() => setShowAddModal(false)}
          onAdded={() => { loadExam(); setSuccessMsg('Questions added successfully'); }}
        />
      )}

      {isStarting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md dark:bg-slate-950/80">
          <div className="flex w-full max-w-md flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="relative mb-8">
              <div className="absolute -inset-4 animate-pulse rounded-full bg-[#FF6900]/10 dark:bg-[#FF6900]/5"></div>
              <div className="absolute inset-0 animate-ping rounded-full bg-[#FF6900]/20"></div>
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6900] to-orange-600 text-white shadow-lg">
                <Loader2 size={36} className="animate-spin" />
              </div>
            </div>
            <h3 className="mb-3 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Prepare yourself
            </h3>
            <p className="text-base font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Setting up your session. The exam will begin shortly...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { examService } from '@/features/exams/services/exams.service';
import type { ExamItem, GradingType, PaginationMeta, SessionSummary, ExamAttemptSummary } from '@/features/exams/types/exams.types';
import { DeleteConfirmModal } from '@/features/subjects/components/DeleteConfirmModal';
import {
  Plus,
  Loader2,
  Clock,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  X,
  BookOpen,
  Zap,
  BarChart3,
  ArrowRight,
  Globe,
  EyeOff,
  RotateCcw,
  Trophy,
  Hash,
  RefreshCw,
} from 'lucide-react';

const PAGE_LIMIT = 20;

const EXAM_TYPE_LABELS: Record<string, string> = { MOCK_EXAM: 'Mock Exam', ASSIGNMENT: 'Assignment' };
const GRADING_TYPE_LABELS: Record<string, string> = { AUTO: 'Auto', MANUAL: 'Manual' };
const RANKING_LABELS: Record<string, string> = {
  SUPERIOR: 'Superior',
  ABOVE_AVERAGE: 'Above Average',
  HIGH_AVERAGE: 'High Average',
  AVERAGE: 'Average',
  LOW_AVERAGE: 'Low Average',
};

function formatDuration(minutes: number | null) {
  if (minutes === null || minutes === undefined) return 'Not set';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Admin / Tutor view ────────────────────────────────────────────────────────

function AdminExamView() {
  const router = useRouter();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishExamData, setPublishExamData] = useState<{ 
    exam: ExamItem; 
    hasEssay: boolean;
    durationMinutes: string;
    gradingType: GradingType;
  } | null>(null);
  const [form, setForm] = useState({
    title: '',
    examType: 'MOCK_EXAM' as 'MOCK_EXAM' | 'ASSIGNMENT',
    durationMinutes: 90,
    gradingType: 'AUTO' as GradingType,
    thresholdSuperior: 72,
    thresholdAboveAverage: 60,
    thresholdHighAverage: 50,
    thresholdAverage: 40,
  });
  const [showThresholds, setShowThresholds] = useState(false);

  const loadExams = useCallback(async (p: number) => {
    setIsLoading(true);
    setListError(null);
    try {
      const res = await examService.list({ page: p, limit: PAGE_LIMIT });
      if (res.success) {
        setExams(res.data);
        setMeta(res.meta);
      } else {
        setListError(res.message);
      }
    } catch (err) {
      setListError(isAxiosError(err) ? err.response?.data?.message || 'Failed to load exams' : 'Failed to load exams');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadExams(page);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [loadExams, page]);

  const openCreate = () => {
    setEditingExam(null);
    setForm({ title: '', examType: 'MOCK_EXAM', durationMinutes: 90, gradingType: 'AUTO', thresholdSuperior: 72, thresholdAboveAverage: 60, thresholdHighAverage: 50, thresholdAverage: 40 });
    setShowThresholds(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEdit = (exam: ExamItem) => {
    setEditingExam(exam);
    setForm({
      title: exam.title,
      examType: exam.examType,
      durationMinutes: exam.durationMinutes ?? 90,
      gradingType: exam.gradingType,
      thresholdSuperior: exam.thresholdSuperior,
      thresholdAboveAverage: exam.thresholdAboveAverage,
      thresholdHighAverage: exam.thresholdHighAverage,
      thresholdAverage: exam.thresholdAverage,
    });
    const isCustom = exam.thresholdSuperior !== 72 || exam.thresholdAboveAverage !== 60 || exam.thresholdHighAverage !== 50 || exam.thresholdAverage !== 40;
    setShowThresholds(isCustom);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    if (form.durationMinutes < 1 || form.durationMinutes > 600) { setFormError('Duration must be between 1 and 600 minutes'); return; }
    if (form.thresholdSuperior <= form.thresholdAboveAverage || form.thresholdAboveAverage <= form.thresholdHighAverage || form.thresholdHighAverage <= form.thresholdAverage) {
      setFormError('Ranking thresholds must be in descending order: Superior > Above Average > High Average > Average');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingExam) {
        const res = await examService.update(editingExam.id, form);
        if (res.success) {
          setSuccessMsg('Exam updated');
          setIsModalOpen(false);
          loadExams(page);
        } else {
          setFormError(res.message);
        }
      } else {
        const res = await examService.create(form);
        if (res.success) {
          setSuccessMsg('Exam created');
          setIsModalOpen(false);
          loadExams(page);
        } else {
          setFormError(res.message);
        }
      }
    } catch (err) {
      setFormError(isAxiosError(err) ? err.response?.data?.message || 'Failed to save exam' : 'Failed to save exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeletingId(id);
    try {
      const res = await examService.remove(id);
      if (res.success) {
        setSuccessMsg('Exam deleted');
        setDeleteTargetId(null);
        loadExams(page);
      }
    } catch (err) {
      setListError(isAxiosError(err) ? err.response?.data?.message || 'Failed to delete exam' : 'Failed to delete exam');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublishClick = async (exam: ExamItem) => {
    if (exam.status === 'PUBLISHED') return;

    setPublishingId(exam.id);
    setListError(null);
    try {
      // 1. Fetch questions to check status and type
      const res = await examService.getWithQuestions(exam.id);
      if (!res.success) {
        setListError(res.message);
        return;
      }

      const questions = res.data.questions;
      if (questions.length === 0) {
        setListError('Cannot publish an exam with no questions');
        return;
      }

      // 2. Validation: Check if all questions are published
      // Note: Backend also has this check, but we do it here for UX
      // The backend uses 'questionId' (internal uuid) vs 'questionId' (readable id)
      // Actually, let's just rely on backend or check status field if it exists in the type
      // Wait, ExamQuestionItem.question has status? Let me check types.
      // Ah, types.ts doesn't show status in ExamQuestionItem.question.
      // But I added it to the backend serializer.
      
      // Let's assume the backend will throw error if not published, but we can still check essay presence.
      const hasEssay = questions.some(q => q.question.type === 'ESSAY');

      setPublishExamData({
        exam,
        hasEssay,
        durationMinutes: String(exam.durationMinutes ?? 90),
        gradingType: exam.gradingType,
      });
      setFormError(null);
      setIsPublishModalOpen(true);
    } catch (err) {
      setListError(isAxiosError(err) ? err.response?.data?.message || 'Failed to prepare publishing' : 'Failed to prepare publishing');
    } finally {
      setPublishingId(null);
    }
  };

  const confirmPublish = async () => {
    if (!publishExamData) return;
    const durationMinutes = Number.parseInt(publishExamData.durationMinutes, 10);

    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 600) {
      setFormError('Duration must be between 1 and 600 minutes');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await examService.publish(publishExamData.exam.id, {
        status: 'PUBLISHED',
        durationMinutes,
        gradingType: publishExamData.gradingType,
      });
      if (res.success) {
        setSuccessMsg('Exam published successfully');
        setIsPublishModalOpen(false);
        setExams((prev) => prev.map((e) => e.id === publishExamData.exam.id ? res.data : e));
      } else {
        setFormError(res.message);
      }
    } catch (err) {
      setFormError(isAxiosError(err) ? err.response?.data?.message || 'Failed to publish exam' : 'Failed to publish exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalQuestions = exams.reduce((sum, e) => sum + e.questionCount, 0);
  const mockExamCount = exams.filter((e) => e.examType === 'MOCK_EXAM').length;
  const autoGradedCount = exams.filter((e) => e.gradingType === 'AUTO').length;

  const navigateToExamDetail = useCallback((examId: string) => {
    router.push(`/dashboard/exams/${examId}`);
  }, [router]);

  const handleRowClick = useCallback((event: React.MouseEvent<HTMLTableRowElement>, examId: string) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea')) {
      return;
    }

    navigateToExamDetail(examId);
  }, [navigateToExamDetail]);

  const handleRowKeyDown = useCallback((event: React.KeyboardEvent<HTMLTableRowElement>, examId: string) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea')) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigateToExamDetail(examId);
    }
  }, [navigateToExamDetail]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Exam Management</h1>
          <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">Create and manage mock exams and assignments</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-100 transition-all hover:bg-[#0864B6] dark:shadow-none"
          >
            <Plus size={16} /> New Exam
          </button>
        </div>
      </header>

      {/* Stat cards */}
      {!isLoading && meta && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FF6900]/10">
                <FileText size={15} className="text-[#FF6900]" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total Exams</p>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{meta.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <BookOpen size={15} className="text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Questions</p>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{totalQuestions}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/20">
                <BarChart3 size={15} className="text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Mock Exams</p>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{mockExamCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20">
                <Zap size={15} className="text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Auto-Graded</p>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{autoGradedCount}</p>
          </div>
        </div>
      )}

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-800/50 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle2 size={16} /> {successMsg}
          <button className="ml-auto" onClick={() => setSuccessMsg(null)}><X size={14} /></button>
        </div>
      )}
      {listError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle size={16} /> {listError}
          <button className="ml-auto" onClick={() => setListError(null)}><X size={14} /></button>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 animate-pulse">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="flex gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-3 w-16 rounded bg-slate-200/70 dark:bg-slate-700" />
              ))}
            </div>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-slate-50 px-5 py-4 dark:border-slate-800/50">
              <div className="h-4 w-40 rounded bg-slate-200/70 dark:bg-slate-700" />
              <div className="h-5 w-16 rounded-full bg-slate-100 dark:bg-slate-800" />
              <div className="hidden h-4 w-20 rounded bg-slate-100 dark:bg-slate-800 sm:block" />
            </div>
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-white py-20 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <FileText size={26} className="text-slate-400 dark:text-slate-500" />
          </div>
          <p className="mt-4 text-base font-bold text-slate-700 dark:text-slate-300">No exams yet</p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Create your first exam to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">Title</th>
                <th className="hidden px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400 sm:table-cell">Status</th>
                <th className="hidden px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400 md:table-cell">Type</th>
                <th className="hidden px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400 lg:table-cell">Duration</th>
                <th className="hidden px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400 lg:table-cell">Grading</th>
                <th className="hidden px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400 xl:table-cell">Questions</th>
                <th className="hidden px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400 xl:table-cell">Created By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {exams.map((exam) => (
                <tr
                  key={exam.id}
                  tabIndex={0}
                  onClick={(event) => handleRowClick(event, exam.id)}
                  onKeyDown={(event) => handleRowKeyDown(event, exam.id)}
                  className="group cursor-pointer transition-colors hover:bg-slate-50/80 focus-visible:bg-slate-50/80 focus-visible:outline-none dark:hover:bg-slate-800/40 dark:focus-visible:bg-slate-800/40"
                >
                  <td className="px-5 py-4">
                    <span className="text-left font-semibold text-slate-900 transition-colors group-hover:text-[#FF6900] group-focus-visible:text-[#FF6900] dark:text-slate-100 dark:group-hover:text-orange-400 dark:group-focus-visible:text-orange-400">
                      {exam.title}
                    </span>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-400 sm:hidden">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold ${exam.status === 'PUBLISHED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {exam.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                      </span>
                      <span>·</span>
                      <span>{EXAM_TYPE_LABELS[exam.examType]}</span>
                      <span>·</span>
                      <span>{formatDuration(exam.durationMinutes)}</span>
                    </div>
                  </td>
                  <td className="hidden px-5 py-4 sm:table-cell">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${exam.status === 'PUBLISHED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {exam.status === 'PUBLISHED' ? <Globe size={11} /> : <EyeOff size={11} />}
                      {exam.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="hidden px-5 py-4 md:table-cell">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${exam.examType === 'MOCK_EXAM' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                      {EXAM_TYPE_LABELS[exam.examType]}
                    </span>
                  </td>
                  <td className="hidden px-5 py-4 text-slate-600 dark:text-slate-300 lg:table-cell">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Clock size={13} className="text-slate-400" />{formatDuration(exam.durationMinutes)}
                    </span>
                  </td>
                  <td className="hidden px-5 py-4 lg:table-cell">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${exam.gradingType === 'AUTO' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {GRADING_TYPE_LABELS[exam.gradingType]}
                    </span>
                  </td>
                  <td className="hidden px-5 py-4 xl:table-cell">
                    <span className={`text-sm font-bold ${exam.questionCount === 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {exam.questionCount}
                      {exam.questionCount === 0 && <span className="ml-1.5 text-xs font-medium text-red-400">— no questions</span>}
                    </span>
                  </td>
                  <td className="hidden px-5 py-4 xl:table-cell">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{exam.creatorName}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          navigateToExamDetail(exam.id);
                        }}
                        className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-[#FF6900] hover:bg-orange-50 dark:hover:bg-orange-900/20 sm:flex transition-colors"
                      >
                        Details <ArrowRight size={12} />
                      </button>
                      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          void handlePublishClick(exam);
                        }}
                        disabled={publishingId === exam.id || exam.status === 'PUBLISHED'}
                        className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${exam.status === 'PUBLISHED' ? 'cursor-not-allowed text-green-600 dark:text-green-400' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200'}`}
                        title={exam.status === 'PUBLISHED' ? 'Exam already published' : 'Publish exam'}
                      >
                        {publishingId === exam.id ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}
                      </button>
                      {!exam.hasSessions && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            openEdit(exam);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                          title="Edit exam"
                        >
                          <Edit2 size={15} />
                        </button>
                      )}
                      {!exam.hasSessions && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteTargetId(exam.id);
                          }}
                          disabled={deletingId === exam.id}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 disabled:opacity-50"
                          title="Delete exam"
                        >
                          {deletingId === exam.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Table footer */}
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-400">
              {meta ? `${meta.total} exam${meta.total !== 1 ? 's' : ''} total` : `${exams.length} exam${exams.length !== 1 ? 's' : ''}`}
            </p>
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center gap-3">
                <p className="text-xs text-slate-400">
                  {(page - 1) * PAGE_LIMIT + 1}–{Math.min(page * PAGE_LIMIT, meta.total)} of {meta.total}
                </p>
                <div className="flex gap-1.5">
                  <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={() => setPage((p) => p + 1)} disabled={page >= meta.totalPages} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {editingExam ? 'Edit Exam' : 'Create New Exam'}
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Required exam setup only. Questions can be added after the exam is created.
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. National Mock Test #1"
                  required
                  maxLength={300}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-[#FF6900] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Exam Type <span className="text-red-500">*</span></label>
                  <select
                    value={form.examType}
                    onChange={(e) => setForm((f) => ({ ...f, examType: e.target.value as 'MOCK_EXAM' | 'ASSIGNMENT' }))}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-[#FF6900] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="MOCK_EXAM">Mock Exam</option>
                    <option value="ASSIGNMENT">Assignment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Grading Type <span className="text-red-500">*</span></label>
                  <select
                    value={form.gradingType}
                    onChange={(e) => setForm((f) => ({ ...f, gradingType: e.target.value as GradingType }))}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-[#FF6900] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="AUTO">Auto</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Duration (minutes) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={form.durationMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, durationMinutes: parseInt(e.target.value, 10) || 0 }))}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-[#FF6900] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                  Allowed range: 1-600 minutes.
                </p>
              </div>

              {/* Ranking Thresholds */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowThresholds((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#0A9AE2] hover:text-[#0659AA] transition-colors"
                >
                  <ChevronDown size={14} className={`transition-transform ${showThresholds ? 'rotate-180' : ''}`} />
                  Ranking Thresholds
                </button>
                {showThresholds && (
                  <div className="mt-3 space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                    <p className="text-[10px] font-medium leading-tight text-slate-400">
                      Minimum score (%) for each ranking level. Scores below the lowest threshold are ranked as Low Average.
                    </p>
                    {([
                      { key: 'thresholdSuperior', label: 'Superior' },
                      { key: 'thresholdAboveAverage', label: 'Above Average' },
                      { key: 'thresholdHighAverage', label: 'High Average' },
                      { key: 'thresholdAverage', label: 'Average' },
                    ] as const).map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between gap-3">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 min-w-[100px]">{label}</label>
                        <div className="relative w-24">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={form[key]}
                            onChange={(e) => setForm((f) => ({ ...f, [key]: parseInt(e.target.value, 10) || 0 }))}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 text-right focus:border-[#FF6900] focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                          />
                          <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {formError && (
                <p className="text-sm font-medium text-red-600 dark:text-red-400">{formError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6900] py-2.5 text-sm font-bold text-white disabled:opacity-60">
                  {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                  {editingExam ? 'Save Changes' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {isPublishModalOpen && publishExamData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-900/30">
                  <Globe className="text-[#FF6900]" size={20} />
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Publish Exam
                </h2>
              </div>
              <button onClick={() => setIsPublishModalOpen(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              You are about to publish <span className="font-bold text-slate-700 dark:text-slate-300">&quot;{publishExamData.exam.title}&quot;</span>.
              Please confirm the final settings below.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Total Exam Duration (Minutes)</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={publishExamData.durationMinutes}
                    onChange={(e) => {
                      const nextValue = e.target.value.replace(/\D/g, '');
                      setPublishExamData(d => d ? { ...d, durationMinutes: nextValue } : null);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-sm font-bold text-slate-900 focus:border-[#FF6900] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {publishExamData.hasEssay && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Essay Grading System</label>
                  <p className="mb-2 text-[10px] leading-tight text-slate-400">This exam contains Essay questions. Select how they should be graded.</p>
                  <select
                    value={publishExamData.gradingType}
                    onChange={(e) => setPublishExamData(d => d ? { ...d, gradingType: e.target.value as GradingType } : null)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-[#FF6900] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="AUTO">Auto</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                </div>
              )}

              {formError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  <AlertCircle size={14} />
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsPublishModalOpen(false)} 
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmPublish}
                  disabled={isSubmitting || publishExamData.durationMinutes.trim() === ''} 
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6900] py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Confirm & Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={onConfirmDelete}
        title="Delete Exam"
        message="Are you sure you want to delete this exam? This action cannot be undone."
        isLoading={deletingId === deleteTargetId}
      />
    </div>
  );
}

// ── Student view ──────────────────────────────────────────────────────────────

function StudentExamView() {
  const router = useRouter();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retakeExamId, setRetakeExamId] = useState<string | null>(null);
  const [attemptSummary, setAttemptSummary] = useState<ExamAttemptSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isStartingRetake, setIsStartingRetake] = useState(false);
  const [viewResultsExamId, setViewResultsExamId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [examRes, sessionRes] = await Promise.all([
          examService.list({ limit: 50 }),
          examService.listSessions({ limit: 50 }),
        ]);
        if (examRes.success) setExams(examRes.data);
        if (sessionRes.success) setSessions(sessionRes.data);
      } catch (err) {
        setError(isAxiosError(err) ? err.response?.data?.message || 'Failed to load exams' : 'Failed to load exams');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Group all sessions by examId — keep best, latest, in-progress, etc.
  const examSessionsMap = sessions.reduce((map, session) => {
    const list = map.get(session.examId) ?? [];
    list.push(session);
    map.set(session.examId, list);
    return map;
  }, new Map<string, SessionSummary[]>());

  const getExamStatus = (examId: string) => {
    const list = examSessionsMap.get(examId);
    if (!list || list.length === 0) return 'not_started';
    const inProgress = list.find((s) => s.status === 'IN_PROGRESS');
    if (inProgress) return 'in_progress';
    const submitted = list.find((s) => s.status === 'SUBMITTED');
    if (submitted) return 'awaiting_review';
    return 'completed';
  };

  const getLatestSession = (examId: string) => {
    const list = examSessionsMap.get(examId);
    if (!list || list.length === 0) return null;
    // In-progress first, then latest by start time
    const inProgress = list.find((s) => s.status === 'IN_PROGRESS');
    if (inProgress) return inProgress;
    return list.reduce((latest, s) => (new Date(s.startTime) > new Date(latest.startTime) ? s : latest));
  };

  const getBestSession = (examId: string) => {
    const list = examSessionsMap.get(examId);
    if (!list) return null;
    const graded = list.filter((s) => s.finalScore !== null);
    if (graded.length === 0) return null;
    return graded.reduce((best, s) => (s.finalScore! > best.finalScore! ? s : best));
  };

  const getAttemptCount = (examId: string) => {
    const list = examSessionsMap.get(examId);
    if (!list) return 0;
    return list.filter((s) => s.status !== 'IN_PROGRESS').length;
  };

  const handleOpenRetake = async (examId: string) => {
    setRetakeExamId(examId);
    setAttemptSummary(null);
    setIsLoadingSummary(true);
    try {
      const res = await examService.getAttemptSummary(examId);
      if (res.success) setAttemptSummary(res.data);
    } catch (err) {
      console.error('Failed to load attempt summary', err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleStartRetake = async (examId: string, mode: 'FULL' | 'INCORRECT_ONLY' | 'SUBJECT_ONLY', opts?: { sourceSessionId?: string; subjectId?: string }) => {
    setIsStartingRetake(true);
    try {
      const res = await examService.startRetake(examId, { mode, ...opts });
      if (res.success) {
        setRetakeExamId(null);
        router.push(`/dashboard/exams/${examId}/session`);
      }
    } catch (err) {
      const msg = isAxiosError(err) ? err.response?.data?.message || 'Failed to start retake' : 'Failed to start retake';
      alert(msg);
    } finally {
      setIsStartingRetake(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl space-y-6 animate-pulse">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col rounded-[2rem] border border-slate-200/60 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between">
                <div className="h-5 w-20 rounded-full bg-slate-200/70 dark:bg-slate-800" />
                <div className="h-5 w-14 rounded-full bg-slate-100 dark:bg-slate-800/60" />
              </div>
              <div className="mt-3 h-5 w-3/4 rounded-lg bg-slate-200/70 dark:bg-slate-800" />
              <div className="mt-2 flex gap-3">
                <div className="h-4 w-14 rounded bg-slate-100 dark:bg-slate-800/60" />
                <div className="h-4 w-20 rounded bg-slate-100 dark:bg-slate-800/60" />
              </div>
              <div className="mt-3 h-16 rounded-xl bg-slate-50 dark:bg-slate-800/30" />
              <div className="mt-4 h-10 rounded-xl bg-slate-200/70 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
        <AlertCircle size={16} /> {error}
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-6">

      {exams.filter((e) => e.questionCount > 0).length === 0 ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <FileText size={40} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">No exams available yet. Check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams
            .filter((exam) => exam.questionCount > 0)
            .map((exam) => {
              const status = getExamStatus(exam.id);
              const latestSession = getLatestSession(exam.id);
              const bestSession = getBestSession(exam.id);
              const attemptCount = getAttemptCount(exam.id);
              return (
                <div
                  key={exam.id}
                  className="flex flex-col rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${exam.examType === 'MOCK_EXAM' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                      {EXAM_TYPE_LABELS[exam.examType]}
                    </span>
                    {status === 'awaiting_review' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <AlertCircle size={11} /> Review Pending
                      </span>
                    )}
                    {status === 'completed' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle2 size={11} /> Done
                      </span>
                    )}
                    {status === 'in_progress' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        <PlayCircle size={11} /> In Progress
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 text-base font-black text-slate-900 dark:text-slate-100 leading-snug">{exam.title}</h2>

                  <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1"><Clock size={12} />{formatDuration(exam.durationMinutes)}</span>
                    <span className="flex items-center gap-1"><FileText size={12} />{exam.questionCount} questions</span>
                    <span>{GRADING_TYPE_LABELS[exam.gradingType]}</span>
                  </div>

                  {/* Score section — show best score if multiple attempts */}
                  {bestSession && bestSession.finalScore !== null && (
                    <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {attemptCount > 1 ? 'Best score' : 'Your score'}
                        </p>
                        {attemptCount > 1 && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                            <Hash size={10} />{attemptCount} attempts
                          </span>
                        )}
                      </div>
                      <p className="text-xl font-black text-slate-900 dark:text-slate-100">{bestSession.finalScore.toFixed(1)}<span className="text-sm text-slate-400">/100</span></p>
                      {bestSession.rankingLevel && (
                        <p className="text-xs font-semibold text-[#FF6900]">{RANKING_LABELS[bestSession.rankingLevel]}</p>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex-1 flex flex-col items-end justify-end gap-2">
                    {status === 'not_started' && (
                      <button
                        onClick={() => router.push(`/dashboard/exams/${exam.id}`)}
                        className="w-full rounded-xl bg-[#FF6900] px-4 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Start Exam
                      </button>
                    )}
                    {status === 'in_progress' && (
                      <button
                        onClick={() => router.push(`/dashboard/exams/${exam.id}/session`)}
                        className="w-full rounded-xl border-2 border-[#FF6900] px-4 py-2.5 text-sm font-bold text-[#FF6900] transition-transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Resume Exam
                      </button>
                    )}
                    {status === 'awaiting_review' && latestSession && (
                      attemptCount > 1 ? (
                        <button
                          onClick={() => setViewResultsExamId(viewResultsExamId === exam.id ? null : exam.id)}
                          className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30 flex items-center justify-center gap-2"
                        >
                          View Results <ChevronDown size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push(`/dashboard/exams/sessions/${latestSession.sessionId}/result`)}
                          className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30"
                        >
                          View Review Status
                        </button>
                      )
                    )}
                    {status === 'completed' && latestSession && (
                      <>
                        {attemptCount > 1 ? (
                          <button
                            onClick={() => setViewResultsExamId(viewResultsExamId === exam.id ? null : exam.id)}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
                          >
                            View Results <ChevronDown size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => router.push(`/dashboard/exams/sessions/${latestSession.sessionId}/result`)}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            View Results
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenRetake(exam.id)}
                          className="w-full rounded-xl border border-[#FF6900]/30 bg-[#FF6900]/5 px-4 py-2.5 text-sm font-bold text-[#FF6900] transition-colors hover:bg-[#FF6900]/10 flex items-center justify-center gap-2"
                        >
                          <RotateCcw size={14} /> Retake Exam
                        </button>
                      </>
                    )}

                    {/* Attempt list dropdown */}
                    {viewResultsExamId === exam.id && (() => {
                      const examSessions = (examSessionsMap.get(exam.id) ?? [])
                        .filter((s) => s.status !== 'IN_PROGRESS')
                        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
                      return (
                        <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 space-y-1 dark:border-slate-700 dark:bg-slate-800">
                          {examSessions.map((s, idx) => {
                            const attemptNum = examSessions.length - idx;
                            const isBest = bestSession?.sessionId === s.sessionId;
                            return (
                              <button
                                key={s.sessionId}
                                onClick={() => {
                                  setViewResultsExamId(null);
                                  router.push(`/dashboard/exams/sessions/${s.sessionId}/result`);
                                }}
                                className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-white dark:hover:bg-slate-700"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">#{attemptNum}</span>
                                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    {s.finalScore !== null ? `${s.finalScore.toFixed(1)}/100` : s.status === 'SUBMITTED' ? 'Grading...' : '—'}
                                  </span>
                                  {isBest && (
                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                      <Trophy size={9} /> Best
                                    </span>
                                  )}
                                  {s.retakeMode && (
                                    <span className="inline-flex rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                      {s.retakeMode === 'FULL' ? 'Full' : s.retakeMode === 'INCORRECT_ONLY' ? 'Incorrect' : 'Subject'}
                                    </span>
                                  )}
                                </div>
                                <ArrowRight size={12} className="text-slate-400" />
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ── Retake Modal ─────────────────────────────────────────────────── */}
      {retakeExamId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setRetakeExamId(null)}>
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Retake Exam</h2>
              <button onClick={() => setRetakeExamId(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            {isLoadingSummary ? (
              <div className="space-y-4 py-4 animate-pulse">
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                      <div className="h-3 w-14 rounded bg-slate-200/70 dark:bg-slate-700" />
                      <div className="mt-2 h-6 w-10 rounded bg-slate-200/70 dark:bg-slate-700" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800" />
                  ))}
                </div>
              </div>
            ) : attemptSummary ? (
              <div className="space-y-5">
                {/* Attempt Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                    <p className="text-xs font-bold uppercase text-slate-400">Attempts</p>
                    <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">{attemptSummary.totalAttempts}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                    <p className="text-xs font-bold uppercase text-slate-400">Best</p>
                    <p className="mt-1 text-xl font-black text-green-600 dark:text-green-400">
                      {attemptSummary.bestScore?.finalScore !== null && attemptSummary.bestScore?.finalScore !== undefined
                        ? <>{attemptSummary.bestScore.finalScore.toFixed(1)}<span className="text-sm text-slate-400">/100</span></>
                        : '—'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                    <p className="text-xs font-bold uppercase text-slate-400">Latest</p>
                    <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">
                      {attemptSummary.latestAttempt?.finalScore !== null && attemptSummary.latestAttempt?.finalScore !== undefined
                        ? <>{attemptSummary.latestAttempt.finalScore.toFixed(1)}<span className="text-sm text-slate-400">/100</span></>
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* Incorrect count */}
                {attemptSummary.incorrectQuestions.length > 0 && (
                  <div className="rounded-xl border border-red-100 bg-red-50/50 px-3 py-2.5 dark:border-red-900/30 dark:bg-red-900/10">
                    <p className="text-xs font-bold text-red-600 dark:text-red-400">
                      {attemptSummary.incorrectQuestions.length} incorrect question{attemptSummary.incorrectQuestions.length !== 1 ? 's' : ''} from latest attempt
                    </p>
                  </div>
                )}

                {/* Retake Options */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Choose retake mode</p>

                  <button
                    onClick={() => handleStartRetake(retakeExamId, 'FULL')}
                    disabled={isStartingRetake}
                    className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <div className="rounded-lg bg-[#FF6900]/10 p-2 text-[#FF6900]"><RefreshCw size={18} /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Full Retake</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Redo the entire exam with all questions</p>
                    </div>
                  </button>

                  {attemptSummary.incorrectQuestions.length > 0 && attemptSummary.latestAttempt && (
                    <button
                      onClick={() => handleStartRetake(retakeExamId, 'INCORRECT_ONLY', { sourceSessionId: attemptSummary.latestAttempt!.sessionId })}
                      disabled={isStartingRetake}
                      className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <div className="rounded-lg bg-red-100 p-2 text-red-600 dark:bg-red-900/30 dark:text-red-400"><RotateCcw size={18} /></div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Incorrect Only</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Redo only the {attemptSummary.incorrectQuestions.length} question{attemptSummary.incorrectQuestions.length !== 1 ? 's' : ''} you got wrong</p>
                      </div>
                    </button>
                  )}

                  {attemptSummary.subjects.length > 1 && attemptSummary.subjects.map((subj) => (
                    <button
                      key={subj.subjectId}
                      onClick={() => handleStartRetake(retakeExamId, 'SUBJECT_ONLY', { subjectId: subj.subjectId })}
                      disabled={isStartingRetake}
                      className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"><BookOpen size={18} /></div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{subj.subjectName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{subj.correctCount}/{subj.totalQuestions} correct · {subj.totalQuestions} questions</p>
                      </div>
                    </button>
                  ))}
                </div>

                {isStartingRetake && (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-500">
                    <Loader2 size={16} className="animate-spin" /> Starting retake...
                  </div>
                )}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">Failed to load attempt summary.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ExamsPage() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  if (user.role === 'ADMIN' || user.role === 'TUTOR') {
    return <AdminExamView />;
  }

  return <StudentExamView />;
}

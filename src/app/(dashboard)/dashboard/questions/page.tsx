'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuestions } from '@/features/questions/hooks/useQuestions';
import { QuestionFormModal } from '@/features/questions/components/QuestionFormModal';
import { RejectModal } from '@/features/questions/components/RejectModal';
import { ImportModal } from '@/features/questions/components/ImportModal';
import { DeleteConfirmModal } from '@/features/subjects/components/DeleteConfirmModal';
import { subjectsService } from '@/features/subjects/services/subjects.service';
import { questionsService } from '@/features/questions/services/questions.service';
import type { Subject, Topic } from '@/features/subjects/types/subjects.types';
import type { Question, QuestionStatus, CreateQuestionPayload } from '@/features/questions/types/questions.types';
import {
  Trophy,
  Plus,
  Upload,
  Search,
  ChevronDown,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  Archive,
  AlertTriangle,
  X,
} from 'lucide-react';
import { LatexRenderer } from '@/components/ui/LatexRenderer';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useAuthStore } from '@/features/auth/store/auth.store';

const STATUS_TABS: { label: string; value: QuestionStatus }[] = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Pending Review', value: 'PENDING_APPROVAL' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

function parseQuestionStatus(status: string | null): QuestionStatus | null {
  if (
    status === 'DRAFT'
    || status === 'PENDING_APPROVAL'
    || status === 'PUBLISHED'
    || status === 'ARCHIVED'
  ) {
    return status;
  }
  return null;
}

const STATUS_BADGE: Record<QuestionStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  PENDING_APPROVAL: { label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
  PUBLISHED: { label: 'Published', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
  ARCHIVED: { label: 'Archived', className: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
};

const DIFFICULTY_BADGE: Record<string, string> = {
  EASY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  HARD: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
};

const TYPE_LABEL: Record<Question['type'], string> = {
  MCQ: 'MCQ',
  ESSAY: 'Essay',
};

const SUBJECTS_PAGE_LIMIT = 100;
const TOPICS_PAGE_LIMIT = 100;
const SELECT_ALL_PAGE_LIMIT = 100;
const PAGE_SIZE_OPTIONS = [15, 30, 50];

export default function QuestionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFromUrl = parseQuestionStatus(searchParams.get('status'));
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'ADMIN';
  const {
    questions,
    meta,
    isLoading,
    actionLoading,
    error,
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    submitQuestion,
    submitQuestions,
    approveQuestion,
    approveQuestions,
    rejectQuestion,
    importQuestions,
  } = useQuestions();

  const statusFilter = statusFromUrl ?? 'DRAFT';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isSelectingAllResults, setIsSelectingAllResults] = useState(false);
  const [selectAllError, setSelectAllError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen]     = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected]         = useState<Question | null>(null);
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  // Unpublish + archive flow state. The same question can be the subject of
  // an unpublish attempt (which surfaces a 409 if it's used in an exam) or a
  // direct archive confirm; we keep both modals separate for clarity.
  const [isUnpublishOpen, setIsUnpublishOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<Question | null>(null);
  const [unpublishStep, setUnpublishStep] = useState<'confirm' | 'archive-fallback'>('confirm');
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const loadTopicsForSubject = useCallback(async (subjectId: string) => {
    const firstPage = await subjectsService.listTopics(subjectId, { page: 1, limit: TOPICS_PAGE_LIMIT }, { feedbackContext: 'options' });

    if (!firstPage.success) {
      setTopics([]);
      return;
    }

    if ((firstPage.meta?.totalPages ?? 1) <= 1) {
      setTopics(firstPage.data);
      return;
    }

    const remainingPages = await Promise.all(
      Array.from({ length: firstPage.meta.totalPages - 1 }, (_, index) =>
        subjectsService.listTopics(subjectId, { page: index + 2, limit: TOPICS_PAGE_LIMIT }, { feedbackContext: 'options' })
      )
    );

    setTopics([
      ...firstPage.data,
      ...remainingPages.flatMap((response) => (response.success ? response.data : [])),
    ]);
  }, []);

  const load = useCallback(() => {
    fetchQuestions({
      page,
      limit: pageSize,
      search: search || undefined,
      subjectId: subjectFilter || undefined,
      topicId: topicFilter || undefined,
      status: statusFilter,
    });
  }, [fetchQuestions, page, pageSize, search, statusFilter, subjectFilter, topicFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let isActive = true;

    const hydrateSubjects = async () => {
      try {
        const firstPage = await subjectsService.listSubjects({ page: 1, limit: SUBJECTS_PAGE_LIMIT }, { feedbackContext: 'options' });

        if (!isActive || !firstPage.success) {
          if (isActive) setSubjects([]);
          return;
        }

        if ((firstPage.meta?.totalPages ?? 1) <= 1) {
          setSubjects(firstPage.data);
          return;
        }

        const remainingPages = await Promise.all(
          Array.from({ length: firstPage.meta.totalPages - 1 }, (_, index) =>
            subjectsService.listSubjects({ page: index + 2, limit: SUBJECTS_PAGE_LIMIT }, { feedbackContext: 'options' })
          )
        );

        if (!isActive) return;

        setSubjects([
          ...firstPage.data,
          ...remainingPages.flatMap((response) => (response.success ? response.data : [])),
        ]);
      } catch {
        if (isActive) setSubjects([]);
      }
    };

    void hydrateSubjects();

    return () => {
      isActive = false;
    };
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setSelectedQuestionIds([]);
    setSelectAllError(null);
    setPage(1);
  };

  const handleTabChange = (tab: QuestionStatus) => {
    setSelectedQuestionIds([]);
    setSelectAllError(null);
    setPage(1);
    router.replace(tab === 'DRAFT' ? '/dashboard/questions' : `/dashboard/questions?status=${tab}`, { scroll: false });
  };

  const handleSubjectFilterChange = (subjectId: string) => {
    setSubjectFilter(subjectId);
    setTopicFilter('');
    setTopics([]);
    setSelectedQuestionIds([]);
    setSelectAllError(null);
    setPage(1);

    if (!subjectId) return;

    loadTopicsForSubject(subjectId).catch(() => {
      setTopics([]);
    });
  };

  const handleTopicFilterChange = (topicId: string) => {
    setTopicFilter(topicId);
    setSelectedQuestionIds([]);
    setSelectAllError(null);
    setPage(1);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setSelectedQuestionIds([]);
    setSelectAllError(null);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSubjectFilter('');
    setTopicFilter('');
    setTopics([]);
    setPageSize(15);
    setSelectedQuestionIds([]);
    setSelectAllError(null);
    setPage(1);
    router.replace('/dashboard/questions', { scroll: false });
  };

  const handleToggleQuestion = (questionId: string) => {
    setSelectAllError(null);
    setSelectedQuestionIds((currentIds) =>
      currentIds.includes(questionId)
        ? currentIds.filter((id) => id !== questionId)
        : [...currentIds, questionId]
    );
  };

  const handleCreate = () => {
    setSelected(null);
    setIsFormOpen(true);
  };

  const handleEdit = (q: Question) => {
    setSelected(q);
    setIsFormOpen(true);
  };

  const handleDeleteOpen = (q: Question) => {
    setSelected(q);
    setIsDeleteOpen(true);
  };

  const handleRejectOpen = (q: Question) => {
    setSelected(q);
    setIsRejectOpen(true);
  };

  const openUnpublishModal = (q: Question) => {
    setActionTarget(q);
    setUnpublishStep('confirm');
    setActionErrorMsg(null);
    setIsUnpublishOpen(true);
  };

  const openArchiveModal = (q: Question) => {
    setActionTarget(q);
    setActionErrorMsg(null);
    setIsArchiveOpen(true);
  };

  const closeUnpublishModal = () => {
    setIsUnpublishOpen(false);
    setActionTarget(null);
    setUnpublishStep('confirm');
    setActionErrorMsg(null);
  };

  const closeArchiveModal = () => {
    setIsArchiveOpen(false);
    setActionTarget(null);
    setActionErrorMsg(null);
  };

  const handleUnpublishConfirm = async () => {
    if (!actionTarget) return;
    setIsProcessingAction(true);
    setActionErrorMsg(null);
    try {
      await questionsService.unpublish(actionTarget.id);
      closeUnpublishModal();
      load();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        // BE blocked the unpublish because the question is referenced by at
        // least one exam — pivot the modal to suggest Archive instead.
        setUnpublishStep('archive-fallback');
        setActionErrorMsg('This question is used in existing exams. Archive it instead.');
      } else {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setActionErrorMsg(msg || 'Failed to unpublish question. Please try again.');
      }
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleSwitchToArchiveFromUnpublish = () => {
    if (!actionTarget) return;
    const target = actionTarget;
    closeUnpublishModal();
    openArchiveModal(target);
  };

  const handleArchiveConfirm = async () => {
    if (!actionTarget) return;
    setIsProcessingAction(true);
    setActionErrorMsg(null);
    try {
      await questionsService.archive(actionTarget.id);
      closeArchiveModal();
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionErrorMsg(msg || 'Failed to archive question. Please try again.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const onFormSubmit = async (payload: CreateQuestionPayload) => {
    let success = false;
    if (selected) {
      success = await updateQuestion(selected.id, payload);
    } else {
      success = await createQuestion({
        ...payload,
        passageId: payload.passageId || undefined,
      });
    }
    if (success) {
      setIsFormOpen(false);
      load();
    }
  };

  const onConfirmDelete = async () => {
    if (!selected) return;
    const success = await deleteQuestion(selected.id);
    setIsDeleteOpen(false);
    if (success) {
      load();
    }
  };

  const onSubmitForReview = async (id: string) => {
    const success = await submitQuestion(id);
    if (success) {
      setSelectedQuestionIds((currentIds) => currentIds.filter((selectedId) => selectedId !== id));
      load();
    }
  };

  const onApprove = async (id: string) => {
    const success = await approveQuestion(id);
    if (success) {
      setSelectedQuestionIds((currentIds) => currentIds.filter((selectedId) => selectedId !== id));
      load();
    }
  };

  const onReject = async (note: string) => {
    if (!selected) return;
    const success = await rejectQuestion(selected.id, { rejectionNote: note });
    if (success) {
      setIsRejectOpen(false);
      load();
    }
  };

  const bulkActionMode = statusFilter === 'PENDING_APPROVAL' ? 'approve' : 'submit';
  const activeBulkStatus: QuestionStatus | null =
    statusFilter === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : statusFilter === 'DRAFT' ? 'DRAFT' : null;
  const selectableQuestionIds = useMemo(
    () =>
      questions
        .filter((question) =>
          bulkActionMode === 'approve'
            ? question.status === 'PENDING_APPROVAL'
            : question.status === 'DRAFT'
        )
        .map((question) => question.id),
    [bulkActionMode, questions]
  );
  const selectedCount = selectedQuestionIds.length;
  const isAllSelectableChecked = selectableQuestionIds.length > 0 && selectableQuestionIds.every((id) => selectedQuestionIds.includes(id));
  const isSomeSelectableChecked = selectableQuestionIds.some((id) => selectedQuestionIds.includes(id)) && !isAllSelectableChecked;
  const isBulkActioning = actionLoading === '__bulk_submit__' || actionLoading === '__bulk_approve__';
  const isSelectionBusy = isBulkActioning || isSelectingAllResults;
  const selectedOnCurrentPageCount = selectableQuestionIds.filter((id) => selectedQuestionIds.includes(id)).length;
  const canSelectAllFilteredResults = Boolean(
    activeBulkStatus &&
    meta &&
    meta.total > selectableQuestionIds.length &&
    isAllSelectableChecked &&
    selectedCount < meta.total
  );
  const bulkActionLabel = bulkActionMode === 'approve' ? 'Approve Selected' : 'Submit Selected';
  const selectableStatusLabel = bulkActionMode === 'approve' ? 'pending review' : 'draft';

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = isSomeSelectableChecked;
  }, [isSomeSelectableChecked]);

  const handleToggleAllQuestions = () => {
    setSelectAllError(null);

    if (isAllSelectableChecked) {
      setSelectedQuestionIds((currentIds) => currentIds.filter((id) => !selectableQuestionIds.includes(id)));
      return;
    }

    setSelectedQuestionIds((currentIds) => [...new Set([...currentIds, ...selectableQuestionIds])]);
  };

  const handleSelectAllFilteredQuestions = async () => {
    if (!activeBulkStatus || !meta || isSelectingAllResults) return;

    setIsSelectingAllResults(true);
    setSelectAllError(null);

    try {
      const firstPage = await questionsService.list({
        page: 1,
        limit: SELECT_ALL_PAGE_LIMIT,
        search: search || undefined,
        subjectId: subjectFilter || undefined,
        topicId: topicFilter || undefined,
        status: activeBulkStatus,
      });

      if (!firstPage.success) {
        setSelectAllError(firstPage.message || 'Failed to select all questions');
        return;
      }

      const allQuestions = [...firstPage.data];
      const totalPages = firstPage.meta?.totalPages ?? 1;

      for (let targetPage = 2; targetPage <= totalPages; targetPage += 1) {
        const response = await questionsService.list({
          page: targetPage,
          limit: SELECT_ALL_PAGE_LIMIT,
          search: search || undefined,
          subjectId: subjectFilter || undefined,
          topicId: topicFilter || undefined,
          status: activeBulkStatus,
        });

        if (response.success) {
          allQuestions.push(...response.data);
        }
      }

      setSelectedQuestionIds([
        ...new Set(
          allQuestions
            .filter((question) => question.status === activeBulkStatus)
            .map((question) => question.id)
        ),
      ]);
    } catch {
      setSelectAllError('Failed to select all questions');
    } finally {
      setIsSelectingAllResults(false);
    }
  };

  const handleBulkAction = async () => {
    if (selectedQuestionIds.length === 0 || isBulkActioning) return;
    setSelectAllError(null);

    const result = bulkActionMode === 'approve'
      ? await approveQuestions(selectedQuestionIds)
      : await submitQuestions(selectedQuestionIds);

    if (result.successCount > 0) {
      setSelectedQuestionIds(result.failedIds);
      load();
    }
  };

  const hasActiveFilters = Boolean(search || subjectFilter || topicFilter || statusFilter !== 'DRAFT' || pageSize !== 15);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Question Bank <span className="text-[#0A9AE2]">.</span>
          </h1>
          <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
            Manage educational questions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Upload size={16} />
            Import
          </button>
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-100 transition-all hover:bg-[#0864B6] dark:shadow-none"
          >
            <Plus size={16} />
            New Question
          </button>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-3 text-xs sm:text-sm font-bold text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Filters + Table card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* Status tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 px-4 pt-4 dark:border-slate-800 sm:px-6">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`mb-[-1px] whitespace-nowrap rounded-t-xl border-b-2 px-4 py-2.5 text-sm font-bold transition-all ${
                statusFilter === tab.value
                  ? 'border-[#0A9AE2] text-[#0A9AE2] bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + filter row */}
        <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search questions..."
                value={search}
                onChange={handleSearch}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm font-medium outline-none transition-all focus:border-[#0A9AE2] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex w-fit items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-bold text-slate-500 dark:bg-slate-800/50">
                <Filter size={16} className="text-[#0A9AE2]" />
                <span>{meta ? `${meta.total} Result${meta.total !== 1 ? 's' : ''}` : ''}</span>
              </div>
              {activeBulkStatus && (
                <button
                  type="button"
                  onClick={handleBulkAction}
                  disabled={selectedCount === 0 || isSelectionBusy}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#0864B6] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isBulkActioning ? <Loader2 size={16} className="animate-spin" /> : bulkActionMode === 'approve' ? <CheckCircle2 size={16} /> : <Send size={16} />}
                  {bulkActionLabel}
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <SearchableSelect
              value={subjectFilter}
              onChange={handleSubjectFilterChange}
              placeholder="All subjects"
              searchPlaceholder="Search subjects..."
              options={[
                { value: '', label: 'All subjects' },
                ...subjects.map((subject) => ({
                  value: subject.id,
                  label: subject.name,
                })),
              ]}
              triggerClassName="py-2.5 text-sm"
            />

            <SearchableSelect
              value={topicFilter}
              onChange={handleTopicFilterChange}
              placeholder={subjectFilter ? 'All topics' : 'Select subject first'}
              searchPlaceholder="Search topics..."
              disabled={!subjectFilter}
              options={[
                { value: '', label: 'All topics' },
                ...topics.map((topic) => ({
                  value: topic.id,
                  label: topic.name,
                })),
              ]}
              triggerClassName="py-2.5 text-sm"
            />

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Reset Filters
            </button>
          </div>

          {activeBulkStatus && (
            <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isAllSelectableChecked}
                  onChange={handleToggleAllQuestions}
                  disabled={selectableQuestionIds.length === 0 || isSelectionBusy}
                  className="h-4 w-4 rounded border-slate-300 text-[#0A9AE2] focus:ring-[#0A9AE2] disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span>
                  Select all {selectableQuestionIds.length} {selectableStatusLabel} question{selectableQuestionIds.length !== 1 ? 's' : ''} on this page
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>{selectedOnCurrentPageCount} selected on page</span>
                {canSelectAllFilteredResults && (
                  <button
                    type="button"
                    onClick={handleSelectAllFilteredQuestions}
                    disabled={isSelectionBusy}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-[#0A9AE2] transition-all hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                  >
                    {isSelectingAllResults && <Loader2 size={12} className="animate-spin" />}
                    Select all {meta?.total ?? 0} results
                  </button>
                )}
              </div>
            </div>
          )}

          {selectAllError && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              {selectAllError}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="w-14 px-6 py-3">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={isAllSelectableChecked}
                    onChange={handleToggleAllQuestions}
                    disabled={selectableQuestionIds.length === 0 || isSelectionBusy}
                    className="h-4 w-4 rounded border-slate-300 text-[#0A9AE2] focus:ring-[#0A9AE2] disabled:cursor-not-allowed disabled:opacity-50"
                    title={`Select all ${selectableStatusLabel} questions on this page`}
                  />
                </th>
                <th className="hidden px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500 lg:table-cell">Question ID</th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Question Content</th>
                <th className="hidden px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500 lg:table-cell">Subject</th>
                <th className="hidden px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500 xl:table-cell">Topic</th>
                <th className="hidden px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500 lg:table-cell">Type</th>
                <th className="hidden px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500 md:table-cell">Difficulty</th>
                <th className="hidden px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500 md:table-cell">Status</th>
                <th className="px-6 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading && questions.length === 0 ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 align-top">
                      <div className="h-4 w-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    </td>
                    <td className="hidden px-6 py-4 lg:table-cell">
                      <div className="h-4 w-3/5 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="h-4 w-4/5 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                        <div className="h-3 w-3/5 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 lg:table-cell">
                      <div className="h-4 w-3/5 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </td>
                    <td className="hidden px-6 py-4 xl:table-cell">
                      <div className="h-4 w-3/5 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </td>
                    <td className="hidden px-6 py-4 lg:table-cell">
                      <div className="h-4 w-3/5 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      <div className="h-4 w-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      <div className="h-4 w-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="ml-auto h-4 w-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Trophy className="text-slate-200 dark:text-slate-800" size={64} />
                      <p className="font-bold text-slate-500">No questions found matching your criteria.</p>
                      <button onClick={handleCreate} className="text-[#0A9AE2] font-bold hover:underline underline-offset-4">
                        Create your first question
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                questions.map((q) => {
                  const isActioning = actionLoading === q.id;
                  const badge = STATUS_BADGE[q.status];
                  return (
                    <tr
                      key={q.id}
                      className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-4 align-top">
                        <input
                          type="checkbox"
                          checked={selectedQuestionIds.includes(q.id)}
                          onChange={() => handleToggleQuestion(q.id)}
                          disabled={!selectableQuestionIds.includes(q.id) || isSelectionBusy}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0A9AE2] focus:ring-[#0A9AE2] disabled:cursor-not-allowed disabled:opacity-40"
                          title={selectableQuestionIds.includes(q.id) ? 'Select question' : bulkActionMode === 'approve' ? 'Only pending review questions can be selected' : 'Only draft questions can be selected'}
                        />
                      </td>
                      <td className="hidden px-6 py-4 align-top lg:table-cell">
                        <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {q.questionId || '-'}
                        </span>
                      </td>
                      {/* Question text */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex flex-wrap items-center gap-2 md:hidden mb-1">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-black ${badge.className}`}>
                              {badge.label}
                            </span>
                            {q.status === 'PUBLISHED' && q.usedInExam && (
                              <span
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-black bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"
                                title="This question is attached to one or more exams — Unpublish will be blocked; use Archive instead."
                              >
                                Used in exam
                              </span>
                            )}
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-black border ${DIFFICULTY_BADGE[q.difficulty]}`}>
                              {q.difficulty}
                            </span>
                            {q.latexEnabled && (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-black bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                                LaTeX
                              </span>
                            )}
                          </div>

                          {q.latexEnabled ? (
                            <div className="overflow-x-auto text-slate-900 dark:text-slate-100 leading-relaxed font-bold">
                              <LatexRenderer latex={q.questionText} displayMode={false} />
                            </div>
                          ) : (
                            <p className="font-bold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-[#0A9AE2] transition-colors leading-relaxed">
                              {q.questionText}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {q.questionId && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800 lg:hidden">
                                Question ID: {q.questionId}
                              </span>
                            )}
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                              Subject: {q.subjectName}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                              Topic: {q.topicName}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800 lg:hidden">
                              Type: {TYPE_LABEL[q.type]}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                              Marking: {q.markingType === 'AUTO' ? 'Auto' : 'AI Rubric'} - {q.maxMarks} mark{q.maxMarks !== 1 ? 's' : ''}
                            </span>
                            {q.type === 'ESSAY' && q.aiRubricId && (
                              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 font-mono text-[10px]">
                                AI Rubric: {q.aiRubric?.name ?? q.aiRubricId} ({q.aiRubricId})
                              </span>
                            )}
                            {q.latexEnabled && (
                              <span className="rounded-full hidden md:inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                                LaTeX
                              </span>
                            )}
                          </div>
                          {q.subtopics && q.subtopics.length > 0 && (
                            <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 truncate max-w-[150px] sm:max-w-none">
                              {q.subtopics.join(' · ')}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {q.timeLimitSeconds && (
                              <span className="text-[9px] sm:text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded px-1.5 py-0.5">
                                ⏱ {q.timeLimitSeconds}s
                              </span>
                            )}
                            {q.imageRefs?.length > 0 && (
                              <span className="text-[9px] sm:text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded px-1.5 py-0.5">
                                🖼 {q.imageRefs.length} {q.imageRefs.length > 1 ? 'Images' : 'Image'}
                              </span>
                            )}
                          </div>
                          {q.status === 'DRAFT' && q.rejectionNote && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-[9px] sm:text-xs font-bold w-fit">
                              <XCircle size={12} />
                              <span>Feedback: {q.rejectionNote}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="hidden px-6 py-4 lg:table-cell">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {q.subjectName}
                        </span>
                      </td>

                      {/* Topic */}
                      <td className="hidden px-6 py-4 xl:table-cell">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {q.topicName}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="hidden px-6 py-4 lg:table-cell">
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                          {TYPE_LABEL[q.type]}
                        </span>
                      </td>

                      {/* Difficulty */}
                      <td className="hidden px-6 py-4 md:table-cell">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black border ${DIFFICULTY_BADGE[q.difficulty]}`}>
                          {q.difficulty}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="hidden px-6 py-4 md:table-cell">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black ${badge.className}`}>
                            {badge.label}
                          </span>
                          {q.status === 'PUBLISHED' && q.usedInExam && (
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"
                              title="This question is attached to one or more exams — Unpublish will be blocked; use Archive instead."
                            >
                              Used in exam
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isActioning ? (
                            <Loader2 className="animate-spin text-[#0A9AE2]" size={16} />
                          ) : (
                            <>
                              {q.status !== 'PUBLISHED' && q.status !== 'ARCHIVED' && (
                                <button
                                  onClick={() => handleEdit(q)}
                                  className="rounded-lg p-2 text-slate-400 transition-all hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"
                                  title="Edit"
                                >
                                  <Edit2 size={16} />
                                </button>
                              )}

                              {q.status === 'DRAFT' && (
                                <button
                                  onClick={() => onSubmitForReview(q.id)}
                                  className="rounded-lg p-2 text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10"
                                  title="Submit"
                                >
                                  <Send size={16} />
                                </button>
                              )}

                              {q.status === 'PENDING_APPROVAL' && (
                                <button
                                  onClick={() => onApprove(q.id)}
                                  className="rounded-lg p-2 text-slate-400 transition-all hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"
                                  title="Approve"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                              )}

                              {q.status === 'PENDING_APPROVAL' && (
                                <button
                                  onClick={() => handleRejectOpen(q)}
                                  className="rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                                  title="Reject"
                                >
                                  <XCircle size={16} />
                                </button>
                              )}

                              {q.status !== 'PUBLISHED' && q.status !== 'ARCHIVED' && (
                                <button
                                  onClick={() => handleDeleteOpen(q)}
                                  className="rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}

                              {isAdmin && q.status === 'PUBLISHED' && (
                                <>
                                  <button
                                    onClick={() => openUnpublishModal(q)}
                                    className="rounded-lg p-2 text-slate-400 transition-all hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10"
                                    title={q.usedInExam ? 'Used in exam — Unpublish will be blocked. Archive instead.' : 'Unpublish'}
                                  >
                                    <RotateCcw size={16} />
                                  </button>
                                  <button
                                    onClick={() => openArchiveModal(q)}
                                    className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700/50"
                                    title="Archive"
                                  >
                                    <Archive size={16} />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && (
          <div className="p-4 sm:px-8 sm:py-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-t border-slate-100 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-900/30">
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedCount}</span> of {meta.total} row(s) selected.
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-5 lg:justify-end">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                <span>Rows per page</span>
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="min-w-24 appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-9 text-xs sm:text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#0A9AE2] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 shadow-sm"
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                Page {meta.totalPages === 0 ? 0 : page} of {meta.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => {
                    setSelectedQuestionIds([]);
                    setPage(1);
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shadow-sm"
                  title="First page"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  disabled={page === 1}
                  onClick={() => {
                    setSelectedQuestionIds([]);
                    setPage((currentPage) => currentPage - 1);
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shadow-sm"
                  title="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page === meta.totalPages}
                  onClick={() => {
                    setSelectedQuestionIds([]);
                    setPage((currentPage) => currentPage + 1);
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shadow-sm"
                  title="Next page"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  disabled={page === meta.totalPages}
                  onClick={() => {
                    setSelectedQuestionIds([]);
                    setPage(meta.totalPages);
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shadow-sm"
                  title="Last page"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <QuestionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={onFormSubmit}
        initialData={selected}
        isLoading={isLoading}
      />

      <RejectModal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onSubmit={onReject}
        isLoading={actionLoading === selected?.id}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => { setIsImportOpen(false); load(); }}
        onImportCsv={importQuestions}
        onSubmitQuestion={submitQuestion}
        onSubmitQuestions={submitQuestions}
        onUpdateQuestion={updateQuestion}
        isLoading={isLoading}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={onConfirmDelete}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        isLoading={actionLoading === selected?.id}
      />

      {/* Unpublish Question Modal */}
      {isUnpublishOpen && actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <RotateCcw size={18} className="text-amber-500" />
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {unpublishStep === 'confirm' ? 'Unpublish Question' : 'Cannot Unpublish'}
                </h2>
              </div>
              <button
                onClick={closeUnpublishModal}
                disabled={isProcessingAction}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {unpublishStep === 'confirm' ? (
                <>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Move this question back to <span className="font-bold text-slate-900 dark:text-slate-100">Draft</span> so it can be edited?
                    {' '}This will hide it from any new exam or practice session.
                  </p>
                  {actionTarget.usedInExam && (
                    <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs font-bold text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-300">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                      <span>This question is already used in at least one exam. Unpublish will be rejected — use Archive instead.</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{actionErrorMsg ?? 'This question is used in existing exams. Archive it instead.'}</span>
                </div>
              )}
              {unpublishStep === 'confirm' && actionErrorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
                  {actionErrorMsg}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button
                onClick={closeUnpublishModal}
                disabled={isProcessingAction}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              {unpublishStep === 'confirm' ? (
                <button
                  onClick={handleUnpublishConfirm}
                  disabled={isProcessingAction}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {isProcessingAction && <Loader2 size={14} className="animate-spin" />}
                  Unpublish
                </button>
              ) : (
                <button
                  onClick={handleSwitchToArchiveFromUnpublish}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                >
                  <Archive size={14} />
                  Archive Instead
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Archive Question Modal */}
      {isArchiveOpen && actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Archive size={18} className="text-slate-500" />
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Archive Question</h2>
              </div>
              <button
                onClick={closeArchiveModal}
                disabled={isProcessingAction}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Archive <span className="font-bold text-slate-900 dark:text-slate-100">{actionTarget.questionId ?? 'this question'}</span>?
              </p>
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>Archived questions cannot be used in new exams. This action cannot be undone.</span>
              </div>
              {actionErrorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
                  {actionErrorMsg}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button
                onClick={closeArchiveModal}
                disabled={isProcessingAction}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveConfirm}
                disabled={isProcessingAction}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {isProcessingAction && <Loader2 size={14} className="animate-spin" />}
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { isAxiosError } from 'axios';
import {
  X, Loader2, Upload, CheckCircle2, XCircle, FileText,
  AlertTriangle, Send, Edit2, CheckCheck, ImageIcon, PlusCircle,
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { BulkImportResult, ImportedQuestionItem, Question, UpdateQuestionPayload, CreateQuestionPayload, UnresolvedRowItem } from '../types/questions.types';
import { questionsService } from '../services/questions.service';
import { subjectsService } from '@/features/subjects/services/subjects.service';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { QuestionFormModal } from './QuestionFormModal';

type Phase = 'upload' | 'review';
type ReviewTableView = 'attention' | 'all';

type CreateFormState =
  | null
  | { type: 'subject'; sectionName: string }
  | { type: 'topic'; sectionName: string; topicName: string; subjectId: string };

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCsv: (file: File) => Promise<BulkImportResult | null>;
  onSubmitQuestion: (id: string) => Promise<boolean>;
  onSubmitQuestions: (ids: string[]) => Promise<{ successCount: number; failedIds: string[] }>;
  onUpdateQuestion: (id: string, payload: UpdateQuestionPayload) => Promise<boolean>;
  isLoading?: boolean;
}

type ReviewQuestion = Question & { importRowNumber: number };

const DIFFICULTY_BADGE: Record<string, string> = {
  EASY:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  HARD:   'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
};

const splitImageRefs = (value?: string | null) => (
  value
    ? value.split('|').map((item) => item.trim()).filter(Boolean)
    : []
);

const getQuestionImageRefs = (q: Question) => {
  if (q.imageUrls?.length) return q.imageUrls;
  return splitImageRefs(q.imageUrl);
};

const isUploadedImageRef = (value: string) => (
  value.startsWith('http://') || value.startsWith('https://')
);

const getPendingImageRefs = (q: Question) => (
  getQuestionImageRefs(q).filter((ref) => !isUploadedImageRef(ref))
);

const needsImageUpload = (q: Question) => {
  return getPendingImageRefs(q).length > 0;
};

const getNextExpectedImageName = (q: Question): string | null => {
  const val = getPendingImageRefs(q)[0];
  if (!val || val.toLowerCase() === 'true') return null;
  return val;
};

const buildQuestionCode = (name: string) => {
  const normalized = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10);

  return normalized || 'SBJ';
};

const normalizeTopicName = (name: string) => name.trim().toLocaleLowerCase();

const isAlreadyImportedReason = (reason: string) => reason.toLowerCase().includes('already exists');

const getRequestErrorMessage = (err: unknown, fallback: string) => {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: string } | undefined)?.message;
    return message || err.message || fallback;
  }

  return err instanceof Error ? err.message : fallback;
};

const toReviewQuestions = (items: ImportedQuestionItem[]): ReviewQuestion[] => (
  items
    .map(({ rowNumber, question }) => ({ ...question, importRowNumber: rowNumber }))
    .sort((a, b) => a.importRowNumber - b.importRowNumber)
);

const mergeReviewQuestions = (
  previous: ReviewQuestion[],
  items: ImportedQuestionItem[],
): ReviewQuestion[] => {
  const next = new Map(previous.map((question) => [question.id, question]));

  for (const imported of toReviewQuestions(items)) {
    next.set(imported.id, imported);
  }

  return [...next.values()].sort((a, b) => a.importRowNumber - b.importRowNumber);
};

export function ImportModal({
  isOpen,
  onClose,
  onImportCsv,
  onSubmitQuestion,
  onSubmitQuestions,
  onUpdateQuestion,
  isLoading,
}: ImportModalProps) {
  const user = useAuthStore((s) => s.user);
  const canCreateSubjectOrTopic = user?.role === 'ADMIN' || user?.role === 'TUTOR';

  // ── Upload state ──────────────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver]     = useState(false);
  const fileInputRef                = useRef<HTMLInputElement>(null);

  // ── Phase + import result ─────────────────────────────────────────────────
  const [phase, setPhase]           = useState<Phase>('upload');
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);

  // ── Review state ──────────────────────────────────────────────────────────
  const [reviewQuestions, setReviewQuestions] = useState<ReviewQuestion[]>([]);
  const [unresolvedRows, setUnresolvedRows]   = useState<UnresolvedRowItem[]>([]);
  const [submittedIds, setSubmittedIds]       = useState<Set<string>>(new Set());
  const [submittingId, setSubmittingId]       = useState<string | null>(null);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);
  const [reviewTableView, setReviewTableView] = useState<ReviewTableView>('attention');

  // ── Image upload state ────────────────────────────────────────────────────
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const imageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Inline create subject/topic ───────────────────────────────────────────
  const [createForm, setCreateForm]     = useState<CreateFormState>(null);
  const [createFormName, setCreateFormName] = useState('');
  const [createFormQuestionCode, setCreateFormQuestionCode] = useState('');
  const [isCreating, setIsCreating]     = useState(false);
  const [isCreatingAllTopics, setIsCreatingAllTopics] = useState(false);
  const [createError, setCreateError]   = useState<string | null>(null);
  // Tracks sectionName → subjectId for newly created subjects (to enable topic creation)
  const [resolvedSubjectIds, setResolvedSubjectIds] = useState<Map<string, string>>(new Map());

  // ── Edit sub-modal ────────────────────────────────────────────────────────
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [isEditOpen, setIsEditOpen]     = useState(false);

  // ── Upload-phase error ────────────────────────────────────────────────────
  const [importError, setImportError]   = useState<string | null>(null);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setImportResult(null);
    setPhase('upload');
    setReviewQuestions([]);
    setUnresolvedRows([]);
    setSubmittedIds(new Set());
    setSubmittingId(null);
    setIsSubmittingAll(false);
    setReviewTableView('attention');
    setUploadingImageId(null);
    setCreateForm(null);
    setCreateFormName('');
    setCreateFormQuestionCode('');
    setIsCreating(false);
    setIsCreatingAllTopics(false);
    setCreateError(null);
    setResolvedSubjectIds(new Map());
    setEditQuestion(null);
    setIsEditOpen(false);
    setImportError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timeoutId = window.setTimeout(resetState, 0);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, resetState]);

  if (!isOpen) return null;

  // ── Derived values ────────────────────────────────────────────────────────

  const pendingCount = reviewQuestions.filter(
    (q) => !submittedIds.has(q.id) && !needsImageUpload(q)
  ).length;
  const imageIssueCount = reviewQuestions.filter(needsImageUpload).length;
  const allSubmitted = reviewQuestions.length > 0 &&
    reviewQuestions.every((q) => submittedIds.has(q.id));

  // ── Upload-phase handlers ─────────────────────────────────────────────────

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      alert('Please select a .csv file.');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileChange(e.dataTransfer.files[0] ?? null);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setImportError(null);
    const result = await onImportCsv(selectedFile);

    if (!result) {
      setImportError('Import failed. Please check your file format and try again.');
      return;
    }

    setImportResult(result);
    setPhase('review');
    setUnresolvedRows(result.unresolvedRows ?? []);
    setReviewQuestions(toReviewQuestions(result.createdQuestions ?? []));
    setReviewTableView('attention');
  };

  // ── Review-phase handlers ─────────────────────────────────────────────────

  const handleSubmitOne = async (id: string) => {
    setSubmittingId(id);
    const ok = await onSubmitQuestion(id);
    if (ok) setSubmittedIds((prev) => new Set([...prev, id]));
    setSubmittingId(null);
  };

  const handleSubmitAll = async () => {
    setIsSubmittingAll(true);
    const pending = reviewQuestions.filter(
      (q) => !submittedIds.has(q.id) && !needsImageUpload(q)
    );
    const pendingIds = pending.map((q) => q.id);
    if (pendingIds.length > 0) {
      const { failedIds } = await onSubmitQuestions(pendingIds);
      const successIds = pendingIds.filter((id) => !failedIds.includes(id));
      if (successIds.length > 0) {
        setSubmittedIds((prev) => new Set([...prev, ...successIds]));
      }
    }
    setIsSubmittingAll(false);
  };

  const handleEditSubmit = async (payload: CreateQuestionPayload) => {
    if (!editQuestion) return;
    const ok = await onUpdateQuestion(editQuestion.id, payload);
    if (ok) {
      try {
        const res = await questionsService.getById(editQuestion.id);
        if (res.success) {
          setReviewQuestions((prev) =>
            prev.map((q) => (q.id === editQuestion.id ? { ...res.data, importRowNumber: q.importRowNumber } : q))
          );
        }
      } catch { /* ignore */ }
      setIsEditOpen(false);
      setEditQuestion(null);
    }
  };

  // ── Image upload handler ──────────────────────────────────────────────────

  const handleImageUpload = async (questionId: string, files: FileList | File[] | null) => {
    const selectedFiles = files ? Array.from(files) : [];
    if (selectedFiles.length === 0) return;

    const question = reviewQuestions.find((q) => q.id === questionId);
    const pendingImageCount = question ? getPendingImageRefs(question).length : 0;
    if (pendingImageCount === 0) {
      setCreateError('This question does not need any more images.');
      if (imageInputRefs.current[questionId]) imageInputRefs.current[questionId]!.value = '';
      return;
    }

    if (selectedFiles.length > pendingImageCount) {
      setCreateError(`This question needs ${pendingImageCount} image${pendingImageCount !== 1 ? 's' : ''}, but you selected ${selectedFiles.length}.`);
      if (imageInputRefs.current[questionId]) imageInputRefs.current[questionId]!.value = '';
      return;
    }

    setCreateError(null);
    setUploadingImageId(questionId);
    try {
      for (const file of selectedFiles) {
        const res = await questionsService.uploadQuestionImage(questionId, file);
        if (res.success) {
          setReviewQuestions((prev) =>
            prev.map((q) => (q.id === questionId ? { ...res.data, importRowNumber: q.importRowNumber } : q))
          );
        }
      }
    } catch {
      // Error visible via button state returning to normal
    } finally {
      if (imageInputRefs.current[questionId]) imageInputRefs.current[questionId]!.value = '';
      setUploadingImageId(null);
    }
  };

  // ── Inline create subject/topic handlers ──────────────────────────────────

  const handleOpenCreateSubject = (sectionName: string) => {
    setCreateError(null);
    setCreateForm({ type: 'subject', sectionName });
    setCreateFormName(sectionName);
    setCreateFormQuestionCode(buildQuestionCode(sectionName));
  };

  const handleOpenCreateTopic = async (sectionName: string, topicName: string) => {
    setCreateError(null);
    setIsCreating(true);
    try {
      // Try from cache first, then fetch from API
      let subjectId = resolvedSubjectIds.get(sectionName);
      if (!subjectId) {
        const res = await subjectsService.listSubjects({ search: sectionName, limit: 5 });
        const match = res.data.find((s) => s.name === sectionName);
        if (!match) {
          setCreateError(`Subject "${sectionName}" not found. Please create the subject first.`);
          return;
        }
        subjectId = match.id;
        setResolvedSubjectIds((prev) => new Map(prev).set(sectionName, subjectId!));
      }
      setCreateForm({ type: 'topic', sectionName, topicName, subjectId });
      setCreateFormName(topicName);
    } catch {
      setCreateError('Failed to look up subject. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateFormSubmit = async () => {
    if (!createForm) return;
    setIsCreating(true);
    setCreateError(null);

    try {
      let affectedRows: UnresolvedRowItem[] = [];

      if (createForm.type === 'subject') {
        const subjectName = createFormName.trim();
        const questionCode = createFormQuestionCode.trim().toUpperCase() || buildQuestionCode(subjectName);

        const sectionRows = unresolvedRows.filter((r) => r.sectionName === createForm.sectionName);

        const topicNames = [...new Map(
          sectionRows
            .map((r) => r.rowData.topicName.trim())
            .filter(Boolean)
            .map((topicName) => [normalizeTopicName(topicName), topicName])
        ).values()];

        const res = await subjectsService.ensureSubjectWithTopics({
          subject: {
            name: subjectName,
            questionCode,
          },
          topics: topicNames.map((name) => ({ name })),
        });
        if (!res.success) throw new Error(res.message ?? 'Failed to create subject and topics');

        const newSubjectId = res.data.subject.id;
        setResolvedSubjectIds((prev) => new Map(prev).set(createForm.sectionName, newSubjectId));
        const topicNameToId = new Map(res.data.topics.map((topic) => [normalizeTopicName(topic.name), topic.id]));
        const missingTopicName = topicNames.find((topicName) => !topicNameToId.has(normalizeTopicName(topicName)));
        if (missingTopicName) {
          throw new Error(`Topic "${missingTopicName}" could not be resolved`);
        }

        affectedRows = sectionRows.map((row) => ({
          ...row,
          resolvedSubjectId: newSubjectId,
          resolvedTopicId: topicNameToId.get(normalizeTopicName(row.rowData.topicName)),
        }));
      } else {
        const res = await subjectsService.createTopic(createForm.subjectId, { name: createFormName.trim() });
        if (!res.success) throw new Error(res.message ?? 'Failed to create topic');

        affectedRows = unresolvedRows
          .filter((r) => r.sectionName === createForm.sectionName && r.rowData.topicName === createForm.topicName)
          .map((row) => ({
            ...row,
            resolvedSubjectId: createForm.subjectId,
            resolvedTopicId: res.data.id,
          }));
      }

      if (affectedRows.length === 0) {
        setCreateForm(null);
        return;
      }

      // Call resolve endpoint to save newly-resolvable rows to DB
      const resolveRes = await questionsService.resolveImport(affectedRows);
      if (!resolveRes.success) {
        setCreateForm(null);
        return;
      }

      const { createdQuestions, stillUnresolved } = resolveRes.data;

      const affectedRowNumbers = new Set(affectedRows.map((r) => r.rowNumber));
      setUnresolvedRows((prev) => [
        ...prev.filter((r) => !affectedRowNumbers.has(r.rowNumber)),
        ...stillUnresolved,
      ]);
      setReviewQuestions((prev) => mergeReviewQuestions(prev, createdQuestions ?? []));
      setCreateForm(null);
    } catch (err) {
      setCreateError(getRequestErrorMessage(err, 'An error occurred'));
    } finally {
      setIsCreating(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const handleCreateAllMissingTopics = async () => {
    const topicRows = unresolvedRows.filter((row) => row.reason === 'TOPIC_NOT_FOUND');
    if (topicRows.length === 0) return;

    setIsCreatingAllTopics(true);
    setCreateError(null);

    try {
      const groups = [...topicRows.reduce((map, row) => {
        const existing = map.get(row.sectionName) ?? { sectionName: row.sectionName, rows: [] as UnresolvedRowItem[] };
        existing.rows.push(row);
        map.set(row.sectionName, existing);
        return map;
      }, new Map<string, { sectionName: string; rows: UnresolvedRowItem[] }>()).values()];

      const nextResolvedSubjectIds = new Map(resolvedSubjectIds);
      const affectedRows: UnresolvedRowItem[] = [];

      for (const group of groups) {
        const cachedSubjectId = nextResolvedSubjectIds.get(group.sectionName);
        let subject = null as Awaited<ReturnType<typeof subjectsService.getSubject>>['data'] | null;

        if (cachedSubjectId) {
          try {
            const subjectRes = await subjectsService.getSubject(cachedSubjectId);
            if (subjectRes.success) subject = subjectRes.data;
          } catch {
            // Fall back to lookup by name below.
          }
        }

        if (!subject) {
          const subjectRes = await subjectsService.listSubjects({ search: group.sectionName, limit: 10 });
          subject = subjectRes.data.find((item) => normalizeTopicName(item.name) === normalizeTopicName(group.sectionName)) ?? null;
        }

        if (!subject) {
          throw new Error(`Subject "${group.sectionName}" not found. Please create the subject first.`);
        }

        const topicNames = [...new Map(
          group.rows
            .map((row) => row.rowData.topicName.trim())
            .filter(Boolean)
            .map((topicName) => [normalizeTopicName(topicName), topicName])
        ).values()];

        const ensureRes = await subjectsService.ensureSubjectWithTopics({
          subject: {
            name: subject.name,
            questionCode: subject.questionCode || buildQuestionCode(subject.name),
            description: subject.description,
          },
          topics: topicNames.map((name) => ({ name })),
        });

        if (!ensureRes.success) throw new Error(ensureRes.message ?? 'Failed to create topics');

        const subjectId = ensureRes.data.subject.id;
        nextResolvedSubjectIds.set(group.sectionName, subjectId);

        const topicNameToId = new Map(ensureRes.data.topics.map((topic) => [normalizeTopicName(topic.name), topic.id]));
        const missingTopicName = topicNames.find((topicName) => !topicNameToId.has(normalizeTopicName(topicName)));
        if (missingTopicName) {
          throw new Error(`Topic "${missingTopicName}" could not be resolved`);
        }

        affectedRows.push(...group.rows.map((row) => ({
          ...row,
          resolvedSubjectId: subjectId,
          resolvedTopicId: topicNameToId.get(normalizeTopicName(row.rowData.topicName)),
        })));
      }

      if (affectedRows.length === 0) return;

      const resolveRes = await questionsService.resolveImport(affectedRows);
      if (!resolveRes.success) throw new Error(resolveRes.message ?? 'Failed to save resolved questions');

      const { createdQuestions, stillUnresolved } = resolveRes.data;
      const affectedRowNumbers = new Set(affectedRows.map((row) => row.rowNumber));

      setResolvedSubjectIds(nextResolvedSubjectIds);
      setUnresolvedRows((prev) => [
        ...prev.filter((row) => !affectedRowNumbers.has(row.rowNumber)),
        ...stillUnresolved,
      ]);
      setReviewQuestions((prev) => mergeReviewQuestions(prev, createdQuestions ?? []));
      setCreateForm(null);
    } catch (err) {
      setCreateError(getRequestErrorMessage(err, 'Failed to create missing topics'));
    } finally {
      setIsCreatingAllTopics(false);
    }
  };

  const totalRows = reviewQuestions.length + unresolvedRows.length;
  const orderedReviewItems = [
    ...reviewQuestions.map((question) => ({ kind: 'question' as const, rowNumber: question.importRowNumber, question })),
    ...unresolvedRows.map((unresolved) => ({ kind: 'unresolved' as const, rowNumber: unresolved.rowNumber, unresolved })),
  ].sort((a, b) => a.rowNumber - b.rowNumber);
  const attentionReviewItems = orderedReviewItems.filter((item) => (
    item.kind === 'unresolved' || needsImageUpload(item.question)
  ));
  const displayedReviewItems = reviewTableView === 'attention'
    ? attentionReviewItems
    : orderedReviewItems;
  const skippedErrors = importResult?.skippedErrors ?? [];
  const skippedCount = Math.max(importResult?.skipped ?? 0, skippedErrors.length);
  const duplicateSkippedCount = skippedErrors.filter((err) => isAlreadyImportedReason(err.reason)).length;
  const allSkippedRowsAlreadyExist = skippedErrors.length > 0 && duplicateSkippedCount === skippedErrors.length;
  const hasNoRowsToReview = Boolean(importResult && reviewQuestions.length === 0 && unresolvedRows.length === 0);
  const missingTopicGroups = [...unresolvedRows
    .filter((row) => row.reason === 'TOPIC_NOT_FOUND')
    .reduce((map, row) => {
      const existing = map.get(row.sectionName) ?? new Set<string>();
      existing.add(normalizeTopicName(row.rowData.topicName));
      map.set(row.sectionName, existing);
      return map;
    }, new Map<string, Set<string>>())
    .values()];
  const missingTopicCount = missingTopicGroups.reduce((total, topics) => total + topics.size, 0);

  return (
    <>
      {/* ImportModal uses z-[60] so the edit QuestionFormModal (z-50) appears above */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div
          className={`w-full bg-white rounded-3xl shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-300 ${
            phase === 'review' ? 'max-w-4xl max-h-[90vh]' : 'max-w-lg'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {phase === 'upload' ? 'Import Questions (CSV)' : 'Review Imported Questions'}
              </h2>
              {phase === 'review' && importResult && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {importResult.created > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{importResult.created} created</span>
                  )}
                  {importResult.created === 0 && skippedCount > 0 && (
                    <span className="font-bold text-slate-500 dark:text-slate-400">0 created</span>
                  )}
                  {skippedCount > 0 && (
                    <span className="text-amber-500 font-bold"> - {skippedCount} already existed</span>
                  )}
                  {importResult.failed > 0 && (
                    <span className="text-red-500 font-bold"> - {importResult.failed} could not be imported</span>
                  )}
                  {unresolvedRows.length > 0 && (
                    <span className="text-amber-500 font-bold"> · {unresolvedRows.length} need attention</span>
                  )}
                  {' '}— review each question before submitting for approval
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <X size={20} />
            </button>
          </div>

          {/* ── UPLOAD PHASE ────────────────────────────────────────────── */}
          {phase === 'upload' && (
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-all ${
                  dragOver
                    ? 'border-[#0A9AE2] bg-blue-50 dark:bg-blue-500/10'
                    : selectedFile
                    ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-500/10'
                    : 'border-slate-200 bg-slate-50 hover:border-[#0A9AE2] hover:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-[#0A9AE2] dark:hover:bg-blue-500/10'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                />
                {selectedFile ? (
                  <>
                    <FileText className="text-emerald-500" size={40} />
                    <div className="text-center">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{selectedFile.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {(selectedFile.size / 1024).toFixed(1)} KB — Click to change
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="text-slate-400" size={40} />
                    <div className="text-center">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        Drop your .csv file here
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        or click to browse — max 500 questions
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Upload error banner */}
              {importError && (
                <div className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400">
                  <XCircle size={16} className="shrink-0" />
                  {importError}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2 pb-8 sm:pb-0">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 py-3.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={!selectedFile || isLoading}
                  className="flex-1 py-3.5 px-4 bg-[#0A9AE2] text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-[#0864B6] disabled:bg-slate-300 transition-all flex items-center justify-center gap-2 dark:shadow-none"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                    <><Upload size={18} /> Import</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── REVIEW PHASE ─────────────────────────────────────────────── */}
          {phase === 'review' && (
            <div className="flex flex-col flex-1 min-h-0">

              {/* Inline create subject/topic form */}
              {createForm && (
                <div className="mx-6 mt-4 rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 p-4 shrink-0">
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-3">
                    {createForm.type === 'subject'
                      ? `Create new Subject`
                      : `Create new Topic in "${createForm.sectionName}"`
                    }
                  </p>
                  {createForm.type === 'subject' ? (
                    <div className="grid gap-3 w-full">
                      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px_auto] gap-2 items-center">
                        <input
                          type="text"
                          value={createFormName}
                          onChange={(e) => setCreateFormName(e.target.value)}
                          placeholder="Subject name"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-amber-200 dark:border-amber-500/30 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                        <input
                          type="text"
                          value={createFormQuestionCode}
                          onChange={(e) => setCreateFormQuestionCode(e.target.value)}
                          placeholder="Code e.g. MATH"
                          maxLength={10}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-amber-200 dark:border-amber-500/30 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleCreateFormSubmit}
                          disabled={isCreating || !createFormName.trim() || !createFormQuestionCode.trim()}
                          className="w-full lg:w-auto px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shrink-0"
                        >
                          {isCreating ? <Loader2 className="animate-spin" size={14} /> : <PlusCircle size={14} />}
                          Create
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                          Question code will be used as prefix for auto-generated question IDs (e.g. Q-MATH-001). Max 10 uppercase characters.
                        </p>
                        <button
                          type="button"
                          onClick={() => { setCreateForm(null); setCreateError(null); setCreateFormQuestionCode(''); }}
                          disabled={isCreating}
                          className="self-start sm:self-auto px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl transition-colors shrink-0"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 w-full">
                      <input
                        type="text"
                        value={createFormName}
                        onChange={(e) => setCreateFormName(e.target.value)}
                        placeholder="Topic name"
                        className="flex-1 px-3 py-2 text-sm rounded-xl border border-amber-200 dark:border-amber-500/30 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                      <button
                        type="button"
                        onClick={handleCreateFormSubmit}
                        disabled={isCreating || !createFormName.trim()}
                        className="px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
                      >
                        {isCreating ? <Loader2 className="animate-spin" size={14} /> : <PlusCircle size={14} />}
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => { setCreateForm(null); setCreateError(null); setCreateFormQuestionCode(''); }}
                        disabled={isCreating}
                        className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl transition-colors shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {createError && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">{createError}</p>
                  )}
                </div>
              )}

              {/* Rows skipped because they already exist */}
              {skippedErrors.length > 0 && !allSkippedRowsAlreadyExist && (
                <div className="mx-6 mt-4 space-y-2 shrink-0 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                        {allSkippedRowsAlreadyExist
                          ? 'All questions already exist in the question bank'
                          : `${skippedCount} row${skippedCount !== 1 ? 's' : ''} were skipped`}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                        {allSkippedRowsAlreadyExist
                          ? `All ${skippedCount} row${skippedCount !== 1 ? 's' : ''} match questions that already exist, so no new questions were added.`
                          : 'Some rows match questions that already exist, so they were not added again.'}
                      </p>
                    </div>
                  </div>
                  <div className="max-h-20 overflow-y-auto space-y-1">
                    {skippedErrors.slice(0, 10).map((err, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg bg-white/70 px-3 py-1.5 dark:bg-slate-900/40">
                        <CheckCircle2 className="mt-0.5 shrink-0 text-amber-500" size={12} />
                        <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                          <span className="font-bold">Row {err.row}:</span> {err.reason}
                        </p>
                      </div>
                    ))}
                    {skippedErrors.length > 10 && (
                      <p className="px-3 text-xs font-bold text-amber-700 dark:text-amber-400">
                        +{skippedErrors.length - 10} more row{skippedErrors.length - 10 !== 1 ? 's' : ''} already exist
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Import errors (hard validation failures) */}
              {importResult && importResult.errors.length > 0 && (
                <div className="mx-6 mt-4 space-y-1 shrink-0">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-amber-500" />
                    {importResult.failed} row{importResult.failed !== 1 ? 's' : ''} could not be imported
                  </p>
                  <div className="max-h-20 overflow-y-auto space-y-1">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-1.5">
                        <XCircle className="text-red-500 shrink-0 mt-0.5" size={12} />
                        <p className="text-xs font-medium text-red-700 dark:text-red-400">
                          <span className="font-bold">Row {err.row}:</span> {err.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit-all action bar */}
              {totalRows > 0 && (
                <div className="flex flex-col gap-3 px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0 sm:flex-row sm:items-center sm:justify-between">
                  {allSubmitted ? (
                    <span className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={18} />
                      All questions submitted for review!
                    </span>
                  ) : (
                    <div className="flex min-w-0 flex-col gap-0.5">
                      {pendingCount > 0 && (
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                          {pendingCount} <span className="text-slate-400 font-medium">pending submission</span>
                        </span>
                      )}
                      {imageIssueCount > 0 && (
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          {imageIssueCount} question{imageIssueCount !== 1 ? 's' : ''} need image upload
                        </span>
                      )}
                      {unresolvedRows.length > 0 && (
                        <span className="text-xs font-bold text-red-500 dark:text-red-400">
                          {unresolvedRows.length} row{unresolvedRows.length !== 1 ? 's' : ''} need Section/Topic to be created
                        </span>
                      )}
                      {createError && !createForm && (
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">
                          {createError}
                        </span>
                      )}
                    </div>
                  )}
                  {!allSubmitted && (
                    <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                      {canCreateSubjectOrTopic && missingTopicCount > 0 && (
                        <button
                          type="button"
                          onClick={handleCreateAllMissingTopics}
                          disabled={isCreatingAllTopics || isCreating}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-all shadow-sm"
                        >
                          {isCreatingAllTopics
                            ? <Loader2 className="animate-spin" size={15} />
                            : <PlusCircle size={15} />
                          }
                          Create All Topics ({missingTopicCount})
                        </button>
                      )}
                      {pendingCount > 0 && (
                        <button
                          type="button"
                          onClick={handleSubmitAll}
                          disabled={isSubmittingAll || unresolvedRows.length > 0 || imageIssueCount > 0}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A9AE2] text-white text-sm font-bold rounded-xl hover:bg-[#0864B6] disabled:opacity-50 transition-all shadow-sm"
                        >
                          {isSubmittingAll
                            ? <Loader2 className="animate-spin" size={15} />
                            : <Send size={15} />
                          }
                          Submit All to Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* All-failed empty state */}
              {importResult && hasNoRowsToReview && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 px-6">
                  {allSkippedRowsAlreadyExist ? (
                    <CheckCircle2 className="text-amber-500" size={48} />
                  ) : (
                    <XCircle className="text-red-400" size={48} />
                  )}
                  <p className="font-bold text-slate-700 dark:text-slate-300 text-center">
                    {allSkippedRowsAlreadyExist ? 'No new questions were imported' : 'No questions were imported'}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
                    {allSkippedRowsAlreadyExist
                      ? `All ${skippedCount} question${skippedCount !== 1 ? 's' : ''} from this CSV are already in the question bank, so the system did not add duplicates.`
                      : `All ${importResult.total} row${importResult.total !== 1 ? 's' : ''} could not be imported. Check the messages above, fix your file, and try again.`}
                  </p>
                </div>
              )}

              {/* Review table */}
              {totalRows > 0 && (
                <div className="overflow-auto flex-1 min-h-0">
                  <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                      <button
                        type="button"
                        onClick={() => setReviewTableView('attention')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          reviewTableView === 'attention'
                            ? 'bg-white text-amber-600 shadow-sm dark:bg-slate-700 dark:text-amber-400'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      >
                        Needs attention ({attentionReviewItems.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewTableView('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          reviewTableView === 'all'
                            ? 'bg-white text-[#0A9AE2] shadow-sm dark:bg-slate-700 dark:text-sky-400'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      >
                        All questions ({orderedReviewItems.length})
                      </button>
                    </div>
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      {reviewTableView === 'attention'
                        ? 'Showing only rows that need action'
                        : 'Showing every imported row'
                      }
                    </p>
                  </div>
                  {displayedReviewItems.length === 0 && reviewTableView === 'attention' ? (
                    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                      <CheckCircle2 className="text-emerald-500 mb-3" size={40} />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        No questions need attention
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        Switch to All questions to review the imported questions.
                      </p>
                    </div>
                  ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide w-8">#</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Question</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Type</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Difficulty</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Marking</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {displayedReviewItems.map((item, idx) => {
                        if (item.kind === 'question') {
                          const q = item.question;
                          const isSubmitted      = submittedIds.has(q.id);
                          const isThisSubmitting = submittingId === q.id;
                          const isUploadingImage = uploadingImageId === q.id;
                          const hasImageIssue    = needsImageUpload(q);
                          const pendingImageRefs = getPendingImageRefs(q);
                          const uploadedImageCount = getQuestionImageRefs(q).length - pendingImageRefs.length;
                          const nextExpectedImageName = getNextExpectedImageName(q);

                          return (
                            <tr
                              key={q.id}
                              className={`transition-colors ${
                                isSubmitted
                                  ? 'bg-emerald-50/40 dark:bg-emerald-500/5'
                                  : hasImageIssue
                                  ? 'bg-amber-50/40 dark:bg-amber-500/5'
                                  : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                              }`}
                            >
                              <td className="px-4 py-4 text-xs font-bold text-slate-400 align-top">{idx + 1}</td>

                              <td className="px-4 py-4 max-w-xs align-top">
                                <div className="flex items-start gap-1.5">
                                  <p className={`font-semibold text-sm line-clamp-2 leading-relaxed ${
                                    isSubmitted
                                      ? 'text-slate-400 dark:text-slate-500'
                                      : 'text-slate-800 dark:text-slate-200'
                                  }`}>
                                    {q.questionText}
                                  </p>
                                  {q.latexEnabled && (
                                    <span className="shrink-0 inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
                                      LaTeX
                                    </span>
                                  )}
                                </div>
                                {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                                  <div className="mt-1 space-y-0.5">
                                    {q.options.slice(0, 3).map((opt) => (
                                      <p key={opt.key} className={`text-xs font-mono truncate max-w-[260px] ${
                                        q.correctAnswer === opt.key
                                          ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                          : 'text-slate-400 dark:text-slate-500'
                                      }`}>
                                        {opt.key}: {opt.text}
                                      </p>
                                    ))}
                                    {q.options.length > 3 && (
                                      <p className="text-xs text-slate-400 dark:text-slate-500">+{q.options.length - 3} more</p>
                                    )}
                                  </div>
                                )}
                                {q.subtopics && q.subtopics.length > 0 && (
                                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[260px]">
                                    {q.subtopics.join(' · ')}
                                  </p>
                                )}
                                {hasImageIssue && (
                                  <div className="mt-1.5 flex flex-col gap-0.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-xs font-bold w-fit">
                                      <ImageIcon size={10} />
                                      {pendingImageRefs.length} Image{pendingImageRefs.length !== 1 ? 's' : ''} Required
                                    </span>
                                    {pendingImageRefs.length > 0 && (
                                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono truncate max-w-[240px]" title={pendingImageRefs.join(', ')}>
                                        {uploadedImageCount > 0 ? `${uploadedImageCount} uploaded · ` : ''}
                                        Next: {nextExpectedImageName ?? 'Upload image'}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>

                              <td className="px-4 py-4 align-top">
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                                  q.type === 'MCQ'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                                }`}>
                                  {q.type}
                                </span>
                              </td>

                              <td className="px-4 py-4 align-top">
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${DIFFICULTY_BADGE[q.difficulty]}`}>
                                  {q.difficulty}
                                </span>
                              </td>

                              <td className="px-4 py-4 align-top">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                    {q.markingType === 'AUTO' ? 'Auto' : 'AI Rubric'} · {q.maxMarks} mark{q.maxMarks !== 1 ? 's' : ''}
                                  </span>
                                  {q.type === 'ESSAY' && q.aiRubricId && (
                                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                      {q.aiRubric?.name ?? q.aiRubricId} ({q.aiRubricId})
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="px-4 py-4 text-right align-top">
                                {isSubmitted ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    <CheckCheck size={14} />
                                    Submitted
                                  </span>
                                ) : (
                                  <div className="flex items-center justify-end gap-1">
                                    {isThisSubmitting || isSubmittingAll || isUploadingImage ? (
                                      <Loader2 className="animate-spin text-[#0A9AE2]" size={18} />
                                    ) : (
                                      <>
                                        {/* Image upload button */}
                                        {hasImageIssue && (
                                          <>
                                            <input
                                              ref={(el) => { imageInputRefs.current[q.id] = el; }}
                                              type="file"
                                              multiple
                                              accept="image/jpeg,image/png,image/webp,image/gif"
                                              className="hidden"
                                              onChange={(e) => handleImageUpload(q.id, e.target.files)}
                                            />
                                            <button
                                              type="button"
                                              title={nextExpectedImageName ? `Upload: ${nextExpectedImageName}` : 'Upload next image for this question'}
                                              onClick={() => imageInputRefs.current[q.id]?.click()}
                                              className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-all"
                                            >
                                              <ImageIcon size={15} />
                                            </button>
                                          </>
                                        )}
                                        <button
                                          type="button"
                                          title="Edit question"
                                          onClick={() => { setEditQuestion(q); setIsEditOpen(true); }}
                                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all"
                                        >
                                          <Edit2 size={15} />
                                        </button>
                                        <button
                                          type="button"
                                          title={hasImageIssue ? 'Upload an image before submitting' : 'Submit for review'}
                                          onClick={() => !hasImageIssue && handleSubmitOne(q.id)}
                                          disabled={hasImageIssue}
                                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                          <Send size={15} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        }

                        const ur = item.unresolved;

                        return (
                          <tr
                            key={`unresolved-${ur.rowNumber}`}
                            className="bg-red-50/30 dark:bg-red-500/5"
                          >
                            <td className="px-4 py-4 text-xs font-bold text-slate-400 align-top">
                              {idx + 1}
                            </td>

                            <td className="px-4 py-4 max-w-xs align-top">
                              <p className="font-semibold text-sm line-clamp-2 leading-relaxed text-slate-700 dark:text-slate-300">
                                {ur.rowData.questionText}
                              </p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 text-xs font-bold">
                                  <XCircle size={10} />
                                  {ur.reason === 'SUBJECT_NOT_FOUND'
                                    ? `Section "${ur.sectionName}" not found`
                                    : `Topic "${ur.topicName}" not found`
                                  }
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                Row {ur.rowNumber} · {ur.sectionName} / {ur.topicName}
                              </p>
                            </td>

                            <td className="px-4 py-4 align-top">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                                ur.rowData.type === 'MCQ'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                  : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                              }`}>
                                {ur.rowData.type}
                              </span>
                            </td>

                            <td className="px-4 py-4 align-top">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${DIFFICULTY_BADGE[ur.rowData.difficulty] ?? ''}`}>
                                {ur.rowData.difficulty}
                              </span>
                            </td>

                            <td className="px-4 py-4 align-top">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                  {ur.rowData.markingType === 'AUTO' ? 'Auto' : 'AI Rubric'} · {ur.rowData.maxMarks} mark{ur.rowData.maxMarks !== 1 ? 's' : ''}
                                </span>
                                {ur.rowData.type === 'ESSAY' && ur.rowData.aiRubricId && (
                                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                    {ur.rowData.aiRubricId}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-4 text-right align-top">
                              {canCreateSubjectOrTopic ? (
                                <div className="flex flex-col items-end gap-1.5">
                                  {isCreating && createForm && (createForm.sectionName === ur.sectionName) ? (
                                    <Loader2 className="animate-spin text-amber-500" size={16} />
                                  ) : ur.reason === 'SUBJECT_NOT_FOUND' ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCreateSubject(ur.sectionName)}
                                      disabled={isCreatingAllTopics}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 disabled:opacity-50 dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30 rounded-lg transition-colors"
                                    >
                                      <PlusCircle size={11} />
                                      Create Subject
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCreateTopic(ur.sectionName, ur.topicName)}
                                      disabled={isCreatingAllTopics}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 disabled:opacity-50 dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30 rounded-lg transition-colors"
                                    >
                                      <PlusCircle size={11} />
                                      Create Topic
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                                  Ask staff to create
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Edit modal — z-50 so it appears above the import modal (z-[60]) */}
      <QuestionFormModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditQuestion(null); }}
        onSubmit={handleEditSubmit}
        initialData={editQuestion}
        isLoading={false}
      />
    </>
  );
}

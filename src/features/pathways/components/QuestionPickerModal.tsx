'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { isAxiosError } from 'axios';
import { X, Search, Check, Loader2, Target } from 'lucide-react';
import { questionsService } from '@/features/questions/services/questions.service';
import { subjectsService } from '@/features/subjects/services/subjects.service';
import { pathwaysService } from '../services/pathways.service';
import { showClientErrorAlert } from '@/lib/errorAlert';
import { QuestionLatexRenderer } from '@/components/ui/QuestionLatexRenderer';
import type { Question, McqOption } from '@/features/questions/types/questions.types';
import type { Topic } from '@/features/subjects/types/subjects.types';
import type { NodeQuestionItem } from '../types/pathways.types';

interface SelectedQuestion {
  id: string;
  questionText: string;
  topicName: string;
  latexEnabled: boolean;
  /** Was this question already saved to the node before the modal opened? */
  existing: boolean;
}

interface QuestionPickerModalProps {
  isOpen: boolean;
  nodeId: string;
  subjectId: string;
  /** The node's own topic — used as the default browser filter. */
  topicId: string;
  topicName: string;
  /** Context labels for the modal header, e.g. "Mathematics · Node 3 — Geometry". */
  subjectName: string;
  nodeLabel?: string;
  thresholdCorrect: number;
  onClose: () => void;
  /** Reports the new saved count so the parent can update node.questionCount. */
  onSaved: (questionCount: number) => void;
}

function truncate(text: string, max = 120): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export function QuestionPickerModal({
  isOpen,
  nodeId,
  subjectId,
  topicId,
  topicName,
  subjectName,
  nodeLabel,
  thresholdCorrect,
  onClose,
  onSaved,
}: QuestionPickerModalProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeTopicId, setActiveTopicId] = useState(topicId);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  // Pagination for infinite scroll.
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selection state keyed by questionId so cross-topic picks survive filtering.
  const [selected, setSelected] = useState<Map<string, SelectedQuestion>>(new Map());
  // Snapshot of questionIds that were already in the node when the modal opened.
  const [initialExisting, setInitialExisting] = useState<Set<string>>(new Set());

  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasLoadedExisting = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  // ── Reset + load existing node questions on open ─────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      hasLoadedExisting.current = false;
      return;
    }
    if (hasLoadedExisting.current) return;
    hasLoadedExisting.current = true;

    setActiveTopicId(topicId);
    setSearchInput('');
    setDebouncedSearch('');
    setPreviewId(null);

    setIsLoadingExisting(true);
    pathwaysService
      .listNodeQuestions(nodeId)
      .then((res) => {
        if (res.success) {
          const existingMap = new Map<string, SelectedQuestion>();
          const existingIds = new Set<string>();
          res.data.forEach((nq: NodeQuestionItem) => {
            existingMap.set(nq.questionId, {
              id: nq.questionId,
              questionText: nq.question.questionText,
              topicName: nq.question.topic.name,
              latexEnabled: nq.question.latexEnabled,
              existing: true,
            });
            existingIds.add(nq.questionId);
          });
          setSelected(existingMap);
          setInitialExisting(existingIds);
        }
      })
      .catch(() => { /* mdwClient interceptor fires the toast */ })
      .finally(() => setIsLoadingExisting(false));
  }, [isOpen, nodeId, topicId]);

  // ── Load subject topics for the filter dropdown ──────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    subjectsService
      .listTopics(subjectId, { limit: 100 }, { feedbackContext: 'options' })
      .then((res) => {
        if (res.success) {
          setTopics(res.data);
        }
      })
      .catch(() => { /* handled by interceptor */ });
  }, [isOpen, subjectId]);

  // ── Debounce the search input (min 2 chars) ──────────────────────────────────
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      setDebouncedSearch(trimmed.length >= 2 ? trimmed : '');
    }, 350);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  // ── Fetch PUBLISHED questions for the active topic + search (page 1) ─────────
  const fetchFirstPage = useCallback(async () => {
    if (!isOpen || !activeTopicId) return;
    setIsLoadingQuestions(true);
    try {
      const res = await questionsService.list({
        topicId: activeTopicId,
        status: 'PUBLISHED',
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        page: 1,
        limit: 30,
      });
      if (res.success) {
        setQuestions(res.data);
        setPage(1);
        setTotalPages(res.meta?.totalPages ?? 1);
        // Reset scroll to the top when the filter/search changes.
        if (listRef.current) listRef.current.scrollTop = 0;
      }
    } catch {
      /* handled by interceptor */
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [isOpen, activeTopicId, debouncedSearch]);

  useEffect(() => {
    void fetchFirstPage();
  }, [fetchFirstPage]);

  // ── Load the next page (infinite scroll) ─────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (isLoadingQuestions || isLoadingMore || page >= totalPages || !activeTopicId) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const res = await questionsService.list({
        topicId: activeTopicId,
        status: 'PUBLISHED',
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        page: nextPage,
        limit: 30,
      });
      if (res.success) {
        // Append, de-duping in case of overlap.
        setQuestions((prev) => {
          const seen = new Set(prev.map((q) => q.id));
          return [...prev, ...res.data.filter((q) => !seen.has(q.id))];
        });
        setPage(nextPage);
        setTotalPages(res.meta?.totalPages ?? nextPage);
      }
    } catch {
      /* handled by interceptor */
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingQuestions, isLoadingMore, page, totalPages, activeTopicId, debouncedSearch]);

  // Trigger load-more when the user scrolls near the bottom of the list.
  const handleListScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
      void loadMore();
    }
  }, [loadMore]);

  const previewQuestion = useMemo(
    () => questions.find((q) => q.id === previewId) ?? null,
    [questions, previewId]
  );

  const toggleQuestion = (q: Question) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(q.id)) {
        next.delete(q.id);
      } else {
        next.set(q.id, {
          id: q.id,
          questionText: q.questionText,
          topicName: q.topicName,
          latexEnabled: q.latexEnabled,
          existing: initialExisting.has(q.id),
        });
      }
      return next;
    });
  };

  const deselect = (id: string) => {
    setSelected((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const selectedIds = new Set(selected.keys());

      // Newly added: selected now but not in the node before.
      const toAdd = Array.from(selectedIds).filter((id) => !initialExisting.has(id));
      // Removed: was in the node before but deselected now.
      const toRemove = Array.from(initialExisting).filter((id) => !selectedIds.has(id));

      if (toAdd.length > 0) {
        await pathwaysService.addNodeQuestions(nodeId, { questionIds: toAdd });
      }
      for (const questionId of toRemove) {
        await pathwaysService.removeNodeQuestion(nodeId, questionId);
      }

      onSaved(selectedIds.size);
      handleClose();
    } catch (err) {
      showClientErrorAlert(
        isAxiosError(err)
          ? err.response?.data?.message ?? 'Failed to save questions'
          : 'Failed to save questions',
        'Failed to save'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSelected(new Map());
    setInitialExisting(new Set());
    setQuestions([]);
    setPage(1);
    setTotalPages(1);
    onClose();
  };

  if (!isOpen) return null;

  const selectedList = Array.from(selected.values());
  // A node needs at least `thresholdCorrect` questions, otherwise the student
  // can never reach the pass threshold and the node can never be completed.
  // Empty (0) is allowed — that's the intentional "Waiting for questions" state.
  const belowThreshold = selectedList.length > 0 && selectedList.length < thresholdCorrect;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-black text-slate-900 dark:text-white">Add Questions</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {subjectName}
              {nodeLabel ? ` · ${nodeLabel}` : ` · ${topicName}`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body: two panels */}
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          {/* Left panel — browser */}
          <div className="flex min-h-0 flex-col border-b border-slate-100 dark:border-slate-800 sm:w-[58%] sm:border-b-0 sm:border-r">
            {/* Search + topic filter */}
            <div className="space-y-2.5 border-b border-slate-100 p-4 dark:border-slate-800">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search questions…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Topic:</span>
                <select
                  value={activeTopicId}
                  onChange={(e) => setActiveTopicId(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {!topics.some((t) => t.id === topicId) && (
                    <option value={topicId}>{topicName} (current)</option>
                  )}
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id === topicId ? `${t.name} (current)` : t.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Clarify the save target — questions land on this node, not the
                  browsed topic. Prevents the "wrong topic" confusion. */}
              <p className="text-xs text-slate-400">
                Browsing questions to add to the{' '}
                <span className="font-bold text-slate-500 dark:text-slate-300">{topicName}</span> node
              </p>
            </div>

            {/* Question list */}
            <div
              ref={listRef}
              onScroll={handleListScroll}
              className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3"
            >
              {isLoadingQuestions || isLoadingExisting ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
                  <Loader2 size={16} className="animate-spin" />
                  Loading questions…
                </div>
              ) : questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                  <p className="text-sm font-bold">No published questions</p>
                  <p className="mt-1 text-xs">
                    {debouncedSearch
                      ? 'Try a different search or topic.'
                      : 'This topic has no published questions yet.'}
                  </p>
                </div>
              ) : (
                questions.map((q) => {
                  const isSelected = selected.has(q.id);
                  // Items already in the node are locked in the browser list —
                  // they show as checked + disabled and are removed via the
                  // right-panel X (which queues a DELETE on save).
                  const isExistingLocked = isSelected && initialExisting.has(q.id);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setPreviewId(q.id);
                        if (!isExistingLocked) toggleQuestion(q);
                      }}
                      className={[
                        'flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all',
                        isExistingLocked
                          ? 'cursor-default border-transparent opacity-50'
                          : isSelected
                            ? 'border-blue-300 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-500/10'
                            : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2',
                          isSelected
                            ? 'border-[#0A9AE2] bg-[#0A9AE2] text-white'
                            : 'border-slate-300 dark:border-slate-600',
                        ].join(' ')}
                      >
                        {isSelected && <Check size={11} strokeWidth={3.5} />}
                      </span>
                      <span className="flex-1">
                        <span
                          className={[
                            'block text-sm font-semibold leading-snug',
                            isSelected ? 'text-[#0A9AE2]' : 'text-slate-700 dark:text-slate-200',
                          ].join(' ')}
                        >
                          <QuestionLatexRenderer
                            text={truncate(q.questionText)}
                            latexEnabled={q.latexEnabled}
                          />
                        </span>
                        <span className="mt-1 block text-xs text-slate-400">
                          {q.topicName} · {isExistingLocked ? 'Already in node' : 'Published'}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}

              {/* Infinite-scroll loader / end indicator */}
              {isLoadingMore && (
                <div className="flex items-center justify-center gap-2 py-3 text-xs text-slate-400">
                  <Loader2 size={14} className="animate-spin" />
                  Loading more…
                </div>
              )}
            </div>

            {/* Preview pane */}
            {previewQuestion && (
              <div className="border-t border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">
                  Preview
                </p>
                <p className="mb-2.5 text-sm font-bold text-slate-800 dark:text-slate-200">
                  <QuestionLatexRenderer
                    text={previewQuestion.questionText}
                    latexEnabled={previewQuestion.latexEnabled}
                  />
                </p>
                {previewQuestion.options && previewQuestion.options.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {previewQuestion.options.map((opt: McqOption) => {
                      const isCorrect = previewQuestion.correctAnswer === opt.key;
                      return (
                        <div
                          key={opt.key}
                          className={[
                            'rounded-xl border px-3 py-1.5 text-xs font-semibold',
                            isCorrect
                              ? 'border-emerald-300 bg-emerald-50 font-bold text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
                              : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                          ].join(' ')}
                        >
                          {opt.key}){' '}
                          <QuestionLatexRenderer
                            text={opt.text}
                            latexEnabled={previewQuestion.latexEnabled}
                          />{' '}
                          {isCorrect ? '✓' : ''}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs italic text-slate-400">
                    No multiple-choice options to preview.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right panel — selected */}
          <div className="flex min-h-0 flex-col sm:w-[42%]">
            <div className="border-b border-slate-100 p-4 dark:border-slate-800">
              <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                Selected{' '}
                <span className="font-normal text-slate-400">
                  ({selectedList.length} question{selectedList.length !== 1 ? 's' : ''})
                </span>
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                <Target size={11} />
                Threshold: {thresholdCorrect} correct
              </p>
              {belowThreshold && (
                <p className="mt-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  Add at least {thresholdCorrect} question{thresholdCorrect !== 1 ? 's' : ''} so the
                  student can reach the pass threshold.
                </p>
              )}
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {selectedList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                  <p className="text-sm font-bold">No questions selected</p>
                  <p className="mt-1 text-xs">Pick questions from the left to add them here.</p>
                </div>
              ) : (
                selectedList.map((sq, idx) => (
                  <div
                    key={sq.id}
                    className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/60"
                  >
                    <span className="mt-0.5 w-4 flex-shrink-0 text-xs font-black text-slate-400">
                      {idx + 1}
                    </span>
                    <p className="flex-1 text-xs font-semibold leading-snug text-slate-700 dark:text-slate-200">
                      <QuestionLatexRenderer
                        text={truncate(sq.questionText, 90)}
                        latexEnabled={sq.latexEnabled}
                      />
                    </p>
                    <button
                      type="button"
                      onClick={() => deselect(sq.id)}
                      className="flex-shrink-0 text-slate-300 transition-colors hover:text-red-400"
                      aria-label="Remove question"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || belowThreshold}
            title={
              belowThreshold
                ? `Select at least ${thresholdCorrect} questions (the pass threshold) or remove all to leave the node empty.`
                : undefined
            }
            className="flex items-center gap-2 rounded-xl bg-[#0A9AE2] px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-[#0659AA] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : null}
            {isSaving ? 'Saving…' : 'Save Questions'}
          </button>
        </div>
      </div>
    </div>
  );
}

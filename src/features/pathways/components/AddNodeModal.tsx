'use client';

import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import { X, Loader2, Tag } from 'lucide-react';
import { subjectsService } from '@/features/subjects/services/subjects.service';
import { pathwaysService } from '../services/pathways.service';
import type { Topic } from '@/features/subjects/types/subjects.types';
import type { PathwayNodeItem } from '../types/pathways.types';

interface AddNodeModalProps {
  isOpen: boolean;
  pathwayId: string;
  subjectId: string;
  existingTopicIds: string[];
  onClose: () => void;
  onAdded: (node: PathwayNodeItem) => void;
  /** Optional: launch the question picker for the freshly-created node. */
  onAddQuestions?: (node: PathwayNodeItem) => void;
}

export function AddNodeModal({
  isOpen,
  pathwayId,
  subjectId,
  existingTopicIds,
  onClose,
  onAdded,
  onAddQuestions,
}: AddNodeModalProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // After a successful add we offer to jump straight into the question picker.
  const [createdNode, setCreatedNode] = useState<PathwayNodeItem | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsFetching(true);
    subjectsService
      .listTopics(subjectId, { limit: 100 }, { feedbackContext: 'options' })
      .then((res) => {
        if (res.success) {
          // Filter out topics already in the pathway.
          setTopics(res.data.filter((t) => !existingTopicIds.includes(t.id)));
        }
      })
      .catch(() => { /* mdwClient interceptor fires the toast */ })
      .finally(() => setIsFetching(false));
  }, [isOpen, subjectId, existingTopicIds]);

  const handleSubmit = async () => {
    if (!selectedTopicId) {
      setError('Please select a topic');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await pathwaysService.addNode(pathwayId, { topicId: selectedTopicId });
      if (res.success) {
        onAdded(res.data);
        // Offer the follow-up question picker instead of closing immediately.
        if (onAddQuestions) {
          setCreatedNode(res.data);
        } else {
          handleClose();
        }
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.message ?? 'Failed to add topic'
          : 'Failed to add topic'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedTopicId('');
    setError(null);
    setCreatedNode(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0A9AE2]/10 flex items-center justify-center">
              <Tag size={20} className="text-[#0A9AE2]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Add Topic</h2>
              <p className="text-xs text-slate-400">Add a new node to this pathway</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {createdNode ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  Topic added: {createdNode.topic.name}
                </p>
                <p className="mt-0.5 text-xs text-emerald-600/80 dark:text-emerald-400/80">
                  Add questions to this node so the student can start practising.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Later
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const node = createdNode;
                    setCreatedNode(null);
                    setSelectedTopicId('');
                    onAddQuestions?.(node);
                    onClose();
                  }}
                  className="flex-1 rounded-xl bg-[#0A9AE2] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0659AA]"
                >
                  Add Questions Now
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Topic
                </label>
                {isFetching ? (
                  <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                    <Loader2 size={14} className="animate-spin" />
                    Loading topics…
                  </div>
                ) : topics.length === 0 ? (
                  <p className="text-sm text-slate-400 py-2">
                    All topics from this subject are already in the pathway.
                  </p>
                ) : (
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-[#0A9AE2] focus:outline-none focus:ring-2 focus:ring-[#0A9AE2]/20 transition-all"
                  >
                    <option value="">Select topic…</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {error && (
                <p className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || isFetching || topics.length === 0}
                  className="flex-1 py-2.5 rounded-xl bg-[#0A9AE2] hover:bg-[#0659AA] text-white text-sm font-bold disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                  {isLoading ? 'Adding…' : 'Add Topic'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

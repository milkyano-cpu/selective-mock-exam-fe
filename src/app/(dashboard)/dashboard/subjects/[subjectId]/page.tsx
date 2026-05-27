'use client';

import { useState, useEffect } from 'react';
import { useTopics } from '@/features/subjects/hooks/useTopics';
import { Topic } from '@/features/subjects/types/subjects.types';
import { TopicModal } from '@/features/subjects/components/TopicModal';
import { DeleteConfirmModal } from '@/features/subjects/components/DeleteConfirmModal';
import { Plus, Edit2, Trash2, ArrowLeft, Layers, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

export default function TopicsPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const resolvedParams = use(params);
  const subjectId = resolvedParams.subjectId;
  const { topics, meta, isLoading, fetchTopics, createTopic, updateTopic, deleteTopic } = useTopics();
  
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchTopics(subjectId, { page, limit: 10, search });
  }, [fetchTopics, subjectId, page, search]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCreate = () => {
    setSelectedTopic(null);
    setIsTopicModalOpen(true);
  };

  const handleEdit = (topic: Topic) => {
    setSelectedTopic(topic);
    setIsTopicModalOpen(true);
  };

  const handleDelete = (topic: Topic) => {
    setSelectedTopic(topic);
    setIsDeleteModalOpen(true);
  };

  const onSubmitTopic = async (data: { name: string; description?: string | null }) => {
    let success = false;
    if (selectedTopic) {
      success = await updateTopic(subjectId, selectedTopic.id, data);
    } else {
      success = await createTopic(subjectId, data);
    }

    if (success) {
      setIsTopicModalOpen(false);
      fetchTopics(subjectId, { page, limit: 10, search });
    }
  };

  const onConfirmDelete = async () => {
    if (!selectedTopic) return;
    const success = await deleteTopic(subjectId, selectedTopic.id);
    setIsDeleteModalOpen(false);
    if (success) {
      fetchTopics(subjectId, { page, limit: 10, search });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      <Link
        href="/dashboard/subjects"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-[#0A9AE2] transition-all hover:translate-x-[-4px] dark:text-slate-400"
      >
        <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
        Back to Subjects
      </Link>

      <header className="flex flex-col gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Manage Topics <span className="text-[#0A9AE2]">.</span>
            </h1>
            <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
              Manage modules within this subject.
            </p>
          </div>
          
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] px-4 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm font-bold text-white transition-all hover:bg-[#0864B6] shadow-lg shadow-blue-200 dark:shadow-none hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={16} className="sm:w-5 sm:h-5" />
            Create Topic
          </button>
        </div>
      </header>

      <div className="rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="p-4 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search topics..."
                value={search}
                onChange={handleSearch}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 sm:py-2.5 pl-10 sm:pl-11 pr-4 text-xs sm:text-sm font-medium outline-none transition-all focus:border-[#0A9AE2] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/50 text-slate-900 dark:bg-slate-800/50 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 sm:px-8 py-3 sm:py-5 font-bold">Topic Name</th>
                <th className="hidden md:table-cell px-8 py-5 font-bold">Description</th>
                <th className="hidden sm:table-cell px-8 py-5 font-bold text-center">Questions</th>
                <th className="px-4 sm:px-8 py-3 sm:py-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading && topics.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 sm:px-8 py-8 sm:py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-[#0A9AE2]" />
                      <span className="text-xs sm:text-sm font-medium text-slate-400">Loading topics...</span>
                    </div>
                  </td>
                </tr>
              ) : topics.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 sm:px-8 py-8 sm:py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Layers className="h-8 w-8 text-slate-200 dark:text-slate-800 sm:h-12 sm:w-12" />
                      <p className="text-xs sm:text-sm font-medium text-slate-500">No topics found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                topics.map((topic) => {
                  const hasRelatedQuestions = (topic._count?.questions ?? 0) > 0;
                  return (
                  <tr key={topic.id} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 sm:px-8 py-4 sm:py-5">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 text-[#0A9AE2] dark:bg-blue-500/10">
                          <Layers size={14} className="sm:w-[18px] sm:h-[18px]" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0A9AE2] transition-colors line-clamp-1">
                            {topic.name}
                          </span>
                          <span className="sm:hidden inline-flex items-center text-[10px] font-bold text-[#0A9AE2]">
                            {topic._count?.questions || 0} Questions
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-8 py-5 max-w-xs truncate font-medium text-slate-500 dark:text-slate-400">
                      {topic.description || <span className="text-slate-300 italic dark:text-slate-700">No description provided</span>}
                    </td>
                    <td className="hidden sm:table-cell px-8 py-5 text-center">
                      <span className="inline-flex items-center justify-center bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                        {topic._count?.questions || 0} Questions
                      </span>
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
                      <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                        <button
                          onClick={() => handleEdit(topic)}
                          className="p-1.5 sm:p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg sm:rounded-xl transition-all dark:hover:bg-emerald-500/10"
                          title="Edit Topic"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(topic)}
                          disabled={hasRelatedQuestions}
                          className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg sm:rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400 dark:hover:bg-red-500/10"
                          title={hasRelatedQuestions
                            ? "Cannot delete: this topic is used by one or more questions"
                            : "Delete Topic"}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="p-4 sm:p-8 flex items-center justify-between border-t border-slate-100 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-900/30">
            <p className="text-[10px] sm:text-sm font-bold text-slate-500">
              <span className="hidden sm:inline">Page </span><span className="text-slate-900 dark:text-white">{meta.page}</span> of <span className="text-slate-900 dark:text-white">{meta.totalPages}</span>
            </p>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="rounded-xl px-3 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-all dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 shadow-sm"
              >
                Prev
              </button>
              <button
                disabled={page === meta.totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-xl px-3 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-all dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <TopicModal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        onSubmit={onSubmitTopic}
        initialData={selectedTopic}
        isLoading={isLoading}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={onConfirmDelete}
        title="Delete Topic"
        message={`Are you sure you want to delete "${selectedTopic?.name}"? This action cannot be undone.`}
        isLoading={isLoading}
      />
    </div>
  );
}

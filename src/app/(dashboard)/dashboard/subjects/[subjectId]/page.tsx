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
    if (selectedTopic) {
      const success = await deleteTopic(subjectId, selectedTopic.id);
      if (success) {
        setIsDeleteModalOpen(false);
        fetchTopics(subjectId, { page, limit: 10, search });
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link
        href="/dashboard/subjects"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0A9AE2] transition-colors dark:text-slate-400"
      >
        <ArrowLeft size={16} />
        Back to Subjects
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="text-[#0A9AE2]" size={24} />
            Topics
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Manage all topics within this subject
          </p>
        </div>
        
        <button
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] px-5 py-3 font-semibold text-white transition-all hover:bg-[#0864B6] shadow-lg shadow-blue-100 dark:shadow-none"
        >
          <Plus size={20} />
          Create Topic
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-6 dark:border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search topics..."
              value={search}
              onChange={handleSearch}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm font-medium outline-none transition-all focus:border-[#0A9AE2] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-bold rounded-tl-xl">Topic Name</th>
                <th className="px-6 py-4 font-bold">Description</th>
                <th className="px-6 py-4 font-bold text-center">Questions</th>
                <th className="px-6 py-4 font-bold text-right rounded-tr-xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && topics.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
                  </td>
                </tr>
              ) : topics.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center font-medium text-slate-500">
                    No topics found.
                  </td>
                </tr>
              ) : (
                topics.map((topic) => (
                  <tr key={topic.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors dark:border-slate-800 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                      {topic.name}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      {topic.description || <span className="text-slate-400 italic">No description</span>}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">
                      <span className="inline-flex items-center justify-center bg-blue-50 text-blue-600 px-3 py-1 rounded-full dark:bg-blue-500/10 dark:text-blue-400">
                        {topic._count?.questions || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(topic)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors dark:hover:bg-emerald-500/10"
                          title="Edit Topic"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(topic)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors dark:hover:bg-red-500/10"
                          title="Delete Topic"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-500">
              Showing page <span className="font-bold text-slate-900 dark:text-white">{meta.page}</span> of <span className="font-bold text-slate-900 dark:text-white">{meta.totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Previous
              </button>
              <button
                disabled={page === meta.totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
        message={`Are you sure you want to delete "${selectedTopic?.name}"? You must remove all associated questions first.`}
        isLoading={isLoading}
      />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useSubjects } from '@/features/subjects/hooks/useSubjects';
import { Subject } from '@/features/subjects/types/subjects.types';
import { SubjectModal } from '@/features/subjects/components/SubjectModal';
import { DeleteConfirmModal } from '@/features/subjects/components/DeleteConfirmModal';
import { Plus, Edit2, Trash2, BookOpen, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';

export default function SubjectsPage() {
  const { subjects, meta, isLoading, error, fetchSubjects, createSubject, updateSubject, deleteSubject, clearError } = useSubjects();
  
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchSubjects({ page, limit: 10, search });
  }, [fetchSubjects, page, search]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCreate = () => {
    clearError();
    setSelectedSubject(null);
    setIsSubjectModalOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    clearError();
    setSelectedSubject(subject);
    setIsSubjectModalOpen(true);
  };

  const handleDelete = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDeleteModalOpen(true);
  };

  const onSubmitSubject = async (data: { name: string; questionCode: string; description?: string | null }) => {
    let success = false;
    if (selectedSubject) {
      success = await updateSubject(selectedSubject.id, data);
    } else {
      success = await createSubject(data);
    }

    if (success) {
      setIsSubjectModalOpen(false);
      fetchSubjects({ page, limit: 10, search });
    }
  };

  const onConfirmDelete = async () => {
    if (!selectedSubject) return;
    const success = await deleteSubject(selectedSubject.id);
    setIsDeleteModalOpen(false);
    if (success) {
      fetchSubjects({ page, limit: 10, search });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Subjects <span className="text-[#0A9AE2]">.</span>
          </h1>
          <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
            Manage all educational subjects and topics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-100 transition-all hover:bg-[#0864B6] dark:shadow-none"
          >
            <Plus size={16} />
            Create Subject
          </button>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search subjects..."
                value={search}
                onChange={handleSearch}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm font-medium outline-none transition-all focus:border-[#0A9AE2] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Subject Name</th>
                <th className="hidden px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500 lg:table-cell">Code</th>
                <th className="hidden px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500 md:table-cell">Description</th>
                <th className="px-6 py-3 text-center text-xs font-black uppercase tracking-wide text-slate-500">Topics</th>
                <th className="px-6 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading && subjects.length === 0 ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4">
                      <div className="h-4 w-3/5 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </td>
                    <td className="hidden px-6 py-4 lg:table-cell">
                      <div className="h-4 w-2/5 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      <div className="h-4 w-3/4 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="mx-auto h-4 w-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="ml-auto h-4 w-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen className="text-slate-200 dark:text-slate-800" size={48} />
                      <p className="font-medium text-slate-500">No subjects found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                subjects.map((subject) => {
                  const hasRelatedQuestions = (subject._count?.questions ?? 0) > 0;
                  return (
                  <tr key={subject.id} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0A9AE2] dark:bg-blue-500/10">
                          <BookOpen size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0A9AE2] transition-colors truncate max-w-[100px] sm:max-w-none">
                            {subject.name}
                          </span>
                          <span className="lg:hidden text-[10px] font-bold text-slate-400">
                            Code: {subject.questionCode || '-'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 font-mono text-xs font-bold text-slate-500 dark:text-slate-400 lg:table-cell">
                      {subject.questionCode || '-'}
                    </td>
                    <td className="hidden max-w-xs truncate px-6 py-4 font-medium text-slate-500 dark:text-slate-400 md:table-cell">
                      {subject.description || <span className="text-slate-300 italic dark:text-slate-700">No description provided</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                        {subject._count?.topics || 0} <span className="hidden sm:inline ml-1">Topics</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/subjects/${subject.id}`}
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-[#0A9AE2]/10 hover:text-[#0A9AE2]"
                          title="View Topics"
                        >
                          <ChevronRight size={16} />
                        </Link>
                        <button
                          onClick={() => handleEdit(subject)}
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"
                          title="Edit Subject"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(subject)}
                          disabled={hasRelatedQuestions}
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400 dark:hover:bg-red-500/10"
                          title={hasRelatedQuestions
                            ? "Cannot delete: this subject is used by one or more questions"
                            : "Delete Subject"}
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
          <div className="p-6 md:p-8 flex items-center justify-between border-t border-slate-100 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-900/30">
            <p className="text-sm font-medium text-slate-500">
              Showing page <span className="font-bold text-slate-900 dark:text-white">{meta.page}</span> of <span className="font-bold text-slate-900 dark:text-white">{meta.totalPages}</span>
            </p>
            <div className="flex items-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-all dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
              >
                Previous
              </button>
              <button
                disabled={page === meta.totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-all dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => { clearError(); setIsSubjectModalOpen(false); }}
        onSubmit={onSubmitSubject}
        initialData={selectedSubject}
        isLoading={isLoading}
        apiError={error}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={onConfirmDelete}
        title="Delete Subject"
        message={
          (selectedSubject?._count?.topics ?? 0) > 0
            ? `Are you sure you want to delete "${selectedSubject?.name}"? All topics inside must be deleted first.`
            : `Are you sure you want to delete "${selectedSubject?.name}"? This action cannot be undone.`
        }
        isLoading={isLoading}
      />
    </div>
  );
}

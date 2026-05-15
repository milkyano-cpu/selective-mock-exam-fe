'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Edit2,
  FileText,
  Filter,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { usePassages } from '@/features/passages/hooks/usePassages';
import { PassageModal, type PassageFormValues } from '@/features/passages/components/PassageModal';
import { ImportPassageModal } from '@/features/passages/components/ImportPassageModal';
import { DeleteConfirmModal } from '@/features/subjects/components/DeleteConfirmModal';
import { passagesService } from '@/features/passages/services/passages.service';
import type { CreatePassagePayload, PassageDetail, PassageListItem, ImportPassagesResult, UpdatePassagePayload } from '@/features/passages/types/passages.types';

export default function PassagesPage() {
  const router = useRouter();
  const {
    passages,
    meta,
    isLoading,
    actionLoading,
    error,
    fetchPassages,
    createPassage,
    updatePassage,
    deletePassage,
  } = usePassages();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPassage, setSelectedPassage] = useState<PassageDetail | PassageListItem | null>(null);

  const load = useCallback(() => {
    fetchPassages({ page, limit: 10, search: search || undefined });
  }, [fetchPassages, page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCreate = () => {
    setSelectedPassage(null);
    setIsModalOpen(true);
  };

  const handleEdit = (passage: PassageListItem) => {
    setSelectedPassage(passage);
    setIsModalOpen(true);
  };

  const handleDelete = (passage: PassageListItem) => {
    setSelectedPassage(passage);
    setIsDeleteOpen(true);
  };

  const handleImportCsv = async (file: File): Promise<ImportPassagesResult | null> => {
    try {
      const res = await passagesService.importCsv(file);
      if (res.success) {
        load();
        return res.data;
      }
      return null;
    } catch {
      return null;
    }
  };

  const onSubmit = async (payload: PassageFormValues) => {
    const isImageType = payload.passageType === 'IMAGE' || payload.passageType === 'TEXT_IMAGE';
    const isTextType = payload.passageType === 'TEXT' || payload.passageType === 'TEXT_IMAGE';
    const validPositions = ['ABOVE', 'MIDDLE', 'BELOW', 'BESIDE', 'MAIN'] as const;
    const rawPos = payload.imageDisplayPosition ?? '';

    if (selectedPassage) {
      // Update: explicitly clear fields that are not relevant to chosen type
      const imgPos = isImageType && validPositions.includes(rawPos as typeof validPositions[number]) ? rawPos as typeof validPositions[number] : null;
      const updatePayload: UpdatePassagePayload = {
        title: payload.title?.trim() || null,
        content: isTextType ? (payload.content?.trim() || null) : null,
        passageFormat: 'Plain',
        passageType: payload.passageType || null,
        imageRef: isImageType ? (payload.imageRef?.trim() || null) : null,
        imageDisplayPosition: imgPos,
        latexEnabled: isTextType ? (payload.latexEnabled ?? false) : false,
        section: payload.section?.trim() || null,
        difficulty: payload.difficulty?.trim() || null,
        topic: payload.topic?.trim() || null,
        notes: payload.notes?.trim() || null,
      };
      const result = await updatePassage(selectedPassage.id, updatePayload);
      if (result) {
        setIsModalOpen(false);
        setSelectedPassage(null);
        load();
      }
      return;
    }

    const normalizedPayload: CreatePassagePayload = {
      title: payload.title?.trim() || undefined,
      content: isTextType ? (payload.content?.trim() || undefined) : undefined,
      passageFormat: 'Plain',
      passageType: payload.passageType || undefined,
      imageRef: isImageType ? (payload.imageRef?.trim() || undefined) : undefined,
      imageDisplayPosition: isImageType && validPositions.includes((payload.imageDisplayPosition ?? '') as typeof validPositions[number]) ? payload.imageDisplayPosition as CreatePassagePayload['imageDisplayPosition'] : undefined,
      latexEnabled: isTextType ? (payload.latexEnabled ?? false) : false,
      section: payload.section?.trim() || undefined,
      difficulty: payload.difficulty?.trim() || undefined,
      topic: payload.topic?.trim() || undefined,
      notes: payload.notes?.trim() || undefined,
    };

    const result = await createPassage(normalizedPayload);

    if (result) {
      setIsModalOpen(false);
      setSelectedPassage(null);
      load();
    }
  };

  const onConfirmDelete = async () => {
    if (!selectedPassage) return;
    const success = await deletePassage(selectedPassage.id);
    if (success) {
      setIsDeleteOpen(false);
      setSelectedPassage(null);
      load();
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Passages <span className="text-[#0A9AE2]">.</span>
          </h1>
          <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
            Manage and import reading passages.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Upload size={16} />
            Import CSV
          </button>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0A9AE2] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-100 hover:bg-[#0864B6] dark:shadow-none"
          >
            <Plus size={16} />
            Create Passage
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search passages..."
              value={search}
              onChange={handleSearch}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <Filter size={14} className="text-[#0A9AE2]" />
            <span>{meta ? `${meta.total} Passage${meta.total !== 1 ? 's' : ''}` : ''}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Passage</th>
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Type</th>
                <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Subject / Topic</th>
                <th className="hidden lg:table-cell px-6 py-3 text-center text-xs font-black uppercase tracking-wide text-slate-500">Difficulty</th>
                <th className="hidden md:table-cell px-6 py-3 text-center text-xs font-black uppercase tracking-wide text-slate-500">Questions</th>
                <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Created</th>
                <th className="px-6 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading && passages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto animate-spin text-[#0A9AE2]" />
                  </td>
                </tr>
              ) : passages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm font-bold text-slate-400">
                    No passages found.
                  </td>
                </tr>
              ) : (
                passages.map((passage) => (
                  <tr
                    key={passage.id}
                    onClick={() => router.push(`/dashboard/passages/${passage.id}`)}
                    className="cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0A9AE2] dark:bg-blue-500/10">
                          <FileText size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-slate-900 dark:text-slate-100">
                              {passage.title || 'Untitled Passage'}
                            </span>
                            {passage.externalId && (
                              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                {passage.externalId}
                              </span>
                            )}
                          </div>
                          <p className="line-clamp-1 text-xs text-slate-400 dark:text-slate-500">
                            {passage.content || <span className="italic">No text content</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4">
                      {passage.passageType ? (
                        <span className={`inline-flex items-center rounded-lg px-2 py-1 text-[11px] font-bold ${
                          passage.passageType === 'TEXT' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' :
                          passage.passageType === 'IMAGE' ? 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400' :
                          'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                        }`}>
                          {passage.passageType === 'TEXT' ? 'Text' : passage.passageType === 'IMAGE' ? 'Image' : 'Text + Image'}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">—</span>
                      )}
                    </td>
                    <td className="hidden xl:table-cell px-6 py-4">
                      {passage.section || passage.topic ? (
                        <div className="min-w-0">
                          {passage.section && (
                            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
                              {passage.section}
                            </span>
                          )}
                          {passage.topic && (
                            <span className="block text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[160px]">
                              {passage.topic}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">—</span>
                      )}
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 text-center">
                      {passage.difficulty ? (
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${
                          passage.difficulty === 'EASY' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          passage.difficulty === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                          'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                        }`}>
                          {passage.difficulty}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">—</span>
                      )}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 text-center">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                        {passage._count.questions}
                      </span>
                    </td>
                    <td className="hidden xl:table-cell px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(passage.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(passage); }}
                          className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"
                          title="Edit passage"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(passage); }}
                          disabled={actionLoading === passage.id}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-500/10"
                          title="Delete passage"
                        >
                          {actionLoading === passage.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-500">
              Page <span className="text-slate-900 dark:text-white">{meta.page}</span> of <span className="text-slate-900 dark:text-white">{meta.totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Prev
              </button>
              <button
                disabled={page === meta.totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <PassageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onSubmit}
        initialData={selectedPassage as PassageDetail | null}
        isLoading={isLoading || (!!selectedPassage && actionLoading === selectedPassage.id)}
      />

      <ImportPassageModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportCsv={handleImportCsv}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={onConfirmDelete}
        title="Delete Passage"
        message={`Are you sure you want to delete "${selectedPassage?.title || selectedPassage?.externalId || 'this passage'}"? Linked questions must be removed or reassigned first.`}
        isLoading={!!selectedPassage && actionLoading === selectedPassage.id}
      />
    </div>
  );
}

'use client';

import { useCallback, useEffect } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { ArrowLeft, BookOpenText, Loader2 } from 'lucide-react';
import { usePassages } from '@/features/passages/hooks/usePassages';

const STATUS_BADGES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  PUBLISHED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
};

const DIFFICULTY_BADGES: Record<string, string> = {
  EASY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  HARD: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
};

export default function PassageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { selectedPassage, actionLoading, error, fetchPassageById } = usePassages();

  const load = useCallback(() => {
    void fetchPassageById(id);
  }, [fetchPassageById, id]);

  useEffect(() => {
    load();
  }, [load]);

  const isLoading = actionLoading === id && !selectedPassage;

  return (
    <div className="space-y-4 sm:space-y-8">
      <Link
        href="/dashboard/passages"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-[#0A9AE2] transition-all hover:translate-x-[-4px] dark:text-slate-400"
      >
        <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
        Back to Passages
      </Link>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-xs sm:text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white px-8 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-[#0A9AE2]" />
            <span className="font-bold text-slate-400">Loading passage detail...</span>
          </div>
        </div>
      ) : selectedPassage ? (
        <>
          <section className="rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-8 sm:py-8 dark:border-slate-800">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                      {selectedPassage.title || 'Untitled Passage'}
                    </h1>
                    {selectedPassage.externalId && (
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {selectedPassage.externalId}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Linked to {selectedPassage._count.questions} question{selectedPassage._count.questions !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-5 sm:px-8 sm:py-8">
              <div className="rounded-2xl bg-slate-50 p-4 sm:p-6 text-sm leading-7 text-slate-700 dark:bg-slate-950 dark:text-slate-300 whitespace-pre-wrap">
                {selectedPassage.content}
              </div>
            </div>
          </section>

          <section className="rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-8 sm:py-6 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0A9AE2] dark:bg-blue-500/10">
                  <BookOpenText size={18} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    Related Questions
                  </h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Review all questions currently attached to this passage.
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50/50 text-slate-900 dark:bg-slate-800/50 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 sm:px-8 py-3 sm:py-5 font-bold">Question</th>
                    <th className="hidden md:table-cell px-8 py-5 font-bold">Type</th>
                    <th className="hidden md:table-cell px-8 py-5 font-bold">Difficulty</th>
                    <th className="hidden md:table-cell px-8 py-5 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedPassage.questions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-14 text-center font-medium text-slate-500 dark:text-slate-400">
                        No questions are linked to this passage yet.
                      </td>
                    </tr>
                  ) : (
                    selectedPassage.questions.map((question) => (
                      <tr key={question.id} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 sm:px-8 py-4 sm:py-6">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                {question.contentText}
                              </span>
                              {question.questionId && (
                                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                  {question.questionId}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                              Subject ID: {question.subjectId} · Topic ID: {question.topicId}
                            </p>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-8 py-6 font-bold text-slate-700 dark:text-slate-300">
                          {question.type}
                        </td>
                        <td className="hidden md:table-cell px-8 py-6">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black ${DIFFICULTY_BADGES[question.difficulty]}`}>
                            {question.difficulty}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-8 py-6">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black ${STATUS_BADGES[question.status]}`}>
                            {question.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

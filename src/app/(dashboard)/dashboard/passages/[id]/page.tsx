'use client';

import { useCallback, useEffect } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { ArrowLeft, BookOpenText, Loader2, Image as ImageIcon, FileText, Hash, Layers, Calendar, Sparkles, MessageSquareQuote } from 'lucide-react';
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

const PASSAGE_TYPE_LABELS: Record<string, { label: string; icon: typeof ImageIcon }> = {
  TEXT: { label: 'Text Only', icon: FileText },
  IMAGE: { label: 'Image Only', icon: ImageIcon },
  TEXT_IMAGE: { label: 'Text & Image', icon: Layers },
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

  const hasImage = (selectedPassage?.passageType === 'IMAGE' || selectedPassage?.passageType === 'TEXT_IMAGE') && selectedPassage?.image?.url;
  const hasContent = !!selectedPassage?.content;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
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
          {/* HERO HEADER - Title + stats in single compact row */}
          <section className="relative rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-white to-blue-50/40 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 overflow-hidden">
            {/* Decorative blob */}
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-blue-400/20 to-cyan-400/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-gradient-to-tr from-purple-400/10 to-blue-400/10 blur-3xl pointer-events-none" />

            <div className="relative px-5 py-5 sm:px-8 sm:py-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                {/* Left: Title + chips */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                      {selectedPassage.title || 'Untitled Passage'}
                    </h1>
                    {selectedPassage.externalId && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 px-2.5 py-1 text-[11px] font-black text-blue-600 dark:from-blue-500/10 dark:to-cyan-500/10 dark:border-blue-500/20 dark:text-blue-400">
                        <Hash size={10} />
                        {selectedPassage.externalId}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {selectedPassage.passageType && PASSAGE_TYPE_LABELS[selectedPassage.passageType] && (
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-300">
                        {(() => {
                          const TypeIcon = PASSAGE_TYPE_LABELS[selectedPassage.passageType!].icon;
                          return <TypeIcon size={12} className="text-slate-400" />;
                        })()}
                        {PASSAGE_TYPE_LABELS[selectedPassage.passageType].label}
                      </div>
                    )}
                    {selectedPassage.difficulty && (
                      <div className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-black ${DIFFICULTY_BADGES[selectedPassage.difficulty]}`}>
                        {selectedPassage.difficulty}
                      </div>
                    )}
                    {selectedPassage.section && (
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 border border-purple-100 px-2.5 py-1 text-[11px] font-bold text-purple-600 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400">
                        <Layers size={12} />
                        {selectedPassage.section}
                      </div>
                    )}
                    {selectedPassage.topic && (
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-50 border border-cyan-100 px-2.5 py-1 text-[11px] font-bold text-cyan-600 dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:text-cyan-400">
                        <BookOpenText size={12} />
                        {selectedPassage.topic}
                      </div>
                    )}
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-400">
                      <Calendar size={12} />
                      {new Date(selectedPassage.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Right: Stats card */}
                <div className="flex items-stretch gap-3">
                  <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 px-5 py-3 text-white shadow-lg shadow-blue-500/20">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                      <MessageSquareQuote size={18} />
                    </div>
                    <div>
                      <div className="text-2xl font-black leading-none">{selectedPassage._count.questions}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-blue-100 mt-1">
                        Question{selectedPassage._count.questions !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CONTENT BODY - 2 column layout when both image and content exist */}
          {(hasImage || hasContent) && (
            <section className={`grid gap-6 ${hasImage && hasContent ? 'lg:grid-cols-5' : 'grid-cols-1'}`}>
              {/* Image Column */}
              {hasImage && (
                <div className={hasContent ? 'lg:col-span-2' : ''}>
                  <div className="sticky top-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 text-white">
                          <ImageIcon size={13} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">Visual</span>
                      </div>
                      {selectedPassage.image?.altText && (
                        <span className="text-[10px] font-medium text-slate-400 truncate max-w-[160px]">
                          {selectedPassage.image.altText}
                        </span>
                      )}
                    </div>
                    <div className="relative bg-[radial-gradient(circle_at_50%_50%,_rgba(148,163,184,0.08),_transparent)] dark:bg-[radial-gradient(circle_at_50%_50%,_rgba(59,130,246,0.08),_transparent)]">
                      <div className="flex items-center justify-center p-5">
                        <a
                          href={selectedPassage.image!.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative inline-block"
                        >
                          <img
                            src={selectedPassage.image!.url}
                            alt={selectedPassage.image!.altText || selectedPassage.title || 'Passage image'}
                            className="max-w-full max-h-[440px] w-auto h-auto rounded-xl shadow-md ring-1 ring-slate-200 dark:ring-slate-700 transition-all duration-500 group-hover:shadow-xl group-hover:ring-blue-300 dark:group-hover:ring-blue-500/40"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/0 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-hover:from-black/20 transition-opacity duration-300 flex items-end justify-center pb-3">
                            <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold text-slate-700 shadow-lg">
                              Click to enlarge
                            </span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Column */}
              {hasContent && (
                <div className={hasImage ? 'lg:col-span-3' : ''}>
                  <div className="rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden h-full">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                          <FileText size={13} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">Passage Text</span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">
                        {selectedPassage.content!.trim().split(/\s+/).length} words
                      </span>
                    </div>
                    <div className="relative px-5 py-5 sm:px-8 sm:py-7">
                      <div className="absolute top-4 left-4 text-5xl font-serif text-slate-100 dark:text-slate-800 select-none pointer-events-none leading-none">
                        &ldquo;
                      </div>
                      <div className="relative pl-4 sm:pl-6 border-l-4 border-blue-500/40">
                        <p className="text-sm sm:text-base leading-7 sm:leading-8 text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-medium">
                          {selectedPassage.content}
                        </p>
                      </div>
                    </div>

                    {selectedPassage.notes && (
                      <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 sm:px-8 sm:py-5">
                        <div className="flex gap-3 rounded-xl bg-amber-50/60 border border-amber-100 p-4 dark:bg-amber-500/5 dark:border-amber-500/20">
                          <Sparkles size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">Notes</p>
                            <p className="text-sm text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                              {selectedPassage.notes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Notes only (when no content but notes exist) */}
          {!hasContent && selectedPassage.notes && (
            <section className="rounded-[1.5rem] border border-amber-100 bg-amber-50/60 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">
              <div className="flex gap-3">
                <Sparkles size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">Notes</p>
                  <p className="text-sm text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                    {selectedPassage.notes}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Related Questions Section */}
          <section className="rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-8 sm:py-5 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/20">
                    <BookOpenText size={16} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                      Related Questions
                    </h2>
                    <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                      {selectedPassage.questions.length} question{selectedPassage.questions.length !== 1 ? 's' : ''} attached to this passage
                    </p>
                  </div>
                </div>
                {selectedPassage.questions.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    {selectedPassage.questions.length} items
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 sm:px-8 py-3 font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Question</th>
                    <th className="hidden md:table-cell px-8 py-3 font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</th>
                    <th className="hidden md:table-cell px-8 py-3 font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Difficulty</th>
                    <th className="hidden md:table-cell px-8 py-3 font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedPassage.questions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                            <BookOpenText size={20} className="text-slate-400" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-bold text-sm text-slate-600 dark:text-slate-300">No questions yet</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Questions linked to this passage will appear here.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    selectedPassage.questions.map((question, index) => (
                      <tr key={question.id} className="group transition-all duration-200 hover:bg-blue-50/30 dark:hover:bg-blue-500/5">
                        <td className="px-4 sm:px-8 py-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-slate-100 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                {index + 1}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                                {question.questionText}
                              </span>
                              {question.questionId && (
                                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                  {question.questionId}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 pl-8">
                              Subject: {question.subjectId} · Topic: {question.topicId}
                            </p>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-8 py-4">
                          <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {question.type}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-8 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black ${DIFFICULTY_BADGES[question.difficulty]}`}>
                            {question.difficulty}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-8 py-4">
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

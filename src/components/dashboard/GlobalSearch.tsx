'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, BookOpen, FileText, ClipboardList, ArrowRight, X } from 'lucide-react';
import { subjectsService } from '@/features/subjects/services/subjects.service';
import { examService } from '@/features/exams/services/exams.service';
import { practiceService } from '@/features/practice/services/practice.service';
import type { Subject } from '@/features/subjects/types/subjects.types';
import type { ExamItem } from '@/features/exams/types/exams.types';
import type { AssignmentSummary } from '@/features/practice/types/practice.types';

type Role = 'ADMIN' | 'TUTOR' | 'PARENT' | 'STUDENT' | string | undefined;

interface GlobalSearchProps {
  role: Role;
}

interface SearchResults {
  subjects: Subject[];
  exams: ExamItem[];
  assignments: AssignmentSummary[];
}

const EMPTY_RESULTS: SearchResults = { subjects: [], exams: [], assignments: [] };

export const GlobalSearch = ({ role }: GlobalSearchProps) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canSearchStaff = role === 'ADMIN' || role === 'TUTOR';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(EMPTY_RESULTS);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const tasks: Promise<void>[] = [];
        const next: SearchResults = { subjects: [], exams: [], assignments: [] };

        if (canSearchStaff) {
          tasks.push(
            subjectsService
              .listSubjects({ search: trimmed, page: 1, limit: 5 })
              .then((res) => {
                if (!cancelled && res.success) next.subjects = res.data;
              })
              .catch(() => { /* silent */ })
          );

          tasks.push(
            examService
              .list({ page: 1, limit: 20 })
              .then((res) => {
                if (cancelled || !res.success) return;
                const q = trimmed.toLowerCase();
                next.exams = res.data
                  .filter((e) => e.title.toLowerCase().includes(q))
                  .slice(0, 5);
              })
              .catch(() => { /* silent */ })
          );

          tasks.push(
            practiceService
              .listAssignments({ page: 1, limit: 20 })
              .then((res) => {
                if (cancelled || !res.success) return;
                const q = trimmed.toLowerCase();
                next.assignments = res.data
                  .filter((a) =>
                    a.studentName.toLowerCase().includes(q) ||
                    (a.topicName?.toLowerCase().includes(q) ?? false) ||
                    (a.subjectName?.toLowerCase().includes(q) ?? false)
                  )
                  .slice(0, 5);
              })
              .catch(() => { /* silent */ })
          );
        } else {
          // Parent/other: only subjects search
          tasks.push(
            subjectsService
              .listSubjects({ search: trimmed, page: 1, limit: 5 })
              .then((res) => {
                if (!cancelled && res.success) next.subjects = res.data;
              })
              .catch(() => { /* silent */ })
          );
        }

        await Promise.all(tasks);
        if (!cancelled) setResults(next);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, canSearchStaff]);

  const totalResults =
    results.subjects.length + results.exams.length + results.assignments.length;

  const handleNavigate = useCallback((href: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(href);
  }, [router]);

  const handleClear = () => {
    setQuery('');
    setResults(EMPTY_RESULTS);
    inputRef.current?.focus();
  };

  const trimmed = query.trim();
  const showDropdown = isOpen && trimmed.length >= 2;

  return (
    <div
      ref={containerRef}
      className="relative hidden w-64 items-center md:flex lg:w-96"
    >
      <div className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-[#0A9AE2] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0A9AE2]/10 text-[#0A9AE2]">
          <Search size={16} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder="Search topics, practice, exams..."
          className="w-full border-none bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 animate-in fade-in slide-in-from-top-1 dark:border-slate-700 dark:bg-slate-900">
          <div className="max-h-[28rem] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm font-medium text-slate-500 dark:text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                Searching...
              </div>
            ) : totalResults === 0 ? (
              <div className="px-4 py-8 text-center">
                <Search size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  No results for &quot;{trimmed}&quot;
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Try different keywords
                </p>
              </div>
            ) : (
              <div className="py-2">
                {results.subjects.length > 0 && (
                  <ResultSection title="Subjects">
                    {results.subjects.map((s) => (
                      <ResultItem
                        key={`subject-${s.id}`}
                        icon={<BookOpen size={14} />}
                        iconTone="bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                        title={s.name}
                        subtitle={
                          s.description || `${s._count?.topics ?? 0} topics`
                        }
                        onClick={() => handleNavigate(`/dashboard/subjects/${s.id}`)}
                      />
                    ))}
                  </ResultSection>
                )}

                {results.exams.length > 0 && (
                  <ResultSection title="Exams">
                    {results.exams.map((e) => (
                      <ResultItem
                        key={`exam-${e.id}`}
                        icon={<FileText size={14} />}
                        iconTone="bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                        title={e.title}
                        subtitle={`${e.examType.replace('_', ' ')} • ${e.status} • ${e.questionCount} questions`}
                        onClick={() => handleNavigate(`/dashboard/exams/${e.id}`)}
                      />
                    ))}
                  </ResultSection>
                )}

                {results.assignments.length > 0 && (
                  <ResultSection title="Practice Assignments">
                    {results.assignments.map((a) => (
                      <ResultItem
                        key={`assignment-${a.sessionId}`}
                        icon={<ClipboardList size={14} />}
                        iconTone="bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                        title={a.studentName}
                        subtitle={`${a.topicName ?? a.subjectName ?? 'Custom'} • ${a.status}`}
                        onClick={() => handleNavigate('/dashboard/practice/assignments')}
                      />
                    ))}
                  </ResultSection>
                )}
              </div>
            )}
          </div>

          {totalResults > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
              <span>{totalResults} result{totalResults !== 1 ? 's' : ''}</span>
              <span className="text-slate-400 dark:text-slate-500">Press Esc to close</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1 last:mb-0">
      <p className="px-4 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {title}
      </p>
      {children}
    </div>
  );
}

function ResultItem({
  icon,
  iconTone,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  iconTone: string;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconTone}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{title}</p>
        {subtitle && (
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      <ArrowRight
        size={14}
        className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#0A9AE2] dark:text-slate-600"
      />
    </button>
  );
}

export default GlobalSearch;

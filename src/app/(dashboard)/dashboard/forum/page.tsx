'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { canWriteForum, canAccessForum } from '@/features/membership/access';
import { FeaturePaywall } from '@/components/billing/FeaturePaywall';
import { forumAuthorLabel } from '@/features/forum/authorLabel';
import { forumService } from '@/features/forum/services/forum.service';
import type { ForumSegment, ForumThread } from '@/features/forum/types/forum.types';
import {
  MessageSquare,
  Plus,
  Pin,
  Lock,
  Clock,
  Users,
  BookOpen,
  AlertCircle,
  ShieldOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const SEGMENT_LABELS: Record<ForumSegment, string> = {
  STUDENT: 'Student Forum',
  PARENT: 'Parent Forum',
};

function timeAgo(dateStr: string | null) {
  if (!dateStr) return 'No replies yet';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

export default function ForumPage() {
  const user = useAuthStore((s) => s.user);
  // Forum is Premium-only for students/parents; ADMIN/TUTOR always allowed.
  const hasForumAccess = canAccessForum(user);
  // Forum-banned students/parents are blocked even with Premium (moderators exempt).
  const isForumBanned =
    Boolean(user?.isForumBanned) && user?.role !== 'ADMIN' && user?.role !== 'TUTOR';
  const userSegment: ForumSegment =
    user?.role === 'PARENT' ? 'PARENT' : 'STUDENT';

  const [activeSegment, setActiveSegment] = useState<ForumSegment>(userSegment);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (segment: ForumSegment, p: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await forumService.listThreads(segment, p);
      if (res.success) {
        setThreads(res.data);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      }
    } catch {
      setError('Failed to load forum threads');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Skip the fetch when gated (paywall/ban) — the API would just 403.
    if (!hasForumAccess || isForumBanned) return;
    const timer = window.setTimeout(() => {
      void load(activeSegment, page);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeSegment, page, load, hasForumAccess, isForumBanned]);

  const handleSegmentChange = (seg: ForumSegment) => {
    setActiveSegment(seg);
    setPage(1);
  };

  const canPost = canWriteForum(user);
  // ADMIN and TUTOR both moderate: they get the moderation panel link and the
  // cross-segment (Student/Parent) switcher.
  const isModerator = user?.role === 'ADMIN' || user?.role === 'TUTOR';

  // Forum-banned users get a clear suspension notice (not the Premium paywall).
  if (isForumBanned) {
    return (
      <div className="mx-auto flex min-h-[55vh] w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
          <ShieldOff size={28} />
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Forum access suspended
        </h1>
        <p className="mt-3 max-w-md text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
          Your access to the forum has been suspended due to repeated violations.
          Please contact an administrator if you believe this is a mistake.
        </p>
      </div>
    );
  }

  // Premium-only feature: students/parents below Premium see a paywall instead.
  if (!hasForumAccess) {
    return (
      <FeaturePaywall
        title="Forum Access"
        description="Available on Premium. Ask your parent to upgrade your plan."
        requiredTier="PREMIUM"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Forum
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {isModerator
              ? 'Review discussions, support the community, and manage forum activity.'
              : 'Ask questions, share tips, and discuss with your learning community.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isModerator && (
            <Link
              href="/dashboard/forum/moderation"
              className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-600 transition-colors hover:bg-orange-100 dark:border-orange-800/50 dark:bg-orange-900/20 dark:text-orange-400"
            >
              <AlertCircle size={16} /> Moderation Panel
            </Link>
          )}
          {canPost && (
            <Link
              href={`/dashboard/forum/new?segment=${activeSegment}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF6900] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-transform hover:scale-[1.02] active:scale-[0.98] dark:shadow-none"
            >
              <Plus size={16} /> New Thread
            </Link>
          )}
        </div>
      </div>

      {/* Segment tabs — only moderators (ADMIN/TUTOR) can switch segments */}
      {isModerator && (
        <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
          {(['STUDENT', 'PARENT'] as ForumSegment[]).map((seg) => (
            <button
              key={seg}
              onClick={() => handleSegmentChange(seg)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                activeSegment === seg
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              {seg === 'STUDENT' ? <BookOpen size={15} /> : <Users size={15} />}
              {SEGMENT_LABELS[seg]}
            </button>
          ))}
        </div>
      )}

      {/* Single-segment header for non-moderators */}
      {!isModerator && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/60">
          {userSegment === 'STUDENT' ? (
            <BookOpen size={18} className="text-[#0A9AE2]" />
          ) : (
            <Users size={18} className="text-violet-500" />
          )}
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {SEGMENT_LABELS[userSegment]}
          </span>
          <span className="ml-auto text-xs font-semibold text-slate-400">
            {total} thread{total !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="min-h-[30vh] space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 rounded-2xl border border-slate-200/60 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200/70 dark:bg-slate-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-slate-200/70 dark:bg-slate-700" />
                <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800/60" />
                <div className="h-3 w-1/4 rounded bg-slate-100 dark:bg-slate-800/60" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle size={18} /> {error}
        </div>
      ) : threads.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-4 rounded-[2rem] border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <MessageSquare size={28} className="text-slate-400" />
          </div>
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-300">No threads yet</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {canPost ? 'Be the first to start a discussion!' : 'No threads in this segment yet.'}
            </p>
          </div>
          {canPost && (
            <Link
              href={`/dashboard/forum/new?segment=${activeSegment}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF6900] px-5 py-2.5 text-sm font-bold text-white"
            >
              <Plus size={16} /> Start a Thread
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/dashboard/forum/${thread.id}`}
              className="group flex items-start gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 transition-all hover:border-[#0A9AE2]/30 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Icon */}
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                <MessageSquare size={18} />
              </div>

              {/* Body */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {thread.isPinned && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      <Pin size={9} /> Pinned
                    </span>
                  )}
                  {thread.isLocked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      <Lock size={9} /> Locked
                    </span>
                  )}
                  {thread.status === 'UNDER_REVIEW' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                      Under Review
                    </span>
                  )}
                </div>
                <h3 className="mt-1 font-bold text-slate-900 transition-colors group-hover:text-[#0A9AE2] dark:text-slate-100">
                  {thread.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  <span>
                    By{' '}
                    <span className="text-slate-600 dark:text-slate-300">
                      {forumAuthorLabel(thread.author)}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={11} /> {thread.postCount} repl{thread.postCount !== 1 ? 'ies' : 'y'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {timeAgo(thread.lastPostAt ?? thread.createdAt)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-sm font-semibold text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { canWriteForum } from '@/features/membership/access';
import { forumService } from '@/features/forum/services/forum.service';
import { showClientErrorAlert } from '@/lib/errorAlert';
import type { ForumPost, ForumThreadDetail, FlagReason } from '@/features/forum/types/forum.types';
import { DeleteConfirmModal } from '@/features/subjects/components/DeleteConfirmModal';
import {
  ArrowLeft,
  Pin,
  Lock,
  Flag,
  Trash2,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  EyeOff,
  User,
} from 'lucide-react';

const FLAG_REASONS: { value: FlagReason; label: string }[] = [
  { value: 'INAPPROPRIATE', label: 'Inappropriate content' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'OFF_TOPIC', label: 'Off-topic' },
  { value: 'MISINFORMATION', label: 'Misinformation' },
  { value: 'OTHER', label: 'Other' },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

function FlagModal({
  postId,
  onClose,
  onFlagged,
}: {
  postId: string;
  onClose: () => void;
  onFlagged: () => void;
}) {
  const [reason, setReason] = useState<FlagReason>('INAPPROPRIATE');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await forumService.flagPost(postId, { reason, note: note.trim() || undefined });
      onFlagged();
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message ?? 'Failed to flag post' : 'Failed to flag post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Report Post</h2>
        <p className="mt-1 text-sm text-slate-500">Select a reason for flagging this post for admin review.</p>

        <div className="mt-4 space-y-2">
          {FLAG_REASONS.map((r) => (
            <label key={r.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors ${reason === r.value ? 'border-[#FF6900] bg-orange-50 dark:bg-orange-900/10' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'}`}>
              <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="accent-[#FF6900]" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{r.label}</span>
            </label>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Additional notes (optional)..."
          rows={3}
          className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 placeholder-slate-400 focus:border-[#FF6900] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60">
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />} Report
          </button>
        </div>
      </div>
    </div>
  );
}

function PostCard({
  post,
  viewerId,
  userRole,
  isFirst,
  onDelete,
  onFlag,
  canForumWrite,
}: {
  post: ForumPost;
  viewerId: string;
  userRole: string;
  isFirst: boolean;
  onDelete: (postId: string) => void;
  onFlag: (postId: string) => void;
  canForumWrite: boolean;
}) {
  const isOwn = post.author?.id === viewerId;
  const canDelete = (isOwn && canForumWrite) || userRole === 'ADMIN';
  const canFlag = canForumWrite && !isOwn && (userRole === 'STUDENT' || userRole === 'PARENT');

  return (
    <div className={`rounded-[1.75rem] border p-5 ${isFirst ? 'border-[#0A9AE2]/30 bg-sky-50/50 dark:border-sky-900/40 dark:bg-sky-900/10' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
      {post.status === 'UNDER_REVIEW' && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          <AlertCircle size={12} /> This post is under review
        </div>
      )}
      {post.status === 'REJECTED' && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle size={12} /> This post was removed by admin
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            {post.isAnonymous ? <EyeOff size={16} /> : <User size={16} />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {post.author?.name ?? 'Anonymous'}
            </p>
            <p className="text-xs text-slate-400">{timeAgo(post.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canFlag && (
            <button onClick={() => onFlag(post.id)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
              <Flag size={14} />
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(post.id)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
        {post.content}
      </p>
    </div>
  );
}

export default function ThreadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [thread, setThread] = useState<ForumThreadDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [replyContent, setReplyContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySuccess, setReplySuccess] = useState(false);

  const [flagPostId, setFlagPostId] = useState<string | null>(null);
  const [flagSuccess, setFlagSuccess] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async (p: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await forumService.getThread(id, p);
      if (res.success) setThread(res.data);
    } catch {
      setError('Failed to load thread');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load(page);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load, page]);

  const handleDeletePost = (postId: string) => {
    setDeletePostId(postId);
  };

  const onConfirmDeletePost = async () => {
    if (!deletePostId) return;
    setIsDeletingPost(true);
    try {
      await forumService.deletePost(deletePostId);
      setDeletePostId(null);
      load(page);
    } catch (err) {
      if (!isAxiosError(err)) {
        void showClientErrorAlert('Failed to delete post.');
      }
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !thread) return;
    setIsSubmitting(true);
    setReplyError(null);
    try {
      await forumService.createPost(thread.id, {
        content: replyContent.trim(),
        isAnonymous,
      });
      setReplyContent('');
      setReplySuccess(true);
      setTimeout(() => setReplySuccess(false), 3000);
      load(page);
    } catch (err) {
      setReplyError(isAxiosError(err) ? err.response?.data?.message ?? 'Failed to post reply' : 'Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canForumWrite = canWriteForum(user);
  const canPost = canForumWrite && !thread?.isLocked;
  const isReadOnlyStudent = user?.role === 'STUDENT' && !canForumWrite;

  if (isLoading) return (
    <div className="min-h-[50vh] space-y-4 animate-pulse">
      <div className="rounded-2xl border border-slate-200/60 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200/70 dark:bg-slate-800" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 rounded bg-slate-200/70 dark:bg-slate-700" />
            <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800/60" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
          <div className="h-3 w-5/6 rounded bg-slate-100 dark:bg-slate-800/60" />
          <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800/60" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200/60 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 shrink-0 rounded-full bg-slate-200/70 dark:bg-slate-800" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/4 rounded bg-slate-100 dark:bg-slate-800/60" />
              <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (error || !thread) return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <AlertCircle size={32} className="text-red-400" />
      <p className="text-sm font-medium text-slate-500">{error ?? 'Thread not found'}</p>
      <button onClick={() => router.push('/dashboard/forum')} className="text-sm font-bold text-[#0A9AE2]">
        Back to Forum
      </button>
    </div>
  );

  const originalPost = page === 1 ? thread.posts[0] : undefined;
  const replyPosts = page === 1 ? thread.posts.slice(1) : thread.posts;

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link href="/dashboard/forum" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400">
        <ArrowLeft size={16} /> Back to Forum
      </Link>

      <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {thread.isPinned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Pin size={10} /> Pinned
                  </span>
                )}
                {thread.isLocked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-black text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    <Lock size={10} /> Locked
                  </span>
                )}
                {originalPost?.status === 'UNDER_REVIEW' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Under review
                  </span>
                )}
                {originalPost?.status === 'REJECTED' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-black text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    Removed
                  </span>
                )}
              </div>
              <h1 className="mt-4 text-3xl font-black leading-tight text-slate-900 dark:text-slate-100">{thread.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    {originalPost?.isAnonymous ? <EyeOff size={16} /> : <User size={16} />}
                  </div>
                  <span>
                    By <strong className="text-slate-700 dark:text-slate-200">{originalPost?.author?.name ?? thread.author?.name ?? 'Anonymous'}</strong>
                  </span>
                </div>
                <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                <span>{thread.postCount} repl{thread.postCount !== 1 ? 'ies' : 'y'}</span>
              </div>
            </div>
            {originalPost && (
              <div className="flex shrink-0 items-center gap-2">
                {canForumWrite && originalPost.author?.id !== user?.id && (user?.role === 'STUDENT' || user?.role === 'PARENT') && (
                  <button onClick={() => setFlagPostId(originalPost.id)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
                    <Flag size={14} />
                  </button>
                )}
                {((originalPost.author?.id === user?.id && canForumWrite) || user?.role === 'ADMIN') && (
                  <button onClick={() => handleDeletePost(originalPost.id)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="p-6">
          <p className="whitespace-pre-wrap text-base font-medium leading-8 text-slate-700 dark:text-slate-300">
            {originalPost?.content ?? 'Thread content is not available on this page.'}
          </p>
        </div>
      </article>

      <div className="space-y-3">
        <p className="px-1 text-xs font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">Replies</p>
        {replyPosts.length > 0 ? (
          replyPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              viewerId={user?.id ?? ''}
              userRole={user?.role ?? ''}
              isFirst={false}
              onDelete={handleDeletePost}
              onFlag={(pid) => setFlagPostId(pid)}
              canForumWrite={canForumWrite}
            />
          ))
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            No replies yet.
          </div>
        )}
      </div>

      {/* Pagination */}
      {thread.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-40 dark:border-slate-700"
          >
            <ArrowLeft size={14} /> Prev
          </button>
          <span className="text-sm text-slate-500">Page {page} of {thread.meta.totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(thread.meta.totalPages, p + 1))}
            disabled={page === thread.meta.totalPages}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-40 dark:border-slate-700"
          >
            Next <ArrowLeft size={14} className="rotate-180" />
          </button>
        </div>
      )}

      {/* Reply box */}
      {canPost && (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Leave a Reply</h3>
          <textarea
            ref={textareaRef}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write your reply..."
            rows={4}
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />

          {replyError && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
              <AlertCircle size={14} /> {replyError}
            </div>
          )}
          {replySuccess && (
            <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle size={14} /> Reply posted!
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 accent-[#FF6900]"
              />
              <EyeOff size={14} /> Post anonymously
            </label>
            <button
              onClick={handleSubmitReply}
              disabled={isSubmitting || !replyContent.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0A9AE2] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Post Reply
            </button>
          </div>
        </div>
      )}

      {thread.isLocked && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <Lock size={16} /> This thread is locked. No new replies are allowed.
        </div>
      )}

      {isReadOnlyStudent && !thread.isLocked && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <Lock size={16} /> Basic members can read forum discussions. Ask your parent to upgrade your plan to reply.
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deletePostId}
        onClose={() => setDeletePostId(null)}
        onConfirm={onConfirmDeletePost}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        isLoading={isDeletingPost}
      />

      {/* Flag modal */}
      {flagPostId && canForumWrite && (
        <FlagModal
          postId={flagPostId}
          onClose={() => setFlagPostId(null)}
          onFlagged={() => {
            setFlagPostId(null);
            setFlagSuccess(true);
            setTimeout(() => setFlagSuccess(false), 3000);
          }}
        />
      )}

      {flagSuccess && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-xl">
          <CheckCircle size={16} /> Post reported for review
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { canWriteForum } from '@/features/membership/access';
import { forumService } from '@/features/forum/services/forum.service';
import { showClientErrorAlert, showClientSuccessToast, showClientWarningToast } from '@/lib/errorAlert';
import type { ForumPost, ForumThreadDetail, FlagReason, ForumAuthor } from '@/features/forum/types/forum.types';
import { DeleteConfirmModal } from '@/features/subjects/components/DeleteConfirmModal';
import { WarnModal, warnActionFeedback } from '@/features/forum/components/WarnModal';
import { forumAuthorLabel } from '@/features/forum/authorLabel';
import {
  ArrowLeft,
  ArchiveX,
  Pin,
  Lock,
  Flag,
  Trash2,
  Send,
  Loader2,
  AlertCircle,
  EyeOff,
  ShieldOff,
  Pencil,
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

// True when a post was edited after creation. 1s tolerance avoids a false
// "edited" label from the tiny createdAt/updatedAt gap at creation time.
function wasEdited(post: ForumPost) {
  return new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 1000;
}

function FlagModal({
  postId,
  onClose,
  onFlagged,
}: {
  postId: string;
  onClose: () => void;
  onFlagged: (result: { message: string; alreadyReported?: boolean }) => void;
}) {
  const [reason, setReason] = useState<FlagReason>('INAPPROPRIATE');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await forumService.flagPost(postId, { reason, note: note.trim() || undefined });
      // Idempotent: a duplicate report comes back as alreadyReported (still a 200).
      onFlagged({
        message: res?.message ?? (res?.alreadyReported ? "You've already reported this post" : 'Post flagged for review'),
        alreadyReported: res?.alreadyReported,
      });
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
  onWarn,
  onSaveEdit,
  onToggleHidden,
  onRemove,
  canForumWrite,
}: {
  post: ForumPost;
  viewerId: string;
  userRole: string;
  isFirst: boolean;
  onDelete: (postId: string) => void;
  onFlag: (postId: string) => void;
  onWarn: (author: ForumAuthor) => void;
  onSaveEdit: (postId: string, content: string) => Promise<void>;
  onToggleHidden: (post: ForumPost) => Promise<void>;
  onRemove: (post: ForumPost) => Promise<void>;
  canForumWrite: boolean;
}) {
  const isOwn = post.author?.id === viewerId;
  const isModerator = userRole === 'ADMIN' || userRole === 'TUTOR';
  const canDelete = (isOwn && canForumWrite) || isModerator;
  const canFlag = canForumWrite && !isOwn && (userRole === 'STUDENT' || userRole === 'PARENT');
  const canToggleHidden = isModerator && post.status !== 'REMOVED';
  const canRemove = userRole === 'ADMIN' && post.status !== 'REMOVED';
  // Only moderators ever receive HIDDEN/REMOVED posts from the API; dim them.
  const isModeratedOut = post.status === 'HIDDEN' || post.status === 'REMOVED';
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(post.content);
  const [savingEdit, setSavingEdit] = useState(false);

  const handleSaveEdit = async () => {
    const content = draft.trim();
    if (!content || savingEdit) return;
    setSavingEdit(true);
    try {
      await onSaveEdit(post.id, content);
      setIsEditing(false);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className={`rounded-[1.75rem] border p-5 ${isModeratedOut ? 'opacity-60 ' : ''}${isFirst ? 'border-[#0A9AE2]/30 bg-sky-50/50 dark:border-sky-900/40 dark:bg-sky-900/10' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
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
      {post.status === 'HIDDEN' && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          <EyeOff size={12} /> Hidden — not visible to students
        </div>
      )}
      {post.status === 'REMOVED' && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <Trash2 size={12} /> Removed — visible to admins only
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            {post.isAnonymous ? <EyeOff size={16} /> : <User size={16} />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {forumAuthorLabel(post.author)}
            </p>
            <p className="text-xs text-slate-400">{timeAgo(post.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwn && !isEditing && (
            <button onClick={() => { setDraft(post.content); setIsEditing(true); }} title="Edit" className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
              <Pencil size={14} />
            </button>
          )}
          {canFlag && (
            <button onClick={() => onFlag(post.id)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
              <Flag size={14} />
            </button>
          )}
          {isModerator && post.author && (
            <button onClick={() => onWarn(post.author!)} title="Warn author" className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20">
              <ShieldOff size={14} />
            </button>
          )}
          {canToggleHidden && (
            <button
              onClick={() => onToggleHidden(post)}
              title={post.status === 'HIDDEN' ? 'Unhide post' : 'Hide post'}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20"
            >
              <EyeOff size={14} />
            </button>
          )}
          {canRemove && (
            <button
              onClick={() => onRemove(post)}
              title="Remove post"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
            >
              <ArchiveX size={14} />
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(post.id)} title="Delete post" className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="mt-4 space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setIsEditing(false); setDraft(post.content); }}
              disabled={savingEdit}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={savingEdit || !draft.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A9AE2] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#0659AA] disabled:opacity-60"
            >
              {savingEdit ? <Loader2 size={12} className="animate-spin" /> : null} Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-4 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
            {post.content}
          </p>
          {wasEdited(post) && <p className="mt-1 text-xs italic text-slate-400">edited</p>}
        </>
      )}
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

  const [flagPostId, setFlagPostId] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [warnTarget, setWarnTarget] = useState<{ id: string; name: string } | null>(null);
  const [isModBusy, setIsModBusy] = useState(false);
  const [editingOriginal, setEditingOriginal] = useState(false);
  const [originalDraft, setOriginalDraft] = useState('');
  const [savingOriginal, setSavingOriginal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async (p: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await forumService.getThread(id, p);
      if (res.success) setThread(res.data);
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message ?? 'Failed to load thread' : 'Failed to load thread');
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
      // Deleting a thread's opening post deletes the whole thread (replies
      // cascade); the BE tells us so we can go back to the list.
      const res = await forumService.deletePost(deletePostId);
      setDeletePostId(null);
      if (res?.threadDeleted) {
        router.push('/dashboard/forum');
        return;
      }
      load(page);
    } catch (err) {
      if (!isAxiosError(err)) {
        void showClientErrorAlert('Failed to delete post.');
      }
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handleTogglePin = async () => {
    if (!thread || isModBusy) return;
    setIsModBusy(true);
    try {
      await forumService.adminPinThread(thread.id, !thread.isPinned);
      setThread((t) => (t ? { ...t, isPinned: !t.isPinned } : t));
    } catch (err) {
      if (!isAxiosError(err)) void showClientErrorAlert('Failed to update the thread.');
    } finally {
      setIsModBusy(false);
    }
  };

  const handleToggleLock = async () => {
    if (!thread || isModBusy) return;
    setIsModBusy(true);
    try {
      await forumService.adminLockThread(thread.id, !thread.isLocked);
      setThread((t) => (t ? { ...t, isLocked: !t.isLocked } : t));
    } catch (err) {
      if (!isAxiosError(err)) void showClientErrorAlert('Failed to update the thread.');
    } finally {
      setIsModBusy(false);
    }
  };

  const handleToggleHiddenPost = async (post: ForumPost) => {
    if (isModBusy || post.status === 'REMOVED') return;
    const isHidden = post.status !== 'HIDDEN';
    const nextStatus: ForumPost['status'] = isHidden ? 'HIDDEN' : 'ACTIVE';
    setIsModBusy(true);
    try {
      await forumService.adminHidePost(post.id, isHidden);
      setThread((t) =>
        t
          ? {
              ...t,
              posts: t.posts.map((p) => (p.id === post.id ? { ...p, status: nextStatus } : p)),
            }
          : t
      );
      void showClientSuccessToast(
        isHidden ? 'Students can no longer see this post.' : 'The post is visible again.',
        isHidden ? 'Post hidden' : 'Post unhidden'
      );
    } catch (err) {
      if (!isAxiosError(err)) void showClientErrorAlert('Failed to update the post.');
    } finally {
      setIsModBusy(false);
    }
  };

  const handleRemovePost = async (post: ForumPost) => {
    if (isModBusy || user?.role !== 'ADMIN' || post.status === 'REMOVED') return;
    setIsModBusy(true);
    try {
      await forumService.adminRemovePost(post.id);
      setThread((t) =>
        t
          ? {
              ...t,
              posts: t.posts.map((p) => (p.id === post.id ? { ...p, status: 'REMOVED' } : p)),
            }
          : t
      );
      void showClientSuccessToast(
        'Only admins can see and restore this post now.',
        'Post removed'
      );
    } catch (err) {
      if (!isAxiosError(err)) void showClientErrorAlert('Failed to remove the post.');
    } finally {
      setIsModBusy(false);
    }
  };

  // Persist an edit (any post) and reflect it in local state so the content +
  // "edited" label update immediately (the API returns 204, no body).
  const handleSaveEditPost = async (postId: string, content: string) => {
    await forumService.editPost(postId, content);
    setThread((t) =>
      t
        ? {
            ...t,
            posts: t.posts.map((p) =>
              p.id === postId ? { ...p, content, updatedAt: new Date().toISOString() } : p
            ),
          }
        : t
    );
  };

  const handleSaveOriginal = async () => {
    const op = thread?.posts[0];
    if (!op) return;
    const content = originalDraft.trim();
    if (!content || savingOriginal) return;
    setSavingOriginal(true);
    try {
      await handleSaveEditPost(op.id, content);
      setEditingOriginal(false);
    } finally {
      setSavingOriginal(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !thread) return;
    setIsSubmitting(true);
    setReplyError(null);
    try {
      const res = await forumService.createPost(thread.id, {
        content: replyContent.trim(),
        isAnonymous,
      });
      setReplyContent('');
      const replyUnderReview = Boolean(res.data?.underReview);
      void showClientSuccessToast(
        replyUnderReview
          ? 'It will be visible once a moderator approves it.'
          : 'Your reply is now live in the thread.',
        replyUnderReview ? 'Reply submitted for review' : 'Reply posted',
      );
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
  const isModerator = user?.role === 'ADMIN' || user?.role === 'TUTOR';

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

  // If the opening post is hidden/removed from this viewer, don't mislabel the
  // first visible reply as the original — show a placeholder and treat all posts
  // as replies.
  const openingRemoved = page === 1 && Boolean(thread.openingPostRemoved);
  const originalPost = page === 1 && !openingRemoved ? thread.posts[0] : undefined;
  const replyPosts = page === 1 ? (openingRemoved ? thread.posts : thread.posts.slice(1)) : thread.posts;
  // Deleting the opening post removes the whole thread, so warn accordingly.
  const deletingOpeningPost = deletePostId != null && deletePostId === originalPost?.id;

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link href="/dashboard/forum" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400">
        <ArrowLeft size={16} /> Back to Forum
      </Link>

      <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800 sm:p-6">
          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between">
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
                {originalPost?.status === 'HIDDEN' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <EyeOff size={10} /> Hidden
                  </span>
                )}
                {originalPost?.status === 'REMOVED' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-black text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    <Trash2 size={10} /> Removed
                  </span>
                )}
              </div>
              <h1 className="mt-4 break-words text-2xl font-black leading-tight text-slate-900 dark:text-slate-100 sm:text-3xl">{thread.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    {originalPost?.isAnonymous ? <EyeOff size={16} /> : <User size={16} />}
                  </div>
                  <span>
                    By <strong className="text-slate-700 dark:text-slate-200">{openingRemoved ? 'Unavailable' : forumAuthorLabel(originalPost?.author ?? thread.author)}</strong>
                  </span>
                </div>
                <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                <span>{thread.postCount} repl{thread.postCount !== 1 ? 'ies' : 'y'}</span>
              </div>
            </div>
            {(isModerator || originalPost) && (
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
                {isModerator && (
                  <>
                    <button
                      onClick={handleTogglePin}
                      disabled={isModBusy}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Pin size={13} /> {thread.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                      onClick={handleToggleLock}
                      disabled={isModBusy}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Lock size={13} /> {thread.isLocked ? 'Unlock' : 'Lock'}
                    </button>
                    {originalPost && originalPost.status !== 'REMOVED' && (
                      <button
                        onClick={() => handleToggleHiddenPost(originalPost)}
                        disabled={isModBusy}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-60 dark:border-amber-800/50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                      >
                        <EyeOff size={13} /> {originalPost.status === 'HIDDEN' ? 'Unhide' : 'Hide'}
                      </button>
                    )}
                    {user?.role === 'ADMIN' && originalPost && originalPost.status !== 'REMOVED' && (
                      <button
                        onClick={() => handleRemovePost(originalPost)}
                        disabled={isModBusy}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <ArchiveX size={13} /> Remove
                      </button>
                    )}
                  </>
                )}
                {originalPost && originalPost.author?.id === user?.id && !editingOriginal && (
                  <button onClick={() => { setOriginalDraft(originalPost.content); setEditingOriginal(true); }} title="Edit" className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
                    <Pencil size={14} />
                  </button>
                )}
                {originalPost && canForumWrite && originalPost.author?.id !== user?.id && (user?.role === 'STUDENT' || user?.role === 'PARENT') && (
                  <button onClick={() => setFlagPostId(originalPost.id)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
                    <Flag size={14} />
                  </button>
                )}
                {originalPost && isModerator && originalPost.author && (
                  <button
                    onClick={() => setWarnTarget({ id: originalPost.author!.id, name: originalPost.author!.realName ?? originalPost.author!.name ?? 'this user' })}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-60 dark:border-amber-800/50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                  >
                    <ShieldOff size={13} /> Warn Author
                  </button>
                )}
                {originalPost && ((originalPost.author?.id === user?.id && canForumWrite) || isModerator) && (
                  <button
                    onClick={() => handleDeletePost(originalPost.id)}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="p-6">
          {originalPost && editingOriginal ? (
            <div className="space-y-2">
              <textarea
                value={originalDraft}
                onChange={(e) => setOriginalDraft(e.target.value)}
                rows={6}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base font-medium leading-8 text-slate-900 placeholder-slate-400 focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setEditingOriginal(false); setOriginalDraft(''); }}
                  disabled={savingOriginal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveOriginal}
                  disabled={savingOriginal || !originalDraft.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A9AE2] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#0659AA] disabled:opacity-60"
                >
                  {savingOriginal ? <Loader2 size={14} className="animate-spin" /> : null} Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-base font-medium leading-8 text-slate-700 dark:text-slate-300">
                {originalPost?.content ?? (openingRemoved ? 'The original post has been removed by a moderator.' : 'Thread content is not available on this page.')}
              </p>
              {originalPost && wasEdited(originalPost) && (
                <p className="mt-2 text-xs italic text-slate-400">edited</p>
              )}
            </>
          )}
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
              onWarn={(author) => setWarnTarget({ id: author.id, name: author.realName ?? author.name ?? 'this user' })}
              onSaveEdit={handleSaveEditPost}
              onToggleHidden={handleToggleHiddenPost}
              onRemove={handleRemovePost}
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
        title={deletingOpeningPost ? 'Delete Thread' : 'Delete Post'}
        message={
          deletingOpeningPost
            ? 'This is the opening post — deleting it removes the entire thread and all its replies. This cannot be undone.'
            : 'Are you sure you want to delete this post? This action cannot be undone.'
        }
        isLoading={isDeletingPost}
      />

      {/* Flag modal */}
      {flagPostId && canForumWrite && (
        <FlagModal
          postId={flagPostId}
          onClose={() => setFlagPostId(null)}
          onFlagged={({ message, alreadyReported }) => {
            setFlagPostId(null);
            if (alreadyReported) {
              void showClientWarningToast(message, 'Already reported');
              return;
            }
            void showClientSuccessToast(message, 'Post reported');
          }}
        />
      )}

      {/* Moderator: issue a warning/suspension against a post's author */}
      {warnTarget && (
        <WarnModal
          userId={warnTarget.id}
          userName={warnTarget.name}
          allowBan={user?.role === 'ADMIN'}
          onClose={() => setWarnTarget(null)}
          onWarn={(level) => {
            const feedback = warnActionFeedback(level, warnTarget.name);
            setWarnTarget(null);
            void showClientSuccessToast(feedback.description, feedback.title);
          }}
        />
      )}
    </div>
  );
}

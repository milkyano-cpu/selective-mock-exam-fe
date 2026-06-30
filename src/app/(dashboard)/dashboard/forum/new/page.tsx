'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { forumService } from '@/features/forum/services/forum.service';
import { showClientSuccessToast } from '@/lib/errorAlert';
import type { ForumSegment } from '@/features/forum/types/forum.types';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { canWriteForum } from '@/features/membership/access';
import { ArrowLeft, EyeOff, Send, Loader2, AlertCircle, Info, LockKeyhole, ShieldOff } from 'lucide-react';

// Mirror the backend validation (createThreadBodySchema) so users get clear,
// immediate feedback instead of a redacted 400.
const TITLE_MIN = 5;
const CONTENT_MIN = 10;

export default function NewThreadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const segment = (searchParams.get('segment') ?? 'STUDENT') as ForumSegment;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleOk = title.trim().length >= TITLE_MIN;
  const contentOk = content.trim().length >= CONTENT_MIN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleOk || !contentOk) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await forumService.createThread(segment, {
        title: title.trim(),
        content: content.trim(),
        isAnonymous,
      });
      if (res.success && res.data) {
        void showClientSuccessToast(
          res.data.underReview
            ? 'It will be visible once a moderator approves it.'
            : 'Your thread is now live in the forum.',
          res.data.underReview ? 'Thread submitted for review' : 'Thread posted',
        );
        router.push(`/dashboard/forum/${res.data.id}`);
      }
    } catch (err) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.message ?? 'Failed to create thread'
          : 'Failed to create thread'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const canForumWrite = canWriteForum(user);
  const isForumBanned = Boolean(user?.isForumBanned) && user?.role !== 'ADMIN' && user?.role !== 'TUTOR';

  if ((user?.role === 'STUDENT' || user?.role === 'PARENT') && !canForumWrite) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${isForumBanned ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-300'}`}>
          {isForumBanned ? <ShieldOff size={28} /> : <LockKeyhole size={28} />}
        </div>
        <h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
          {isForumBanned ? 'Forum access suspended' : 'Forum is read-only'}
        </h1>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
          {isForumBanned
            ? 'Your access to the forum has been suspended due to repeated violations.'
            : 'You can still read discussions. Ask your parent to upgrade your plan to start threads and comment.'}
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/dashboard/forum" className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 dark:border-slate-700 dark:text-slate-300">
            Back to forum
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/dashboard/forum" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400">
        <ArrowLeft size={16} /> Back to Forum
      </Link>

      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Start a New Thread</h1>
        <p className="mt-1 text-sm text-slate-500">
          Posting to: <strong className="text-[#0A9AE2]">{segment === 'STUDENT' ? 'Student Forum' : 'Parent Forum'}</strong>
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/10 dark:text-blue-300">
        <Info size={16} className="mt-0.5 shrink-0" />
        <p>
          Content containing off-topic or inappropriate words will be automatically sent for admin review before being visible to others.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
            Thread Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g. Tips for solving verbal reasoning questions..."
            maxLength={200}
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="font-medium text-red-500">
              {title.trim().length > 0 && !titleOk ? `Title must be at least ${TITLE_MIN} characters` : ''}
            </span>
            <span className="text-slate-400">{title.length}/200</span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe your question or topic in detail..."
            rows={8}
            maxLength={5000}
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="font-medium text-red-500">
              {content.trim().length > 0 && !contentOk ? `Content must be at least ${CONTENT_MIN} characters` : ''}
            </span>
            <span className="text-slate-400">{content.length}/5000</span>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-4 w-4 accent-[#FF6900]"
          />
          <div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <EyeOff size={14} /> Post Anonymously
            </p>
            <p className="text-xs text-slate-400">Your name will be hidden from other users</p>
          </div>
        </label>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link
            href="/dashboard/forum"
            className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !titleOk || !contentOk}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF6900] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 disabled:opacity-50 dark:shadow-none"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Post Thread
          </button>
        </div>
      </form>
    </div>
  );
}

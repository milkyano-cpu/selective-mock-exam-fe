'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { forumService } from '@/features/forum/services/forum.service';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { showClientErrorAlert, showClientSuccessToast } from '@/lib/errorAlert';
import type { ForumFlag, ForumWarning, ForumBannedWord, ModeratedPost } from '@/features/forum/types/forum.types';
import { DeleteConfirmModal } from '@/features/subjects/components/DeleteConfirmModal';
import { WarnModal, warnActionFeedback } from '@/features/forum/components/WarnModal';
import {
  ArrowLeft,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldOff,
  AlertCircle,
  Trash2,
  Plus,
  BookOpen,
  EyeOff,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';

type Tab = 'flags' | 'moderated' | 'warnings' | 'bannedWords';

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

export default function ForumModerationPage() {
  // Word-filter (banned words) management is ADMIN-only; tutors moderate content
  // but don't configure the filter.
  const isAdmin = useAuthStore((s) => s.user?.role) === 'ADMIN';
  const [activeTab, setActiveTab] = useState<Tab>('flags');

  // Flags
  const [flags, setFlags] = useState<ForumFlag[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [flagsError, setFlagsError] = useState<string | null>(null);

  // Warnings
  const [warnings, setWarnings] = useState<ForumWarning[]>([]);
  const [warningsLoading, setWarningsLoading] = useState(false);
  const [deleteWarningId, setDeleteWarningId] = useState<string | null>(null);
  const [isDeletingWarning, setIsDeletingWarning] = useState(false);

  // Banned words
  const [bannedWords, setBannedWords] = useState<ForumBannedWord[]>([]);
  const [bwLoading, setBwLoading] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [bwError, setBwError] = useState<string | null>(null);
  const [deleteWordId, setDeleteWordId] = useState<string | null>(null);
  const [isDeletingWord, setIsDeletingWord] = useState(false);

  // Moderated (hidden/removed) posts
  const [moderatedPosts, setModeratedPosts] = useState<ModeratedPost[]>([]);
  const [mpLoading, setMpLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [liftingBanId, setLiftingBanId] = useState<string | null>(null);

  // Warn modal
  const [warnTarget, setWarnTarget] = useState<{ id: string; name: string } | null>(null);

  // Action feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); };

  const loadFlags = useCallback(async () => {
    setFlagsLoading(true);
    try {
      const res = await forumService.adminListFlags('PENDING');
      setFlags(res.data);
    } catch { setFlagsError('Failed to load flags'); }
    finally { setFlagsLoading(false); }
  }, []);

  const loadWarnings = useCallback(async () => {
    setWarningsLoading(true);
    try {
      const res = await forumService.adminListWarnings();
      setWarnings(res.data);
    } finally { setWarningsLoading(false); }
  }, []);

  const loadBannedWords = useCallback(async () => {
    setBwLoading(true);
    try {
      const res = await forumService.listBannedWords();
      setBannedWords((res as any).data ?? []);
    } finally { setBwLoading(false); }
  }, []);

  const loadModeratedPosts = useCallback(async () => {
    setMpLoading(true);
    try {
      const res = await forumService.listModeratedPosts();
      setModeratedPosts(res.data ?? []);
    } finally { setMpLoading(false); }
  }, []);

  useEffect(() => { loadFlags(); }, [loadFlags]);
  useEffect(() => { if (activeTab === 'moderated') loadModeratedPosts(); }, [activeTab, loadModeratedPosts]);
  useEffect(() => { if (activeTab === 'warnings') loadWarnings(); }, [activeTab, loadWarnings]);
  useEffect(() => { if (isAdmin && activeTab === 'bannedWords') loadBannedWords(); }, [isAdmin, activeTab, loadBannedWords]);

  const handleReviewFlag = async (flagId: string, postId: string, action: 'APPROVE' | 'REJECT' | 'HIDE' | 'REMOVE') => {
    try {
      await forumService.adminReviewFlag(flagId, { action });
      const feedback =
        action === 'REJECT'
          ? {
              title: 'Report dismissed',
              description: 'The post stays visible and the report is closed.',
            }
          : action === 'HIDE'
            ? {
                title: 'Post hidden',
                description: 'Students and parents can no longer see it. It can be restored from Moderated Posts.',
              }
            : action === 'REMOVE'
              ? {
                  title: 'Post removed',
                  description: 'The post was removed from the forum. Only admins can restore removed posts.',
                }
              : {
                  title: 'Post moderated',
                  description: 'The reported post has been reviewed.',
                };
      void showClientSuccessToast(feedback.description, feedback.title);
      loadFlags();
    } catch (err) {
      if (!isAxiosError(err)) {
        void showClientErrorAlert('Failed to update the reported post.');
      }
    }
  };

  const handleRestore = async (postId: string) => {
    setRestoringId(postId);
    try {
      await forumService.restorePost(postId);
      showSuccess('Post restored');
      loadModeratedPosts();
    } catch (err) {
      if (!isAxiosError(err)) {
        void showClientErrorAlert('Failed to restore the post.');
      }
    } finally {
      setRestoringId(null);
    }
  };

  const handleLiftBan = async (userId: string) => {
    setLiftingBanId(userId);
    try {
      await forumService.liftForumBan(userId);
      showSuccess('Forum ban lifted');
      loadWarnings();
    } catch (err) {
      if (!isAxiosError(err)) {
        void showClientErrorAlert('Failed to lift the ban.');
      }
    } finally {
      setLiftingBanId(null);
    }
  };

  const handleAddWord = async () => {
    const w = newWord.trim().toLowerCase();
    if (!w) return;
    setBwError(null);
    try {
      await forumService.addBannedWord(w);
      setNewWord('');
      loadBannedWords();
      showSuccess(`"${w}" added to filter list`);
    } catch (err) {
      setBwError(isAxiosError(err) ? err.response?.data?.message ?? 'Failed' : 'Failed');
    }
  };

  const onConfirmDeleteWord = async () => {
    if (!deleteWordId) return;
    setIsDeletingWord(true);
    try {
      await forumService.deleteBannedWord(deleteWordId);
      setDeleteWordId(null);
      loadBannedWords();
    } catch (err) {
      if (!isAxiosError(err)) {
        void showClientErrorAlert('Failed to remove the banned word.');
      }
    } finally {
      setIsDeletingWord(false);
    }
  };

  const onConfirmDeleteWarning = async () => {
    if (!deleteWarningId) return;
    setIsDeletingWarning(true);
    try {
      await forumService.deleteWarning(deleteWarningId);
      setDeleteWarningId(null);
      showSuccess('Warning deleted');
      loadWarnings();
    } catch (err) {
      if (!isAxiosError(err)) {
        void showClientErrorAlert('Failed to delete the warning.');
      }
    } finally {
      setIsDeletingWarning(false);
    }
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'flags', label: 'Flagged Posts', icon: <Flag size={15} />, badge: flags.length },
    { id: 'moderated', label: 'Moderated Posts', icon: <EyeOff size={15} /> },
    { id: 'warnings', label: 'User Actions', icon: <AlertTriangle size={15} /> },
    // Word filter is ADMIN-only — hidden from tutors.
    ...(isAdmin ? [{ id: 'bannedWords' as Tab, label: 'Word Filter', icon: <BookOpen size={15} /> }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Success toast */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-xl">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      {warnTarget && (
        <WarnModal
          userId={warnTarget.id}
          userName={warnTarget.name}
          allowBan={isAdmin}
          onClose={() => setWarnTarget(null)}
          onWarn={(level) => {
            const feedback = warnActionFeedback(level, warnTarget.name);
            setWarnTarget(null);
            void showClientSuccessToast(feedback.description, feedback.title);
            if (activeTab === 'warnings') loadWarnings();
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard/forum" className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700">
            <ArrowLeft size={15} /> Back to Forum
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Moderation Panel</h1>
          <p className="mt-1 text-sm text-slate-500">Review flagged content, manage user actions, and configure the word filter.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-1 items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[10px] font-bold leading-tight transition-all sm:gap-1.5 sm:px-2 sm:py-2.5 sm:text-xs lg:gap-2 lg:px-3 lg:text-sm ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            {tab.icon} {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Flags tab */}
      {activeTab === 'flags' && (
        <div className="space-y-3">
          {flagsLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-[1.75rem] border border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-900" />
              ))}
            </div>
          ) : flagsError ? (
            <div className="flex items-center gap-2 text-sm text-red-500"><AlertCircle size={14} /> {flagsError}</div>
          ) : flags.length === 0 ? (
            <div className="flex min-h-[20vh] flex-col items-center justify-center gap-3 rounded-[2rem] border border-slate-200 bg-white p-10 dark:border-slate-800 dark:bg-slate-900">
              <CheckCircle size={36} className="text-emerald-400" />
              <p className="font-bold text-slate-600 dark:text-slate-400">No pending flags — all clear!</p>
            </div>
          ) : flags.map((flag) => (
            <div key={flag.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-black text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      {flag.reason.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">Reported by {flag.reporter.name} · {timeAgo(flag.createdAt)}</span>
                    {flag.author && (
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        · Author: {flag.author.name}{flag.isAnonymous ? ' (posted anonymously)' : ''}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                    "{flag.postContent}"
                  </p>
                  {flag.note && (
                    <p className="mt-1 text-xs text-slate-400 italic">Note: {flag.note}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  {flag.author && (
                    <button
                      onClick={() => setWarnTarget({ id: flag.author!.id, name: flag.author!.name ?? 'this user' })}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 dark:border-amber-800/50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                    >
                      <ShieldOff size={13} /> Warn Author
                    </button>
                  )}
                  <button
                    onClick={() => handleReviewFlag(flag.id, flag.postId, 'REJECT')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                  >
                    <XCircle size={13} /> Dismiss
                  </button>
                  <button
                    onClick={() => handleReviewFlag(flag.id, flag.postId, 'HIDE')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600"
                  >
                    <EyeOff size={13} /> Hide
                  </button>
                  <button
                    onClick={() => handleReviewFlag(flag.id, flag.postId, 'REMOVE')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-3 py-2 text-xs font-bold text-white hover:bg-red-600"
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Moderated posts tab (hidden/removed) */}
      {activeTab === 'moderated' && (
        <div className="space-y-3">
          {mpLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-[1.75rem] border border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-900" />
              ))}
            </div>
          ) : moderatedPosts.length === 0 ? (
            <div className="flex min-h-[20vh] flex-col items-center justify-center gap-3 rounded-[2rem] border border-slate-200 bg-white p-10 dark:border-slate-800 dark:bg-slate-900">
              <CheckCircle size={36} className="text-emerald-400" />
              <p className="font-bold text-slate-600 dark:text-slate-400">No hidden or removed posts.</p>
            </div>
          ) : moderatedPosts.map((post) => (
            <div key={post.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${post.status === 'HIDDEN' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {post.status}
                    </span>
                    <span className="text-xs text-slate-400">By {post.author?.name ?? 'Unknown'} · {timeAgo(post.createdAt)}</span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm font-medium text-slate-700 dark:text-slate-300">&ldquo;{post.content}&rdquo;</p>
                  <Link href={`/dashboard/forum/${post.threadId}`} className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#0A9AE2] hover:underline">
                    <ExternalLink size={11} /> {post.threadTitle}
                  </Link>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleRestore(post.id)}
                    disabled={restoringId === post.id}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-60"
                  >
                    <RotateCcw size={13} /> Restore
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warnings tab */}
      {activeTab === 'warnings' && (
        <div className="space-y-3">
          {warningsLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 rounded-[1.75rem] border border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-900" />
              ))}
            </div>
          ) : warnings.length === 0 ? (
            <div className="flex min-h-[20vh] flex-col items-center justify-center gap-3 rounded-[2rem] border border-slate-200 bg-white p-10 dark:border-slate-800 dark:bg-slate-900">
              <CheckCircle size={36} className="text-emerald-400" />
              <p className="font-bold text-slate-600">No user actions issued yet.</p>
            </div>
          ) : warnings.map((w) => {
            const levelTone =
              w.level === 'BAN' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : w.level === 'MAJOR' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
            const levelText =
              w.level === 'BAN' ? 'text-red-500' : w.level === 'MAJOR' ? 'text-orange-500' : 'text-amber-500';
            return (
              <div key={w.id} className="flex items-center gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${levelTone}`}>
                  {w.level === 'BAN' ? <ShieldOff size={18} /> : <AlertTriangle size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                    <span>{w.user.name} — <span className={levelText}>{w.level}</span></span>
                    {w.isForumBanned && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <ShieldOff size={10} /> Forum Banned
                      </span>
                    )}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-black text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                      {w.minorCount} MINOR
                    </span>
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-black text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                      {w.majorCount} MAJOR
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{w.reason}</p>
                  <p className="mt-1 text-xs text-slate-400">By {w.admin.name} · {timeAgo(w.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {w.isForumBanned && isAdmin && (
                    <button
                      onClick={() => handleLiftBan(w.user.id)}
                      disabled={liftingBanId === w.user.id}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-60"
                    >
                      <RotateCcw size={13} /> Lift Ban
                    </button>
                  )}
                  <button
                    onClick={() => setWarnTarget({ id: w.user.id, name: w.user.name ?? '' })}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700"
                  >
                    + Action
                  </button>
                  <button
                    onClick={() => setDeleteWarningId(w.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Banned words tab (ADMIN-only) */}
      {isAdmin && activeTab === 'bannedWords' && (
        <div className="space-y-5">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-black text-slate-900 dark:text-slate-100">Add Word to Filter</h3>
            <p className="mt-1 text-sm text-slate-500">
              Posts containing these words will automatically go to "Under Review" status.
            </p>
            <div className="mt-4 flex gap-3">
              <input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
                placeholder="Type a word..."
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              />
              <button
                onClick={handleAddWord}
                disabled={!newWord.trim()}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
              >
                <Plus size={15} /> Add
              </button>
            </div>
            {bwError && <p className="mt-2 text-xs text-red-500">{bwError}</p>}
          </div>

          {bwLoading ? (
            <div className="flex flex-wrap gap-2 animate-pulse">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className={`h-10 rounded-full bg-slate-100 dark:bg-slate-800 ${index % 2 === 0 ? 'w-24' : 'w-32'}`} />
              ))}
            </div>
          ) : bannedWords.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
              <p className="text-sm font-medium text-slate-400">No banned words configured yet.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {bannedWords.map((bw) => (
                <span key={bw.id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {bw.word}
                  <button onClick={() => setDeleteWordId(bw.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteWordId}
        onClose={() => setDeleteWordId(null)}
        onConfirm={onConfirmDeleteWord}
        title="Remove Banned Word"
        message="Are you sure you want to remove this word from the filter list?"
        isLoading={isDeletingWord}
      />

      <DeleteConfirmModal
        isOpen={!!deleteWarningId}
        onClose={() => setDeleteWarningId(null)}
        onConfirm={onConfirmDeleteWarning}
        title="Delete Warning"
        message="Are you sure you want to delete this warning? This removes the log entry and cannot be undone. The user's forum-ban status is not affected."
        isLoading={isDeletingWarning}
      />
    </div>
  );
}

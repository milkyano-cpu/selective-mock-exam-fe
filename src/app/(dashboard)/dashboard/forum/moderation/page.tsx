'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { forumService } from '@/features/forum/services/forum.service';
import type { ForumFlag, ForumWarning, ForumBannedWord } from '@/features/forum/types/forum.types';
import {
  ArrowLeft,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldOff,
  Loader2,
  AlertCircle,
  Trash2,
  Plus,
  BookOpen,
} from 'lucide-react';

type Tab = 'flags' | 'warnings' | 'bannedWords';

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

function WarnModal({
  userId,
  userName,
  onClose,
  onWarn,
}: {
  userId: string;
  userName: string;
  onClose: () => void;
  onWarn: () => void;
}) {
  const [level, setLevel] = useState<'WARNING' | 'SUSPEND'>('WARNING');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await forumService.adminWarnUser(userId, { level, reason: reason.trim() });
      onWarn();
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message ?? 'Failed' : 'Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Issue Action</h2>
        <p className="mt-1 text-sm text-slate-500">Against: <strong>{userName}</strong></p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {(['WARNING', 'SUSPEND'] as const).map((l) => (
            <label key={l} className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 px-4 py-3 ${level === l ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
              <input type="radio" name="level" value={l} checked={level === l} onChange={() => setLevel(l)} className="accent-red-500" />
              <div>
                <p className="text-sm font-bold">{l === 'WARNING' ? '⚠️ Warning' : '🚫 Suspend'}</p>
                <p className="text-xs text-slate-400">{l === 'WARNING' ? 'Formal warning' : 'Disable posting'}</p>
              </div>
            </label>
          ))}
        </div>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for this action..."
          rows={3}
          className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-red-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
        />

        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">Cancel</button>
          <button onClick={handleSubmit} disabled={isSubmitting || !reason.trim()} className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />} Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ForumModerationPage() {
  const [activeTab, setActiveTab] = useState<Tab>('flags');

  // Flags
  const [flags, setFlags] = useState<ForumFlag[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [flagsError, setFlagsError] = useState<string | null>(null);

  // Warnings
  const [warnings, setWarnings] = useState<ForumWarning[]>([]);
  const [warningsLoading, setWarningsLoading] = useState(false);

  // Banned words
  const [bannedWords, setBannedWords] = useState<ForumBannedWord[]>([]);
  const [bwLoading, setBwLoading] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [bwError, setBwError] = useState<string | null>(null);

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

  useEffect(() => { loadFlags(); }, [loadFlags]);
  useEffect(() => { if (activeTab === 'warnings') loadWarnings(); }, [activeTab, loadWarnings]);
  useEffect(() => { if (activeTab === 'bannedWords') loadBannedWords(); }, [activeTab, loadBannedWords]);

  const handleReviewFlag = async (flagId: string, postId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await forumService.adminReviewFlag(flagId, { action });
      showSuccess(action === 'APPROVE' ? 'Post removed' : 'Flag dismissed');
      loadFlags();
    } catch (err) {
      alert(isAxiosError(err) ? err.response?.data?.message : 'Error');
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

  const handleDeleteWord = async (wordId: string) => {
    if (!confirm('Remove this word from the filter list?')) return;
    try {
      await forumService.deleteBannedWord(wordId);
      loadBannedWords();
    } catch (err) {
      alert(isAxiosError(err) ? err.response?.data?.message : 'Error');
    }
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'flags', label: 'Flagged Posts', icon: <Flag size={15} />, badge: flags.length },
    { id: 'warnings', label: 'User Actions', icon: <AlertTriangle size={15} /> },
    { id: 'bannedWords', label: 'Word Filter', icon: <BookOpen size={15} /> },
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
          onClose={() => setWarnTarget(null)}
          onWarn={() => {
            setWarnTarget(null);
            showSuccess('Action issued');
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
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
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
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                    "{flag.postContent}"
                  </p>
                  {flag.note && (
                    <p className="mt-1 text-xs text-slate-400 italic">Note: {flag.note}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleReviewFlag(flag.id, flag.postId, 'REJECT')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                  >
                    <XCircle size={13} /> Dismiss
                  </button>
                  <button
                    onClick={() => handleReviewFlag(flag.id, flag.postId, 'APPROVE')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-3 py-2 text-xs font-bold text-white hover:bg-red-600"
                  >
                    <Trash2 size={13} /> Remove Post
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
          ) : warnings.map((w) => (
            <div key={w.id} className="flex items-center gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${w.level === 'SUSPEND' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                {w.level === 'SUSPEND' ? <ShieldOff size={18} /> : <AlertTriangle size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {w.user.name} — <span className={w.level === 'SUSPEND' ? 'text-red-500' : 'text-amber-500'}>{w.level}</span>
                </p>
                <p className="text-sm text-slate-500">{w.reason}</p>
                <p className="mt-1 text-xs text-slate-400">By {w.admin.name} · {timeAgo(w.createdAt)}</p>
              </div>
              <button
                onClick={() => setWarnTarget({ id: w.user.id, name: w.user.name ?? '' })}
                className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700"
              >
                + Action
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Banned words tab */}
      {activeTab === 'bannedWords' && (
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
            <div className="flex justify-center py-6"><Loader2 size={24} className="animate-spin" /></div>
          ) : bannedWords.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
              <p className="text-sm font-medium text-slate-400">No banned words configured yet.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {bannedWords.map((bw) => (
                <span key={bw.id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {bw.word}
                  <button onClick={() => handleDeleteWord(bw.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

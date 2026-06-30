'use client';

import { useState } from 'react';
import { isAxiosError } from 'axios';
import { Loader2, ShieldOff } from 'lucide-react';
import { forumService } from '../services/forum.service';
import type { WarningLevel } from '../types/forum.types';

const LEVELS: { value: WarningLevel; label: string; desc: string }[] = [
  { value: 'MINOR', label: 'Minor', desc: 'First warning. Informational only.' },
  { value: 'MAJOR', label: 'Major', desc: 'Repeated offence. Posting restricted for 24 hours.' },
  { value: 'BAN', label: 'Ban', desc: 'Ongoing pattern. Forum access suspended until lifted by an admin.' },
];

export function warnActionFeedback(level: WarningLevel, userName = 'The author') {
  switch (level) {
    case 'BAN':
      return {
        title: 'Forum ban issued',
        description: `${userName} cannot post in the forum until an admin lifts the ban.`,
      };
    case 'MAJOR':
      return {
        title: 'Major warning issued',
        description: `${userName} received a major warning. Posting is restricted for 24 hours.`,
      };
    default:
      return {
        title: 'Warning issued',
        description: `${userName} received a minor forum warning.`,
      };
  }
}

/**
 * Moderator action modal: issue a MINOR/MAJOR warning or a BAN against a user.
 * BAN is admin-only — pass `allowBan` to expose it. Used from the moderation
 * panel and from forum threads.
 */
export function WarnModal({
  userId,
  userName,
  allowBan = false,
  onClose,
  onWarn,
}: {
  userId: string;
  userName: string;
  allowBan?: boolean;
  onClose: () => void;
  onWarn: (level: WarningLevel) => void;
}) {
  const [level, setLevel] = useState<WarningLevel>('MINOR');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const levels = allowBan ? LEVELS : LEVELS.filter((l) => l.value !== 'BAN');

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await forumService.adminWarnUser(userId, { level, reason: reason.trim() });
      onWarn(level);
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

        <div className="mt-4 space-y-2">
          {levels.map((l) => {
            const selected = level === l.value;
            const selectedCls =
              l.value === 'BAN' ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                : l.value === 'MAJOR' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
                  : 'border-amber-500 bg-amber-50 dark:bg-amber-900/10';
            return (
              <label key={l.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 ${selected ? selectedCls : 'border-slate-200 dark:border-slate-700'}`}>
                <input type="radio" name="level" value={l.value} checked={selected} onChange={() => setLevel(l.value)} className="mt-0.5 accent-red-500" />
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{l.label}</p>
                  <p className="text-xs text-slate-400">{l.desc}</p>
                </div>
              </label>
            );
          })}
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

'use client';

import { useState } from 'react';
import { Check, Layers3, Loader2 } from 'lucide-react';
import mdwClient from '@/lib/mdwClient';

type Status = 'idle' | 'loading' | 'added';

/**
 * "Add to Drill" action shown under an MCQ answer on exam/practice result
 * pages. Creates a flashcard for the question; on success it locks into the
 * "Added ✓" state. Errors (e.g. duplicate card) surface via the global API
 * error toast and the button returns to its initial state.
 */
export function AddToDrillButton({ questionId }: { questionId: string }) {
  const [status, setStatus] = useState<Status>('idle');

  const handleClick = async () => {
    if (status !== 'idle') return;
    setStatus('loading');
    try {
      await mdwClient.post('/flashcards', { questionId });
      setStatus('added');
    } catch {
      setStatus('idle');
    }
  };

  if (status === 'added') {
    return (
      <div className="mt-4 flex justify-end">
        <button
          disabled
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-black text-green-600 opacity-80 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-400"
        >
          <Check size={14} strokeWidth={2.5} /> Added ✓
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 flex justify-end">
      <button
        onClick={handleClick}
        disabled={status === 'loading'}
        className="inline-flex items-center gap-2 rounded-xl border border-[#0A9AE2]/40 bg-[#0A9AE2]/5 px-4 py-2 text-sm font-black text-[#0A9AE2] transition-colors hover:bg-[#0A9AE2]/10 disabled:opacity-60 dark:border-[#0A9AE2]/30 dark:bg-[#0A9AE2]/10"
      >
        {status === 'loading' ? (
          <Loader2 size={14} strokeWidth={2.5} className="animate-spin" />
        ) : (
          <Layers3 size={14} strokeWidth={2.5} />
        )}
        Add to Drill
      </button>
    </div>
  );
}

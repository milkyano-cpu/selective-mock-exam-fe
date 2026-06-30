'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/auth.store';
import mdwClient from '@/lib/mdwClient';

/**
 * Number of flashcards due for review today, shown as a nav badge.
 * Students only — other roles always get 0. Refetched on every route change
 * so the badge stays fresh after a review session. Failures are silent
 * (mdwClient quiet-lists this endpoint): a missing badge is harmless, a
 * toast in the nav is not.
 */
export function useFlashcardsDueCount() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isStudent = user?.role === 'STUDENT';
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    if (!isStudent) return;
    let cancelled = false;
    mdwClient
      .get<{ data?: { due?: number } }>('/flashcards/stats')
      .then((response) => {
        if (!cancelled) setDueCount(response.data.data?.due ?? 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isStudent, pathname]);

  return isStudent ? dueCount : 0;
}

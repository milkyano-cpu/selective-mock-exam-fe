'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { showDataOutdatedToast } from '@/lib/errorAlert';

const STALE_THRESHOLD_MS = 15 * 60 * 1000;

export function StaleDataBootstrap() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.user));
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      hiddenAtRef.current = null;
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        return;
      }

      if (hiddenAtRef.current === null) return;
      const elapsed = Date.now() - hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (elapsed >= STALE_THRESHOLD_MS) {
        void showDataOutdatedToast();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated]);

  return null;
}

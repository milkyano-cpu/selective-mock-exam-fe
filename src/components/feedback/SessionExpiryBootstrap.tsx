'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { showSessionExpiringToast } from '@/lib/errorAlert';

const WARN_BEFORE_MS = 60_000;

export function SessionExpiryBootstrap() {
  const sessionExpiresAt = useAuthStore((s) => s.sessionExpiresAt);
  const isAuthenticated = useAuthStore((s) => Boolean(s.user));
  const lastWarnedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !sessionExpiresAt) return;

    const expiryMs = new Date(sessionExpiresAt).getTime();
    if (Number.isNaN(expiryMs)) return;

    const warnAt = expiryMs - WARN_BEFORE_MS;
    const delay = warnAt - Date.now();

    if (lastWarnedForRef.current === sessionExpiresAt) return;

    if (delay <= 0) {
      if (expiryMs > Date.now()) {
        lastWarnedForRef.current = sessionExpiresAt;
        void showSessionExpiringToast();
      }
      return;
    }

    const timer = window.setTimeout(() => {
      lastWarnedForRef.current = sessionExpiresAt;
      void showSessionExpiringToast();
    }, delay);

    return () => window.clearTimeout(timer);
  }, [sessionExpiresAt, isAuthenticated]);

  return null;
}

'use client';

import { AlertCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import {
  FEEDBACK_EVENT_NAME,
  showPendingFeedbackToast,
  type FeedbackIcon,
  type FeedbackNotice,
} from '@/lib/errorAlert';

const noticeTheme: Record<
  FeedbackIcon,
  { icon: typeof AlertCircle; iconClassName: string; progressClassName: string }
> = {
  success: {
    icon: CheckCircle2,
    iconClassName: 'bg-emerald-500/10 text-emerald-500',
    progressClassName: 'bg-emerald-500',
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: 'bg-amber-500/10 text-amber-500',
    progressClassName: 'bg-amber-500',
  },
  error: {
    icon: AlertCircle,
    iconClassName: 'bg-red-500/10 text-red-500',
    progressClassName: 'bg-red-500',
  },
};

export function FeedbackBootstrap() {
  const [notice, setNotice] = useState<FeedbackNotice | null>(null);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const showNotice = (event: Event) => {
      const nextNotice = (event as CustomEvent<FeedbackNotice>).detail;

      window.clearTimeout(timeoutRef.current);
      setNotice(nextNotice);
      timeoutRef.current = window.setTimeout(() => {
        setNotice((current) => (current?.key === nextNotice.key ? null : current));
      }, nextNotice.duration);
    };

    window.addEventListener(FEEDBACK_EVENT_NAME, showNotice);
    void showPendingFeedbackToast();

    return () => {
      window.removeEventListener(FEEDBACK_EVENT_NAME, showNotice);
      window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const dismissNotice = () => {
    window.clearTimeout(timeoutRef.current);
    setNotice(null);
  };

  const theme = notice ? noticeTheme[notice.icon] : null;
  const Icon = theme?.icon;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-5 z-[100] flex justify-center px-4 sm:top-7"
    >
      <AnimatePresence mode="wait">
        {notice && theme && Icon && (
          <motion.div
            key={notice.key}
            role={notice.icon === 'error' ? 'alert' : 'status'}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_14px_40px_rgba(15,23,42,0.14)] backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-[0_18px_46px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-start gap-3 px-4 pb-3.5 pt-3.5">
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${theme.iconClassName}`}>
                <Icon size={20} strokeWidth={2.3} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{notice.title}</p>
                  {notice.statusCode !== undefined && (
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      HTTP {notice.statusCode}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
                  {notice.description}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close notification"
                onClick={dismissNotice}
                className="mt-0.5 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <X size={16} />
              </button>
            </div>
            <motion.div
              key={`${notice.key}:timer`}
              className={`h-0.5 origin-left ${theme.progressClassName}`}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: notice.duration / 1000, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

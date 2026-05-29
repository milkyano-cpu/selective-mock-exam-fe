'use client';

import Link from 'next/link';
import { Crown, LockKeyhole } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';

type FeaturePaywallProps = {
  title: string;
  description: string;
  requiredTier?: 'STANDARD' | 'PREMIUM';
  compact?: boolean;
  /** Extra classes for the compact box — e.g. `flex-1` to fill the card height. */
  className?: string;
};

export function FeaturePaywall({ title, description, requiredTier = 'PREMIUM', compact = false, className = '' }: FeaturePaywallProps) {
  // Students don't manage their own billing — the parent does. Sending them to
  // /dashboard/billing dead-ends because that page is parent-only, so the CTA
  // becomes a plain message routing them to ask their parent instead.
  const role = useAuthStore((s) => s.user?.role);
  const isStudent = role === 'STUDENT';
  const isPremium = requiredTier === 'PREMIUM';

  // Compact = the inline paywall used inside dashboard cards. It mirrors the
  // dashed "locked feature" box from the design mockup: lock chip, title,
  // description, a tier pill, and (for non-students) the upgrade button.
  if (compact) {
    const boxClass = isPremium
      ? 'border-violet-200 bg-violet-50/50 dark:border-violet-900/40 dark:bg-violet-950/10'
      : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/30';
    const iconClass = isPremium
      ? 'bg-violet-100 text-violet-400 dark:bg-violet-900/40 dark:text-violet-300'
      : 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-300';
    const pillClass = isPremium
      ? 'border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-300'
      : 'border-[#0A9AE2]/20 bg-[#0A9AE2]/10 text-[#0A9AE2]';
    const btnClass = isPremium
      ? 'bg-violet-600 hover:bg-violet-700'
      : 'bg-[#0A9AE2] hover:bg-[#0887c9]';

    return (
      <div className={`flex min-h-[160px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center ${boxClass} ${className}`}>
        <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
          <LockKeyhole size={20} />
        </div>
        <p className="text-sm font-black text-slate-700 dark:text-slate-200">{title}</p>
        <p className="mt-1 max-w-xs text-xs font-medium leading-5 text-slate-400 dark:text-slate-500">{description}</p>
        <span className={`mt-2 inline-block rounded-full border px-2.5 py-1 text-xs font-bold ${pillClass}`}>
          {isPremium ? 'Premium plan' : 'Standard plan'}
        </span>
        {!isStudent && (
          <Link
            href="/dashboard/billing"
            className={`mt-3 inline-flex h-9 items-center justify-center rounded-xl px-4 text-xs font-bold text-white transition-colors ${btnClass}`}
          >
            View membership options →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[55vh] w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0A9AE2]/10 text-[#0A9AE2]">
        <LockKeyhole size={28} />
      </div>
      <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
        <Crown size={13} />
        {requiredTier} required
      </div>
      <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
        {title}
      </h1>
      <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {!isStudent && (
        <Link
          href="/dashboard/billing"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-[#0A9AE2] px-5 text-sm font-black text-white transition-colors hover:bg-[#0659AA]"
        >
          View membership options
        </Link>
      )}
    </div>
  );
}

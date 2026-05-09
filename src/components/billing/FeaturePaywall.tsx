'use client';

import Link from 'next/link';
import { Crown, LockKeyhole } from 'lucide-react';

type FeaturePaywallProps = {
  title: string;
  description: string;
  requiredTier?: 'STANDARD' | 'PREMIUM';
};

export function FeaturePaywall({ title, description, requiredTier = 'PREMIUM' }: FeaturePaywallProps) {
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
      <Link
        href="/dashboard/billing"
        className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-[#0A9AE2] px-5 text-sm font-black text-white transition-colors hover:bg-[#0659AA]"
      >
        View membership options
      </Link>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Crown, LockKeyhole } from 'lucide-react';

type FeaturePaywallProps = {
  title: string;
  description: string;
  requiredTier?: 'STANDARD' | 'PREMIUM';
  compact?: boolean;
};

export function FeaturePaywall({ title, description, requiredTier = 'PREMIUM', compact = false }: FeaturePaywallProps) {
  return (
    <div className={`mx-auto flex w-full max-w-2xl flex-col items-center justify-center text-center ${compact ? 'min-h-[180px] px-3 py-4' : 'min-h-[55vh] px-4'}`}>
      <div className={`flex items-center justify-center rounded-2xl bg-[#0A9AE2]/10 text-[#0A9AE2] ${compact ? 'h-11 w-11' : 'h-16 w-16'}`}>
        <LockKeyhole size={compact ? 20 : 28} />
      </div>
      <div className={`${compact ? 'mt-3' : 'mt-5'} inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300`}>
        <Crown size={13} />
        {requiredTier} required
      </div>
      <h1 className={`${compact ? 'mt-3 text-base' : 'mt-5 text-3xl'} font-black tracking-tight text-slate-950 dark:text-white`}>
        {title}
      </h1>
      <p className={`${compact ? 'mt-1.5 text-xs leading-5' : 'mt-3 text-sm leading-6'} max-w-xl font-medium text-slate-500 dark:text-slate-400`}>
        {description}
      </p>
      <Link
        href="/dashboard/billing"
        className={`${compact ? 'mt-3 h-9 rounded-xl px-4 text-xs' : 'mt-6 h-12 rounded-2xl px-5 text-sm'} inline-flex items-center justify-center bg-[#0A9AE2] font-black text-white transition-colors hover:bg-[#0659AA]`}
      >
        View membership options
      </Link>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';

export function AccessDeniedScreen() {
  const user = useAuthStore((s) => s.user);
  const isStaff = user?.role === 'ADMIN' || user?.role === 'TUTOR';

  const title = isStaff ? 'Access denied' : 'Access restricted';
  const description = isStaff
    ? "You don't have permission to perform this action."
    : "You don't have permission to do this.";

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="max-w-md text-center">
        <ShieldAlert className="mx-auto mb-4 text-red-500" size={48} />
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">{title}</h2>
        <p className="mt-2 font-medium text-slate-500 dark:text-slate-400">{description}</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0A9AE2] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0864B6] transition-all"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

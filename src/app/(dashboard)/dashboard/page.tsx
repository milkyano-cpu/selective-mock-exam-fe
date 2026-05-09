'use client';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { BannerCarousel } from '@/components/dashboard/BannerCarousel';
import {
  Zap,
  TrendingUp,
  Users,
} from 'lucide-react';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const userDisplayName = user?.fullName || user?.name || 'User';
  const firstName = userDisplayName.split(' ')[0];

  if (user?.role === 'ADMIN') {
    return (
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back, <span className="text-[#0A9AE2]">{firstName}</span>! 👋
            </h1>
            <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
              Here is what&apos;s happening with Aspire Academics today.
            </p>
          </div>
        </header>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 text-center shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 lg:p-20">
          <div className="w-20 h-20 bg-[#0A9AE2]/10 text-[#0A9AE2] rounded-3xl flex items-center justify-center mx-auto mb-8">
            <TrendingUp size={40} />
          </div>
          <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Platform Overview</h2>
          <p className="mx-auto max-w-md text-lg font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            This administrative dashboard allows you to manage users, update exam content, and monitor platform revenue.
          </p>
          
          <div className="mt-12 inline-flex items-center gap-3 px-6 py-3 bg-orange-50 text-orange-600 rounded-2xl font-black text-sm uppercase tracking-widest border border-orange-100">
            <Zap size={18} /> Analytics Under Construction
          </div>
        </div>
      </div>
    );
  }

  if (user?.role === 'TUTOR') {
    return (
      <div className="space-y-8">
        <BannerCarousel />
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back, <span className="text-[#0A9AE2]">{firstName}</span>! 👋
            </h1>
            <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
              Here is what&apos;s happening with your classes today.
            </p>
          </div>
        </header>
      </div>
    );
  }

  if (user?.role === 'PARENT') {
    return (
      <div className="space-y-8">
        <BannerCarousel />
        {/* Welcome Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Parent Dashboard <span className="text-[#0A9AE2]">.</span>
            </h1>
            <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
              Monitor students&apos; progress and manage accounts.
            </p>
          </div>
        </header>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 text-center shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 lg:p-20">
          <div className="w-20 h-20 bg-[#0A9AE2]/10 text-[#0A9AE2] rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3">
            <Users size={40} />
          </div>
          <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Welcome, {firstName}!</h2>
          <p className="mx-auto max-w-md text-lg font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            This specialized dashboard allows you to track mock exam results, analyze performance trends, and manage student subscriptions.
          </p>
          
          <div className="mt-12 inline-flex items-center gap-3 px-6 py-3 bg-orange-50 text-orange-600 rounded-2xl font-black text-sm uppercase tracking-widest border border-orange-100">
            <Zap size={18} /> Feature Under Construction
          </div>
        </div>

        {/* Quick Preview Grid for Parent */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50 pointer-events-none">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-2 font-bold text-slate-900 dark:text-slate-100">Linked Students</h3>
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Coming soon: View all registered students under your account.</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-2 font-bold text-slate-900 dark:text-slate-100">Recent Reports</h3>
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Coming soon: Download performance reports for your students.</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden sm:space-y-6">
      <div className="min-w-0 space-y-4">
        <header className="relative min-w-0 overflow-hidden px-5 py-5 sm:px-6">
          <div className="flex min-w-0 flex-col gap-4 pt-1 xl:min-h-[188px] xl:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#0A9AE2]">Student quest board</p>
              <h1 className="mt-1 break-words text-[clamp(1.55rem,4vw,2.1rem)] font-black leading-tight tracking-tight text-slate-900 dark:text-slate-100">
                Welcome back, <span className="text-[#0A9AE2]">{firstName}</span>
              </h1>
              <p className="mt-1 max-w-2xl break-words text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                Your current exam status, weak spots, and review queue in one glance.
              </p>
            </div>
          </div>
        </header>
      </div>
    </div>
  );
}


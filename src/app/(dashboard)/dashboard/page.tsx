'use client';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { 
  BookOpen, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Zap,
  TrendingUp,
  Users,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const userDisplayName = user?.fullName || user?.name || 'User';
  const firstName = userDisplayName.split(' ')[0];

  if (user?.role === 'ADMIN') {
    return (
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back, <span className="text-[#0A9AE2]">{firstName}</span>! 👋
            </h1>
            <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">
              Here is what's happening with Aspire Academics today.
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
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back, <span className="text-[#0A9AE2]">{firstName}</span>! 👋
            </h1>
            <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">
              Here is what's happening with your classes today.
            </p>
          </div>
        </header>
      </div>
    );
  }

  if (user?.role === 'PARENT') {
    return (
      <div className="space-y-8">
        {/* Welcome Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Parent Dashboard <span className="text-[#0A9AE2]">.</span>
            </h1>
            <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">
              Monitor your students&apos; academic progress and manage accounts.
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
    <div className="space-y-8">
      {/* Welcome Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Welcome back, <span className="text-[#0A9AE2]">{firstName}</span> 👋
          </h1>
          <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">
            You have 2 mock exams scheduled for this week.
          </p>
        </div>
        <Link 
          href="/dashboard/exams"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FF6900] text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:scale-[1.02] transition-transform active:scale-[0.98]"
        >
          Start New Practice <ArrowRight size={18} />
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard 
          icon={BookOpen} 
          label="Total Exams" 
          value="24" 
          color="bg-blue-500" 
          trend="+3 this week"
        />
        <StatCard 
          icon={CheckCircle2} 
          label="Completed" 
          value="18" 
          color="bg-green-500" 
          trend="75% rate"
        />
        <StatCard 
          icon={Zap} 
          label="Active Recall" 
          value="142" 
          color="bg-orange-500" 
          trend="Cards learned"
        />
        <StatCard 
          icon={TrendingUp} 
          label="Avg Score" 
          value="82%" 
          color="bg-purple-500" 
          trend="+5% improvement"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Exams */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Recent Mock Exams</h2>
            <Link href="/dashboard/exams" className="text-sm font-bold text-[#0A9AE2] hover:underline">View All</Link>
          </div>
          
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className={`flex items-center justify-between p-4 lg:p-6 ${i !== 2 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-[#0A9AE2] dark:bg-slate-800">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">Selective High School Practice #{10 - i}</h4>
                    <div className="mt-1 flex items-center gap-3 text-xs font-medium text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1"><Clock size={12} /> 45 mins</span>
                      <span>•</span>
                      <span>Numerical Reasoning</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-slate-900 dark:text-slate-100">{85 - i * 3}%</p>
                  <p className="text-[10px] font-bold text-green-500 uppercase">Passed</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions / Active Recall */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4">
            <button className="p-6 bg-gradient-to-br from-[#0A9AE2] to-[#0659AA] rounded-3xl text-white text-left group relative overflow-hidden shadow-xl shadow-blue-100">
              <div className="relative z-10">
                <Zap className="mb-4" size={32} />
                <h3 className="text-lg font-bold">Daily Flashcards</h3>
                <p className="text-blue-100 text-sm mt-1">Review 15 new concepts today.</p>
              </div>
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            </button>
            
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                <TrendingUp size={18} className="text-[#FF6900]" />
                Next Milestone
              </h3>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-50 dark:bg-slate-800">
                <div className="bg-[#FF6900] h-full w-2/3 rounded-full"></div>
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="font-bold text-slate-900 dark:text-slate-100">65%</span> towards Level 4 Diagnostic
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
  trend: string;
}

function StatCard({ icon: Icon, label, value, color, trend }: StatCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{value}</p>
        <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{trend}</p>
      </div>
    </div>
  );
}

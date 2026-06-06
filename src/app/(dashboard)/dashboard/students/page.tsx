'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { Users, Plus, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MyStudentsPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (user?.role === 'PARENT') {
      router.replace('/dashboard');
    }
  }, [router, user?.role]);

  if (user?.role === 'PARENT') {
    return null;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Students</h1>
          <p className="text-slate-500 font-medium mt-1">Manage and track your children&apos;s performance.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0A9AE2] text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:scale-[1.02] transition-transform active:scale-[0.98]">
          <Plus size={18} /> Register New Student
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Student Card 1 (Sample) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 lg:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-black">
                JD
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Jane Doe</h3>
                <p className="text-sm font-medium text-slate-400 mt-0.5">Year 5 • Selective Entry Prep</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100">
              Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Score</p>
              <p className="text-xl font-black text-slate-900">84%</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Exams Completed</p>
              <p className="text-xl font-black text-slate-900">12</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <BookOpen size={14} className="text-[#0A9AE2]" /> Recent Activity
            </h4>
            <div className="flex items-center justify-between py-2 border-b border-slate-50 text-sm">
              <span className="text-slate-600 font-medium">Numerical Reasoning #4</span>
              <span className="text-slate-900 font-black text-right">88%</span>
            </div>
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-600 font-medium">Reading Comprehension #2</span>
              <span className="text-slate-900 font-black text-right">76%</span>
            </div>
          </div>

          <button className="w-full mt-6 py-3 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
            View Full Progress <ArrowRight size={16} />
          </button>
        </motion.div>

        {/* Empty State / Add Student */}
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mb-4 shadow-sm">
            <Users size={32} />
          </div>
          <h3 className="font-bold text-slate-900">Add Another Student?</h3>
          <p className="text-sm text-slate-500 max-w-xs mt-1">You can register multiple students under your account to track their individual progress.</p>
          <button className="mt-6 font-bold text-[#0A9AE2] hover:underline flex items-center gap-2">
            Click here to add <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

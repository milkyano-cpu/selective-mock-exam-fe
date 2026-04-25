'use client';

import { useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { adminService } from '@/features/admin/services/admin.service';
import { UserPlus, Mail, Lock, ShieldAlert, Loader2, CheckCircle2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageUsersPage() {
  const user = useAuthStore((state) => state.user);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    role: 'TUTOR' as 'ADMIN' | 'TUTOR',
    fullName: '',
    email: '',
    password: '',
  });

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Access Denied</h2>
          <p className="mt-2 font-medium text-slate-500">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: any = { ...formData };
      if (!payload.password) {
        delete payload.password; // backend will auto-generate if missing
      }

      const res = await adminService.createStaff(payload);
      if (res.success) {
        setSuccessMsg(res.message || `Account for ${formData.fullName} created successfully. Credentials have been sent to the staff email.`);
        setFormData({ role: 'TUTOR', fullName: '', email: '', password: '' });
      } else {
        setErrorMsg(res.message || 'Failed to create account');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          Manage Users <span className="text-[#0A9AE2]">.</span>
        </h1>
        <p className="font-medium text-slate-500 dark:text-slate-400">
          Create and manage administrative and tutor accounts for the platform.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Create Tutor */}
        <div className="lg:col-span-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="border-b border-slate-100 dark:border-slate-800 p-6 md:p-8 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A9AE2]/10 text-[#0A9AE2]">
                <UserPlus size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create Staff Account</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Add a new TUTOR or ADMIN</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              <AnimatePresence>
                {errorMsg && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
                    {errorMsg}
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-medium flex items-start gap-3">
                    <CheckCircle2 className="shrink-0 mt-0.5" size={18} />
                    <span>{successMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-100 ml-1">Account Role</label>
                  <select 
                    value={formData.role} 
                    onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A9AE2] focus:ring-1 focus:ring-[#0A9AE2] transition-all text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 font-medium"
                  >
                    <option value="TUTOR">Tutor</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-100 ml-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="text-slate-400" size={18} />
                    </div>
                    <input 
                      type="text" 
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      placeholder="e.g. John Doe"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A9AE2] focus:ring-1 focus:ring-[#0A9AE2] transition-all text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-100 ml-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="text-slate-400" size={18} />
                    </div>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="e.g. john@aspire.com"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A9AE2] focus:ring-1 focus:ring-[#0A9AE2] transition-all text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-100 ml-1">Password (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="text-slate-400" size={18} />
                    </div>
                    <input 
                      type="password" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Leave blank to auto-generate"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A9AE2] focus:ring-1 focus:ring-[#0A9AE2] transition-all text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 bg-[#0A9AE2] text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-none hover:bg-[#0864B6] hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} /> Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} /> Create Account
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50/50 p-6 md:p-8 dark:border-slate-800 dark:bg-slate-900/50">
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-4">About Tutor Accounts</h3>
            <ul className="space-y-3 text-sm font-medium text-slate-600 dark:text-slate-400">
              <li className="flex gap-2"><div className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-[#0A9AE2]"></div> Tutors can grade mock exams and provide feedback.</li>
              <li className="flex gap-2"><div className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-[#0A9AE2]"></div> If you leave the password blank, a secure random password will be generated and sent by email.</li>
              <li className="flex gap-2"><div className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-[#0A9AE2]"></div> Welcome emails will be sent automatically to the new staff member containing their credentials.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loader2, Key, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const ChangePasswordForm = () => {
  const { changePassword, isLoading, error } = useAuth();
  const [success, setSuccess] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordValues) => {
    const res = await changePassword({
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    });
    
    if (res && res.success) {
      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 5000);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 sm:rounded-[1.75rem] sm:shadow-[0_18px_50px_-28px_rgba(15,23,42,0.24)]">
      <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/40 sm:px-6 sm:py-5 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0A9AE2]/10 text-[#0A9AE2] sm:h-10 sm:w-10 sm:rounded-2xl">
                <Key size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 sm:text-lg">Change Password</h3>
                <p className="hidden text-xs font-bold uppercase tracking-[0.18em] text-slate-400 sm:block">Security access</p>
              </div>
            </div>
            <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400 sm:mt-3 sm:text-sm">
              Update your password regularly to keep your account secure across all devices and dashboard sessions.
            </p>
          </div>

          <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:block">
            Minimum 8 characters with uppercase, lowercase, number, and symbol.
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div>

            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <div className="flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 p-4 text-green-600 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400">
                    <CheckCircle size={20} />
                    <p className="font-bold text-sm">Password updated successfully!</p>
                  </div>
                </motion.div>
              )}
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                    <p className="font-bold text-sm">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-4 rounded-xl border border-slate-200 px-3 py-3 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:hidden">
              Minimum 8 characters with uppercase, lowercase, number, and symbol.
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="current-password" className="text-sm font-bold text-slate-700 dark:text-slate-300">Current Password</label>
                <div className="relative">
                  <input 
                    id="current-password"
                    {...register('oldPassword')}
                    type={showOldPassword ? "text" : "password"}
                    aria-invalid={Boolean(errors.oldPassword)}
                    aria-describedby={errors.oldPassword ? 'current-password-error' : undefined}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-[#0A9AE2] dark:text-slate-500"
                  >
                    {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.oldPassword && <p id="current-password-error" className="mt-1 text-xs font-bold text-red-500">{errors.oldPassword.message}</p>}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="new-password" className="text-sm font-bold text-slate-700 dark:text-slate-300">New Password</label>
                  <div className="relative">
                    <input 
                      id="new-password"
                      {...register('newPassword')}
                      type={showNewPassword ? "text" : "password"}
                      aria-invalid={Boolean(errors.newPassword)}
                      aria-describedby={errors.newPassword ? 'new-password-error' : undefined}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-[#0A9AE2] dark:text-slate-500"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.newPassword && <p id="new-password-error" className="mt-1 text-xs font-bold text-red-500">{errors.newPassword.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm-new-password" className="text-sm font-bold text-slate-700 dark:text-slate-300">Confirm New Password</label>
                  <div className="relative">
                    <input 
                      id="confirm-new-password"
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? "text" : "password"}
                      aria-invalid={Boolean(errors.confirmPassword)}
                      aria-describedby={errors.confirmPassword ? 'confirm-new-password-error' : undefined}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-[#0A9AE2] dark:text-slate-500"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p id="confirm-new-password-error" className="mt-1 text-xs font-bold text-red-500">{errors.confirmPassword.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] py-3.5 font-bold text-white transition-all hover:bg-[#0864B6] disabled:bg-slate-300 sm:rounded-2xl sm:shadow-lg sm:shadow-blue-100"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Update Password'}
              </button>
            </form>
          </div>

          <div className="hidden grid-cols-1 gap-3 lg:grid">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Password rule</p>
              <p className="mt-2 text-sm font-black text-slate-900 dark:text-slate-100">Strong & unique</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Recommendation</p>
              <p className="mt-2 text-sm font-black text-slate-900 dark:text-slate-100">Rotate regularly</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { resetPasswordSchema, ResetPasswordValues } from '../schemas/reset-password.schema';
import { useAuth } from '../hooks/useAuth';

export const ResetPasswordForm = ({ token }: { token: string }) => {
  const { resetPassword, isLoading, error, resetError } = useAuth();

  const [done, setDone] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    const success = await resetPassword(token, data.newPassword);
    if (success) setDone(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full flex flex-col h-full justify-start pt-4 lg:pt-0 lg:justify-center"
    >
      <div className="mb-5 lg:mb-10">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-1 text-[24px] lg:text-3xl font-bold tracking-tight text-[#0A9AE2] lg:text-slate-900 text-center lg:text-left"
        >
          Set a New Password.
        </motion.h1>
        <p className="mt-2 text-slate-500 text-sm text-center lg:text-left">
          Choose a strong password for your account.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="relative w-full"
      >
        <div className="bg-white p-6 lg:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden w-full">

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center text-center py-4 gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle className="text-green-500" size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Password Updated!</h2>
                <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                  Your password has been changed successfully. All previous sessions have been logged out.
                </p>
                <Link
                  href="/login"
                  className="mt-2 w-full py-3.5 bg-[#FF6900] text-white font-bold rounded-xl text-center text-base shadow-lg shadow-[#FF6900]/20 hover:bg-[#e55e00] transition-all"
                >
                  Log in with New Password
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 lg:p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-red-600 font-bold text-xs">!</div>
                        <div className="pt-0.5">
                          <p className="font-medium">{error}</p>
                          {error.toLowerCase().includes('invalid or expired') && (
                            <Link
                              href="/forgot-password"
                              className="text-xs font-bold text-[#0A9AE2] hover:underline mt-1 inline-block"
                            >
                              Request a new link
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 lg:space-y-6 relative z-10 w-full">
                  <div className="space-y-1.5">
                    <label htmlFor="reset-new-password" className="text-[13px] font-medium text-slate-400 ml-1">New Password</label>
                    <div className="relative">
                      <input
                        id="reset-new-password"
                        {...register('newPassword', { onChange: () => error && resetError() })}
                        type={showNewPassword ? 'text' : 'password'}
                        aria-invalid={Boolean(errors.newPassword)}
                        aria-describedby={errors.newPassword ? 'reset-new-password-error' : undefined}
                        className={`w-full pl-4 pr-12 py-3.5 bg-slate-50/50 lg:bg-slate-50 border rounded-xl focus:outline-none transition-all duration-300 text-slate-900 font-medium text-[15px] ${
                          errors.newPassword
                            ? 'border-red-300 focus:border-red-500 focus:bg-red-50'
                            : 'border-slate-200 focus:border-[#0A9AE2] focus:bg-white'
                        }`}
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#0A9AE2] transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <AnimatePresence>
                      {errors.newPassword && (
                        <motion.p
                          id="reset-new-password-error"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="ml-1 text-xs font-bold text-red-500"
                        >
                          {errors.newPassword.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="reset-confirm-password" className="text-[13px] font-medium text-slate-400 ml-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        id="reset-confirm-password"
                        {...register('confirmPassword', { onChange: () => error && resetError() })}
                        type={showConfirmPassword ? 'text' : 'password'}
                        aria-invalid={Boolean(errors.confirmPassword)}
                        aria-describedby={errors.confirmPassword ? 'reset-confirm-password-error' : undefined}
                        className={`w-full pl-4 pr-12 py-3.5 bg-slate-50/50 lg:bg-slate-50 border rounded-xl focus:outline-none transition-all duration-300 text-slate-900 font-medium text-[15px] ${
                          errors.confirmPassword
                            ? 'border-red-300 focus:border-red-500 focus:bg-red-50'
                            : 'border-slate-200 focus:border-[#0A9AE2] focus:bg-white'
                        }`}
                        placeholder="Repeat your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#0A9AE2] transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <AnimatePresence>
                      {errors.confirmPassword && (
                        <motion.p
                          id="reset-confirm-password-error"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="ml-1 text-xs font-bold text-red-500"
                        >
                          {errors.confirmPassword.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="relative w-full py-3.5 lg:py-4 px-6 font-bold text-white text-base lg:text-lg rounded-xl shadow-lg shadow-[#FF6900]/20 disabled:bg-slate-300 disabled:shadow-none transition-all bg-[#FF6900]"
                  >
                    <div className="relative flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          <span>Resetting...</span>
                        </>
                      ) : (
                        <span>Reset Password</span>
                      )}
                    </div>
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-6 flex flex-col items-center gap-4 w-full"
      >
        <p className="text-slate-400 font-medium text-[13px]">
          Remembered your password?{' '}
          <Link href="/login" className="font-bold text-[#0659AA] hover:text-[#0A9AE2] transition-colors">
            Back to Login
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
};

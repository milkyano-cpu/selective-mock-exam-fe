'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginValues } from '../schemas/login.schema';
import { useAuth } from '../hooks/useAuth';
import { Loader2, ShieldCheck, Zap, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const LoginForm = () => {
  const { login, isLoading, error } = useAuth();
  const [isFocused, setIsFocused] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginValues) => {
    await login(data);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full flex flex-col h-full justify-center"
    >
      {/* Header Section (Mobile Reference Style) */}
      <div className="mb-6 lg:mb-10 text-center lg:text-left flex flex-col items-center lg:items-start">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
          className="w-full flex justify-center lg:justify-start -mb-2 lg:mb-2"
        >
          {/* Logo container for mobile */}
          <div className="lg:hidden flex justify-center scale-90 sm:scale-100 mb-2">
            <Image 
              src="/logo.png" 
              alt="Aspire Academics Logo" 
              width={160} 
              height={160} 
              priority
              className="object-contain"
            />
          </div>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-[28px] lg:text-4xl font-extrabold tracking-tight text-[#0A9AE2] lg:text-slate-900 uppercase lg:normal-case"
        >
          <span className="lg:hidden">Welcome Back</span>
          <span className="hidden lg:inline">Welcome Back <span className="text-[#0A9AE2]">.</span></span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-2 text-slate-500 font-medium text-sm lg:text-lg max-w-xs lg:max-w-none text-center lg:text-left"
        >
          Sign in to your account to continue.
        </motion.p>
      </div>

      {/* Main Form Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="relative w-full"
      >
        <div className="bg-[#FFFFFF] p-6 lg:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden w-full">
          
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 lg:p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                  <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-red-600 font-bold">
                    !
                  </div>
                  <p className="font-medium pt-0.5">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 lg:space-y-6 relative z-10 w-full">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-400 ml-1">
                Email
              </label>
              <div className={`relative transition-all duration-300`}>
                <input
                  {...register('email')}
                  type="email"
                  onFocus={() => setIsFocused('email')}
                  onBlur={() => setIsFocused(null)}
                  className={`w-full px-4 py-3.5 bg-slate-50/50 lg:bg-slate-50 border rounded-xl focus:outline-none transition-all duration-300 text-slate-900 font-medium text-[15px] ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:bg-red-50' 
                      : 'border-slate-200 focus:border-[#0A9AE2] focus:bg-white'
                  }`}
                  placeholder="Enter Your Email"
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="ml-1 text-xs font-bold text-red-500">
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-400 ml-1">
                Password
              </label>
              <div className={`relative transition-all duration-300`}>
                <input
                  {...register('password')}
                  type={showPassword ? "text" : "password"}
                  onFocus={() => setIsFocused('password')}
                  onBlur={() => setIsFocused(null)}
                  className={`w-full pl-4 pr-16 py-3.5 bg-slate-50/50 lg:bg-slate-50 border rounded-xl focus:outline-none transition-all duration-300 text-slate-900 font-medium text-[15px] ${
                    errors.password 
                      ? 'border-red-300 focus:border-red-500 focus:bg-red-50' 
                      : 'border-slate-200 focus:border-[#0A9AE2] focus:bg-white'
                  }`}
                  placeholder="Enter Your Password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#0A9AE2] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="ml-1 text-xs font-bold text-red-500">
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Forgot Password Link - Reference Style */}
            <div className="flex justify-end pt-1 pb-2">
              <a href="#" className="text-[13px] font-medium text-slate-400 hover:text-[#0A9AE2] transition-colors">
                Forgot Your Password?
              </a>
            </div>

            {/* Submit Button - CTA */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="relative w-full py-3.5 lg:py-4 px-6 font-bold text-white text-base lg:text-lg rounded-xl overflow-hidden group/btn shadow-lg shadow-[#FF6900]/20 disabled:bg-slate-300 disabled:shadow-none transition-all bg-[#FF6900]"
            >
              <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-white/20 skew-x-12 group-hover/btn:animate-[shine_1.5s_ease-in-out_infinite]" />
              <div className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </div>
            </motion.button>
            

          </form>
        </div>
      </motion.div>

      {/* Footer / Create Account - Reference Style */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-6 flex flex-col items-center gap-4 w-full"
      >
        <p className="text-slate-400 font-medium text-[13px]">
          Don't have an account?{' '}
          <a href="#" className="font-bold text-[#0659AA] hover:text-[#0A9AE2] transition-colors">
            Sign Up
          </a>
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-2 text-[12px] font-medium text-[#0659AA]">
          <a href="#" className="hover:underline">Terms and Conditions</a>
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="w-full text-center hover:underline mt-1">FAQs</a>
        </div>
      </motion.div>

      <style jsx global>{`
        @keyframes shine {
          100% {
            left: 200%;
          }
        }
      `}</style>
    </motion.div>
  );
};

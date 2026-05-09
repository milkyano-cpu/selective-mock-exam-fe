'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginValues } from '../schemas/login.schema';
import { useAuth } from '../hooks/useAuth';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export const LoginForm = () => {
  const { login, isLoading, error, resetError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const router = useRouter();

  const onSubmit = async (data: LoginValues) => {
    const result = await login(data);
    if (result) {
      router.push('/dashboard');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full flex flex-col h-full justify-start pt-4 lg:pt-0 lg:justify-center"
    >
      {/* Header Section (Mobile Reference Style) */}
      <div className="mb-5 lg:mb-10 text-center lg:text-left flex flex-col items-center lg:items-start">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
          className="w-full flex justify-center lg:justify-start -mb-2 lg:mb-2"
        >
          {/* Logo container - Hidden on mobile and desktop, as it's handled in LoginHeroCopy */}
          <div className="hidden justify-center scale-90 sm:scale-100 -mb-4 lg:mb-2">
            <Image 
              src="/logo.png" 
              alt="Aspire Academics Logo" 
              width={130} 
              height={130} 
              priority
              className="object-contain"
            />
          </div>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-1 text-[24px] lg:text-3xl font-bold tracking-tight text-[#0A9AE2] text-center lg:text-left"
        >
          Sign in to your account.
        </motion.h1>
      </div>

      {/* Main Form Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="relative w-full"
      >
        <div className="bg-[#FFFFFF] p-6 lg:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden w-full">
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 lg:space-y-6 relative z-10 w-full">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-[13px] font-medium text-slate-400 ml-1">
                Email
              </label>
              <div className={`relative transition-all duration-300`}>
                <input
                  id="login-email"
                  {...register('email', { onChange: () => error && resetError() })}
                  type="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
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
                  <motion.p id="login-email-error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="ml-1 text-xs font-bold text-red-500">
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-[13px] font-medium text-slate-400 ml-1">
                Password
              </label>
              <div className={`relative transition-all duration-300`}>
                <input
                  id="login-password"
                  {...register('password', { onChange: () => error && resetError() })}
                  type={showPassword ? "text" : "password"}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
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
                  <motion.p id="login-password-error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="ml-1 text-xs font-bold text-red-500">
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="ml-1 text-xs font-bold text-red-500">
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Forgot Password Link - Reference Style */}
            <div className="flex justify-end pt-1 pb-2">
              <Link href="/forgot-password" className="text-[13px] font-medium text-slate-400 hover:text-[#0A9AE2] transition-colors">
                Forgot Your Password?
              </Link>
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
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-bold text-[#0659AA] hover:text-[#0A9AE2] transition-colors">
            Sign Up
          </Link>
        </p>

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

'use client';

import { useForm, useFieldArray, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterValues } from '../schemas/register.schema';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Plus, Trash2, ArrowRight, User, Users, Mail, Phone, Home, Building2, IdCard, ChevronDown, PlusCircle, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import termsData from '../data/terms.json';

export const RegisterForm = () => {
  const { register: registerUser, isLoading, error } = useAuth();
  const router = useRouter();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const termsRef = useRef<HTMLDivElement>(null);
  const wasLoading = useRef(false);

  useEffect(() => {
    if (termsRef.current) {
      if (termsRef.current.scrollHeight <= termsRef.current.clientHeight + 2) {
        setHasScrolledToBottom(true);
      }
    }
  }, []);

  useEffect(() => {
    if (wasLoading.current && !isLoading && error) {
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    }
    wasLoading.current = isLoading;
  }, [isLoading, error]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 2) {
      setHasScrolledToBottom(true);
    }
  };

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      parent: {
        fullName: '',
        email: '',
        phoneNumber: '',
        address: '',
      },
      students: [
        {
          fullName: '',
          email: '',
          gender: 'MALE',
          yearLevel: '',
          schoolName: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'students',
  });

  const onSubmit = async (data: RegisterValues) => {
    const res = await registerUser(data);
    if (res && res.success) {
      setSuccessMsg('Registration successful! Please check your email for login credentials.');
      setTimeout(() => {
        router.push('/login');
      }, 5000);
    }
  };

  const onError = (_errors: FieldErrors<RegisterValues>) => {
    setTimeout(() => {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.tagName !== 'BODY') {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  if (successMsg) {
    return (
      <div className="bg-[#FFFFFF] p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Success!</h2>
        <p className="text-slate-500 mb-6">{successMsg}</p>
        <Link href="/login" className="inline-flex items-center gap-2 font-bold text-[#0A9AE2] hover:underline">
          Go to Login <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      {/* Header Section */}
      <div className="mb-6 lg:mb-10 text-left">
        <h1 className="text-[28px] lg:text-4xl font-extrabold tracking-tight text-slate-900">
          Create Account <span className="text-[#0A9AE2]">.</span>
        </h1>
        <p className="mt-2 text-slate-500 font-medium text-sm lg:text-lg">
          Join Aspire Selective Entry Preparation today.
        </p>
      </div>

      <div className="w-full">
        
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4">
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <p className="font-medium pt-0.5">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
          
          {/* Parent Information Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <User className="text-[#0A9AE2]" size={20} />
              <h3 className="text-[16px] font-bold text-slate-900">Parent Information</h3>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="register-fullname" className="text-[13px] font-medium text-slate-900 ml-1">Full Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <IdCard className="text-slate-400" size={18} />
                  </div>
                  <input id="register-fullname" {...register('parent.fullName')} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A9AE2] focus:ring-1 focus:ring-[#0A9AE2] transition-all text-slate-900 text-[14px] placeholder:text-slate-400" placeholder="e.g. Jane Doe" />
                </div>
                {errors.parent?.fullName && <p className="text-xs text-red-500 ml-1">{errors.parent.fullName.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="register-email" className="text-[13px] font-medium text-slate-900 ml-1">Email Address <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="text-slate-400" size={18} />
                    </div>
                    <input id="register-email" {...register('parent.email')} type="email" className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A9AE2] focus:ring-1 focus:ring-[#0A9AE2] transition-all text-slate-900 text-[14px] placeholder:text-slate-400" placeholder="e.g. jane@example.com" />
                  </div>
                  {errors.parent?.email && <p className="text-xs text-red-500 ml-1">{errors.parent.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="register-phone" className="text-[13px] font-medium text-slate-900 ml-1">Phone Number <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="text-slate-400" size={18} />
                    </div>
                    <input {...register('parent.phoneNumber')} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A9AE2] focus:ring-1 focus:ring-[#0A9AE2] transition-all text-slate-900 text-[14px] placeholder:text-slate-400" placeholder="e.g. +61 412 345 678" />
                  </div>
                  {errors.parent?.phoneNumber && <p className="text-xs text-red-500 ml-1">{errors.parent.phoneNumber.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="register-address" className="text-[13px] font-medium text-slate-900 ml-1">Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Home className="text-slate-400" size={18} />
                  </div>
                  <input id="register-address" {...register('parent.address')} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A9AE2] focus:ring-1 focus:ring-[#0A9AE2] transition-all text-slate-900 text-[14px] placeholder:text-slate-400" placeholder="e.g. 123 Main Street, Truganina VIC 3029" />
                </div>
                {errors.parent?.address && <p className="text-xs text-red-500 ml-1">{errors.parent.address.message}</p>}
              </div>
            </div>
          </div>

          {/* Student Cards */}
          {fields.map((field, index) => (
            <motion.div 
              key={field.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <User className="text-[#0A9AE2]" size={20} />
                  <h3 className="text-[16px] font-bold text-slate-900">Student {index + 1} Information</h3>
                </div>
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(index)} className="text-slate-400 hover:text-red-500 transition-colors text-sm font-medium flex items-center gap-1">
                    <Trash2 size={16} /> Remove
                  </button>
                )}
              </div>
              
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor={`student-name-${index}`} className="text-[13px] font-medium text-slate-900 ml-1">Student Name <span className="text-red-500">*</span></label>
                    <input id={`student-name-${index}`} {...register(`students.${index}.fullName`)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A9AE2] focus:ring-1 focus:ring-[#0A9AE2] transition-all text-slate-900 text-[14px] placeholder:text-slate-400" placeholder="Full Name" />
                    {errors.students?.[index]?.fullName && <p className="text-xs text-red-500 ml-1">{errors.students[index]?.fullName?.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor={`student-email-${index}`} className="text-[13px] font-medium text-slate-900 ml-1 flex items-center gap-1">
                      Student Email <span className="text-red-500">*</span> <span className="text-slate-400 font-normal">(Used for LMS Login)</span>
                    </label>
                    <input id={`student-email-${index}`} {...register(`students.${index}.email`)} type="email" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A9AE2] focus:ring-1 focus:ring-[#0A9AE2] transition-all text-slate-900 text-[14px] placeholder:text-slate-400" placeholder="Email Address" />
                    {errors.students?.[index]?.email && <p className="text-xs text-red-500 ml-1">{errors.students[index]?.email?.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2.5">
                    <label id={`student-gender-group-${index}`} className="text-[13px] font-medium text-slate-900 ml-1 block">Gender <span className="text-red-500">*</span></label>
                    <div role="radiogroup" aria-labelledby={`student-gender-group-${index}`} className="flex flex-row gap-6 px-1 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" value="MALE" {...register(`students.${index}.gender`)} className="w-4 h-4 accent-[#0A9AE2] border-slate-300 cursor-pointer" />
                        <span className="text-[14px] text-slate-900">Male</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" value="FEMALE" {...register(`students.${index}.gender`)} className="w-4 h-4 accent-[#0A9AE2] border-slate-300 cursor-pointer" />
                        <span className="text-[14px] text-slate-900">Female</span>
                      </label>
                    </div>
                    {errors.students?.[index]?.gender && <p className="text-xs text-red-500 ml-1">{errors.students[index]?.gender?.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor={`student-grade-${index}`} className="text-[13px] font-medium text-slate-900 ml-1">School Grade <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select id={`student-grade-${index}`} {...register(`students.${index}.yearLevel`)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A9AE2] focus:ring-1 focus:ring-[#0A9AE2] transition-all text-slate-900 text-[14px] appearance-none">
                        <option value="" disabled>Select Grade</option>
                        <option value="Year 3">Year 3</option>
                        <option value="Year 4">Year 4</option>
                        <option value="Year 5">Year 5</option>
                        <option value="Year 6">Year 6</option>
                        <option value="Year 7">Year 7</option>
                        <option value="Year 8">Year 8</option>
                        <option value="Year 9">Year 9</option>
                        <option value="Year 10">Year 10</option>
                        <option value="Year 11">Year 11</option>
                        <option value="Year 12">Year 12</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <ChevronDown className="text-slate-400" size={16} />
                      </div>
                    </div>
                    {errors.students?.[index]?.yearLevel && <p className="text-xs text-red-500 ml-1">{errors.students[index]?.yearLevel?.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor={`student-school-${index}`} className="text-[13px] font-medium text-slate-900 ml-1">School Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Building2 className="text-slate-400" size={18} />
                    </div>
                    <input id={`student-school-${index}`} {...register(`students.${index}.schoolName`)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A9AE2] focus:ring-1 focus:ring-[#0A9AE2] transition-all text-slate-900 text-[14px] placeholder:text-slate-400" placeholder="e.g. Melbourne High School" />
                  </div>
                  {errors.students?.[index]?.schoolName && <p className="text-xs text-red-500 ml-1">{errors.students[index]?.schoolName?.message}</p>}
                </div>
              </div>
            </motion.div>
          ))}

          <div className="flex justify-start">
            <button 
              type="button" 
              onClick={() => append({ fullName: '', email: '', gender: 'MALE', yearLevel: '', schoolName: '' })}
              className="flex items-center gap-2 px-5 py-2.5 border-2 border-dashed border-[#0A9AE2]/60 text-[#0A9AE2] font-semibold text-[14px] rounded-full hover:bg-[#0A9AE2]/5 transition-colors"
            >
              <PlusCircle size={18} /> Add Another Student
            </button>
          </div>

          {/* Terms & Conditions Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <FileText className="text-[#0A9AE2]" size={20} />
              <h3 className="text-[16px] font-bold text-slate-900">Terms & Conditions, Payment Policy & Privacy Policy</h3>
            </div>
            
            <div className="p-6 space-y-5">
              <div 
                ref={termsRef}
                onScroll={handleScroll}
                className="h-[280px] overflow-y-auto bg-slate-50/70 border border-slate-200 rounded-xl p-5 md:p-6 text-[13px] text-slate-600 space-y-5 custom-scrollbar"
              >
                <div>
                  <h4 className="font-bold text-[15px] text-slate-900">{termsData.title}</h4>
                  <h5 className="font-bold text-[14px] text-slate-800">{termsData.subtitle}</h5>
                  <p className="text-slate-400 text-xs mt-1">Last updated: {termsData.lastUpdated}</p>
                </div>

                {termsData.sections.map((section) => (
                  <div key={section.heading} className="space-y-1">
                    <h5 className="font-bold text-slate-800">{section.heading}</h5>
                    <p className="leading-relaxed">{section.content}</p>
                  </div>
                ))}
              </div>

              <label htmlFor="register-terms" className={`flex items-start gap-3 pt-2 ${!hasScrolledToBottom ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                <input id="register-terms" type="checkbox" 
                  checked={agreedToTerms} 
                  onChange={(e) => {
                    if (hasScrolledToBottom) setAgreedToTerms(e.target.checked);
                  }} 
                  disabled={!hasScrolledToBottom}
                  className={`w-4 h-4 mt-0.5 accent-[#0A9AE2] border-slate-300 rounded ${!hasScrolledToBottom ? 'cursor-not-allowed' : 'cursor-pointer'}`} 
                />
                <div className="flex flex-col">
                  <span className="text-[14px] text-slate-900 font-medium leading-tight">I agree to the Terms & Conditions, Payment Policy and Privacy Policy</span>
                  {!hasScrolledToBottom && (
                    <span className="text-[12px] text-[#FF6900] mt-1 font-medium">* Please scroll to the bottom of the terms to agree</span>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || !agreedToTerms}
              className="relative py-2.5 px-6 font-bold text-white text-[14px] rounded-lg overflow-hidden shadow-lg shadow-[#FF6900]/20 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed transition-all bg-[#FF6900] hover:bg-[#E55E00] flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ArrowRight size={16} className="ml-1" />
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
      
      <div className="mt-6 flex flex-col items-center gap-4 w-full">
        <p className="text-slate-400 font-medium text-[13px]">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-[#0659AA] hover:text-[#0A9AE2] transition-colors">
            Login
          </Link>
        </p>
      </div>

    </motion.div>
  );
};


'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { studentMenuItems, parentMenuItems, adminMenuItems, tutorMenuItems } from '@/constants/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MoreHorizontal, X } from 'lucide-react';

export const BottomNav = () => {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  let menuItems = studentMenuItems;
  if (user?.role === 'PARENT') menuItems = parentMenuItems;
  if (user?.role === 'ADMIN') menuItems = adminMenuItems;
  if (user?.role === 'TUTOR') menuItems = tutorMenuItems;

  const isStudent = user?.role === 'STUDENT' || !user?.role;
  const isParent = user?.role === 'PARENT';
  const useStudentStyle = isStudent || isParent;
  const isItemActive = (href: string) => href === '/dashboard'
    ? pathname === '/dashboard'
    : pathname.startsWith(href);

  // Close the More sheet on route change
  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsMoreOpen(false);
  }, []);

  useEffect(() => {
    if (isMoreOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isMoreOpen, handleKeyDown]);

  if (useStudentStyle) {
    // Show first 4 items + More
    const primaryItems = menuItems.slice(0, 4);
    const moreItems = menuItems.slice(4);
    const isMoreActive = moreItems.some((item) => isItemActive(item.href));

    return (
      <div data-bottom-nav="">
        {/* More Popover */}
        <AnimatePresence>
          {isMoreOpen && (
            <>
              <motion.div
                key="more-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[60] lg:hidden"
                onClick={() => setIsMoreOpen(false)}
              />
              <motion.div
                key="more-popover"
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-[70] w-52 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.14),0_2px_8px_rgba(15,23,42,0.08)] dark:border-slate-700/60 dark:bg-slate-800 dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] lg:hidden"
              >
                <button
                  type="button"
                  onClick={() => setIsMoreOpen(false)}
                  className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ChevronLeft size={18} strokeWidth={2.2} className="text-slate-400" />
                  Back
                </button>
                {moreItems.map((item) => {
                  const active = isItemActive(item.href);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={[
                        'flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors',
                        active
                          ? 'bg-[#E8F7FD] text-[#0A9AE2] dark:bg-cyan-950/30'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800',
                      ].join(' ')}
                    >
                      <item.icon size={18} strokeWidth={active ? 2.2 : 1.8} className={active ? 'text-[#0A9AE2]' : 'text-slate-400 dark:text-slate-500'} />
                      {item.label}
                    </Link>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-[430px] -translate-x-1/2 lg:hidden">
          <div className="flex h-[72px] items-center justify-around rounded-full border border-slate-200/80 bg-white px-4 shadow-[0_8px_32px_rgba(15,23,42,0.14),0_2px_8px_rgba(15,23,42,0.08)] dark:border-slate-700/60 dark:bg-slate-800 dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            {primaryItems.map((item) => {
              const isActive = isItemActive(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-center"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="relative flex h-9 items-center justify-center px-5">
                    {isActive && (
                      <motion.div
                        layoutId="student-nav-bubble"
                        className="absolute inset-0 rounded-full bg-[#E8F7FD] dark:bg-cyan-950/50"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <item.icon
                      size={22}
                      strokeWidth={isActive ? 2.4 : 1.8}
                      className={`relative z-10 transition-colors duration-200 ${isActive ? 'text-[#0A9AE2]' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'}`}
                    />
                  </div>
                  <span className={`text-[10px] leading-none transition-colors duration-200 ${isActive ? 'font-extrabold text-[#0A9AE2]' : 'font-bold text-slate-400 dark:text-slate-500'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* More button */}
            <button
              type="button"
              onClick={() => setIsMoreOpen((prev) => !prev)}
              className="group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-center"
            >
              <div className="relative flex h-9 items-center justify-center px-5">
                {(isMoreActive || isMoreOpen) && (
                  <motion.div
                    layoutId="student-nav-bubble"
                    className="absolute inset-0 rounded-full bg-[#E8F7FD] dark:bg-cyan-950/50"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <MoreHorizontal
                  size={22}
                  strokeWidth={(isMoreActive || isMoreOpen) ? 2.4 : 1.8}
                  className={`relative z-10 transition-colors duration-200 ${(isMoreActive || isMoreOpen) ? 'text-[#0A9AE2]' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'}`}
                />
              </div>
              <span className={`text-[10px] leading-none transition-colors duration-200 ${(isMoreActive || isMoreOpen) ? 'font-extrabold text-[#0A9AE2]' : 'font-bold text-slate-400 dark:text-slate-500'}`}>
                More
              </span>
            </button>
          </div>
        </nav>
      </div>
    );
  }

  const displayItems = menuItems.slice(0, 5);

  return (
    <nav data-bottom-nav="" className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-50 w-[calc(100%-2rem)] max-w-[390px] -translate-x-1/2 lg:hidden">
      <div
        className={[
          'relative overflow-hidden border p-1.5 backdrop-blur-2xl backdrop-saturate-150',
          'before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-white/80',
          'rounded-[28px] border-slate-200/80 bg-white/92 shadow-[0_8px_32px_rgba(15,23,42,0.14),0_2px_8px_rgba(15,23,42,0.08)] dark:border-slate-700/60 dark:bg-slate-800/95 dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
        ].join(' ')}
      >
        <div className="relative flex h-16 items-center gap-1">
          {displayItems.map((item) => {
            const isActive = isItemActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-center rounded-[26px] px-1 text-center transition-all duration-300"
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 z-0 rounded-[26px] bg-[#0A9AE2] shadow-[0_10px_24px_rgba(10,154,226,0.32),inset_0_1px_0_rgba(255,255,255,0.26)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <div className={`relative z-10 transition-all duration-300 ${isActive ? '-translate-y-0.5 scale-105 text-white' : 'text-slate-500 dark:text-slate-400 group-hover:-translate-y-0.5 group-hover:text-slate-900 dark:group-hover:text-slate-200'}`}>
                  <item.icon size={21} strokeWidth={isActive ? 2.6 : 2.15} />
                </div>

                <span className={`relative z-10 mt-1 max-w-full truncate text-[10px] font-black leading-none transition-all duration-300 ${isActive ? 'text-white opacity-100' : 'max-h-0 text-slate-500/80 opacity-0 dark:text-slate-400/80'}`}>
                  {item.label}
                </span>

              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

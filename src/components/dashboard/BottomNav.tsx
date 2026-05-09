'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { studentMenuItems, parentMenuItems, adminMenuItems, tutorMenuItems } from '@/constants/navigation';
import { motion } from 'framer-motion';

export const BottomNav = () => {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  let menuItems = studentMenuItems;
  if (user?.role === 'PARENT') menuItems = parentMenuItems;
  if (user?.role === 'ADMIN') menuItems = adminMenuItems;
  if (user?.role === 'TUTOR') menuItems = tutorMenuItems;

  const displayItems = menuItems.slice(0, 5);
  const isStudent = user?.role === 'STUDENT' || !user?.role;
  const isItemActive = (href: string) => href === '/dashboard'
    ? pathname === '/dashboard'
    : pathname.startsWith(href);

  if (isStudent) {
    return (
      <nav className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.9rem)] left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-[430px] -translate-x-1/2 lg:hidden">
        <div className="relative h-[76px] overflow-hidden rounded-full border border-white/45 bg-white/30 px-1 py-2 shadow-[0_18px_42px_rgba(15,23,42,0.22),inset_0_1px_1px_rgba(255,255,255,0.72),inset_0_-1px_1px_rgba(255,255,255,0.18)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-slate-900/34 dark:shadow-[0_18px_42px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-white/80" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/35 via-white/8 to-slate-900/10 dark:from-white/10 dark:via-white/5 dark:to-black/20" />
          <div className="relative flex h-full items-center overflow-x-auto scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {menuItems.map((item) => {
              const isActive = isItemActive(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group relative flex h-full w-[72px] shrink-0 flex-col items-center justify-center rounded-full text-center transition-transform duration-300 active:scale-95"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon
                    size={25}
                    strokeWidth={isActive ? 2.6 : 2.25}
                    className={`transition-all duration-300 ${isActive ? 'text-[#0A9AE2]' : 'text-slate-700 group-hover:text-[#0A9AE2] dark:text-slate-100'}`}
                  />
                  <span className={`mt-1 max-w-full truncate text-[10px] font-black leading-none transition-colors duration-300 ${isActive ? 'text-[#0A9AE2]' : 'text-slate-700/90 dark:text-slate-100/82'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-50 w-[calc(100%-2rem)] max-w-[390px] -translate-x-1/2 lg:hidden">
      <div
        className={[
          'relative overflow-hidden border p-1.5 backdrop-blur-2xl backdrop-saturate-150',
          'before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-white/80',
          isStudent
            ? 'rounded-[34px] border-white/65 bg-white/52 shadow-[0_18px_45px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-white/10 dark:bg-slate-950/58 dark:shadow-[0_18px_45px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.08)]'
            : 'rounded-[28px] border-white/70 bg-white/78 shadow-[0_20px_50px_rgba(14,116,144,0.18)] dark:border-white/10 dark:bg-slate-950/86 dark:shadow-[0_20px_50px_rgba(0,0,0,0.34)]',
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

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookMarked,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useFlashcardsDueCount } from '@/features/flashcards/hooks/useFlashcardsDueCount';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { studentMenuItems, parentMenuItems, adminMenuItems, adminMenuGroups, tutorMenuItems, tutorMenuGroups } from '@/constants/navigation';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const flashcardsDueCount = useFlashcardsDueCount();
  const { resolvedTheme } = useTheme();
  const isStudent = user?.role === 'STUDENT';
  const isAdmin = user?.role === 'ADMIN';
  const isTutor = user?.role === 'TUTOR';
  const isStaff = isAdmin || isTutor;
  const studentTones = [
    'from-cyan-500 to-sky-500',
    'from-violet-500 to-fuchsia-500',
    'from-orange-500 to-amber-400',
    'from-emerald-500 to-teal-400',
    'from-rose-500 to-pink-500',
    'from-blue-500 to-indigo-500',
    'from-slate-600 to-slate-800',
  ];
  
  let menuItems = studentMenuItems;
  if (user?.role === 'PARENT') menuItems = parentMenuItems;
  if (user?.role === 'ADMIN') menuItems = adminMenuItems;
  if (user?.role === 'TUTOR') menuItems = tutorMenuItems;

  return (
    <div className={[
      'flex h-full w-64 flex-col border-r transition-colors',
      isStudent
        ? 'border-white/70 bg-white/82 shadow-[10px_0_40px_rgba(14,116,144,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/82'
        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950',
    ].join(' ')}>
      <div className={[
        'relative flex flex-col',
        isStaff ? 'h-[52px] shrink-0 items-center justify-center border-b border-slate-200 px-4 dark:border-slate-800' : 'items-start px-6 pb-4 pt-6',
      ].join(' ')}>
        {isStudent && (
          <div className="absolute inset-x-4 top-4 h-24 rounded-[28px] bg-[linear-gradient(135deg,#0A9AE2_0%,#7C3AED_55%,#FF6900_100%)] opacity-12 dark:opacity-20" />
        )}
        <Link 
          href="/dashboard" 
          className={[
            'relative flex items-center overflow-hidden transition-transform hover:scale-105 active:scale-95',
            isStaff ? 'h-10 justify-center' : '-ml-4 h-14',
          ].join(' ')}
        >
          <img 
            src={resolvedTheme === 'dark' ? '/logo-darkmode.png' : '/logo.png'} 
            alt="Aspire Academics" 
            className={`${isStaff ? 'w-36' : 'w-52'} h-auto object-contain`}
          />
        </Link>
        {onClose && (
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800 lg:hidden"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className={[
        'flex-1 overflow-y-auto',
        isAdmin
          ? 'min-h-0 px-2 pb-5 pt-3 lg:flex lg:flex-col lg:justify-between lg:pt-4'
          : isTutor
            ? 'min-h-0 px-2 pb-5 pt-4'
            : 'space-y-1 px-4 py-2',
      ].join(' ')}>
        {(user?.role === 'ADMIN' || user?.role === 'TUTOR') ? (
          (user?.role === 'ADMIN' ? adminMenuGroups : tutorMenuGroups).map((section, idx) => (
            <div key={section.group ?? 'top'} className={idx > 0 ? (isAdmin ? 'pt-3 lg:pt-0' : isTutor ? 'pt-5' : 'pt-4') : ''}>
              {section.group && (
                <p className={[
                  'font-semibold uppercase text-slate-400 dark:text-slate-500',
                  isStaff ? 'px-2 pb-1.5 text-[10px] leading-4 tracking-[0.12em]' : 'px-4 pb-1 text-[10px] tracking-wider',
                ].join(' ')}>
                  {section.group}
                </p>
              )}
              {section.items.map((item) => {
                const isActive = item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onClose}
                    className={[
                      'flex items-center font-medium transition-all duration-200',
                      isStaff ? 'h-10 gap-3.5 rounded-lg px-6 text-sm' : 'gap-3 rounded-xl px-4 py-2.5',
                      isStaff
                        ? isActive
                          ? 'bg-[#0A9AE2]/10 text-[#0A9AE2] dark:bg-[#0A9AE2]/15 dark:text-[#38BDF8]'
                          : 'text-slate-950 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-900'
                        : isActive
                          ? 'bg-[#0A9AE2]/10 text-[#0A9AE2]'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100',
                    ].join(' ')}
                  >
                    <item.icon size={isStaff ? 18 : 20} />
                    <span>{item.label}</span>
                    {isActive && !isStaff && (
                      <motion.div
                        layoutId="active-pill"
                        className="ml-auto h-1.5 w-1.5 rounded-full bg-[#0A9AE2]"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          ))
        ) : (
          menuItems.map((item, index) => {
            const isActive = item.href === '/dashboard' 
              ? pathname === '/dashboard' 
              : pathname.startsWith(item.href);
            const tone = studentTones[index % studentTones.length];
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={[
                  'group flex items-center gap-3 rounded-2xl px-3.5 py-3 font-bold transition-all duration-200',
                  isStudent
                    ? isActive
                      ? `bg-gradient-to-r ${tone} text-white shadow-lg shadow-sky-500/15`
                      : 'text-slate-600 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 hover:shadow-md dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                    : isActive
                      ? 'bg-[#0A9AE2]/10 text-[#0A9AE2]'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100',
                ].join(' ')}
              >
                <span className={[
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                  isStudent
                    ? isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-sky-50 group-hover:text-[#0A9AE2] dark:bg-slate-800 dark:text-slate-300'
                    : '',
                ].join(' ')}>
                  <item.icon size={isStudent ? 18 : 20} />
                </span>
                <span className="truncate">{item.label}</span>
                {item.href === '/dashboard/flashcards' && flashcardsDueCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white">
                    {flashcardsDueCount}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className={`${item.href === '/dashboard/flashcards' && flashcardsDueCount > 0 ? 'ml-2' : 'ml-auto'} h-2 w-2 rounded-full ${isStudent ? 'bg-white' : 'bg-[#0A9AE2]'}`}
                  />
                )}
              </Link>
            );
          })
        )}
      </nav>

      {!isStaff && (
        <div className="mt-auto p-5">
          {isStudent ? (
            <div className="overflow-hidden rounded-3xl border border-white/70 bg-[linear-gradient(135deg,#ffffff_0%,#ecfeff_42%,#fff7ed_100%)] p-4 shadow-sm dark:border-white/10 dark:bg-[linear-gradient(135deg,#0f172a_0%,#082f49_52%,#27120a_100%)]">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FF6900] text-white shadow-lg shadow-orange-500/20">
                <BookMarked size={18} />
              </div>
              <p className="text-sm font-black text-slate-950 dark:text-white">Ready for the next level?</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500 dark:text-slate-300">
                Small daily drills build serious exam confidence.
              </p>
            </div>
          ) : (
            <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Version
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Mock Exam App v0.2.4
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

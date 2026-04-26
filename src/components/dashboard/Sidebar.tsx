'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Trophy, 
  Settings, 
  LogOut,
  X,
  Users,
  TrendingUp,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { ProfileAvatar } from './ProfileAvatar';
import { useProfilePhoto } from '@/features/users/hooks/useProfilePhoto';

const studentMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: BookOpen, label: 'Mock Exams', href: '/dashboard/exams' },
  { icon: FileText, label: 'Flashcards', href: '/dashboard/flashcards' },
  { icon: Trophy, label: 'Performance', href: '/dashboard/performance' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

const parentMenuItems = [
  { icon: LayoutDashboard, label: 'Parent Home', href: '/dashboard' },
  { icon: Users, label: 'My Students', href: '/dashboard/students' },
  { icon: TrendingUp, label: 'Exam Results', href: '/dashboard/results' },
  { icon: CreditCard, label: 'Billing', href: '/dashboard/billing' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

const adminMenuItems = [
  { icon: LayoutDashboard, label: 'Admin Panel', href: '/dashboard' },
  { icon: Users, label: 'Manage Users', href: '/dashboard/users' },
  { icon: BookOpen, label: 'Manage Subjects', href: '/dashboard/subjects' },
  { icon: DollarSign, label: 'Revenue', href: '#' },
  { icon: Settings, label: 'Settings', href: '#' },
];

const tutorMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Students & Classes', href: '#' },
  { icon: FileText, label: 'Assignments', href: '#' },
  { icon: BookOpen, label: 'Grading & Reviews', href: '#' },
  { icon: Trophy, label: 'Question Bank', href: '#' },
  { icon: TrendingUp, label: 'Study Resources', href: '#' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
  const pathname = usePathname();
  const { logout } = useAuth();
  const user = useAuthStore((state) => state.user);
  const { photoUrl, isLoading } = useProfilePhoto();
  const { resolvedTheme } = useTheme();
  
  let menuItems = studentMenuItems;
  if (user?.role === 'PARENT') menuItems = parentMenuItems;
  if (user?.role === 'ADMIN') menuItems = adminMenuItems;
  if (user?.role === 'TUTOR') menuItems = tutorMenuItems;

  return (
    <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-950">
      <div className="px-6 pt-6 pb-6 flex flex-col items-start relative">
        <Link 
          href="/dashboard" 
          className="transition-transform hover:scale-105 active:scale-95 -ml-4 h-14 flex items-center overflow-hidden"
        >
          <img 
            src={resolvedTheme === 'dark' ? '/logo-darkmode.png' : '/logo.png'} 
            alt="Aspire Academics" 
            className="w-52 h-auto object-contain"
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

      <nav className="flex-1 px-4 py-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-[#0A9AE2]/10 text-[#0A9AE2]' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0A9AE2]"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 transition-all hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700">
          <div className="relative shrink-0">
            <ProfileAvatar name={user?.fullName || user?.name} photoUrl={photoUrl} isLoading={isLoading} />
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900"></div>
          </div>
          
          <div className="flex flex-1 flex-col overflow-hidden">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {user?.fullName || 'User'}
            </p>
            <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
              {user?.role || 'STUDENT'}
            </p>
          </div>

          <button
            onClick={() => logout()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-500"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

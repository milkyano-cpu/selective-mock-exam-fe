'use client';

import { Bell, ChevronDown, ChevronLeft, LogOut, Menu, Moon, MoreHorizontal, RefreshCw, Settings, Sun, CheckCheck, FileQuestion, ExternalLink, MessageSquare, Map, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSyncExternalStore, useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ProfileAvatar } from './ProfileAvatar';
import { GlobalSearch } from './GlobalSearch';
import { useProfilePhoto } from '@/features/users/hooks/useProfilePhoto';
import { useNotificationStore } from '@/features/notifications/store/notification.store';
import { notificationService } from '@/features/notifications/services/notification.service';
import { studentMenuItems } from '@/constants/navigation';

function timeAgo(dateStr: string): string {
  const timestamp = new Date(dateStr).getTime();
  if (!Number.isFinite(timestamp)) return 'Just now';
  const diff = Date.now() - timestamp;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

interface NavbarProps {
  onMenuClick?: () => void;
}

export const Navbar = ({ onMenuClick }: NavbarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const user = useAuthStore((state) => state.user);
  const { photoUrl, isLoading } = useProfilePhoto();
  const { logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef = useRef<HTMLDivElement>(null);
  const studentMobileProfileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const storeMarkAsRead = useNotificationStore((s) => s.markAsRead);
  const storeMarkAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const isStudent = user?.role === 'STUDENT';
  const isStaff = user?.role === 'ADMIN' || user?.role === 'TUTOR';
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideProfile =
        Boolean(profileRef.current?.contains(target)) ||
        Boolean(mobileProfileRef.current?.contains(target)) ||
        Boolean(studentMobileProfileRef.current?.contains(target));

      if (!isInsideProfile) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = useCallback(async (id: string) => {
    storeMarkAsRead(id);
    try { await notificationService.markAsRead(id); } catch { /* silent */ }
  }, [storeMarkAsRead]);

  const handleMarkAllAsRead = useCallback(async () => {
    storeMarkAllAsRead();
    try { await notificationService.markAllAsRead(); } catch { /* silent */ }
  }, [storeMarkAllAsRead]);

  const handleNotificationClick = useCallback(async (id: string, isRead: boolean, url?: string) => {
    if (!isRead) {
      await handleMarkAsRead(id);
    }
    setIsNotifOpen(false);
    if (url) {
      router.push(url);
    }
  }, [handleMarkAsRead, router]);

  const isDarkMode = mounted && theme === 'dark';

  return (
    <header className={[
      'sticky top-0 z-30 flex items-center justify-between border-b px-3 sm:px-4 lg:px-8 lg:backdrop-blur-2xl',
      isStudent
        ? 'h-[4.75rem] border-white/70 bg-[#eefbff] shadow-[0_10px_28px_rgba(14,116,144,0.10)] dark:border-white/10 dark:bg-slate-950 lg:h-20 lg:border-white/45 lg:bg-white/38 lg:shadow-[0_18px_44px_rgba(14,116,144,0.12)] lg:supports-[backdrop-filter]:bg-white/28 lg:dark:bg-slate-950/42 lg:dark:supports-[backdrop-filter]:bg-slate-950/30'
        : `${isStaff ? 'h-[52px]' : ''} border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80`,
    ].join(' ')}>
      <div className="flex min-w-0 items-center gap-3 lg:gap-4">
        {isStudent && (
          <Link
            href="/dashboard"
            className="hidden h-[8.5rem] w-96 shrink-0 items-center overflow-visible rounded-2xl transition-transform hover:scale-105 active:scale-95 sm:w-[26rem] lg:flex"
          >
            <img
              src={isDarkMode ? '/logo-darkmode.png' : '/logo.png'}
              alt="Aspire Academics"
              className="h-[8.5rem] w-full object-contain object-left"
            />
          </Link>
        )}

        {isStudent && (
          <div className="relative lg:hidden" ref={studentMobileProfileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex max-w-[210px] items-center gap-2 rounded-2xl border border-white/70 bg-white/72 py-1.5 pl-1.5 pr-3 shadow-sm backdrop-blur-xl transition-colors hover:bg-white dark:border-white/10 dark:bg-slate-900/70 dark:hover:bg-slate-800"
            >
              <div className="relative shrink-0">
                <ProfileAvatar name={user?.fullName || user?.name} photoUrl={photoUrl} isLoading={isLoading} className="h-10 w-10 rounded-xl" iconSize={17} textClassName="text-xs" />
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900"></div>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-xs font-black leading-tight text-slate-900 dark:text-slate-100">
                  {user?.fullName || 'Student'}
                </p>
                <p className="truncate text-[10px] font-bold uppercase leading-tight text-slate-500 dark:text-slate-400">
                  {user?.tier || 'BASIC'}
                </p>
              </div>
              <ChevronDown
                size={13}
                className={`shrink-0 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isProfileOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/80 bg-white shadow-xl shadow-sky-900/10 animate-in fade-in slide-in-from-top-1 dark:border-white/10 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <p className="truncate text-sm font-black text-slate-900 dark:text-slate-100">{user?.fullName || 'Student'}</p>
                  <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{user?.email || ''}</p>
                </div>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Hamburger menu for admin/tutor on mobile */}
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-2xl p-2 text-slate-500 transition-colors hover:bg-white hover:text-[#0A9AE2] hover:shadow-sm lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Menu size={22} />
          </button>
        )}
        {/* Profile (Mobile Only) */}
        <div className={`${isStudent ? 'hidden' : 'relative lg:hidden'}`} ref={mobileProfileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="flex max-w-[150px] items-center gap-2 rounded-2xl border border-white/70 bg-white/75 py-1.5 pl-1.5 pr-3 shadow-sm transition-colors hover:bg-white dark:border-white/10 dark:bg-slate-900/70 dark:hover:bg-slate-800"
          >
            <div className="relative shrink-0">
              <ProfileAvatar name={user?.fullName || user?.name} photoUrl={photoUrl} isLoading={isLoading} className="h-7 w-7 rounded-lg" iconSize={14} textClassName="text-[10px]" />
              <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-emerald-500 dark:border-slate-900"></div>
            </div>
            <div className="flex flex-col overflow-hidden text-left flex-1 min-w-0">
              <p className="truncate text-[10px] font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {user?.fullName || 'User'}
              </p>
              <p className="truncate text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                {user?.tier || 'BASIC'}
              </p>
            </div>
            <ChevronDown 
              size={12} 
              className={`text-slate-400 shrink-0 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {isProfileOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 animate-in fade-in slide-in-from-top-1">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.fullName || 'User'}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email || ''}</p>
              </div>
              <Link
                href="/dashboard/settings"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Settings size={16} />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
              <div className="border-t border-slate-100 px-4 py-2 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-bold">
                  v0.2.4
                </p>
              </div>
            </div>
          )}
        </div>

        {!isStudent && <GlobalSearch role={user?.role} />}
      </div>

      {/* Centered desktop nav for student */}
      {isStudent && (
        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
          <StudentDesktopNav menuItems={studentMenuItems} pathname={pathname} />
        </div>
      )}

      <div className={`flex shrink-0 items-center ${isStaff ? 'gap-2' : 'gap-1 sm:gap-2 lg:gap-4'}`}>
        {/* Profile (Desktop Only) */}
        <div className="hidden lg:block relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className={[
              'flex items-center border transition-all duration-200',
              isStaff
                ? 'h-10 min-w-[176px] gap-3 rounded-xl border-slate-200/90 bg-white px-2.5 pr-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                : isStudent
                ? 'h-12 min-w-[168px] max-w-[220px] gap-2.5 rounded-full border-white/80 bg-white/75 py-1.5 pl-1.5 pr-3 shadow-[0_4px_16px_rgba(14,116,144,0.08)] hover:border-white hover:bg-white hover:shadow-[0_8px_22px_rgba(14,116,144,0.13)] dark:border-white/10 dark:bg-slate-900/70 dark:hover:border-white/15 dark:hover:bg-slate-800'
                : 'min-w-[180px] gap-4 rounded-2xl border-slate-200 bg-slate-50 py-2 pl-2.5 pr-5 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800',
            ].join(' ')}
          >
            <div className="relative shrink-0">
              <ProfileAvatar name={user?.fullName || user?.name} photoUrl={photoUrl} isLoading={isLoading} className={`h-8 w-8 ${isStudent ? 'rounded-full' : 'rounded-[10px]'}`} iconSize={16} textClassName="text-xs" />
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900"></div>
            </div>
            <div className="flex flex-col overflow-hidden text-left flex-1">
              <p className={`${isStaff ? 'text-[13px] font-bold leading-4' : 'text-sm font-semibold'} truncate text-slate-900 dark:text-slate-100`}>
                {user?.fullName || 'User'}
              </p>
              <p className={`${isStaff ? 'text-[10px] font-semibold uppercase tracking-[0.12em] leading-3 text-slate-500 dark:text-slate-400' : isStudent ? 'text-[10px] font-bold uppercase tracking-[0.12em] leading-3 text-[#0A9AE2] dark:text-cyan-400' : 'text-xs font-medium text-slate-500 dark:text-slate-400'} truncate`}>
                {user?.tier || 'BASIC'}
              </p>
            </div>
            <ChevronDown 
              size={isStaff ? 13 : 14}
              className={`shrink-0 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full z-50 mt-3 w-60 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.14)] dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.fullName || 'User'}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email || ''}</p>
              </div>
              <Link
                href="/dashboard/settings"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Settings size={16} />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          aria-label="Refresh page"
          className="rounded-2xl p-2 text-slate-500 transition-colors hover:bg-white hover:text-[#0A9AE2] hover:shadow-sm active:rotate-180 active:transition-transform dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
        >
          <RefreshCw size={20} />
        </button>

        <div className={isStaff ? 'flex items-center gap-1 pl-1' : 'contents'}>
          <button
            type="button"
            onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className={isStaff
              ? 'flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-slate-100 hover:text-[#0A9AE2] dark:text-slate-300 dark:hover:bg-slate-800'
              : 'rounded-2xl p-2 text-slate-500 transition-colors hover:bg-white hover:text-[#FF6900] hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-800'}
          >
            {isDarkMode ? <Sun size={isStaff ? 18 : 20} /> : <Moon size={isStaff ? 18 : 20} />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen((prev) => !prev)}
              className={isStaff
                ? 'relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-slate-100 hover:text-[#0A9AE2] dark:text-slate-300 dark:hover:bg-slate-800'
                : 'relative rounded-2xl p-2 text-slate-500 transition-colors hover:bg-white hover:text-[#0A9AE2] hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-800'}
            >
              <Bell size={isStaff ? 18 : 20} />
              {unreadCount > 0 && (
                <span className={`absolute flex items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ${isStaff ? '-right-0.5 -top-0.5 h-5 min-w-5 border-2 border-white dark:border-slate-950' : '-right-0.5 -top-0.5 h-4.5 min-w-4.5'}`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 top-full z-50 mt-3 w-80 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-2xl shadow-sky-900/10 animate-in fade-in slide-in-from-top-1 dark:border-white/10 dark:bg-slate-900 sm:w-96">
              <div className="flex items-center justify-between border-b border-slate-100 bg-[linear-gradient(135deg,#ecfeff_0%,#fff7ed_100%)] px-4 py-3 dark:border-slate-800 dark:bg-[linear-gradient(135deg,#082f49_0%,#1e1b4b_100%)]">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 text-xs font-medium text-[#0A9AE2] hover:underline"
                  >
                    <CheckCheck size={13} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
                    <Bell size={28} className="mb-2" />
                    <p className="text-sm font-medium">No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        const url = typeof n.data?.url === 'string'
                          ? n.data.url
                          : n.type === 'QUESTION_PENDING_APPROVAL'
                            ? '/dashboard/questions?status=PENDING_APPROVAL'
                            : n.type === 'FORUM_REPLY' && typeof n.data?.threadId === 'string'
                              ? `/dashboard/forum/${n.data.threadId}`
                              : n.type === 'PATHWAY_ASSIGNED' || n.type === 'PATHWAY_NODE_UNLOCKED'
                                ? '/dashboard/pathways'
                                : undefined;
                        void handleNotificationClick(n.id, n.isRead, url);
                      }}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        !n.isRead ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''
                      }`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        n.type === 'QUESTION_PENDING_APPROVAL'
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                          : n.type === 'FORUM_REPLY'
                            ? 'bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400'
                            : n.type === 'PATHWAY_ASSIGNED' || n.type === 'PATHWAY_NODE_UNLOCKED'
                              ? 'bg-[#0A9AE2]/10 text-[#0A9AE2]'
                              : n.type === 'PRACTICE_ASSIGNED'
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {n.type === 'QUESTION_PENDING_APPROVAL' ? <FileQuestion size={16} />
                          : n.type === 'FORUM_REPLY' ? <MessageSquare size={16} />
                          : n.type === 'PATHWAY_ASSIGNED' || n.type === 'PATHWAY_NODE_UNLOCKED' ? <Map size={16} />
                          : n.type === 'PRACTICE_ASSIGNED' ? <ClipboardList size={16} />
                          : <Bell size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!n.isRead ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-600 dark:text-slate-400'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                      {!n.isRead && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#0A9AE2]"></span>
                      )}
                    </button>
                  ))
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setIsNotifOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-[#0A9AE2] hover:underline"
                >
                  View All <ExternalLink size={12} />
                </Link>
              </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

function StudentDesktopNav({ menuItems, pathname }: { menuItems: typeof studentMenuItems; pathname: string }) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const primaryItems = menuItems.slice(0, 4);
  const moreItems = menuItems.slice(4);

  const isItemActive = (href: string) => href === '/dashboard'
    ? pathname === '/dashboard'
    : pathname.startsWith(href);

  const isMoreActive = moreItems.some((item) => isItemActive(item.href));

  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="hidden items-center gap-1 rounded-full bg-white p-1.5 shadow-[0_2px_16px_rgba(15,23,42,0.08)] dark:bg-slate-900 lg:flex">
      {primaryItems.map((item) => {
        const isActive = isItemActive(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className="group relative flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors duration-200"
          >
            {isActive && (
              <motion.div
                layoutId="student-desktop-nav-pill"
                className="absolute inset-0 z-0 rounded-full bg-[#E8F7FD] dark:bg-cyan-950/50"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              />
            )}
            <item.icon
              size={17}
              strokeWidth={isActive ? 2.4 : 1.8}
              className={`relative z-10 transition-colors duration-200 ${isActive ? 'text-[#0A9AE2]' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'}`}
            />
            <span className={`relative z-10 transition-colors duration-200 ${isActive ? 'font-extrabold text-[#0A9AE2]' : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* More */}
      <div className="relative" ref={moreRef}>
        <button
          type="button"
          onClick={() => setIsMoreOpen((prev) => !prev)}
          className="group relative flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors duration-200"
        >
          {(isMoreActive || isMoreOpen) && (
            <motion.div
              layoutId="student-desktop-nav-pill"
              className="absolute inset-0 z-0 rounded-full bg-[#E8F7FD] dark:bg-cyan-950/50"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
            />
          )}
          <MoreHorizontal
            size={17}
            strokeWidth={(isMoreActive || isMoreOpen) ? 2.4 : 1.8}
            className={`relative z-10 transition-colors duration-200 ${(isMoreActive || isMoreOpen) ? 'text-[#0A9AE2]' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'}`}
          />
          <span className={`relative z-10 transition-colors duration-200 ${(isMoreActive || isMoreOpen) ? 'font-extrabold text-[#0A9AE2]' : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200'}`}>
            More
          </span>
        </button>

        <AnimatePresence>
          {isMoreOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
              className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl bg-white shadow-[0_8px_32px_rgba(15,23,42,0.14),0_2px_8px_rgba(15,23,42,0.08)] dark:bg-slate-900 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
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
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

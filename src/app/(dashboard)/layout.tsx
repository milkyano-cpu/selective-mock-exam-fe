'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Navbar } from '@/components/dashboard/Navbar';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { StudentUtilityRail } from '@/components/dashboard/StudentUtilityRail';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { userService } from '@/features/users/services/user.service';
import { AnimatePresence, motion } from 'framer-motion';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { PushNotificationBanner } from '@/components/pwa/PushNotificationBanner';
import { useNotificationSSE } from '@/features/notifications/hooks/useNotificationSSE';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isAdminOrTutor = user?.role === 'ADMIN' || user?.role === 'TUTOR';
  const isStudent = user?.role === 'STUDENT';
  const userId = user?.id;
  const setAuth = useAuthStore((state) => state.setAuth);
  const studentRailRoutes = [
    '/dashboard',
    '/dashboard/pathways',
    '/dashboard/practice',
    '/dashboard/forum',
    '/dashboard/flashcards',
    '/dashboard/billing',
    '/dashboard/exams',
  ];
  const isStudentRailRoute = studentRailRoutes.some((route) => (
    pathname === route || pathname.startsWith(`${route}/`)
  ));
  const isFocusedStudentWorkspace = (
    pathname.includes('/session') ||
    pathname.startsWith('/dashboard/practice/sessions') ||
    pathname.startsWith('/dashboard/pathways/practice')
  );
  const shouldShowStudentRail = Boolean(isStudent && isStudentRailRoute && !isFocusedStudentWorkspace);

  useEffect(() => {
    const checkHydration = () => {
      setIsReady(true);
    };
    // Defer the set state to avoid the synchronous effect warning
    const timeout = setTimeout(checkHydration, 0);
    return () => clearTimeout(timeout);
  }, []);

  // SSE for real-time notifications
  useNotificationSSE();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    let isCancelled = false;

    const syncUser = async () => {
      try {
        const response = await userService.getMe();

        if (!isCancelled && response.success) {
          setAuth(response.data);
        }
      } catch {
        return;
      }
    };

    void syncUser();

    return () => {
      isCancelled = true;
    };
  }, [isReady, setAuth, userId]);

  if (!isReady || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white transition-colors dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-[#0A9AE2] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={[
      'relative flex min-h-screen max-w-full overflow-x-clip text-slate-900 transition-colors dark:text-slate-100',
      isStudent
        ? 'bg-[linear-gradient(135deg,#e0f7ff_0%,#fff7ed_34%,#eef2ff_68%,#ecfdf5_100%)] dark:bg-[linear-gradient(135deg,#06111f_0%,#101827_42%,#161328_70%,#071a17_100%)]'
        : 'bg-slate-50 dark:bg-slate-950',
    ].join(' ')}>
      {isStudent && !isFocusedStudentWorkspace && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.48)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.48)_1px,transparent_1px)] bg-[size:32px_32px] opacity-35 dark:bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] dark:opacity-45"
        />
      )}
      {/* Desktop Sidebar */}
      {!isStudent && (
        <aside className="fixed inset-y-0 left-0 z-40 hidden lg:block">
          <Sidebar />
        </aside>
      )}

      {/* Mobile Sidebar Drawer (Admin & Tutor only) */}
      <AnimatePresence>
        {isAdminOrTutor && isMobileSidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar onClose={() => setIsMobileSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div
        className={[
          'relative z-10 flex min-h-screen min-w-0 max-w-full flex-1 flex-col overflow-x-clip',
          isAdminOrTutor ? '' : 'pb-28',
          isStudent ? 'lg:pb-0' : 'lg:ml-64 lg:pb-0',
        ].join(' ')}
      >
        {!(isStudent && isFocusedStudentWorkspace) && (
          <Navbar onMenuClick={isAdminOrTutor ? () => setIsMobileSidebarOpen(true) : undefined} />
        )}
        <main
          className={[
            'mx-auto w-full min-w-0 flex-1 overflow-x-clip',
            isStudent && isFocusedStudentWorkspace ? 'max-w-full p-0' : 'p-4',
            isStudent && !isFocusedStudentWorkspace ? 'max-w-[1760px] lg:px-8 lg:py-8' : !isStudent ? 'max-w-[1600px] lg:p-8' : '',
          ].join(' ')}
        >
          {shouldShowStudentRail ? (
            <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.42fr)]">
              <div className="min-w-0">{children}</div>
              <StudentUtilityRail />
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {!isAdminOrTutor && !(isStudent && isFocusedStudentWorkspace) && <BottomNav />}
      <InstallPrompt />
      <PushNotificationBanner />
    </div>
  );
}

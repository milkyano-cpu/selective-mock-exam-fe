'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Navbar } from '@/components/dashboard/Navbar';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { userService } from '@/features/users/services/user.service';
import { AnimatePresence, motion } from 'framer-motion';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const updateUser = useAuthStore((state) => state.updateUser);
  const router = useRouter();

  useEffect(() => {
    const checkHydration = () => {
      setIsReady(true);
    };
    // Defer the set state to avoid the synchronous effect warning
    const timeout = setTimeout(checkHydration, 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isReady && !user) {
      router.push('/login');
    }
  }, [isReady, user, router]);

  useEffect(() => {
    if (!isReady || !userId) {
      return;
    }

    let isCancelled = false;

    const syncUser = async () => {
      try {
        const response = await userService.getMe();

        if (!isCancelled && response.success) {
          updateUser(response.data);
        }
      } catch {
        return;
      }
    };

    void syncUser();

    return () => {
      isCancelled = true;
    };
  }, [isReady, updateUser, userId]);

  if (!isReady || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white transition-colors dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-[#0A9AE2] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="w-full max-w-[1600px] flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

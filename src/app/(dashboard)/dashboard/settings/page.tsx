'use client';

import { ChangePasswordForm } from '@/components/dashboard/ChangePasswordForm';
import { ProfilePhotoSettingsCard } from '@/components/dashboard/ProfilePhotoSettingsCard';
import { User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const isParent = user?.role === 'PARENT';
  const isStaff = user?.role === 'ADMIN' || user?.role === 'TUTOR';

  return (
    <div className="w-full max-w-5xl space-y-8">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">Manage your account and preferences.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="space-y-6">
          <ProfilePhotoSettingsCard />

          <ChangePasswordForm />
        </div>

        {!isStaff && (
          <aside className="xl:sticky xl:top-24">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 lg:p-8">
              <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                <UserIcon className="text-[#0A9AE2]" size={20} />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Profile Information</h3>
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                {isParent 
                  ? "As a parent, you can manage your personal details and linked student accounts. Profile editing features will be available in the next update."
                  : "Profile editing is currently managed by your parent. Please contact them to update your registered name or email address."
                }
              </p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChangePasswordForm } from '@/components/dashboard/ChangePasswordForm';
import { ProfileAvatar } from '@/components/dashboard/ProfileAvatar';
import { ProfilePhotoSettingsCard } from '@/components/dashboard/ProfilePhotoSettingsCard';
import { PushNotificationSettingsCard } from '@/components/dashboard/PushNotificationSettingsCard';
import { AlertTriangle, Loader2, ShieldCheck, Trash2, User as UserIcon, X } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { userService } from '@/features/users/services/user.service';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  TUTOR: 'Tutor',
  PARENT: 'Parent',
  STUDENT: 'Student',
};

const ROLE_NOTES: Record<string, string> = {
  ADMIN: 'You can manage your personal account settings here while continuing to oversee platform operations from the dashboard.',
  TUTOR: 'Keep your profile polished, secure your account, and stay connected to grading or session alerts on every device you use.',
  PARENT: '',
  STUDENT: 'Your core profile data is currently managed by your parent account. You can still personalize your photo, password, and device preferences here.',
};

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const displayName = user?.fullName || user?.name || 'Your account';
  const roleLabel = ROLE_LABELS[user?.role || 'STUDENT'] || 'Member';
  const accountStatus = user?.status || 'ACTIVE';

  const isStudent = user?.role === 'STUDENT';
  const canDeleteAccount = !isStudent;

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      await userService.deleteMyAccount();
      clearAuth();
      router.push('/login');
    } catch {
      setDeleteError('Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 lg:space-y-8">
      {/* Unified Header */}
      <header className="flex flex-col gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between lg:p-8">
        <div className="flex items-center gap-4 lg:gap-6">
          <ProfileAvatar
            name={displayName}
            className="h-16 w-16 rounded-[1.25rem] lg:h-20 lg:w-20 lg:rounded-[1.5rem]"
            iconSize={28}
            textClassName="text-xl lg:text-2xl"
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 lg:text-3xl">
              Account Settings
            </h1>
            <p className="mt-1 truncate text-sm font-medium text-slate-500 dark:text-slate-400 lg:text-base">
              {displayName} · {user?.email}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <ShieldCheck size={14} className="text-[#0A9AE2]" />
            {roleLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {accountStatus}
          </span>
        </div>
      </header>

      {/* Info Note */}
      {ROLE_NOTES[user?.role || 'STUDENT'] && (
        <div className="flex items-start gap-4 rounded-[1.5rem] border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-900/30 dark:bg-blue-900/10">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
            <UserIcon size={14} />
          </div>
          <p className="text-sm font-medium leading-relaxed text-blue-800/80 dark:text-blue-300/80">
            {ROLE_NOTES[user?.role || 'STUDENT']}
          </p>
        </div>
      )}

      {/* Settings Sections - Vertical Stack */}
      <div className="space-y-6 lg:space-y-8">
        <ProfilePhotoSettingsCard />
        <PushNotificationSettingsCard />
        <ChangePasswordForm />

        {/* Danger Zone — hidden for STUDENT (account deletion managed by parent) */}
        {canDeleteAccount && (
          <div className="rounded-[1.5rem] border border-red-200 bg-white dark:border-red-500/20 dark:bg-slate-900">
            <div className="border-b border-red-100 px-6 py-4 dark:border-red-500/10">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                <h2 className="text-sm font-black text-red-600 dark:text-red-400">Danger Zone</h2>
              </div>
            </div>
            <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Delete Account</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Permanently remove your account and revoke all active sessions. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => { setIsDeleteOpen(true); setConfirmText(''); setDeleteError(''); }}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <Trash2 size={14} />
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Account Modal */}
      {canDeleteAccount && isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" />
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Delete Account</h2>
              </div>
              <button
                onClick={() => setIsDeleteOpen(false)}
                disabled={isDeleting}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                This will permanently deactivate your account and revoke all active sessions. You will not be able to log in again.
              </p>
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                Type <span className="font-black">delete</span> below to confirm.
              </div>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="delete"
                disabled={isDeleting}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-600"
              />
              {deleteError && (
                <p className="text-xs font-bold text-red-500">{deleteError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button
                onClick={() => setIsDeleteOpen(false)}
                disabled={isDeleting}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={confirmText !== 'delete' || isDeleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting && <Loader2 size={14} className="animate-spin" />}
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

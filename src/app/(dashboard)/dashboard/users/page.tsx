'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  adminService,
  type CreateStaffPayload,
  type UserItem,
} from '@/features/admin/services/admin.service';
import {
  UserPlus, Mail, Lock, Loader2, CheckCircle2, User,
  Search, ChevronLeft, ChevronRight, X, RefreshCw, Crown, Phone, Calendar, Clock,
  Trash2, AlertTriangle, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AccessDeniedScreen } from '@/components/feedback/AccessDeniedScreen';

type RoleTab = 'STUDENT' | 'PARENT' | 'TUTOR' | 'ADMIN';

const ADMIN_TABS: { role: RoleTab; label: string }[] = [
  { role: 'STUDENT', label: 'Student' },
  { role: 'PARENT',  label: 'Parent'  },
  { role: 'TUTOR',   label: 'Tutor'   },
  { role: 'ADMIN',   label: 'Admin'   },
];

const TUTOR_TABS: { role: RoleTab; label: string }[] = [
  { role: 'STUDENT', label: 'Student' },
];

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  SUSPENDED: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  BANNED:    'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

const TIER_STYLES = {
  PREMIUM:  'bg-purple-50 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20',
  STANDARD: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
  BASIC:    'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function ManageUsersPage() {
  const user = useAuthStore((state) => state.user);
  const isTutor = user?.role === 'TUTOR';
  const isAdmin = user?.role === 'ADMIN';
  const TABS = isTutor ? TUTOR_TABS : ADMIN_TABS;

  const [activeTab, setActiveTab]   = useState<RoleTab>('STUDENT');
  const [users, setUsers]           = useState<UserItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(10);
  const [search, setSearch]         = useState('');
  const [isLoading, setIsLoading]   = useState(false);

  const [selectedUser, setSelectedUser]   = useState<UserItem | null>(null);

  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [userToDelete, setUserToDelete]         = useState<UserItem | null>(null);
  const [isDeletingUser, setIsDeletingUser]     = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg]     = useState<string | null>(null);

  const [isSyncing, setIsSyncing]         = useState(false);
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [successMsg, setSuccessMsg]       = useState<string | null>(null);
  const [errorMsg, setErrorMsg]           = useState<string | null>(null);
  const [formData, setFormData]           = useState({
    role: 'TUTOR' as 'ADMIN' | 'TUTOR',
    fullName: '',
    email: '',
    password: '',
  });

  const fetchUsers = useCallback(async (role: RoleTab, pg: number, q: string, limit: number) => {
    setIsLoading(true);
    try {
      const res = await adminService.listUsers({ role, page: pg, limit, search: q || undefined });
      if (res.success) {
        setUsers(res.data);
        const nextTotalPages = Math.max(1, res.meta.totalPages);
        setTotalPages(nextTotalPages);
        setTotal(res.meta.total);
        if (pg > nextTotalPages) setPage(nextTotalPages);
      } else {
        setUsers([]);
        setTotalPages(1);
        setTotal(0);
      }
    } catch {
      setUsers([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void fetchUsers(activeTab, page, search, pageSize), 0);
    return () => window.clearTimeout(timeoutId);
  }, [activeTab, page, search, pageSize, fetchUsers]);

  const handleTabChange = (tab: RoleTab) => {
    setActiveTab(tab);
    setPage(1);
    setSearch('');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setPage(1);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    setDeleteErrorMsg(null);
    try {
      await adminService.deleteUser(userToDelete.id);
      setIsDeleteUserOpen(false);
      setUserToDelete(null);
      setSelectedUser(null);
      void fetchUsers(activeTab, page, search, pageSize);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setDeleteErrorMsg(
          'This account has an active subscription. Please ask the parent to cancel their subscription first before deleting.'
        );
      } else {
        setDeleteErrorMsg('Failed to delete user. Please try again.');
      }
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleSyncTiers = async () => {
    setIsSyncing(true);
    try {
      await adminService.syncTiers();
      void fetchUsers(activeTab, page, search, pageSize);
    } catch {
      // silent — table will still refresh
    } finally {
      setIsSyncing(false);
    }
  };

  const openModal = () => {
    setFormData({ role: 'TUTOR', fullName: '', email: '', password: '' });
    setSuccessMsg(null);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: CreateStaffPayload = {
        role: formData.role,
        fullName: formData.fullName,
        email: formData.email,
      };
      if (formData.password) payload.password = formData.password;

      const res = await adminService.createStaff(payload);
      if (res.success) {
        setSuccessMsg(res.message || `Account created. Credentials sent to ${formData.email}.`);
        setFormData({ role: 'TUTOR', fullName: '', email: '', password: '' });
        void fetchUsers(activeTab, page, search, pageSize);
      } else {
        setErrorMsg(res.message || 'Failed to create account');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorMsg(msg || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== 'ADMIN' && user?.role !== 'TUTOR') {
    return <AccessDeniedScreen />;
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      <header className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          {isTutor ? 'Students' : 'Users'} <span className="text-[#0A9AE2]">.</span>
        </h1>
        <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
          {isTutor
            ? 'View all registered student accounts.'
            : 'View and manage all user accounts by role.'}
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Tabs + Create button */}
        <div className="border-b border-slate-100 dark:border-slate-800 px-4 sm:px-6 pt-4 sm:pt-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-1">
              {TABS.map(({ role, label }) => (
                <button
                  key={role}
                  onClick={() => handleTabChange(role)}
                  className={`px-3 sm:px-4 py-2.5 text-sm font-bold rounded-t-xl transition-all flex-shrink-0 ${
                    activeTab === role
                      ? 'bg-[#0A9AE2] text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isAdmin && activeTab === 'STUDENT' && (
                <button
                  onClick={handleSyncTiers}
                  disabled={isSyncing}
                  title="Re-sync tier from subscriptions"
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2.5 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Tiers'}</span>
                </button>
              )}
              {isAdmin && (activeTab === 'TUTOR' || activeTab === 'ADMIN') && (
                <button
                  onClick={openModal}
                  className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2.5 bg-[#0A9AE2] text-white text-sm font-bold rounded-xl shadow-sm shadow-blue-100 hover:bg-[#0864B6] transition-all dark:shadow-none"
                >
                  <UserPlus size={16} />
                  <span className="hidden sm:inline">Create Account</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={handleSearch}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A9AE2] dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Mobile Card List */}
        <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-4">
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse w-2/5" />
                  <div className="h-3 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse w-3/5" />
                </div>
                <div className="h-5 w-14 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <User size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="font-bold text-slate-400 dark:text-slate-500">No {TABS.find(t => t.role === activeTab)?.label} accounts found</p>
              {search && <p className="mt-1 text-xs text-slate-400">Try clearing your search.</p>}
            </div>
          ) : (
            users.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A9AE2]/10 font-black text-[#0A9AE2] text-sm overflow-hidden">
                  {u.photoUrl
                    ? <img src={u.photoUrl} alt={u.fullName} className="w-full h-full object-cover" />
                    : u.fullName.charAt(0).toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm">{u.fullName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLES[u.status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {u.status}
                  </span>
                  {activeTab === 'STUDENT' && (
                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${TIER_STYLES[u.tier]}`}>
                      {u.tier !== 'BASIC' && <Crown size={9} />}
                      {u.tier}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
                <th className="px-6 py-3.5 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3.5 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Email</th>
                {activeTab === 'STUDENT' && (
                  <th className="px-6 py-3.5 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Tier</th>
                )}
                <th className="px-6 py-3.5 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3.5 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(() => {
                const colCount = activeTab === 'STUDENT' ? 6 : 5;
                if (isLoading) return Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: colCount }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" style={{ width: j === 0 ? '60%' : j === 1 ? '75%' : '40%' }} />
                      </td>
                    ))}
                  </tr>
                ));
                if (users.length === 0) return (
                  <tr>
                    <td colSpan={colCount} className="px-6 py-16 text-center">
                      <User size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                      <p className="font-bold text-slate-400 dark:text-slate-500">No {TABS.find(t => t.role === activeTab)?.label} accounts found</p>
                      {search && <p className="mt-1 text-xs text-slate-400">Try clearing your search.</p>}
                    </td>
                  </tr>
                );
                return users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0A9AE2]/10 font-black text-[#0A9AE2] text-sm overflow-hidden">
                          {u.photoUrl
                            ? <img src={u.photoUrl} alt={u.fullName} className="w-full h-full object-cover" />
                            : u.fullName.charAt(0).toUpperCase()
                          }
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                    {activeTab === 'STUDENT' && (
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${TIER_STYLES[u.tier]}`}>
                          {u.tier !== 'BASIC' && <Crown size={11} />}
                          {u.tier}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[u.status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isAdmin && u.id !== user?.id && (
                        <button
                          onClick={() => { setUserToDelete(u); setDeleteErrorMsg(null); setIsDeleteUserOpen(true); }}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                          title="Delete user"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Showing <span className="font-bold text-slate-700 dark:text-slate-200">{(page - 1) * pageSize + 1}</span>
              {' '}to <span className="font-bold text-slate-700 dark:text-slate-200">{Math.min(page * pageSize, total)}</span>
              {' '}of <span className="font-bold text-slate-700 dark:text-slate-200">{total}</span> user{total !== 1 ? 's' : ''}
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span>Rows per page</span>
                <select
                  value={pageSize}
                  onChange={(event) => handlePageSizeChange(Number(event.target.value))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition-all focus:border-[#0A9AE2] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  title="First page"
                >
                  <ChevronsLeft size={14} />
                </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  title="Previous page"
              >
                  <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  title="Next page"
              >
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  title="Last page"
                >
                  <ChevronsRight size={14} />
              </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Bottom Sheet (Mobile) */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div
              key="sheet-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 sm:hidden"
              onClick={() => setSelectedUser(null)}
            />
            <motion.div
              key="sheet"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white dark:bg-slate-900 shadow-2xl sm:hidden overflow-hidden"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0A9AE2]/10 font-black text-[#0A9AE2] text-lg overflow-hidden">
                    {selectedUser.photoUrl
                      ? <img src={selectedUser.photoUrl} alt={selectedUser.fullName} className="w-full h-full object-cover" />
                      : selectedUser.fullName.charAt(0).toUpperCase()
                    }
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-slate-100">{selectedUser.fullName}</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{selectedUser.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={18} className="text-slate-500" />
                </button>
              </div>

              {/* Details */}
              <div className="px-5 py-4 space-y-3 pb-8">
                <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 dark:border-slate-800">
                  <Mail size={16} className="text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 dark:border-slate-800">
                  <Phone size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Phone</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {selectedUser.phoneNumber ?? <span className="text-slate-400 italic">Not provided</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 dark:border-slate-800">
                  <User size={16} className="text-slate-400 shrink-0" />
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</p>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold mt-0.5 ${STATUS_STYLES[selectedUser.status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {selectedUser.status}
                      </span>
                    </div>
                    {selectedUser.role === 'STUDENT' && (
                      <div className="ml-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tier</p>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold mt-0.5 ${TIER_STYLES[selectedUser.tier]}`}>
                          {selectedUser.tier !== 'BASIC' && <Crown size={11} />}
                          {selectedUser.tier}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 dark:border-slate-800">
                  <Calendar size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Joined</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {new Date(selectedUser.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 dark:border-slate-800">
                  <Clock size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Last Updated</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {new Date(selectedUser.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {isAdmin && selectedUser.id !== user?.id && (
                  <button
                    onClick={() => { setUserToDelete(selectedUser); setDeleteErrorMsg(null); setIsDeleteUserOpen(true); }}
                    className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <Trash2 size={14} />
                    Delete User
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete User Confirmation Modal */}
      {isDeleteUserOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" />
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Delete User</h2>
              </div>
              <button
                onClick={() => { setIsDeleteUserOpen(false); setUserToDelete(null); setDeleteErrorMsg(null); }}
                disabled={isDeletingUser}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-slate-100">{userToDelete.fullName}</span>? Their active sessions will be revoked and account will be permanently disabled.
                {' '}Ensure the subscription has been cancelled by the parent before proceeding.
              </p>
              {deleteErrorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
                  {deleteErrorMsg}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button
                onClick={() => { setIsDeleteUserOpen(false); setUserToDelete(null); setDeleteErrorMsg(null); }}
                disabled={isDeletingUser}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeletingUser}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeletingUser && <Loader2 size={14} className="animate-spin" />}
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A9AE2]/10 text-[#0A9AE2]">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Create Account</h2>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Add a new Tutor or Admin</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <X size={18} className="text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
                <AnimatePresence mode="wait">
                  {errorMsg && (
                    <motion.div key="err" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
                      {errorMsg}
                    </motion.div>
                  )}
                  {successMsg && (
                    <motion.div key="ok" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm font-medium flex items-start gap-2 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
                      <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                      <span>{successMsg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-100">Account Role</label>
                  <div className="flex gap-2">
                    {(['TUTOR', 'ADMIN'] as const).map((r) => (
                      <button key={r} type="button" onClick={() => setFormData({ ...formData, role: r })}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          formData.role === r
                            ? 'bg-[#0A9AE2] text-white shadow-sm shadow-blue-100 dark:shadow-none'
                            : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400'
                        }`}>
                        {r === 'TUTOR' ? 'Tutor' : 'Administrator'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-100">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" required value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0A9AE2] dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 placeholder:text-slate-400" />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-100">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" required value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. john@aspire.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0A9AE2] dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 placeholder:text-slate-400" />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Password <span className="text-slate-400 font-medium">(optional — auto-generated if blank)</span>
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="password" value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Leave blank to auto-generate"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0A9AE2] dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 placeholder:text-slate-400" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-300">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="flex-1 py-3 bg-[#0A9AE2] text-white font-bold rounded-xl hover:bg-[#0864B6] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><UserPlus size={16} /> Create Account</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { AlertTriangle, Crown, CreditCard, Download, ExternalLink, Loader2, ReceiptText, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { billingService } from '@/features/billing/services/billing.service';
import type { BillingInvoice, BillingOverview, BillingPrice, BillingTier } from '@/features/billing/types/billing.types';
import { analyticsService } from '@/features/analytics/services/analytics.service';
import type { ChildSummary } from '@/features/analytics/types/analytics.types';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { DeleteConfirmModal } from '@/features/subjects/components/DeleteConfirmModal';

const tiers: Array<{
  tier: BillingTier;
  title: string;
  description: string;
  features: string[];
}> = [
  {
    tier: 'STANDARD',
    title: 'Standard',
    description: 'Unlock full practice and forum participation.',
    features: ['All practice topics', 'Subject-wide practice', 'Weak-area practice', 'Forum posting and comments'],
  },
  {
    tier: 'PREMIUM',
    title: 'Premium',
    description: 'Unlock every learning workflow in Aspire.',
    features: ['Everything in Standard', 'Learning Pathways', 'Flash Cards', 'Pathway practice progress'],
  },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatInvoiceDate(value: string | null) {
  if (!value) return 'Not available';
  return formatDate(value);
}

function getPriceAmount(price: BillingPrice | undefined) {
  if (!price) return null;
  const minorAmount = price.unitAmount ?? (
    price.unitAmountDecimal ? Number(price.unitAmountDecimal) : null
  );
  if (minorAmount === null || !Number.isFinite(minorAmount)) return null;
  return minorAmount / 100;
}

function formatPrice(price: BillingPrice | undefined) {
  const amount = getPriceAmount(price);
  if (amount === null) return 'USD';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (price?.currency || 'usd').toUpperCase(),
  }).format(amount);
}

function formatBillingPeriod(price: BillingPrice | undefined) {
  const interval = price?.interval ?? 'month';
  const count = price?.intervalCount ?? 1;
  if (count > 1) return `every ${count} ${interval}s`;
  return `per ${interval}`;
}

function formatMinorCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

// Stripe invoice status → tailwind badge classes.
// paid → green, open → amber, void/uncollectible → red, anything else → gray.
function invoiceStatusBadgeClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'paid') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
  }
  if (normalized === 'open') {
    return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
  }
  if (normalized === 'void' || normalized === 'uncollectible') {
    return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300';
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

export default function BillingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyTier, setBusyTier] = useState<BillingTier | 'PORTAL' | null>(null);
  // Track which (studentId × action) is in-flight so only that button spins.
  const [busyChild, setBusyChild] = useState<string | null>(null);
  // Tracks which child is currently in the "pick a tier" step.
  // Null means the default state with just the "Subscribe for X" button.
  const [tierPickerStudentId, setTierPickerStudentId] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  // The child queued for deletion drives the confirmation dialog; null = closed.
  const [childToDelete, setChildToDelete] = useState<ChildSummary | null>(null);
  const [isDeletingChild, setIsDeletingChild] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isStudent = user?.role === 'STUDENT';
  const isParent = user?.role === 'PARENT';
  // Billing is parent-only — students are redirected away from this page.
  const canUseBilling = isParent;

  const loadBillingData = useCallback(
    async (signal: { cancelled: boolean }) => {
      const requests: Array<Promise<void>> = [
        billingService.listInvoices().then((res) => {
          if (signal.cancelled || !res.success) return;
          setInvoices(res.data.invoices);
        }),
      ];

      if (isStudent) {
        requests.push(
          billingService.getMe().then((res) => {
            if (signal.cancelled || !res.success) return;
            setOverview(res.data);
            updateUser({ tier: res.data.tier });
          })
        );
      }

      if (isParent) {
        requests.push(
          analyticsService.getChildren().then((res) => {
            if (signal.cancelled || !res.success) return;
            setChildren(res.data);
          })
        );
      }

      try {
        await Promise.all(requests);
      } catch (err) {
        if (signal.cancelled) return;
        setError(
          isAxiosError(err) ? err.response?.data?.message ?? 'Failed to load billing' : 'Failed to load billing'
        );
      }
    },
    [isStudent, isParent, updateUser]
  );

  useEffect(() => {
    if (isStudent) {
      router.replace('/dashboard');
      return;
    }
    if (!canUseBilling) {
      return;
    }

    const signal = { cancelled: false };
    loadBillingData(signal).finally(() => {
      if (!signal.cancelled) setIsLoading(false);
    });

    return () => {
      signal.cancelled = true;
    };
  }, [canUseBilling, isStudent, loadBillingData, router]);

  // Refetch when the tab becomes visible again — covers the Stripe portal return
  // flow where the cancel webhook may settle while the user is still off-tab.
  useEffect(() => {
    if (!canUseBilling) return;

    const signal = { cancelled: false };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadBillingData(signal);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      signal.cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [canUseBilling, loadBillingData]);

  const handleCheckout = async (tier: BillingTier) => {
    setBusyTier(tier);
    setError(null);
    try {
      const res = await billingService.createCheckout(tier);
      window.open(res.data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message ?? 'Failed to start checkout' : 'Failed to start checkout');
    } finally {
      setBusyTier(null);
    }
  };

  const handlePortal = async () => {
    setBusyTier('PORTAL');
    setError(null);
    try {
      const res = await billingService.createPortal();
      window.open(res.data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message ?? 'Failed to open billing portal' : 'Failed to open billing portal');
    } finally {
      setBusyTier(null);
    }
  };

  const handleParentCheckout = async (studentId: string, tier: BillingTier) => {
    setBusyChild(`${studentId}:${tier}`);
    setError(null);
    try {
      const res = await billingService.parentCheckout(studentId, tier);
      window.open(res.data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message ?? 'Failed to start checkout' : 'Failed to start checkout');
    } finally {
      setBusyChild(null);
    }
  };

  const handleParentPortal = async (studentId: string) => {
    setBusyChild(`${studentId}:PORTAL`);
    setError(null);
    try {
      const res = await billingService.parentPortal(studentId);
      window.open(res.data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message ?? 'Failed to open billing portal' : 'Failed to open billing portal');
    } finally {
      setBusyChild(null);
    }
  };

  const handleDeleteChild = async () => {
    if (!childToDelete) return;
    const { studentId } = childToDelete;
    setIsDeletingChild(true);
    setError(null);
    try {
      await billingService.deleteChildAccount(studentId);
      // Drop the deleted child from the list without reloading the page.
      setChildren((prev) => prev.filter((c) => c.studentId !== studentId));
      setChildToDelete(null);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError('Please cancel the subscription first before deleting this account.');
      } else {
        setError(
          isAxiosError(err) ? err.response?.data?.message ?? 'Failed to delete account' : 'Failed to delete account'
        );
      }
      setChildToDelete(null);
    } finally {
      setIsDeletingChild(false);
    }
  };

  const handleInvoiceDownload = async (invoice: BillingInvoice) => {
    setDownloadingInvoiceId(invoice.id);
    setError(null);
    try {
      const res = await billingService.getInvoiceDownload(invoice.id);
      window.open(res.data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message ?? 'Failed to download invoice' : 'Failed to download invoice');
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  if (!canUseBilling) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-300">
          <CreditCard size={28} />
        </div>
        <h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">Student and parent billing only</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
          Memberships and invoices are attached to student accounts and their linked parents.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Billing</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Manage subscriptions and view invoices for your linked students.
          </p>
        </header>
        <div className="space-y-4 animate-pulse">
          <div className="h-44 rounded-3xl border border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-900" />
          <div className="h-56 rounded-3xl border border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-900" />
        </div>
      </div>
    );
  }

  const tier = overview?.tier ?? user?.tier ?? 'BASIC';
  const activeSubscription = overview?.activeSubscription ?? null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Billing</h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Manage subscriptions and view invoices for your linked students.
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {isStudent && activeSubscription && (
        <section className="flex flex-col gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-black text-emerald-900 dark:text-emerald-100">{activeSubscription.tier} subscription active</p>
              <p className="text-xs font-bold text-emerald-700/80 dark:text-emerald-300/80">
                {activeSubscription.cancelAtPeriodEnd ? 'Cancels at period end' : 'Managed securely by Stripe'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePortal}
            disabled={busyTier === 'PORTAL'}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {busyTier === 'PORTAL' ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}
            Manage billing
          </button>
        </section>
      )}

      {isStudent && (
      <section className="grid gap-4 md:grid-cols-2">
        {tiers.map((item) => {
          const isCurrentTier = tier === item.tier;
          const price = overview?.prices?.[item.tier];
          return (
            <div key={item.tier} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className={item.tier === 'PREMIUM' ? 'text-amber-500' : 'text-[#0A9AE2]'} />
                    <h2 className="text-xl font-black text-slate-950 dark:text-white">{item.title}</h2>
                  </div>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">{item.description}</p>
                </div>
                {isCurrentTier && (
                  <span className="rounded-full bg-[#0A9AE2]/10 px-3 py-1 text-xs font-black text-[#0A9AE2]">Current</span>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-end gap-x-2 gap-y-1">
                <p className="text-4xl font-black tracking-tight text-slate-950 dark:text-white">
                  {formatPrice(price)}
                </p>
                <p className="pb-1 text-sm font-black uppercase tracking-wide text-slate-400">
                  {formatBillingPeriod(price)}
                </p>
              </div>
              <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                Billed in {(price?.currency || 'usd').toUpperCase()} through Stripe.
              </p>

              <ul className="mt-5 space-y-2">
                {item.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                    <ShieldCheck size={15} className="text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleCheckout(item.tier)}
                disabled={isCurrentTier || busyTier !== null}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0A9AE2] px-4 text-sm font-black text-white transition-colors hover:bg-[#0659AA] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
              >
                {busyTier === item.tier ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                {isCurrentTier ? 'Current plan' : `Choose ${item.title}`}
              </button>
            </div>
          );
        })}
      </section>
      )}

      {isParent && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Crown size={18} className="text-amber-500" />
            <h2 className="text-xl font-black text-slate-950 dark:text-white">Your children&apos;s subscriptions</h2>
          </div>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
            Subscribe a child to a paid tier or manage an existing subscription.
          </p>

          {(() => {
            const cancellingChildren = children.filter(
              (c) => c.activeSubscription?.cancelAtPeriodEnd
            );
            if (cancellingChildren.length === 0) return null;
            return (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="text-sm">
                  <p className="font-black text-amber-900 dark:text-amber-100">
                    {cancellingChildren.length === 1 ? 'A subscription is scheduled to cancel' : 'Subscriptions are scheduled to cancel'}
                  </p>
                  <ul className="mt-1 space-y-0.5 font-medium text-amber-800 dark:text-amber-200">
                    {cancellingChildren.map((c) => (
                      <li key={c.studentId}>
                        <span className="font-bold">{c.studentName}</span>
                        {' '}— ends on {formatDate(c.activeSubscription!.currentPeriodEnd)}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs font-bold text-amber-700/80 dark:text-amber-300/80">
                    Access will revert to BASIC once the period ends. Reopen the billing portal to restore the subscription before then.
                  </p>
                </div>
              </div>
            );
          })()}

          {children.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-6 text-sm font-bold text-slate-500 dark:border-slate-800 dark:text-slate-400">
              No linked students yet.
            </div>
          ) : (
            <ul className={`mt-5 grid gap-3 ${children.length > 1 ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
              {children.map((child) => {
                const childTier = child.tier ?? 'BASIC';
                const activeSub = child.activeSubscription ?? null;
                const isSubscribed = activeSub !== null;
                // Subscription status: active / cancelled / none (per SME-99 spec).
                // "cancelled" here means a still-active sub flagged to end at period end.
                let subscriptionStatus: 'active' | 'cancelled' | 'none';
                if (!isSubscribed) {
                  subscriptionStatus = 'none';
                } else if (activeSub.cancelAtPeriodEnd) {
                  subscriptionStatus = 'cancelled';
                } else {
                  subscriptionStatus = 'active';
                }
                const statusBadgeClass =
                  subscriptionStatus === 'active'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : subscriptionStatus === 'cancelled'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
                const portalKey = `${child.studentId}:PORTAL`;
                const standardKey = `${child.studentId}:STANDARD`;
                const premiumKey = `${child.studentId}:PREMIUM`;
                const isAnyBusy = busyChild !== null;
                return (
                  <li
                    key={child.studentId}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0A9AE2] text-sm font-black text-white">
                        {child.studentName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-slate-950 dark:text-white">{child.studentName}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                          {childTier !== 'BASIC' && <Crown size={12} className="text-amber-500" />}
                          Tier: {childTier}
                        </p>
                        <span className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${statusBadgeClass}`}>
                          {subscriptionStatus}
                        </span>
                        {subscriptionStatus === 'cancelled' && activeSub && (
                          <p className="mt-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                            Cancels on {formatDate(activeSub.currentPeriodEnd)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isSubscribed ? (
                        <button
                          type="button"
                          onClick={() => handleParentPortal(child.studentId)}
                          disabled={isAnyBusy}
                          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {busyChild === portalKey ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                          Manage billing
                        </button>
                      ) : tierPickerStudentId === child.studentId ? (
                        <>
                          <span className="w-full text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Pick a tier:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleParentCheckout(child.studentId, 'STANDARD')}
                            disabled={isAnyBusy}
                            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] px-3 text-xs font-black text-white transition-colors hover:bg-[#0659AA] disabled:opacity-60"
                          >
                            {busyChild === standardKey ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                            Standard
                          </button>
                          <button
                            type="button"
                            onClick={() => handleParentCheckout(child.studentId, 'PREMIUM')}
                            disabled={isAnyBusy}
                            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 text-xs font-black text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
                          >
                            {busyChild === premiumKey ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            Premium
                          </button>
                          <button
                            type="button"
                            onClick={() => setTierPickerStudentId(null)}
                            disabled={isAnyBusy}
                            className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setTierPickerStudentId(child.studentId)}
                          disabled={isAnyBusy}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] px-4 text-xs font-black text-white transition-colors hover:bg-[#0659AA] disabled:opacity-60"
                        >
                          <CreditCard size={14} />
                          Subscribe for {child.studentName.split(' ')[0]}
                        </button>
                      )}
                    </div>

                    {/* Danger zone — delete the child's account entirely. */}
                    <div className="flex flex-col gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-red-500/80 dark:text-red-400/80">
                        <AlertTriangle size={11} />
                        Danger Zone
                      </span>
                      {subscriptionStatus === 'none' ? (
                        <button
                          type="button"
                          onClick={() => setChildToDelete(child)}
                          disabled={isAnyBusy || isDeletingChild}
                          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          <Trash2 size={14} />
                          Delete account
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          title="Cancel subscription first."
                          className="inline-flex h-9 w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-400 dark:border-slate-800 dark:text-slate-600"
                        >
                          <Trash2 size={14} />
                          Delete account
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ReceiptText size={18} className="text-[#0A9AE2]" />
              <h2 className="text-xl font-black text-slate-950 dark:text-white">Invoices</h2>
            </div>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
              Download payment invoices generated by Stripe.
            </p>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-6 text-sm font-bold text-slate-500 dark:border-slate-800 dark:text-slate-400">
            No invoices yet.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs font-black uppercase tracking-wide text-slate-400">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  {isParent && <th className="whitespace-nowrap px-3 py-3">Student</th>}
                  <th className="whitespace-nowrap px-3 py-3">Invoice</th>
                  <th className="whitespace-nowrap px-3 py-3">Status</th>
                  <th className="whitespace-nowrap px-3 py-3">Period</th>
                  <th className="whitespace-nowrap px-3 py-3 text-right">Paid</th>
                  <th className="whitespace-nowrap px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    {isParent && (
                      <td className="whitespace-nowrap px-3 py-4 font-bold text-slate-700 dark:text-slate-200">
                        {invoice.studentName}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-3 py-4">
                      <p className="font-black text-slate-950 dark:text-white">
                        {invoice.invoiceNumber ?? 'Invoice'}
                      </p>
                      <p className="text-xs font-bold text-slate-400">
                        {formatInvoiceDate(invoice.createdAt)}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${invoiceStatusBadgeClass(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 font-bold text-slate-600 dark:text-slate-300">
                      {formatInvoiceDate(invoice.periodStart)} - {formatInvoiceDate(invoice.periodEnd)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right font-black text-slate-950 dark:text-white">
                      {formatMinorCurrency(invoice.amountPaid, invoice.currency)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleInvoiceDownload(invoice)}
                        disabled={!invoice.downloadAvailable || downloadingInvoiceId === invoice.id}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-3 text-xs font-black text-white transition-colors hover:bg-[#0659AA] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 dark:bg-white dark:text-slate-950 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
                      >
                        {downloadingInvoiceId === invoice.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DeleteConfirmModal
        isOpen={childToDelete !== null}
        onClose={() => setChildToDelete(null)}
        onConfirm={handleDeleteChild}
        isLoading={isDeletingChild}
        title="Delete account"
        message={
          childToDelete
            ? `This will permanently disable ${childToDelete.studentName}'s account. This action cannot be undone.`
            : ''
        }
      />
    </div>
  );
}

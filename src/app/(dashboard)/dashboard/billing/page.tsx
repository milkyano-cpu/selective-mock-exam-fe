'use client';

import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Crown, CreditCard, Download, ExternalLink, Loader2, ReceiptText, ShieldCheck, Sparkles } from 'lucide-react';
import { billingService } from '@/features/billing/services/billing.service';
import type { BillingInvoice, BillingOverview, BillingPrice, BillingTier } from '@/features/billing/types/billing.types';
import { useAuthStore } from '@/features/auth/store/auth.store';

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

export default function BillingPage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyTier, setBusyTier] = useState<BillingTier | 'PORTAL' | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isStudent = user?.role === 'STUDENT';
  const isParent = user?.role === 'PARENT';
  const canUseBilling = isStudent || isParent;

  useEffect(() => {
    if (!canUseBilling) {
      return;
    }

    let cancelled = false;

    const requests: Array<Promise<void>> = [
      billingService.listInvoices().then((res) => {
        if (cancelled || !res.success) return;
        setInvoices(res.data.invoices);
      }),
    ];

    if (isStudent) {
      requests.push(
        billingService.getMe().then((res) => {
          if (cancelled || !res.success) return;
          setOverview(res.data);
          updateUser({ tier: res.data.tier });
        })
      );
    }

    Promise.all(requests)
      .catch((err) => {
        if (cancelled) return;
        setError(isAxiosError(err) ? err.response?.data?.message ?? 'Failed to load billing' : 'Failed to load billing');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canUseBilling, isStudent, updateUser]);

  const handleCheckout = async (tier: BillingTier) => {
    setBusyTier(tier);
    setError(null);
    try {
      const res = await billingService.createCheckout(tier);
      window.location.assign(res.data.url);
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message ?? 'Failed to start checkout' : 'Failed to start checkout');
      setBusyTier(null);
    }
  };

  const handlePortal = async () => {
    setBusyTier('PORTAL');
    setError(null);
    try {
      const res = await billingService.createPortal();
      window.location.assign(res.data.url);
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message ?? 'Failed to open billing portal' : 'Failed to open billing portal');
      setBusyTier(null);
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
      <div className="mx-auto w-full max-w-6xl space-y-6 animate-pulse">
        <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="p-6 md:p-8 space-y-4">
            <div className="h-5 w-28 rounded-full bg-slate-200/70 dark:bg-slate-800" />
            <div className="h-8 w-32 rounded-lg bg-slate-200/70 dark:bg-slate-800" />
            <div className="h-4 w-64 rounded bg-slate-100 dark:bg-slate-800/60" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-slate-200/60 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="h-5 w-20 rounded bg-slate-200/70 dark:bg-slate-800" />
              <div className="mt-3 h-8 w-24 rounded bg-slate-200/70 dark:bg-slate-800" />
              <div className="mt-4 space-y-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
                ))}
              </div>
              <div className="mt-6 h-10 rounded-xl bg-slate-200/70 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const tier = overview?.tier ?? user?.tier ?? 'BASIC';
  const activeSubscription = overview?.activeSubscription ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#0A9AE2]/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#0A9AE2]">
              <CreditCard size={14} />
              Membership
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Billing</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
              {isStudent
                ? 'Manage your Aspire membership and unlock the learning tools that match your study plan.'
                : 'View and download invoices for your linked student accounts.'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              {isStudent ? 'Current tier' : 'Invoices'}
            </p>
            {isStudent ? (
              <>
                <p className="mt-1 flex items-center gap-2 text-2xl font-black text-slate-950 dark:text-white">
                  {tier !== 'BASIC' && <Crown size={22} className="text-amber-500" />}
                  {tier}
                </p>
                {activeSubscription && (
                  <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    Renews {formatDate(activeSubscription.currentPeriodEnd)}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                {invoices.length}
              </p>
            )}
          </div>
        </div>
      </section>

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
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
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
    </div>
  );
}

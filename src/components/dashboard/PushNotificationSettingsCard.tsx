'use client';

import { usePushSubscription } from '@/features/push/hooks/usePushSubscription';
import { BellRing, CheckCircle2, Loader2, ShieldCheck, Smartphone } from 'lucide-react';

export function PushNotificationSettingsCard() {
  const { isSupported, isSubscribed, isLoading, status, subscribe, unsubscribe } = usePushSubscription();

  const statusBadgeClassName =
    status === 'enabled'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
      : status === 'disabled'
        ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
        : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400';

  const statusLabel =
    status === 'enabled'
      ? 'Enabled'
      : status === 'disabled'
        ? 'Disabled'
        : 'Not supported';

  const handleToggle = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } catch (err) {
      console.error('Failed to toggle push notifications:', err);
      alert('Failed to update notification settings. Please check your browser permissions.');
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 sm:rounded-[1.75rem] sm:shadow-[0_18px_50px_-28px_rgba(15,23,42,0.24)]">
      <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/40 sm:px-6 sm:py-5 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0A9AE2]/10 text-[#0A9AE2] sm:h-10 sm:w-10 sm:rounded-2xl">
                <BellRing size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 sm:text-lg">Push Notifications</h3>
                <p className="hidden text-xs font-bold uppercase tracking-[0.18em] text-slate-400 sm:block">Device alerts</p>
              </div>
            </div>
            <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400 sm:mt-3 sm:text-sm">
              Receive important updates and announcements on this device even when the app is closed.
            </p>
          </div>

          <span className={`hidden w-fit rounded-full px-3 py-1 text-xs font-bold sm:inline-flex ${statusBadgeClassName}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <div className="space-y-3 sm:hidden">
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3 px-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">Enable on this device</p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Works best on installed PWA.</p>
              </div>

              {!isSupported ? (
                <span className="shrink-0 text-xs font-bold text-red-600 dark:text-red-400">Unsupported</span>
              ) : isLoading ? (
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-300">
                  <Loader2 size={12} className="animate-spin" /> Checking
                </span>
              ) : (
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={isSubscribed}
                    disabled={isLoading}
                    onChange={handleToggle}
                  />
                  <div className="peer h-7 w-12 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-1 after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#0A9AE2] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:after:border-slate-600 dark:after:bg-slate-800"></div>
                </label>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 px-3 py-3 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{statusLabel}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 px-3 py-3 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Best use</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Installed PWA</span>
            </div>
          </div>

          <p className="text-xs font-medium leading-5 text-slate-400 dark:text-slate-500">
            Notifications are device-specific. Enable them separately on each device you use.
          </p>
        </div>

        <div className="hidden gap-5 sm:grid lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-black text-slate-900 dark:text-slate-100">Enable notifications for this device</p>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Works best on installed PWA. iOS requires 16.4+.
                </p>
              </div>

              {!isSupported ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                  Not supported on this browser/device.
                </div>
              ) : isLoading ? (
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  <Loader2 size={14} className="animate-spin" /> Checking status...
                </div>
              ) : (
                <label className="relative inline-flex cursor-pointer items-center self-start sm:self-auto">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={isSubscribed}
                    disabled={isLoading}
                    onChange={handleToggle}
                  />
                  <div className="peer h-7 w-12 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-1 after:h-5.5 after:w-5.5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#0A9AE2] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-700 dark:after:border-slate-600 dark:after:bg-slate-800"></div>
                </label>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <Smartphone size={16} className="text-[#0A9AE2]" />
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Per-device setup</p>
                </div>
                <p className="mt-2 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
                  Notifications are device-specific. Enable them separately on each phone, tablet, or desktop you use.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#0A9AE2]" />
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Permission aware</p>
                </div>
                <p className="mt-2 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
                  If your browser blocks notifications, update permissions first and then retry enabling alerts.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Status</p>
              <p className="mt-2 text-sm font-black text-slate-900 dark:text-slate-100">{statusLabel}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-500" />
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Best use</p>
              </div>
              <p className="mt-2 text-sm font-black text-slate-900 dark:text-slate-100">Installed PWA</p>
            </div>
          </div>
        </div>

        <p className="mt-5 text-xs font-medium text-slate-400 dark:text-slate-500">
          Notifications are device-specific. You need to enable this on each device where you want to receive alerts.
        </p>
      </div>
    </section>
  );
}

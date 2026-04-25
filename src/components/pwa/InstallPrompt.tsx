'use client';

import { useEffect, useState } from 'react';
import { Download, Share, Plus, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'aspire.pwa.installDismissedAt';
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true
  );
};

const detectIOS = () => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isIOSDevice = /iphone|ipad|ipod/.test(ua);
  const isIPadOS =
    ua.includes('mac') && 'ontouchend' in document;
  return isIOSDevice || isIPadOS;
};

const wasRecentlyDismissed = () => {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts < DISMISS_COOLDOWN_MS;
  } catch (_) {
    return false;
  }
};

const rememberDismiss = () => {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch (_) {
    /* storage might be unavailable */
  }
};

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isStandalone()) return;
    if (wasRecentlyDismissed()) return;

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setVisible(false);
      rememberDismiss();
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    // iOS has no install prompt event — show manual hint after a short delay.
    if (detectIOS()) {
      const timer = window.setTimeout(() => {
        setShowIOSHint(true);
        setVisible(true);
      }, 3000);
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener(
          'beforeinstallprompt',
          onBeforeInstallPrompt
        );
        window.removeEventListener('appinstalled', onAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'dismissed') rememberDismiss();
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleClose = () => {
    rememberDismiss();
    setVisible(false);
  };

  if (!visible) return null;

  if (showIOSHint && !deferredPrompt) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-md rounded-2xl bg-white shadow-xl shadow-slate-900/10 border border-slate-100 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A9AE2] to-[#0659AA] flex items-center justify-center text-white flex-shrink-0">
              <Download size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">
                Install Aspire
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tap{' '}
                <Share size={12} className="inline mx-0.5 -mt-0.5" /> then
                <span className="font-semibold"> Add to Home Screen </span>
                <Plus size={12} className="inline mx-0.5 -mt-0.5" /> to
                install the app.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Dismiss install hint"
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md rounded-2xl bg-white shadow-xl shadow-slate-900/10 border border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A9AE2] to-[#0659AA] flex items-center justify-center text-white flex-shrink-0">
            <Download size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900">
              Install Aspire
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Add to your home screen for a faster, app-like experience.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Dismiss"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[#0A9AE2] to-[#0659AA] rounded-lg shadow-md shadow-blue-200 hover:opacity-90"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
};

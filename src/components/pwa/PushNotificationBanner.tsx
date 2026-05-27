'use client';

import { useEffect, useState } from 'react';
import { BellRing, X, Loader2 } from 'lucide-react';
import { isAxiosError } from 'axios';
import { usePushSubscription } from '@/features/push/hooks/usePushSubscription';
import { showClientErrorAlert } from '@/lib/errorAlert';

export function PushNotificationBanner() {
  const { isSupported, permission, isSubscribed, subscribe, isLoading } = usePushSubscription();
  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // Only show if supported, not loading initial status, permission is not determined/denied, 
    // and user is not already subscribed, and hasn't explicitly dismissed the banner
    if (isLoading) return;
    
    const isDismissed = localStorage.getItem('push_prompt_dismissed') === 'true';
    if (!isSupported || isDismissed || isSubscribed || permission === 'denied') {
      setIsVisible(false);
      return;
    }

    if (permission === 'default' || (permission === 'granted' && !isSubscribed)) {
      // Add a small delay to not overwhelm the user immediately on page load
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isSupported, isSubscribed, permission]);

  const handleDismiss = () => {
    localStorage.setItem('push_prompt_dismissed', 'true');
    setIsVisible(false);
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      await subscribe();
      setIsVisible(false);
    } catch (err) {
      console.error('Subscription failed', err);
      if (!isAxiosError(err)) {
        void showClientErrorAlert('Please allow notifications in your browser settings and try again.', 'Notifications not enabled');
      }
      // Let the user try again later, or hide it if denied
      if (Notification.permission === 'denied') {
        setIsVisible(false);
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-8 sm:right-8 sm:max-w-sm w-[calc(100%-2rem)]">
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl dark:bg-slate-900 dark:border-slate-700 animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div className="flex items-start gap-4 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A9AE2]/10 text-[#0A9AE2] mt-0.5">
            <BellRing size={20} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Enable Push Notifications</h3>
              <button 
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors -mt-1 -mr-2 p-1"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Get notified immediately about urgent broadcasts, exam updates, and important announcements even when you&apos;re not using the app.
            </p>
            
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleSubscribe}
                disabled={isSubscribing}
                className="flex items-center gap-1.5 rounded-lg bg-[#0A9AE2] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#0864B6] disabled:opacity-70"
              >
                {isSubscribing ? <><Loader2 size={14} className="animate-spin" /> Enabling...</> : 'Enable Now'}
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-lg px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

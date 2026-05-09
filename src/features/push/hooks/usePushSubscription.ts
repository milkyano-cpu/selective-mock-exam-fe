'use client';

import { useCallback, useEffect, useState } from 'react';
import { pushService, type PushSubscriptionKeys } from '../services/push.service';

export type PushSubscriptionStatus = 'enabled' | 'disabled' | 'not_supported';

// Utility to convert Base64-url to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function parseSubscriptionKeys(
  keys?: Record<string, string>,
): PushSubscriptionKeys | null {
  if (!keys?.p256dh || !keys?.auth) {
    return null;
  }

  return {
    p256dh: keys.p256dh,
    auth: keys.auth,
  };
}

export function usePushSubscription() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (err) {
        console.error('Error checking push subscription status:', err);
      }
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  const subscribe = async () => {
    if (!isSupported) throw new Error('Push notifications are not supported by your browser.');
    
    setIsLoading(true);
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult !== 'granted') {
        throw new Error('Permission not granted for push notifications');
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID key from our backend
      const vapidRes = await pushService.getVapidPublicKey();
      if (!vapidRes.success || !vapidRes.publicKey) {
        throw new Error('Failed to get VAPID public key');
      }
      
      const applicationServerKey = urlBase64ToUint8Array(vapidRes.publicKey);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Send to backend
      const subJson = subscription.toJSON();
      const subscriptionKeys = parseSubscriptionKeys(subJson.keys);

      if (!subJson.endpoint || !subscriptionKeys) {
        throw new Error('Invalid subscription generated');
      }

      await pushService.subscribeDevice(
        {
          endpoint: subJson.endpoint,
          keys: subscriptionKeys,
        },
        navigator.userAgent
      );

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!isSupported) return false;
    
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await pushService.unsubscribeDevice(endpoint);
      }
      
      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error('Failed to unsubscribe from push notifications:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const status: PushSubscriptionStatus = !isSupported
    ? 'not_supported'
    : isSubscribed
      ? 'enabled'
      : 'disabled';

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    status,
    subscribe,
    unsubscribe,
    checkStatus,
  };
}

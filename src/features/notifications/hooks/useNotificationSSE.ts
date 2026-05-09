'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useNotificationStore } from '../store/notification.store';
import { notificationService, type NotificationItem } from '../services/notification.service';

const RECONNECT_DELAY_MS = 3_000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const MAX_RECONNECT_ATTEMPTS = 10;

export function useNotificationSSE() {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef(RECONNECT_DELAY_MS);
  const retryCountRef = useRef(0);

  const fetchInitialData = useCallback(async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        notificationService.unreadCount(),
        notificationService.list({ limit: 10, unreadOnly: false }),
      ]);
      setUnreadCount(countRes.count);
      setNotifications(listRes.data);
    } catch {
      // Silent — SSE will update state soon
    }
  }, [setUnreadCount, setNotifications]);

  useEffect(() => {
    let mounted = true;

    void fetchInitialData();

    function connect() {
      if (!mounted) return;

      const es = new EventSource('/api/notifications/sse', { withCredentials: true });
      esRef.current = es;

      es.addEventListener('connected', () => {
        retryRef.current = RECONNECT_DELAY_MS;
        retryCountRef.current = 0;
      });

      es.addEventListener('notification', (e) => {
        try {
          const data = JSON.parse(e.data) as NotificationItem;
          addNotification(data);
        } catch {
          // Malformed event, ignore
        }
      });

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (!mounted) return;
        retryCountRef.current += 1;
        if (retryCountRef.current > MAX_RECONNECT_ATTEMPTS) return;
        setTimeout(connect, retryRef.current);
        retryRef.current = Math.min(retryRef.current * 2, MAX_RECONNECT_DELAY_MS);
      };
    }

    connect();

    return () => {
      mounted = false;
      esRef.current?.close();
      esRef.current = null;
    };
  }, [addNotification, fetchInitialData]);
}

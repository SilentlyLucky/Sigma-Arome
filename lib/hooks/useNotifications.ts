'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface AppNotification {
  id: string;
  recipient_role: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  created_at: string;
}

/** Show at most this many recent notifications in the bell, mixing read + unread. */
const MAX_VISIBLE = 7;
const POLL_INTERVAL_MS = 30_000;
const CACHE_FRESH_MS = 10_000;

const notificationCache = new Map<string, AppNotification[]>();
const notificationFetchedAt = new Map<string, number>();
const notificationInFlight = new Map<string, Promise<AppNotification[]>>();

function areNotificationsEqual(a: AppNotification[], b: AppNotification[]) {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item.id === b[index]?.id && item.read === b[index]?.read);
}

async function fetchNotificationsForRole(role: string, force = false) {
  if (!role) return [];

  const cached = notificationCache.get(role) ?? [];
  const fetchedAt = notificationFetchedAt.get(role) ?? 0;
  if (!force && fetchedAt > 0 && Date.now() - fetchedAt < CACHE_FRESH_MS) return cached;

  const existing = notificationInFlight.get(role);
  if (existing) return existing;

  const params = new URLSearchParams({
    'filter[recipient_role][_eq]': role,
    'sort[]': '-created_at',
    limit: String(MAX_VISIBLE),
  });

  const request = fetch(`/api/items/notifications?${params}`)
    .then(async (res) => {
      if (!res.ok) {
        if (res.status === 429) {
          console.warn(`Notifications rate limited for role "${role}"; keeping cached notifications.`);
        }
        return cached;
      }

      const json = await res.json();
      const next = ((json.data ?? []) as AppNotification[]).slice(0, MAX_VISIBLE);
      notificationCache.set(role, next);
      notificationFetchedAt.set(role, Date.now());
      return next;
    })
    .catch((error) => {
      console.warn(`Notifications fetch failed for role "${role}"`, error);
      return cached;
    })
    .finally(() => {
      notificationInFlight.delete(role);
    });

  notificationInFlight.set(role, request);
  return request;
}

export function useNotifications(role: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => notificationCache.get(role) ?? []);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  /**
   * Fetch the most recent notifications for this role, capped at MAX_VISIBLE.
   * Includes both read and unread — once a user reads something we still want
   * to show it for context, until it scrolls off the cap.
   */
  const fetchRecent = useCallback(async () => {
    return fetchNotificationsForRole(role);
  }, [role]);

  useEffect(() => {
    if (!role) {
      setNotifications([]);
      return;
    }

    let cancelled = false;
    fetchRecent().then((next) => {
      if (!cancelled) {
        setNotifications((prev) => (areNotificationsEqual(prev, next) ? prev : next));
      }
    });

    // Poll as a fallback when realtime is unavailable, but keep it gentle so
    // the notification bell cannot exhaust the API rate limit by itself.
    const pollInterval = setInterval(() => {
      fetchNotificationsForRole(role, true).then((next) => {
        if (cancelled) return;
        setNotifications((prev) => (areNotificationsEqual(prev, next) ? prev : next));
      });
    }, POLL_INTERVAL_MS);

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${role}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_role=eq.${role}`,
        },
        (payload) => {
          const newNotif = payload.new as AppNotification;
          // Avoid duplicates if the poll already picked this up
          setNotifications((prev) => {
            const next = prev.some((n) => n.id === newNotif.id)
              ? prev
              : [newNotif, ...prev].slice(0, MAX_VISIBLE);
            notificationCache.set(role, next);
            notificationFetchedAt.set(role, Date.now());
            return next;
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [role, fetchRecent]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useCallback(async (id: string) => {
    await fetch(`/api/items/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true }),
    });
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      notificationCache.set(role, next);
      return next;
    });
  }, [role]);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(
      unread.map((n) =>
        fetch(`/api/items/notifications/${n.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ read: true }),
        })
      )
    );
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      notificationCache.set(role, next);
      return next;
    });
  }, [notifications, role]);

  return { notifications, unreadCount, markRead, markAllRead };
}

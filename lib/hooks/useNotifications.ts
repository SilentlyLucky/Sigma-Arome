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

export function useNotifications(role: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  /**
   * Fetch the most recent notifications for this role, capped at MAX_VISIBLE.
   * Includes both read and unread — once a user reads something we still want
   * to show it for context, until it scrolls off the cap.
   */
  const fetchRecent = useCallback(async () => {
    const params = new URLSearchParams({
      'filter[recipient_role][_eq]': role,
      'sort[]': '-created_at',
      'limit': String(MAX_VISIBLE),
    });
    const res = await fetch(`/api/items/notifications?${params}`);
    if (!res.ok) return;
    const json = await res.json();
    setNotifications((json.data ?? []).slice(0, MAX_VISIBLE));
  }, [role]);

  useEffect(() => {
    fetchRecent();

    // Poll every 5s for near-live updates. Self-hosted Supabase often doesn't
    // expose the supabase_realtime publication, so polling is the safe default.
    const pollInterval = setInterval(fetchRecent, 5000);

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
          setNotifications((prev) =>
            prev.some((n) => n.id === newNotif.id)
              ? prev
              : [newNotif, ...prev].slice(0, MAX_VISIBLE)
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
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
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

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
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [notifications]);

  return { notifications, unreadCount, markRead, markAllRead };
}

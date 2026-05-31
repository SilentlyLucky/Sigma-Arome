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

export function useNotifications(role: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  const fetchUnread = useCallback(async () => {
    const params = new URLSearchParams({
      'filter[recipient_role][_eq]': role,
      'filter[read][_eq]': 'false',
      'sort[]': '-created_at',
      'limit': '20',
    });
    const res = await fetch(`/api/items/notifications?${params}`);
    if (!res.ok) return;
    const json = await res.json();
    setNotifications(json.data ?? []);
  }, [role]);

  useEffect(() => {
    fetchUnread();

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
          setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role, fetchUnread]);

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

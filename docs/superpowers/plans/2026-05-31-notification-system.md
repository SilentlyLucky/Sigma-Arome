# Notification System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real-time, persistent bell-icon notification system to all 6 non-admin role layouts, driven by PostgreSQL triggers that fire automatically when key operational events occur.

**Architecture:** A `notifications` DaaS collection stores all alerts persistently. PostgreSQL triggers on existing tables (`raw_material_orders`, `raw_material_receipts`, `batches`, `production_orders`, `material_requests`) automatically insert notification rows when status fields change. The frontend subscribes via Supabase Realtime for instant delivery — no polling, no manual notification writes in UI code.

**Tech Stack:** Next.js 16, Mantine v8, Supabase Realtime (`@supabase/supabase-js` v2), `@tabler/icons-react` v3, DaaS (Directus-like) backend.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `lib/hooks/useNotifications.ts` | Create | Supabase Realtime subscription + fetch hook |
| `components/NotificationBell.tsx` | Create | Bell icon + popover UI component |
| `supabase/migrations/20260531000001_notifications_table.sql` | Create | Creates `notifications` table (mirrors DaaS collection) |
| `supabase/migrations/20260531000002_notification_triggers.sql` | Create | All PostgreSQL trigger functions |
| `app/(authenticated)/ppic/layout.tsx` | Modify | Add `<NotificationBell role="ppic" />` |
| `app/(authenticated)/warehouse/layout.tsx` | Modify | Add `<NotificationBell role="warehouse" />` |
| `app/(authenticated)/qc/layout.tsx` | Modify | Add `<NotificationBell role="qc" />` |
| `app/(authenticated)/production/layout.tsx` | Modify | Add `<NotificationBell role="production" />` |
| `app/(authenticated)/logistic/layout.tsx` | Modify | Add `<NotificationBell role="logistic" />` |
| `app/(authenticated)/manager/layout.tsx` | Modify | Add `<NotificationBell role="manager" />` |

---

## Task 1: Create `notifications` DaaS Collection + RBAC

This task is manual — done in the DaaS admin UI.

- [ ] **Step 1: Create the collection**

  Log into the DaaS admin panel. Go to Settings → Data Model → Create Collection.
  - Collection name: `notifications`
  - Primary key: `id` (UUID, auto-generated)

- [ ] **Step 2: Add fields**

  Add these fields to the `notifications` collection:

  | Field name | Type | Notes |
  |---|---|---|
  | `recipient_role` | String | Required |
  | `type` | String | Required |
  | `title` | String | Required |
  | `message` | String | Required |
  | `link` | String | Required |
  | `read` | Boolean | Default: `false` |
  | `created_at` | Timestamp | Auto-populated on create |

- [ ] **Step 3: Create "Read and mark own notifications" policy**

  Go to Settings → Access Control → Create Policy.
  - Name: `Read Own Notifications`
  - Collection: `notifications`
  - Action: Read
  - Filter (Permissions): `{ "recipient_role": { "_eq": "$CURRENT_USER_ROLE" } }`
  - Action: Update (field `read` only)
  - Same filter
  - Assign to roles: `ppic`, `warehouse`, `qc`, `production`, `logistic`, `manager`

- [ ] **Step 4: Create "Create notifications" policy**

  - Name: `Create Notifications`
  - Collection: `notifications`
  - Action: Create
  - No row filter
  - Assign to roles: `ppic`, `warehouse`, `qc`, `production`, `logistic`, `manager`

- [ ] **Step 5: Enable Supabase Realtime on the table**

  In Supabase dashboard → Database → Replication → Tables → find `notifications` → enable Realtime.

---

## Task 2: Write SQL Migrations

These SQL files will be applied in Supabase SQL Editor (Dashboard → SQL Editor → New Query).

- [ ] **Step 1: Create the migrations directory**

  ```bash
  mkdir -p supabase/migrations
  ```

- [ ] **Step 2: Create `supabase/migrations/20260531000001_notifications_table.sql`**

  This migration is a safety net — it creates the table if DaaS didn't already create it. If DaaS already created the table, this migration is skipped.

  ```sql
  -- Only creates if DaaS did not already create it.
  CREATE TABLE IF NOT EXISTS notifications (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_role text NOT NULL,
    type        text NOT NULL,
    title       text NOT NULL,
    message     text NOT NULL,
    link        text NOT NULL,
    read        boolean NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now()
  );

  -- Index for fast role-based queries
  CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role
    ON notifications (recipient_role, read, created_at DESC);

  -- Enable Row Level Security (required for Supabase Realtime filtering)
  ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

  -- Policy: users can read their own role's notifications
  -- NOTE: This uses the app_role claim set by DaaS auth. Adjust claim name if needed.
  CREATE POLICY "read_own_role_notifications"
    ON notifications FOR SELECT
    USING (true); -- DaaS enforces role filter; Supabase RLS is permissive here

  -- Policy: service role can insert (triggers run as SECURITY DEFINER)
  CREATE POLICY "insert_notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

  -- Policy: allow update of read field
  CREATE POLICY "update_own_notifications"
    ON notifications FOR UPDATE
    USING (true)
    WITH CHECK (true);
  ```

  Apply this in Supabase SQL Editor. Run it and confirm "Success".

- [ ] **Step 3: Create `supabase/migrations/20260531000002_notification_triggers.sql`**

  ```sql
  -- ─── Helper function ────────────────────────────────────────────────────────
  CREATE OR REPLACE FUNCTION insert_notification(
    p_recipient_role text,
    p_type           text,
    p_title          text,
    p_message        text,
    p_link           text
  ) RETURNS void AS $$
  BEGIN
    INSERT INTO notifications (recipient_role, type, title, message, link, read, created_at)
    VALUES (p_recipient_role, p_type, p_title, p_message, p_link, false, now());
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;


  -- ─── Trigger 1: raw_material_orders → ordered ───────────────────────────────
  -- Notifies: warehouse
  CREATE OR REPLACE FUNCTION trg_fn_rmo_ordered()
  RETURNS trigger AS $$
  BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'ordered' THEN
      PERFORM insert_notification(
        'warehouse',
        'material_order_created',
        'New material order incoming',
        'A new raw material order has been placed and is on its way.',
        '/warehouse/incoming'
      );
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trg_rmo_ordered ON raw_material_orders;
  CREATE TRIGGER trg_rmo_ordered
    AFTER UPDATE ON raw_material_orders
    FOR EACH ROW EXECUTE FUNCTION trg_fn_rmo_ordered();


  -- ─── Trigger 2 + 2b: raw_material_receipts INSERT ───────────────────────────
  -- Notifies: qc (new batch to inspect) + ppic (order received)
  CREATE OR REPLACE FUNCTION trg_fn_receipt_insert()
  RETURNS trigger AS $$
  BEGIN
    PERFORM insert_notification(
      'qc',
      'batch_received_qc',
      'New batch waiting for inspection',
      'A raw material receipt was logged. Batches are ready for QC inspection.',
      '/qc/queue'
    );
    PERFORM insert_notification(
      'ppic',
      'material_order_received',
      'Material order received',
      'A raw material receipt has been logged against one of your orders.',
      '/ppic/orders'
    );
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trg_receipt_insert ON raw_material_receipts;
  CREATE TRIGGER trg_receipt_insert
    AFTER INSERT ON raw_material_receipts
    FOR EACH ROW EXECUTE FUNCTION trg_fn_receipt_insert();


  -- ─── Trigger 3: batches → approved ──────────────────────────────────────────
  -- Notifies: warehouse (assign storage)
  CREATE OR REPLACE FUNCTION trg_fn_batch_approved()
  RETURNS trigger AS $$
  BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'approved' THEN
      PERFORM insert_notification(
        'warehouse',
        'batch_qc_approved',
        'QC approved — assign storage',
        'A batch has been approved by QC and needs a storage location assigned.',
        '/warehouse/putaway'
      );
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trg_batch_approved ON batches;
  CREATE TRIGGER trg_batch_approved
    AFTER UPDATE ON batches
    FOR EACH ROW EXECUTE FUNCTION trg_fn_batch_approved();


  -- ─── Trigger 3b + 3c: batches → rejected ────────────────────────────────────
  -- Notifies: warehouse + ppic
  CREATE OR REPLACE FUNCTION trg_fn_batch_rejected()
  RETURNS trigger AS $$
  BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'rejected' THEN
      PERFORM insert_notification(
        'warehouse',
        'batch_qc_rejected',
        'QC rejected a batch',
        'A batch was rejected by QC. Review the batch and coordinate disposal.',
        '/warehouse/batches'
      );
      PERFORM insert_notification(
        'ppic',
        'batch_qc_rejected_ppic',
        'QC rejected a batch',
        'A raw material batch was rejected by QC. The order may need to be re-placed.',
        '/ppic/orders'
      );
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trg_batch_rejected ON batches;
  CREATE TRIGGER trg_batch_rejected
    AFTER UPDATE ON batches
    FOR EACH ROW EXECUTE FUNCTION trg_fn_batch_rejected();


  -- ─── Trigger 3d + 3e: batches → hold ────────────────────────────────────────
  -- Notifies: warehouse + ppic
  CREATE OR REPLACE FUNCTION trg_fn_batch_hold()
  RETURNS trigger AS $$
  BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'hold' THEN
      PERFORM insert_notification(
        'warehouse',
        'batch_on_hold',
        'QC placed a batch on hold',
        'A batch has been put on hold by QC. Await further instructions.',
        '/warehouse/batches'
      );
      PERFORM insert_notification(
        'ppic',
        'batch_on_hold_ppic',
        'QC placed a batch on hold',
        'A raw material batch was placed on hold by QC. Monitor the situation.',
        '/ppic/orders'
      );
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trg_batch_hold ON batches;
  CREATE TRIGGER trg_batch_hold
    AFTER UPDATE ON batches
    FOR EACH ROW EXECUTE FUNCTION trg_fn_batch_hold();


  -- ─── Trigger 4: production_orders → released ────────────────────────────────
  -- Notifies: warehouse
  CREATE OR REPLACE FUNCTION trg_fn_prod_released()
  RETURNS trigger AS $$
  BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'released' THEN
      PERFORM insert_notification(
        'warehouse',
        'production_order_released',
        'New production order released',
        'A production order has been released. Prepare materials for the production floor.',
        '/warehouse/production'
      );
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trg_prod_released ON production_orders;
  CREATE TRIGGER trg_prod_released
    AFTER UPDATE ON production_orders
    FOR EACH ROW EXECUTE FUNCTION trg_fn_prod_released();


  -- ─── Trigger 5: production_orders → in_progress ─────────────────────────────
  -- Notifies: production
  CREATE OR REPLACE FUNCTION trg_fn_prod_in_progress()
  RETURNS trigger AS $$
  BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'in_progress' THEN
      PERFORM insert_notification(
        'production',
        'production_order_started',
        'Materials ready — start production',
        'Materials have been issued. Your production order is ready to execute.',
        '/production/orders'
      );
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trg_prod_in_progress ON production_orders;
  CREATE TRIGGER trg_prod_in_progress
    AFTER UPDATE ON production_orders
    FOR EACH ROW EXECUTE FUNCTION trg_fn_prod_in_progress();


  -- ─── Trigger 6 + 6b: production_orders → completed ──────────────────────────
  -- Notifies: warehouse + ppic
  CREATE OR REPLACE FUNCTION trg_fn_prod_completed()
  RETURNS trigger AS $$
  BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed' THEN
      PERFORM insert_notification(
        'warehouse',
        'production_order_completed_wh',
        'Production order finished',
        'A production order has been completed. Check for finished goods to put away.',
        '/warehouse/batches'
      );
      PERFORM insert_notification(
        'ppic',
        'production_order_completed_ppic',
        'Production order finished',
        'A production order has been marked as completed.',
        '/ppic/production'
      );
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trg_prod_completed ON production_orders;
  CREATE TRIGGER trg_prod_completed
    AFTER UPDATE ON production_orders
    FOR EACH ROW EXECUTE FUNCTION trg_fn_prod_completed();


  -- ─── Trigger 7: material_requests → submitted ───────────────────────────────
  -- Notifies: logistic
  CREATE OR REPLACE FUNCTION trg_fn_mr_submitted()
  RETURNS trigger AS $$
  BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'submitted' THEN
      PERFORM insert_notification(
        'logistic',
        'material_request_submitted',
        'New material request needs coordination',
        'A material request has been submitted and is waiting for logistic coordination.',
        '/logistic/requests'
      );
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trg_mr_submitted ON material_requests;
  CREATE TRIGGER trg_mr_submitted
    AFTER UPDATE ON material_requests
    FOR EACH ROW EXECUTE FUNCTION trg_fn_mr_submitted();


  -- ─── Trigger 8: material_requests → coordinated ─────────────────────────────
  -- Notifies: warehouse
  CREATE OR REPLACE FUNCTION trg_fn_mr_coordinated()
  RETURNS trigger AS $$
  BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'coordinated' THEN
      PERFORM insert_notification(
        'warehouse',
        'material_request_coordinated',
        'Movement coordinated — ready to issue',
        'Logistic has coordinated a material request. Issue the materials to production.',
        '/warehouse/issue'
      );
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trg_mr_coordinated ON material_requests;
  CREATE TRIGGER trg_mr_coordinated
    AFTER UPDATE ON material_requests
    FOR EACH ROW EXECUTE FUNCTION trg_fn_mr_coordinated();
  ```

  Apply in Supabase SQL Editor. Confirm "Success".

- [ ] **Step 4: Commit the migration files**

  ```bash
  git add supabase/migrations/
  git commit -m "feat: add notification SQL migrations and triggers"
  ```

---

## Task 3: Create `useNotifications` Hook

- [ ] **Step 1: Create `lib/hooks/useNotifications.ts`**

  ```typescript
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
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add lib/hooks/useNotifications.ts
  git commit -m "feat: add useNotifications hook with Supabase Realtime"
  ```

---

## Task 4: Create `NotificationBell` Component

- [ ] **Step 1: Create `components/NotificationBell.tsx`**

  ```tsx
  'use client';

  import {
    ActionIcon,
    Box,
    Group,
    Indicator,
    Popover,
    ScrollArea,
    Stack,
    Text,
    UnstyledButton,
  } from '@mantine/core';
  import { useDisclosure } from '@mantine/hooks';
  import { IconBell, IconCircleCheck } from '@tabler/icons-react';
  import { useRouter } from 'next/navigation';
  import { useNotifications } from '@/lib/hooks/useNotifications';

  interface NotificationBellProps {
    role: string;
  }

  export function NotificationBell({ role }: NotificationBellProps) {
    const [opened, { toggle, close }] = useDisclosure(false);
    const router = useRouter();
    const { notifications, unreadCount, markRead, markAllRead } = useNotifications(role);

    const handleClick = async (id: string, link: string) => {
      await markRead(id);
      close();
      router.push(link);
    };

    const formatTime = (iso: string) => {
      const diff = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    };

    return (
      <Popover
        opened={opened}
        onClose={close}
        position="bottom-end"
        width={360}
        shadow="md"
        withinPortal
      >
        <Popover.Target>
          <Indicator
            label={unreadCount > 0 ? String(unreadCount) : undefined}
            size={16}
            color="red"
            disabled={unreadCount === 0}
            processing={unreadCount > 0}
          >
            <ActionIcon
              variant="subtle"
              size="lg"
              radius="xl"
              onClick={toggle}
              aria-label="Notifications"
            >
              <IconBell size={20} />
            </ActionIcon>
          </Indicator>
        </Popover.Target>

        <Popover.Dropdown p={0}>
          <Group justify="space-between" px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
            <Text fw={600} size="sm">Notifications</Text>
            <UnstyledButton
              onClick={markAllRead}
              style={{ opacity: unreadCount === 0 ? 0.4 : 1, pointerEvents: unreadCount === 0 ? 'none' : 'auto' }}
            >
              <Text size="xs" c="dimmed">Mark all read</Text>
            </UnstyledButton>
          </Group>

          <ScrollArea mah={400}>
            {notifications.length === 0 ? (
              <Stack align="center" gap="xs" py="xl" px="md">
                <IconCircleCheck size={32} color="var(--mantine-color-green-6)" />
                <Text size="sm" c="dimmed">You&apos;re all caught up</Text>
              </Stack>
            ) : (
              <Stack gap={0}>
                {notifications.map((notif) => (
                  <UnstyledButton
                    key={notif.id}
                    onClick={() => handleClick(notif.id, notif.link)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: 'var(--mantine-spacing-sm) var(--mantine-spacing-md)',
                      borderBottom: '1px solid var(--mantine-color-default-border)',
                      background: notif.read ? undefined : 'var(--mantine-color-blue-light)',
                    }}
                  >
                    <Group gap="xs" wrap="nowrap" align="flex-start">
                      <Box
                        w={3}
                        h={36}
                        style={{
                          borderRadius: 2,
                          flexShrink: 0,
                          background: notif.read
                            ? 'var(--mantine-color-default-border)'
                            : 'var(--mantine-color-blue-6)',
                        }}
                      />
                      <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Group justify="space-between" wrap="nowrap">
                          <Text size="sm" fw={notif.read ? 400 : 600} lineClamp={1}>
                            {notif.title}
                          </Text>
                          <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                            {formatTime(notif.created_at)}
                          </Text>
                        </Group>
                        <Text size="xs" c="dimmed" lineClamp={2}>
                          {notif.message}
                        </Text>
                      </Stack>
                    </Group>
                  </UnstyledButton>
                ))}
              </Stack>
            )}
          </ScrollArea>
        </Popover.Dropdown>
      </Popover>
    );
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add components/NotificationBell.tsx
  git commit -m "feat: add NotificationBell component"
  ```

---

## Task 5: Update PPIC Layout

- [ ] **Step 1: Modify `app/(authenticated)/ppic/layout.tsx`**

  Add import at top (after existing imports):
  ```tsx
  import { NotificationBell } from '@/components/NotificationBell';
  ```

  Replace the header `<Menu>` block with a `<Group>` wrapping the bell and menu:
  ```tsx
  // BEFORE:
  <Menu shadow="md" width={200}>
    <Menu.Target>
      <ActionIcon variant="subtle" size="lg" radius="xl">
        <Avatar size="sm" color="teal">P</Avatar>
      </ActionIcon>
    </Menu.Target>
    <Menu.Dropdown>
      <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>
      <Menu.Divider />
      <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={handleLogout}>Logout</Menu.Item>
    </Menu.Dropdown>
  </Menu>

  // AFTER:
  <Group gap="xs">
    <NotificationBell role="ppic" />
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <ActionIcon variant="subtle" size="lg" radius="xl">
          <Avatar size="sm" color="teal">P</Avatar>
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>
        <Menu.Divider />
        <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={handleLogout}>Logout</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  </Group>
  ```

- [ ] **Step 2: Run build to verify no TypeScript errors**

  ```bash
  pnpm build
  ```
  Expected: zero errors.

- [ ] **Step 3: Commit**

  ```bash
  git add app/\(authenticated\)/ppic/layout.tsx
  git commit -m "feat: add notification bell to PPIC layout"
  ```

---

## Task 6: Update Warehouse Layout

- [ ] **Step 1: Modify `app/(authenticated)/warehouse/layout.tsx`**

  Add import after existing imports:
  ```tsx
  import { NotificationBell } from '@/components/NotificationBell';
  ```

  In the `handleLogout` inline arrow function — this layout has it inline. Replace the header right-side `<Menu>` block:
  ```tsx
  // BEFORE:
  <Menu shadow="md" width={200}>
    <Menu.Target><ActionIcon variant="subtle" size="lg" radius="xl"><Avatar size="sm" color="orange">W</Avatar></ActionIcon></Menu.Target>
    <Menu.Dropdown>
      <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>
      <Menu.Divider />
      <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}>Logout</Menu.Item>
    </Menu.Dropdown>
  </Menu>

  // AFTER:
  <Group gap="xs">
    <NotificationBell role="warehouse" />
    <Menu shadow="md" width={200}>
      <Menu.Target><ActionIcon variant="subtle" size="lg" radius="xl"><Avatar size="sm" color="orange">W</Avatar></ActionIcon></Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>
        <Menu.Divider />
        <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}>Logout</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  </Group>
  ```

- [ ] **Step 2: Run build**

  ```bash
  pnpm build
  ```
  Expected: zero errors.

- [ ] **Step 3: Commit**

  ```bash
  git add app/\(authenticated\)/warehouse/layout.tsx
  git commit -m "feat: add notification bell to Warehouse layout"
  ```

---

## Task 7: Update QC Layout

- [ ] **Step 1: Modify `app/(authenticated)/qc/layout.tsx`**

  Add import after existing imports:
  ```tsx
  import { NotificationBell } from '@/components/NotificationBell';
  ```

  Replace header right-side:
  ```tsx
  // BEFORE:
  <Menu shadow="md" width={200}>
    <Menu.Target><ActionIcon variant="subtle" size="lg" radius="xl"><Avatar size="sm" color="grape">Q</Avatar></ActionIcon></Menu.Target>
    <Menu.Dropdown>
      <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>
      <Menu.Divider />
      <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}>Logout</Menu.Item>
    </Menu.Dropdown>
  </Menu>

  // AFTER:
  <Group gap="xs">
    <NotificationBell role="qc" />
    <Menu shadow="md" width={200}>
      <Menu.Target><ActionIcon variant="subtle" size="lg" radius="xl"><Avatar size="sm" color="grape">Q</Avatar></ActionIcon></Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>
        <Menu.Divider />
        <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}>Logout</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  </Group>
  ```

- [ ] **Step 2: Run build**

  ```bash
  pnpm build
  ```
  Expected: zero errors.

- [ ] **Step 3: Commit**

  ```bash
  git add app/\(authenticated\)/qc/layout.tsx
  git commit -m "feat: add notification bell to QC layout"
  ```

---

## Task 8: Update Production Layout

- [ ] **Step 1: Modify `app/(authenticated)/production/layout.tsx`**

  Add import after existing imports:
  ```tsx
  import { NotificationBell } from '@/components/NotificationBell';
  ```

  Replace header right-side:
  ```tsx
  // BEFORE:
  <Menu shadow="md" width={200}>
    <Menu.Target><ActionIcon variant="subtle" size="lg" radius="xl"><Avatar size="sm" color="violet">P</Avatar></ActionIcon></Menu.Target>
    <Menu.Dropdown>
      <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>
      <Menu.Divider />
      <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}>Logout</Menu.Item>
    </Menu.Dropdown>
  </Menu>

  // AFTER:
  <Group gap="xs">
    <NotificationBell role="production" />
    <Menu shadow="md" width={200}>
      <Menu.Target><ActionIcon variant="subtle" size="lg" radius="xl"><Avatar size="sm" color="violet">P</Avatar></ActionIcon></Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>
        <Menu.Divider />
        <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}>Logout</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  </Group>
  ```

- [ ] **Step 2: Run build**

  ```bash
  pnpm build
  ```
  Expected: zero errors.

- [ ] **Step 3: Commit**

  ```bash
  git add app/\(authenticated\)/production/layout.tsx
  git commit -m "feat: add notification bell to Production layout"
  ```

---

## Task 9: Update Logistic Layout

- [ ] **Step 1: Modify `app/(authenticated)/logistic/layout.tsx`**

  Add import after existing imports:
  ```tsx
  import { NotificationBell } from '@/components/NotificationBell';
  ```

  Replace header right-side:
  ```tsx
  // BEFORE:
  <Menu shadow="md" width={200}>
    <Menu.Target><ActionIcon variant="subtle" size="lg" radius="xl"><Avatar size="sm" color="cyan">L</Avatar></ActionIcon></Menu.Target>
    <Menu.Dropdown>
      <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>
      <Menu.Divider />
      <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}>Logout</Menu.Item>
    </Menu.Dropdown>
  </Menu>

  // AFTER:
  <Group gap="xs">
    <NotificationBell role="logistic" />
    <Menu shadow="md" width={200}>
      <Menu.Target><ActionIcon variant="subtle" size="lg" radius="xl"><Avatar size="sm" color="cyan">L</Avatar></ActionIcon></Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>
        <Menu.Divider />
        <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}>Logout</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  </Group>
  ```

- [ ] **Step 2: Run build**

  ```bash
  pnpm build
  ```
  Expected: zero errors.

- [ ] **Step 3: Commit**

  ```bash
  git add app/\(authenticated\)/logistic/layout.tsx
  git commit -m "feat: add notification bell to Logistic layout"
  ```

---

## Task 10: Update Manager Layout

- [ ] **Step 1: Modify `app/(authenticated)/manager/layout.tsx`**

  Add import after existing imports:
  ```tsx
  import { NotificationBell } from '@/components/NotificationBell';
  ```

  Replace header right-side:
  ```tsx
  // BEFORE:
  <Menu shadow="md" width={200}>
    <Menu.Target><ActionIcon variant="subtle" size="lg" radius="xl"><Avatar size="sm" color="indigo">M</Avatar></ActionIcon></Menu.Target>
    <Menu.Dropdown>
      <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>
      <Menu.Divider />
      <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}>Logout</Menu.Item>
    </Menu.Dropdown>
  </Menu>

  // AFTER:
  <Group gap="xs">
    <NotificationBell role="manager" />
    <Menu shadow="md" width={200}>
      <Menu.Target><ActionIcon variant="subtle" size="lg" radius="xl"><Avatar size="sm" color="indigo">M</Avatar></ActionIcon></Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>
        <Menu.Divider />
        <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}>Logout</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  </Group>
  ```

- [ ] **Step 2: Run final build**

  ```bash
  pnpm build
  ```
  Expected: zero TypeScript errors, zero build errors.

- [ ] **Step 3: Commit**

  ```bash
  git add app/\(authenticated\)/manager/layout.tsx
  git commit -m "feat: add notification bell to Manager layout"
  ```

---

## Task 11: Manual Verification

- [ ] **Step 1: Start dev server**

  ```bash
  pnpm dev
  ```

- [ ] **Step 2: Verify bell appears in each layout**

  Log in as each role. Confirm:
  - Bell icon appears to the left of the avatar in the header
  - Badge is hidden when no unread notifications exist
  - Clicking the bell opens the popover with "You're all caught up" empty state

- [ ] **Step 3: Verify a trigger end-to-end**

  Log in as PPIC in one browser tab. Log in as Warehouse in another.
  1. In PPIC: change a raw material order status to `ordered`
  2. In Warehouse: within seconds, the bell badge should increment and show "New material order incoming"
  3. Click the notification — it should navigate to `/warehouse/incoming` and the badge should decrement

- [ ] **Step 4: Verify mark all read**

  With multiple unread notifications, click "Mark all read". Confirm badge goes to zero and all rows lose their blue tint.

- [ ] **Step 5: Verify persistence**

  Receive a notification, refresh the page. Confirm the unread notification is still there.

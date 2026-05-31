# Notification System Design
**Date:** 2026-05-31
**Scope:** Cross-role alert system for PPIC, Warehouse Operation, QC, Production, Logistic, Manager. Admin excluded.

---

## Overview

A persistent, real-time notification system that automatically alerts relevant roles when key operational events occur. Notifications are stored in DaaS, triggered by PostgreSQL triggers, and delivered instantly via Supabase Realtime. The frontend is completely passive — it never writes notifications manually.

---

## 1. Data Layer

### DaaS Collection: `notifications`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | auto-generated primary key |
| `recipient_role` | string | one of: `ppic`, `warehouse`, `qc`, `production`, `logistic`, `manager` |
| `type` | string | slug identifying the event, e.g. `material_order_created` |
| `title` | string | short heading shown in bell dropdown |
| `message` | string | one-line detail |
| `link` | string | Next.js route to navigate to on click |
| `read` | boolean | default `false` |
| `created_at` | timestamp | auto-set on insert |

### RBAC Policies

**Policy: "Read and mark own notifications"**
- Filter: `recipient_role = $CURRENT_USER_ROLE`
- Permissions: SELECT, UPDATE (`read` field only)
- Applied to: `ppic`, `warehouse`, `qc`, `production`, `logistic`, `manager` roles

**Policy: "Create notifications for any role"**
- Filter: none (all rows)
- Permissions: INSERT
- Applied to: all authenticated roles

---

## 2. Trigger Map

All triggers are PostgreSQL functions created as Supabase SQL migrations. Each trigger compares `OLD.status` to `NEW.status` (for UPDATE triggers) or fires on INSERT. They call a shared `insert_notification(recipient_role, type, title, message, link)` helper function.

| # | Table | Event | Condition | Recipient | Type slug | Title | Link |
|---|---|---|---|---|---|---|---|
| 1 | `raw_material_orders` | UPDATE | status → `ordered` | `warehouse` | `material_order_created` | New material order incoming | `/warehouse/incoming` |
| 2 | `raw_material_receipts` | INSERT | — | `qc` | `batch_received_qc` | New batch waiting for inspection | `/qc/queue` |
| 2b | `raw_material_receipts` | INSERT | — | `ppic` | `material_order_received` | Material order received | `/ppic/orders` |
| 3 | `batches` | UPDATE | status → `approved` | `warehouse` | `batch_qc_approved` | QC approved — assign storage | `/warehouse/putaway` |
| 3b | `batches` | UPDATE | status → `rejected` | `warehouse` | `batch_qc_rejected` | QC rejected a batch | `/warehouse/batches` |
| 3c | `batches` | UPDATE | status → `rejected` | `ppic` | `batch_qc_rejected_ppic` | QC rejected a batch | `/ppic/orders` |
| 3d | `batches` | UPDATE | status → `on_hold` | `warehouse` | `batch_on_hold` | QC placed a batch on hold | `/warehouse/batches` |
| 3e | `batches` | UPDATE | status → `on_hold` | `ppic` | `batch_on_hold_ppic` | QC placed a batch on hold | `/ppic/orders` |
| 4 | `production_orders` | UPDATE | status → `released` | `warehouse` | `production_order_released` | New production order released | `/warehouse/production` |
| 5 | `production_orders` | UPDATE | status → `in_progress` | `production` | `production_order_started` | Materials ready — start production | `/production/orders` |
| 6 | `production_orders` | UPDATE | status → `completed` | `warehouse` | `production_order_completed_wh` | Production order finished | `/warehouse/batches` |
| 6b | `production_orders` | UPDATE | status → `completed` | `ppic` | `production_order_completed_ppic` | Production order finished | `/ppic/production` |
| 7 | `material_requests` | UPDATE | status → `submitted` | `logistic` | `material_request_submitted` | New material request needs coordination | `/logistic/requests` |
| 8 | `material_requests` | UPDATE | status → `coordinated` | `warehouse` | `material_request_coordinated` | Movement coordinated — ready to issue | `/warehouse/issue` |

### SQL Helper Function

```sql
CREATE OR REPLACE FUNCTION insert_notification(
  p_recipient_role text,
  p_type text,
  p_title text,
  p_message text,
  p_link text
) RETURNS void AS $$
BEGIN
  INSERT INTO notifications (recipient_role, type, title, message, link, read, created_at)
  VALUES (p_recipient_role, p_type, p_title, p_message, p_link, false, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Example Trigger (pattern for all others)

```sql
CREATE OR REPLACE FUNCTION trg_material_order_to_warehouse()
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

CREATE TRIGGER after_raw_material_order_status_change
AFTER UPDATE ON raw_material_orders
FOR EACH ROW EXECUTE FUNCTION trg_material_order_to_warehouse();
```

---

## 3. Frontend Architecture

### Hook: `lib/hooks/useNotifications.ts`

```ts
useNotifications(role: string): {
  notifications: Notification[]
  unreadCount: number
  markRead: (id: string) => void
  markAllRead: () => void
}
```

- On mount: fetches from `/api/items/notifications?filter[recipient_role][_eq]=<role>&filter[read][_eq]=false&sort[]=-created_at&limit=20`
- Opens Supabase Realtime channel: subscribes to `INSERT` on `notifications` where `recipient_role = <role>`
- On new INSERT event: prepends notification to state, increments unread count
- `markRead`: PATCHes `/api/items/notifications/<id>` with `{ read: true }`, removes from unread list
- `markAllRead`: PATCHes all unread notification ids

### Component: `components/NotificationBell.tsx`

Props: `{ role: string }`

- `ActionIcon` containing `IconBell` (size 20)
- Mantine `Indicator` wrapping the icon — shows unread count, hidden when 0, color `red`
- Click opens a `Popover` (width 360, position `bottom-end`)
- Popover header: "Notifications" title + "Mark all read" button (disabled when unreadCount = 0)
- Popover body: scrollable list (max-height 400px) of notification rows
  - Each row: colored left border by type category, title (fw 600), message (size xs, c dimmed), relative timestamp, link on click
  - Unread rows have a subtle background tint
  - Empty state: "You're all caught up" with `IconCircleCheck`

### Layout Changes

All 6 role layouts receive identical changes. In the header `Group`:

```tsx
// Before
<Menu shadow="md" width={200}>
  <Menu.Target><ActionIcon ...><Avatar .../></ActionIcon></Menu.Target>
  ...
</Menu>

// After
<Group gap="xs">
  <NotificationBell role="warehouse" />
  <Menu shadow="md" width={200}>
    <Menu.Target><ActionIcon ...><Avatar .../></ActionIcon></Menu.Target>
    ...
  </Menu>
</Group>
```

Roles and their color values:
| Layout file | Role string | Color |
|---|---|---|
| `ppic/layout.tsx` | `ppic` | `teal` |
| `warehouse/layout.tsx` | `warehouse` | `orange` |
| `qc/layout.tsx` | `qc` | `violet` |
| `production/layout.tsx` | `production` | `blue` |
| `logistic/layout.tsx` | `logistic` | `cyan` |
| `manager/layout.tsx` | `manager` | `gray` |

---

## 4. File Inventory

### New files
- `lib/hooks/useNotifications.ts` — Realtime hook
- `components/NotificationBell.tsx` — bell + popover UI
- `supabase/migrations/20260531_notifications_table.sql` — creates `notifications` table + RBAC policies
- `supabase/migrations/20260531_notification_triggers.sql` — all trigger functions

### Modified files
- `app/(authenticated)/ppic/layout.tsx`
- `app/(authenticated)/warehouse/layout.tsx`
- `app/(authenticated)/qc/layout.tsx`
- `app/(authenticated)/production/layout.tsx`
- `app/(authenticated)/logistic/layout.tsx`
- `app/(authenticated)/manager/layout.tsx`

### DaaS config
- New collection `notifications` with fields as specified above
- Two new policies as specified in Section 1

---

## 5. Acceptance Criteria

- [ ] Bell icon appears in all 6 role layouts, not in admin
- [ ] Unread count badge shows correctly and hides at zero
- [ ] New notifications appear in real time without page refresh
- [ ] Clicking a notification marks it read and navigates to the correct route
- [ ] Mark all read clears the badge
- [ ] All 14 trigger conditions create the correct notification for the correct role
- [ ] A PPIC user cannot read WO notifications (RBAC enforced)
- [ ] Notifications persist across logout/login

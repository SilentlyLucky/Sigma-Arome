# Production Order Pipeline Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the production_orders status pipeline from 9 to 6 states, automate the material check on release, enforce role-based authority server-side, and add a dedicated Warehouse Operator picking page.

**Architecture:** DaaS extensions enforce all business rules server-side (validator + two new filter/action hooks). Frontend components remove manual material_check/ready steps and add a new WO-specific page at `warehouse/production/[id]`. Postgres enum values `material_check` and `ready` are preserved (for audit history) but removed from dropdown choices and transition maps.

**Tech Stack:** Next.js App Router, Mantine v8, DaaS (Directus-based) with MCP extensions, TypeScript, pnpm

---

## File Map

| File | Change |
|------|--------|
| DaaS Extension `fc88df0b-0fd1-45cf-be78-4277fc937a18` | Update: new transitions + role guard |
| DaaS Extension (new, filter, sort -10) | Create: auto material check on release |
| DaaS Extension (new, action, sort 30) | Create: recheck waiting orders on stock |
| `material_request_items` (DaaS schema) | New fields: `stock_available`, `shortage_qty` |
| `production_orders.status` (DaaS schema) | Remove material_check/ready from dropdown choices |
| `production_orders` items (DaaS data) | Migrate material_check/ready rows → released |
| `app/(authenticated)/ppic/production/create/page.tsx` | Two-step release flow |
| `app/(authenticated)/ppic/production/[id]/page.tsx` | Simplified transitions + material check panel |
| `app/(authenticated)/ppic/page.tsx` | Fix prodReady query (remove `ready`) |
| `app/(authenticated)/manager/page.tsx` | Fix prodReady query (remove `ready`) |
| `app/(authenticated)/warehouse/page.tsx` | Remove `ready` from pick queue filter; add WO link |
| `app/(authenticated)/warehouse/production/[id]/page.tsx` | New: WO picking + start production page |
| `app/(authenticated)/production/orders/[id]/page.tsx` | Remove `ready`/start-production button |
| `.kiro/steering/UI-PATTERNS.md` | Add state machine + role matrix section |

---

## Task 1: DaaS Schema — Add fields to material_request_items

**Files:**
- DaaS schema (via MCP): `material_request_items` collection

**Context:** Two new decimal fields needed before the extensions can write shortage data. Check if they already exist before creating.

- [ ] **Step 1: Check if fields already exist**

Use the DaaS MCP `fields` tool (list or read fields for `material_request_items`). Look for `stock_available` and `shortage_qty`. If either already exists, skip its creation step below.

- [ ] **Step 2: Create `stock_available` field**

Use the DaaS MCP `fields` tool to create:
```json
{
  "collection": "material_request_items",
  "field": "stock_available",
  "type": "decimal",
  "meta": {
    "interface": "input",
    "display": "formatted-value",
    "readonly": true,
    "note": "Stock qty found in stored_available batches at check time. Written by Extension B.",
    "hidden": false
  },
  "schema": {
    "is_nullable": true,
    "numeric_precision": 18,
    "numeric_scale": 4
  }
}
```

- [ ] **Step 3: Create `shortage_qty` field**

Use the DaaS MCP `fields` tool to create:
```json
{
  "collection": "material_request_items",
  "field": "shortage_qty",
  "type": "decimal",
  "meta": {
    "interface": "input",
    "display": "formatted-value",
    "readonly": true,
    "note": "MAX(0, requested_qty - stock_available). Written by Extension B.",
    "hidden": false
  },
  "schema": {
    "is_nullable": true,
    "numeric_precision": 18,
    "numeric_scale": 4
  }
}
```

- [ ] **Step 4: Verify fields exist**

Use the DaaS MCP `fields` tool to read fields for `material_request_items` and confirm `stock_available` and `shortage_qty` appear in the list.

- [ ] **Step 5: Commit**

```bash
git commit --allow-empty -m "feat: add stock_available and shortage_qty fields to material_request_items (DaaS schema)"
```

---

## Task 2: DaaS Schema — Update status dropdown + migrate data

**Files:**
- DaaS schema (via MCP): `production_orders.status` field meta
- DaaS items (via MCP): `production_orders` rows with status in ('material_check', 'ready')

- [ ] **Step 1: Check how many rows need migration**

Use the DaaS MCP `items` tool to read `production_orders` with filter `status._in=["material_check","ready"]` and `limit=1000`. Note the count.

- [ ] **Step 2: Migrate material_check/ready rows to released**

Use the DaaS MCP `items` tool to update all `production_orders` where `status._in=["material_check","ready"]` — set `status: "released"`. If the batch update is not supported, update them individually using the IDs from Step 1.

- [ ] **Step 3: Update status dropdown choices on production_orders**

Use the DaaS MCP `fields` tool to update `production_orders.status` field meta with the following choices (removing `material_check` and `ready`):
```json
{
  "meta": {
    "note": "Managed by system. Driven by automated material check on release.",
    "options": {
      "choices": [
        { "value": "draft",         "text": "Draft" },
        { "value": "planned",       "text": "Planned" },
        { "value": "waiting_issue", "text": "Waiting Issue" },
        { "value": "released",      "text": "Released" },
        { "value": "in_progress",   "text": "In Progress" },
        { "value": "completed",     "text": "Completed" },
        { "value": "on_hold",       "text": "On Hold" },
        { "value": "cancelled",     "text": "Cancelled" }
      ]
    }
  }
}
```

- [ ] **Step 4: Verify no rows remain in old states**

Use the DaaS MCP `items` tool to query `production_orders` where `status._in=["material_check","ready"]`. Expected: empty result (0 rows).

- [ ] **Step 5: Commit**

```bash
git commit --allow-empty -m "feat: migrate production_orders status (material_check/ready → released), update dropdown choices"
```

---

## Task 3: DaaS Extension A — Update validator with new transitions and role guard

**Files:**
- DaaS Extension ID: `fc88df0b-0fd1-45cf-be78-4277fc937a18` (update via MCP)

**Context:** Read the existing extension first to understand the current code and the DaaS extension JS API pattern (hook signatures, how to call `services`, etc.). Then replace the body with the new implementation below.

- [ ] **Step 1: Read the existing extension**

Use the DaaS MCP tool to read extension `fc88df0b-0fd1-45cf-be78-4277fc937a18`. Study the hook signature (how `filter` is called, what arguments `payload`, `meta`/`keys`, and `context` look like). Use the same pattern in the new code.

- [ ] **Step 2: Write the updated extension code**

Replace the extension body with this logic (adapt the exact hook signature to match what you observed in Step 1):

```js
// Extension A — Production Order Status Validator + Role Guard
// Event: production_orders.items.update | Type: filter | Sort: 0

const VALID_TRANSITIONS = {
  draft:         ['planned', 'cancelled'],
  planned:       ['released', 'waiting_issue', 'cancelled'],
  waiting_issue: ['released', 'cancelled', 'on_hold'],
  released:      ['in_progress', 'on_hold', 'cancelled'],
  in_progress:   ['completed', 'on_hold'],
  on_hold:       ['released', 'cancelled'],
  completed:     [],
  cancelled:     [],
};

// Role authority: which statuses each role may transition TO
const ROLE_ALLOWED_TARGETS = {
  ppic:               ['planned', 'released', 'on_hold', 'cancelled'],
  warehouse_operator: ['in_progress', 'on_hold', 'cancelled'],
  production:         ['completed', 'on_hold', 'cancelled'],
};

export default ({ filter }) => {
  filter('production_orders.items.update', async (payload, meta, context) => {
    const newStatus = payload.status;
    if (!newStatus) return payload; // not a status change, skip

    const { services, schema, accountability } = context;
    const keys = meta.keys ?? [];
    if (keys.length === 0) return payload;

    const ordersService = services.items('production_orders', { elevated: true });
    const item = await ordersService.readOne(keys[0], { fields: ['status'] });
    const currentStatus = item.status;

    // 1. Check valid transition
    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid status transition: "${currentStatus}" → "${newStatus}". Allowed: [${allowed.join(', ')}]`
      );
    }

    // 2. Role guard — skip for admin/system (accountability.admin or no user)
    const userId = accountability?.user;
    if (userId && !accountability?.admin) {
      const rolesService = services.items('daas_user_roles', { elevated: true });
      const roleRows = await rolesService.readByQuery({
        filter: { directus_user: { _eq: userId } },
        fields: ['role'],
        limit: 1,
      });
      const roleName = roleRows?.[0]?.role?.toLowerCase?.() ?? null;

      if (roleName && ROLE_ALLOWED_TARGETS[roleName]) {
        const allowedTargets = ROLE_ALLOWED_TARGETS[roleName];
        if (!allowedTargets.includes(newStatus)) {
          throw new Error(
            `Role "${roleName}" is not authorized to move production order from "${currentStatus}" to "${newStatus}".`
          );
        }
      }
    }

    // 3. Guard: warehouse_operator cannot start production if materials not fully issued
    if (newStatus === 'in_progress') {
      const mrService = services.items('material_requests', { elevated: true });
      const mrs = await mrService.readByQuery({
        filter: { production_order_id: { _eq: keys[0] } },
        fields: ['id'],
        limit: 100,
      });
      if (mrs.length > 0) {
        const mrIds = mrs.map(m => m.id);
        const itemsService = services.items('material_request_items', { elevated: true });
        const mrItems = await itemsService.readByQuery({
          filter: { material_request_id: { _in: mrIds } },
          fields: ['id', 'material_id', 'requested_qty', 'issued_qty', 'unit'],
          limit: 500,
        });
        // Resolve material names for error messages
        const shortMaterialIds = [...new Set(mrItems.filter(i => (i.issued_qty ?? 0) < i.requested_qty).map(i => i.material_id))];
        if (shortMaterialIds.length > 0) {
          // Get first short item for error message
          const short = mrItems.find(i => (i.issued_qty ?? 0) < i.requested_qty);
          const matsService = services.items('raw_materials', { elevated: true });
          const mat = await matsService.readOne(short.material_id, { fields: ['name'] });
          throw new Error(
            `Cannot start production: ${mat?.name ?? short.material_id} not fully issued (${short.issued_qty ?? 0} of ${short.requested_qty} ${short.unit})`
          );
        }
      }
    }

    return payload;
  });
};
```

- [ ] **Step 3: Update the extension via MCP**

Use the DaaS MCP extension update tool to save the new code to extension `fc88df0b-0fd1-45cf-be78-4277fc937a18`. Ensure:
- Type: `filter`
- Event: `production_orders.items.update`
- Sort: `0`
- Status: `active`

- [ ] **Step 4: Smoke-test via UI**

In the DaaS admin (or via API), try transitioning a test order from `draft` → `planned`. Should succeed. Try `planned` → `completed` (invalid jump). Should be rejected with a clear error.

- [ ] **Step 5: Commit**

```bash
git commit --allow-empty -m "feat: update Extension A — new VALID_TRANSITIONS map + role guard + material issue guard"
```

---

## Task 4: DaaS Extension B — Auto material check on release

**Files:**
- DaaS Extension (new, to be created via MCP)

**Context:** This filter runs BEFORE Extension A (sort: -10). It intercepts `planned → released` transitions, runs the stock check, and may override status to `waiting_issue`. Read Extension A first so you know the DaaS extension JS API pattern.

- [ ] **Step 1: Write the extension code**

```js
// Extension B — Auto Material Check on Release
// Event: production_orders.items.update | Type: filter | Sort: -10
// Runs BEFORE Extension A (sort 0)

export default ({ filter }) => {
  filter('production_orders.items.update', async (payload, meta, context) => {
    const newStatus = payload.status;
    if (newStatus !== 'released') return payload;

    const { services } = context;
    const keys = meta.keys ?? [];
    if (keys.length === 0) return payload;

    const ordersService = services.items('production_orders', { elevated: true });
    const order = await ordersService.readOne(keys[0], {
      fields: ['id', 'status', 'bom_id', 'planned_qty'],
    });

    // Only intercept planned → released
    if (order.status !== 'planned') return payload;
    if (!order.bom_id) return payload; // no BOM, cannot check

    // Fetch BOM ingredients
    const bomItemsService = services.items('bom_items', { elevated: true });
    const ingredients = await bomItemsService.readByQuery({
      filter: { bom_id: { _eq: order.bom_id } },
      fields: ['material_id', 'qty_per_unit', 'unit'],
      limit: 200,
    });

    if (ingredients.length === 0) return payload; // empty BOM, allow release

    const shortages = [];

    for (const ing of ingredients) {
      const requestedQty = (ing.qty_per_unit ?? 0) * (order.planned_qty ?? 0);

      // Sum stored_available batches
      const batchesService = services.items('batches', { elevated: true });
      const availableBatches = await batchesService.readByQuery({
        filter: {
          material_id: { _eq: ing.material_id },
          status: { _eq: 'stored_available' },
        },
        fields: ['qty'],
        limit: 1000,
      });
      const availableQty = availableBatches.reduce((sum, b) => sum + (b.qty ?? 0), 0);
      const shortageQty = Math.max(0, requestedQty - availableQty);

      // Update material_request_items for this ingredient
      // Find the material_request for this production order
      const mrService = services.items('material_requests', { elevated: true });
      const mrs = await mrService.readByQuery({
        filter: { production_order_id: { _eq: order.id } },
        fields: ['id'],
        limit: 10,
      });

      if (mrs.length > 0) {
        const mrIds = mrs.map(m => m.id);
        const mrItemsService = services.items('material_request_items', { elevated: true });
        const matchingItems = await mrItemsService.readByQuery({
          filter: {
            material_request_id: { _in: mrIds },
            material_id: { _eq: ing.material_id },
          },
          fields: ['id'],
          limit: 10,
        });

        for (const mrItem of matchingItems) {
          await mrItemsService.updateOne(mrItem.id, {
            stock_available: availableQty,
            shortage_qty: shortageQty,
          });
        }
      }

      if (shortageQty > 0) {
        // Resolve material name for the note
        const matsService = services.items('raw_materials', { elevated: true });
        const mat = await matsService.readOne(ing.material_id, { fields: ['name'] }).catch(() => null);
        shortages.push({
          material: mat?.name ?? ing.material_id,
          shortageQty,
          unit: ing.unit,
        });
      }
    }

    if (shortages.length > 0) {
      const shortageLines = shortages
        .map(s => `short by ${s.shortageQty} ${s.unit} of ${s.material}`)
        .join('; ');
      payload.status = 'waiting_issue';
      payload.notes = `Auto-blocked: ${shortageLines}`;
      console.log(`[AutoCheck] order ${order.id}: waiting_issue — ${shortages.length} shortages`);
    } else {
      console.log(`[AutoCheck] order ${order.id}: released — all materials available`);
    }

    return payload;
  });
};
```

- [ ] **Step 2: Create the extension via MCP**

Use the DaaS MCP extension create tool with:
- Name: `Production Order - Auto Material Check on Release`
- Type: `filter`
- Event: `production_orders.items.update`
- Sort: `-10`
- Status: `active`
- Code: the JS above

- [ ] **Step 3: Verify sort order**

Use the DaaS MCP extension list tool to confirm that Extension B (sort -10) appears before Extension A (sort 0) in the list for `production_orders.items.update`.

- [ ] **Step 4: Commit**

```bash
git commit --allow-empty -m "feat: create Extension B — auto material check filter on release (sort -10)"
```

---

## Task 5: DaaS Extension C — Recheck waiting orders on stock available

**Files:**
- DaaS Extension (new, to be created via MCP)

**Context:** This action hook fires after a batch is updated to `stored_available`. It re-runs the shortage check for any `waiting_issue` production orders that needed that material, and auto-releases them if all shortages are cleared.

- [ ] **Step 1: Write the extension code**

```js
// Extension C — Recheck Waiting Orders on Stock Available
// Event: batches.items.update | Type: action | Sort: 30

export default ({ action }) => {
  action('batches.items.update', async (meta, context) => {
    const { services } = context;
    const keys = meta.keys ?? [];
    if (keys.length === 0) return;

    // Only trigger when batch moves to stored_available
    const newStatus = meta.payload?.status;
    if (newStatus !== 'stored_available') return;

    const batchesService = services.items('batches', { elevated: true });
    const batch = await batchesService.readOne(keys[0], { fields: ['material_id'] });
    if (!batch?.material_id) return;

    const materialId = batch.material_id;

    // Find material_request_items for this material with shortage_qty > 0
    const mrItemsService = services.items('material_request_items', { elevated: true });
    const shortItems = await mrItemsService.readByQuery({
      filter: {
        material_id: { _eq: materialId },
        shortage_qty: { _gt: 0 },
      },
      fields: ['id', 'material_request_id'],
      limit: 200,
    });

    if (shortItems.length === 0) return;

    // Collect unique production order IDs via material_requests
    const mrIds = [...new Set(shortItems.map(i => i.material_request_id))];
    const mrService = services.items('material_requests', { elevated: true });
    const mrs = await mrService.readByQuery({
      filter: { id: { _in: mrIds } },
      fields: ['id', 'production_order_id'],
      limit: 200,
    });

    const orderIds = [...new Set(mrs.map(m => m.production_order_id).filter(Boolean))];
    if (orderIds.length === 0) return;

    const ordersService = services.items('production_orders', { elevated: true });
    const waitingOrders = await ordersService.readByQuery({
      filter: {
        id: { _in: orderIds },
        status: { _eq: 'waiting_issue' },
      },
      fields: ['id', 'bom_id', 'planned_qty'],
      limit: 200,
    });

    let released = 0;

    for (const order of waitingOrders) {
      if (!order.bom_id) continue;

      const bomItemsService = services.items('bom_items', { elevated: true });
      const ingredients = await bomItemsService.readByQuery({
        filter: { bom_id: { _eq: order.bom_id } },
        fields: ['material_id', 'qty_per_unit', 'unit'],
        limit: 200,
      });

      let hasShortage = false;

      for (const ing of ingredients) {
        const requestedQty = (ing.qty_per_unit ?? 0) * (order.planned_qty ?? 0);
        const availBatches = await services.items('batches', { elevated: true }).readByQuery({
          filter: { material_id: { _eq: ing.material_id }, status: { _eq: 'stored_available' } },
          fields: ['qty'],
          limit: 1000,
        });
        const availableQty = availBatches.reduce((sum, b) => sum + (b.qty ?? 0), 0);
        const shortageQty = Math.max(0, requestedQty - availableQty);

        // Update the material_request_items
        const orderMrs = mrs.filter(m => m.production_order_id === order.id);
        if (orderMrs.length > 0) {
          const orderMrIds = orderMrs.map(m => m.id);
          const matchItems = await mrItemsService.readByQuery({
            filter: { material_request_id: { _in: orderMrIds }, material_id: { _eq: ing.material_id } },
            fields: ['id'],
            limit: 10,
          });
          for (const mi of matchItems) {
            await mrItemsService.updateOne(mi.id, { stock_available: availableQty, shortage_qty: shortageQty });
          }
        }

        if (shortageQty > 0) { hasShortage = true; break; }
      }

      if (!hasShortage) {
        await ordersService.updateOne(order.id, { status: 'released' });
        released++;
      }
    }

    console.log(`[Recheck] batch ${keys[0]} stored_available → rechecked ${waitingOrders.length} orders, released ${released}`);
  });
};
```

- [ ] **Step 2: Create the extension via MCP**

Use the DaaS MCP extension create tool with:
- Name: `Production Order - Recheck Waiting Orders on Stock Available`
- Type: `action`
- Event: `batches.items.update`
- Sort: `30`
- Status: `active`
- Code: the JS above

- [ ] **Step 3: Commit**

```bash
git commit --allow-empty -m "feat: create Extension C — recheck waiting orders when batch becomes stored_available"
```

---

## Task 6: Frontend — PPIC create page (two-step release flow)

**Files:**
- Modify: `app/(authenticated)/ppic/production/create/page.tsx`

- [ ] **Step 1: Replace the create page**

Open `app/(authenticated)/ppic/production/create/page.tsx` and make these changes:

1. Change the `handleSave` function: when `targetStatus === 'planned'`, after the initial POST succeeds, immediately PATCH the returned order ID to `status: 'released'`, then re-read the final status to determine routing.

2. Rename the "Submit Order" button to **"Release for Production"**.

3. Update the alert copy to mention automatic material check.

Replace the `handleSave` function and button section with:

```tsx
const handleSave = async (targetStatus: 'draft' | 'planned') => {
  const errors: string[] = [];
  if (!form.product_id) errors.push('Product is required');
  const qty = typeof form.planned_qty === 'number' ? form.planned_qty : parseFloat(String(form.planned_qty));
  if (!qty || isNaN(qty) || qty <= 0) errors.push('Planned quantity must be a positive number');
  if (!form.unit) errors.push('Unit is required (select a product first)');
  if (!form.priority) errors.push('Priority is required');
  if (!form.planned_start_date) errors.push('Planned start date is required');
  if (!form.planned_end_date) errors.push('Planned end date is required');
  if (!form.due_date) errors.push('Due date is required');
  if (form.planned_start_date && form.planned_end_date) {
    if (dayjs(form.planned_end_date).isBefore(dayjs(form.planned_start_date)))
      errors.push('End date must be on or after start date');
  }
  if (form.planned_end_date && form.due_date) {
    if (dayjs(form.due_date).isBefore(dayjs(form.planned_end_date)))
      errors.push('Due date must be on or after end date');
  }
  if (errors.length > 0) {
    notifications.show({ title: 'Validation', message: errors.join('. '), color: 'red' });
    return;
  }

  setSaving(true);
  try {
    const body: Record<string, unknown> = {
      product_id: form.product_id,
      planned_qty: qty,
      unit: form.unit,
      priority: form.priority,
      planned_start_date: form.planned_start_date,
      planned_end_date: form.planned_end_date,
      due_date: form.due_date,
      notes: form.notes || null,
      status: targetStatus,
    };
    if (form.bom_id) body.bom_id = form.bom_id;

    const res = await fetch('/api/items/production_orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.errors?.[0]?.message ?? 'Save failed');
    }
    const created = await res.json();
    const createdId = created?.data?.id;

    if (targetStatus === 'draft') {
      notifications.show({ title: 'Draft Saved', message: 'Production order saved as draft. Open it to submit when ready.', color: 'blue' });
      router.push('/ppic/production');
      return;
    }

    // Two-step release: POST as 'planned', then PATCH to 'released' (triggers Extension B)
    const patchRes = await fetch(`/api/items/production_orders/${createdId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'released' }),
    });

    // Re-read actual status (Extension B may have changed it to waiting_issue)
    const readRes = await fetch(`/api/items/production_orders/${createdId}?fields[]=status&fields[]=notes`);
    const readData = await readRes.json();
    const finalStatus = readData?.data?.status;
    const finalNotes = readData?.data?.notes;

    if (finalStatus === 'released') {
      notifications.show({ title: 'Order Released', message: 'Production order released — materials confirmed available.', color: 'green' });
      router.push('/ppic/production');
    } else if (finalStatus === 'waiting_issue') {
      const firstLine = finalNotes ? String(finalNotes).split(';')[0] : 'material shortage detected';
      notifications.show({ title: 'Order Blocked', message: `Order created but blocked: ${firstLine}.`, color: 'orange' });
      router.push(`/ppic/production/${createdId}`);
    } else {
      // Unexpected — still navigate to the order
      notifications.show({ title: 'Order Submitted', message: 'Production order submitted.', color: 'green' });
      router.push('/ppic/production');
    }
  } catch (err) {
    notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
  } finally {
    setSaving(false);
  }
};
```

Replace the Alert copy and the "Submit Order" button label:

```tsx
<Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
  Use <strong>Release for Production</strong> to submit and immediately run an automated stock check.
  If materials are short, the order is parked as <em>Waiting Issue</em> automatically.
  Use <strong>Save Draft</strong> to finish later.
</Alert>
```

```tsx
<Button color="teal" onClick={() => handleSave('planned')} loading={saving}>
  Release for Production
</Button>
```

- [ ] **Step 2: Type-check**

```bash
pnpm tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/(authenticated)/ppic/production/create/page.tsx
git commit -m "feat: ppic create page — two-step release flow with auto material check"
```

---

## Task 7: Frontend — PPIC detail page (simplified transitions + material check panel)

**Files:**
- Modify: `app/(authenticated)/ppic/production/[id]/page.tsx`

- [ ] **Step 1: Replace the entire page**

Replace `app/(authenticated)/ppic/production/[id]/page.tsx` with:

```tsx
'use client';

import { Stack, Title, Text, Group, Badge, Button, Alert, Table, Paper, Loader } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconAlertTriangle } from '@tabler/icons-react';

const STATUS_TRANSITIONS: Record<string, Array<{ value: string; label: string; color: string }>> = {
  draft:   [{ value: 'planned', label: 'Submit for Planning', color: 'blue' }, { value: 'cancelled', label: 'Cancel Order', color: 'red' }],
  planned: [{ value: 'released', label: 'Release for Production', color: 'teal' }, { value: 'cancelled', label: 'Cancel Order', color: 'red' }],
  // released and beyond: no PPIC action buttons (WO or production takes over)
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'gray', planned: 'blue', waiting_issue: 'orange',
  released: 'indigo', in_progress: 'violet', completed: 'dark',
  on_hold: 'orange', cancelled: 'red',
};
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', planned: 'Planned', waiting_issue: 'Waiting Issue',
  released: 'Released', in_progress: 'In Progress',
  completed: 'Completed', on_hold: 'On Hold', cancelled: 'Cancelled',
};

interface MaterialCheckRow {
  id: string;
  material_name: string;
  requested_qty: number;
  stock_available: number | null;
  shortage_qty: number | null;
  unit: string;
}

export default function ProductionOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [status, setStatus] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [checkRows, setCheckRows] = useState<MaterialCheckRow[]>([]);
  const [loadingCheck, setLoadingCheck] = useState(true);

  useEffect(() => {
    fetch(`/api/items/production_orders/${id}?fields[]=status`)
      .then((r) => r.json())
      .then((d) => setStatus(d?.data?.status ?? null))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    async function loadMaterialCheck() {
      setLoadingCheck(true);
      try {
        const mrRes = await fetch(`/api/items/material_requests?filter[production_order_id][_eq]=${id}&fields[]=id&limit=10`);
        const mrs: Array<{ id: string }> = (await mrRes.json())?.data ?? [];
        if (mrs.length === 0) { setCheckRows([]); return; }

        const mrIds = mrs.map(m => m.id).join(',');
        const itemsRes = await fetch(
          `/api/items/material_request_items?filter[material_request_id][_in]=${mrIds}` +
          `&fields[]=id&fields[]=material_id&fields[]=requested_qty&fields[]=unit&fields[]=stock_available&fields[]=shortage_qty&limit=200`
        );
        const items: Array<{ id: string; material_id: string; requested_qty: number; unit: string; stock_available: number | null; shortage_qty: number | null }> =
          (await itemsRes.json())?.data ?? [];

        if (items.length === 0) { setCheckRows([]); return; }

        const matIds = [...new Set(items.map(i => i.material_id))].join(',');
        const matsRes = await fetch(`/api/items/raw_materials?filter[id][_in]=${matIds}&fields[]=id&fields[]=name&limit=200`);
        const matMap: Record<string, string> = {};
        for (const m of (await matsRes.json())?.data ?? []) matMap[m.id] = m.name;

        setCheckRows(items.map(i => ({
          id: i.id,
          material_name: matMap[i.material_id] ?? i.material_id.slice(0, 8),
          requested_qty: i.requested_qty,
          stock_available: i.stock_available,
          shortage_qty: i.shortage_qty,
          unit: i.unit,
        })));
      } catch {
        setCheckRows([]);
      } finally {
        setLoadingCheck(false);
      }
    }
    loadMaterialCheck();
  }, [id]);

  const handleTransition = async (newStatus: string) => {
    setTransitioning(true);
    try {
      const res = await fetch(`/api/items/production_orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.errors?.[0]?.message ?? 'Status update failed');
      }
      // Re-read status — Extension B may have changed it
      const readRes = await fetch(`/api/items/production_orders/${id}?fields[]=status`);
      const finalStatus = (await readRes.json())?.data?.status ?? newStatus;
      setStatus(finalStatus);
      notifications.show({ title: 'Updated', message: `Production order is now ${STATUS_LABELS[finalStatus] ?? finalStatus}`, color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setTransitioning(false);
    }
  };

  const nextTransitions = status ? (STATUS_TRANSITIONS[status] ?? []) : [];
  const hasCheckData = checkRows.length > 0 && checkRows.some(r => r.stock_available !== null);
  const isReadOnly = status !== null && !['draft', 'planned'].includes(status);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Production Order Detail</Title>
          <Text c="dimmed" size="sm">Review the production plan and move it through the next step.</Text>
        </div>
        {status && (
          <Badge size="lg" color={STATUS_COLORS[status] ?? 'gray'} variant="light">
            {STATUS_LABELS[status] ?? status}
          </Badge>
        )}
      </Group>

      {nextTransitions.length > 0 && (
        <Group gap="xs">
          <Text size="sm" fw={500} c="dimmed">Actions:</Text>
          {nextTransitions.map((t) => (
            <Button key={t.value} size="xs" color={t.color} variant="light" loading={transitioning} onClick={() => handleTransition(t.value)}>
              {t.label}
            </Button>
          ))}
        </Group>
      )}

      {(status === 'completed' || status === 'cancelled') && (
        <Alert icon={<IconAlertCircle size={16} />} color="gray" variant="light">
          This production order is finished or cancelled and can no longer be changed.
        </Alert>
      )}

      {/* Material Check Result Panel */}
      {loadingCheck ? (
        <Group gap="xs"><Loader size="xs" /><Text size="sm" c="dimmed">Loading material check...</Text></Group>
      ) : hasCheckData ? (
        <Paper p="md" radius="md" withBorder>
          <Text fw={600} size="sm" mb="sm">Material Check Result</Text>
          {status === 'waiting_issue' && (
            <Alert icon={<IconAlertTriangle size={14} />} color="orange" variant="light" mb="sm">
              This order is blocked due to insufficient stock. It will be auto-released when materials become available.
            </Alert>
          )}
          <Table withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Material</Table.Th>
                <Table.Th>Requested</Table.Th>
                <Table.Th>Available</Table.Th>
                <Table.Th>Shortage</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {checkRows.map(row => (
                <Table.Tr key={row.id} style={row.shortage_qty && row.shortage_qty > 0 ? { backgroundColor: 'var(--mantine-color-red-0)' } : undefined}>
                  <Table.Td><Text size="sm">{row.material_name}</Text></Table.Td>
                  <Table.Td><Text size="sm">{row.requested_qty} {row.unit}</Text></Table.Td>
                  <Table.Td><Text size="sm" c={row.stock_available === null ? 'dimmed' : undefined}>{row.stock_available ?? '—'} {row.stock_available !== null ? row.unit : ''}</Text></Table.Td>
                  <Table.Td>
                    {row.shortage_qty === null ? <Text size="sm" c="dimmed">—</Text>
                     : row.shortage_qty > 0 ? <Text size="sm" c="red" fw={600}>{row.shortage_qty} {row.unit}</Text>
                     : <Text size="sm" c="green">✓ OK</Text>}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      ) : null}

      <CollectionForm
        collection="production_orders"
        mode={isReadOnly ? 'view' : 'edit'}
        id={id}
        onSuccess={() => router.push('/ppic/production')}
        onCancel={() => router.push('/ppic/production')}
      />
    </Stack>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(authenticated)/ppic/production/[id]/page.tsx"
git commit -m "feat: ppic detail page — simplified transitions, material check result panel, view-only form for released+"
```

---

## Task 8: Frontend — Fix prodReady queries in PPIC and Manager dashboards

**Files:**
- Modify: `app/(authenticated)/ppic/page.tsx` (line 41)
- Modify: `app/(authenticated)/manager/page.tsx` (line 49)

**Context:** Both dashboards count `prodReady` as orders in `['ready', 'released']`. After migration, `ready` no longer exists — change to `_eq: 'released'` only.

- [ ] **Step 1: Fix ppic/page.tsx**

In `app/(authenticated)/ppic/page.tsx`, find this line (around line 41):
```ts
{ key: 'prodReady', collection: 'production_orders', filter: { status: { _in: ['ready', 'released'] } } },
```

Replace with:
```ts
{ key: 'prodReady', collection: 'production_orders', filter: { status: { _eq: 'released' } } },
```

- [ ] **Step 2: Fix manager/page.tsx**

In `app/(authenticated)/manager/page.tsx`, find this line (around line 49):
```ts
{ key: 'prodReady', collection: 'production_orders', filter: { status: { _in: ['ready', 'released'] } } },
```

Replace with:
```ts
{ key: 'prodReady', collection: 'production_orders', filter: { status: { _eq: 'released' } } },
```

- [ ] **Step 3: Type-check**

```bash
pnpm tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(authenticated)/ppic/page.tsx" "app/(authenticated)/manager/page.tsx"
git commit -m "fix: remove 'ready' from prodReady count queries in ppic and manager dashboards"
```

---

## Task 9: Frontend — Warehouse page (remove `ready`, add WO detail link)

**Files:**
- Modify: `app/(authenticated)/warehouse/page.tsx`

**Context:** The pick queue currently fetches `status._in=ready,released,in_progress`. Remove `ready`. Also add `onClick` to order rows in the pick queue tables so WOs can navigate to the new `/warehouse/production/{id}` detail page.

- [ ] **Step 1: Fix the production_orders fetch filter**

In `app/(authenticated)/warehouse/page.tsx`, find this line (around line 89):
```ts
'/api/items/production_orders?filter[status][_in]=ready,released,in_progress' +
```

Replace with:
```ts
'/api/items/production_orders?filter[status][_in]=released,in_progress' +
```

- [ ] **Step 2: Add clickable order rows in the "Ready to Send" table**

In the "Ready to Send" `Table.Tbody`, the first `<Table.Td>` in each row renders the order number. Make the order number a clickable link to the new WO page:

Find in `pendingTasks.map(task => (`:
```tsx
<Table.Td><Text size="sm" fw={500}>{task.order_number}</Text></Table.Td>
```

Replace with:
```tsx
<Table.Td>
  <Text
    size="sm" fw={500} style={{ cursor: 'pointer', textDecoration: 'underline' }}
    onClick={() => router.push(`/warehouse/production/${task.production_order_id}`)}
  >
    {task.order_number}
  </Text>
</Table.Td>
```

- [ ] **Step 3: Add clickable order rows in the "No Production-Ready Stock" table**

Similarly in `blockedTasks.map(task => (`:

Find:
```tsx
<Table.Td><Text size="sm" fw={500}>{task.order_number}</Text></Table.Td>
```

Replace with:
```tsx
<Table.Td>
  <Text
    size="sm" fw={500} style={{ cursor: 'pointer', textDecoration: 'underline' }}
    onClick={() => router.push(`/warehouse/production/${task.production_order_id}`)}
  >
    {task.order_number}
  </Text>
</Table.Td>
```

- [ ] **Step 4: Type-check**

```bash
pnpm tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add "app/(authenticated)/warehouse/page.tsx"
git commit -m "fix: warehouse pick queue — remove 'ready' status, add WO detail page links"
```

---

## Task 10: Frontend — New warehouse/production/[id] page

**Files:**
- Create: `app/(authenticated)/warehouse/production/[id]/page.tsx`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p "app/(authenticated)/warehouse/production/[id]"
```

- [ ] **Step 2: Create the page file**

Create `app/(authenticated)/warehouse/production/[id]/page.tsx`:

```tsx
'use client';

import {
  Stack, Title, Text, Group, Badge, Button, Alert, Table, Paper, Loader, Tooltip,
} from '@mantine/core';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { IconPlayerPlay, IconAlertTriangle, IconCheck } from '@tabler/icons-react';

const STATUS_COLORS: Record<string, string> = {
  released: 'indigo', in_progress: 'violet', completed: 'teal',
  waiting_issue: 'orange', on_hold: 'orange', cancelled: 'red',
};
const STATUS_LABELS: Record<string, string> = {
  released: 'Released', in_progress: 'In Progress', completed: 'Completed',
  waiting_issue: 'Waiting Issue', on_hold: 'On Hold', cancelled: 'Cancelled',
};

interface MaterialLine {
  id: string;
  material_name: string;
  requested_qty: number;
  issued_qty: number;
  unit: string;
  shortage_qty: number | null;
}

interface OrderInfo {
  order_number: string;
  status: string;
  product_name: string;
  planned_qty: number;
  unit: string;
}

export default function WOProductionDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const orderId = id as string;
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [lines, setLines] = useState<MaterialLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const orderRes = await fetch(
        `/api/items/production_orders/${orderId}?fields[]=order_number&fields[]=status&fields[]=product_id&fields[]=planned_qty&fields[]=unit`
      );
      const orderData = (await orderRes.json())?.data;
      if (!orderData) return;

      let productName = orderData.product_id;
      if (orderData.product_id) {
        const prodRes = await fetch(`/api/items/products/${orderData.product_id}?fields[]=name`);
        productName = (await prodRes.json())?.data?.name ?? orderData.product_id;
      }

      setOrder({
        order_number: orderData.order_number,
        status: orderData.status,
        product_name: productName,
        planned_qty: orderData.planned_qty,
        unit: orderData.unit,
      });

      // Fetch material lines
      const mrRes = await fetch(
        `/api/items/material_requests?filter[production_order_id][_eq]=${orderId}&fields[]=id&limit=10`
      );
      const mrs: Array<{ id: string }> = (await mrRes.json())?.data ?? [];
      if (mrs.length === 0) { setLines([]); return; }

      const mrIds = mrs.map(m => m.id).join(',');
      const itemsRes = await fetch(
        `/api/items/material_request_items?filter[material_request_id][_in]=${mrIds}` +
        `&fields[]=id&fields[]=material_id&fields[]=requested_qty&fields[]=issued_qty&fields[]=unit&fields[]=shortage_qty&limit=200`
      );
      const items: Array<{ id: string; material_id: string; requested_qty: number; issued_qty: number; unit: string; shortage_qty: number | null }> =
        (await itemsRes.json())?.data ?? [];

      if (items.length === 0) { setLines([]); return; }

      const matIds = [...new Set(items.map(i => i.material_id))].join(',');
      const matsRes = await fetch(`/api/items/raw_materials?filter[id][_in]=${matIds}&fields[]=id&fields[]=name&limit=200`);
      const matMap: Record<string, string> = {};
      for (const m of (await matsRes.json())?.data ?? []) matMap[m.id] = m.name;

      setLines(items.map(i => ({
        id: i.id,
        material_name: matMap[i.material_id] ?? i.material_id.slice(0, 8),
        requested_qty: i.requested_qty,
        issued_qty: i.issued_qty ?? 0,
        unit: i.unit,
        shortage_qty: i.shortage_qty,
      })));
    } catch (err) {
      console.error('Failed to load WO detail:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const unfulfilledLines = lines.filter(l => (l.issued_qty ?? 0) < l.requested_qty);
  const allIssued = lines.length > 0 && unfulfilledLines.length === 0;

  const startProduction = async () => {
    setStarting(true);
    try {
      const res = await fetch(`/api/items/production_orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.errors?.[0]?.message ?? 'Failed to start production');
      }
      notifications.show({ title: 'Production Started', message: 'Order is now in progress.', color: 'green' });
      router.push('/warehouse');
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return <Group justify="center" py="xl"><Loader /></Group>;
  }

  if (!order) {
    return <Alert color="red">Production order not found.</Alert>;
  }

  const tooltipLabel = unfulfilledLines.length > 0
    ? `Cannot start: ${unfulfilledLines.map(l => `${l.material_name} (${l.issued_qty}/${l.requested_qty} ${l.unit})`).join(', ')}`
    : '';

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Production Order {order.order_number}</Title>
          <Text c="dimmed" size="sm">{order.product_name} | {order.planned_qty} {order.unit}</Text>
        </div>
        <Badge size="lg" color={STATUS_COLORS[order.status] ?? 'gray'} variant="light">
          {STATUS_LABELS[order.status] ?? order.status}
        </Badge>
      </Group>

      {/* Materials to Issue */}
      <Paper p="md" radius="md" withBorder>
        <Text fw={600} size="sm" mb="sm">Materials to Issue</Text>
        {lines.length === 0 ? (
          <Alert color="blue" variant="light">No material request items found for this order.</Alert>
        ) : (
          <Table withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Material</Table.Th>
                <Table.Th>Required</Table.Th>
                <Table.Th>Issued</Table.Th>
                <Table.Th>Shortage</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {lines.map(line => {
                const remaining = line.requested_qty - (line.issued_qty ?? 0);
                const done = remaining <= 0;
                return (
                  <Table.Tr
                    key={line.id}
                    style={!done ? { backgroundColor: 'var(--mantine-color-red-0)' } : undefined}
                  >
                    <Table.Td><Text size="sm">{line.material_name}</Text></Table.Td>
                    <Table.Td><Text size="sm">{line.requested_qty} {line.unit}</Text></Table.Td>
                    <Table.Td><Text size="sm">{line.issued_qty ?? 0} {line.unit}</Text></Table.Td>
                    <Table.Td>
                      {done
                        ? <Text size="sm" c="dimmed">—</Text>
                        : <Text size="sm" c="red" fw={600}>{remaining} {line.unit}</Text>}
                    </Table.Td>
                    <Table.Td>
                      {done
                        ? <Badge size="xs" color="green" variant="light"><IconCheck size={10} /> Done</Badge>
                        : <Badge size="xs" color="orange" variant="light"><IconAlertTriangle size={10} /> Remaining</Badge>}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* Start Production button */}
      {order.status === 'released' && (
        <Group>
          <Tooltip
            label={tooltipLabel}
            disabled={allIssued}
            multiline
            maw={320}
          >
            <Button
              leftSection={<IconPlayerPlay size={16} />}
              color="violet"
              loading={starting}
              disabled={!allIssued}
              onClick={startProduction}
            >
              Start Production
            </Button>
          </Tooltip>
          {!allIssued && (
            <Text size="xs" c="dimmed">{unfulfilledLines.length} material{unfulfilledLines.length !== 1 ? 's' : ''} not fully issued yet.</Text>
          )}
        </Group>
      )}

      {order.status === 'in_progress' && (
        <Alert color="violet" variant="light">Production is in progress. The production team will mark it complete.</Alert>
      )}
      {order.status === 'completed' && (
        <Alert color="teal" variant="light">Production is complete.</Alert>
      )}

      <Group>
        <Button variant="subtle" onClick={() => router.push('/warehouse')}>← Back to Warehouse</Button>
      </Group>
    </Stack>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
pnpm tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(authenticated)/warehouse/production/[id]/page.tsx"
git commit -m "feat: new warehouse/production/[id] page — WO picking detail + start production button"
```

---

## Task 11: Frontend — Production orders/[id] page (remove ready/start)

**Files:**
- Modify: `app/(authenticated)/production/orders/[id]/page.tsx`

**Context:** Production role no longer starts production (WO does). Remove `status === 'ready'` from the Start Production button condition, and remove `material_check`/`ready` from STATUS_COLORS/STATUS_LABELS.

- [ ] **Step 1: Replace the page**

Replace `app/(authenticated)/production/orders/[id]/page.tsx` with:

```tsx
'use client';

import { Stack, Title, Text, Group, Badge, Button, Alert } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';

const STATUS_COLORS: Record<string, string> = {
  released: 'indigo', in_progress: 'violet', completed: 'teal',
  waiting_issue: 'orange', on_hold: 'orange', cancelled: 'red',
};
const STATUS_LABELS: Record<string, string> = {
  released: 'Released', in_progress: 'In Progress', completed: 'Completed',
  waiting_issue: 'Waiting Issue', on_hold: 'On Hold', cancelled: 'Cancelled',
};

export default function ProductionOrderDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const orderId = id as string;
  const [status, setStatus] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetch(`/api/items/production_orders/${orderId}?fields[]=status`)
      .then(r => r.json()).then(d => setStatus(d?.data?.status ?? null)).catch(() => {});
  }, [orderId]);

  const updateStatus = async (newStatus: string, message: string) => {
    setActing(true);
    try {
      const res = await fetch(`/api/items/production_orders/${orderId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json())?.errors?.[0]?.message ?? 'Failed');
      setStatus(newStatus);
      notifications.show({ title: 'Updated', message, color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally { setActing(false); }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title order={2}>Production Order</Title>
          <Text c="dimmed" size="sm">Record production details and mark it finished when work is complete.</Text>
        </div>
        {status && <Badge size="lg" color={STATUS_COLORS[status] ?? 'gray'} variant="light">{STATUS_LABELS[status] ?? status}</Badge>}
      </Group>

      {status === 'in_progress' && (
        <Button leftSection={<IconCheck size={16} />} color="teal" loading={acting}
          onClick={() => updateStatus('completed', 'Production completed. A finished goods batch will be created.')}>
          Mark as Finished
        </Button>
      )}

      {status === 'completed' && (
        <Alert color="teal" variant="light">Production is finished. The finished goods batch can now move to QC.</Alert>
      )}

      <CollectionForm collection="production_orders" mode="edit" id={orderId}
        onSuccess={() => router.push('/production/orders')} onCancel={() => router.push('/production/orders')} />
    </Stack>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(authenticated)/production/orders/[id]/page.tsx"
git commit -m "feat: production order detail — remove ready/start-production button, production role only marks finished"
```

---

## Task 12: Docs — Add state machine section to UI-PATTERNS.md

**Files:**
- Modify: `.kiro/steering/UI-PATTERNS.md`

- [ ] **Step 1: Append state machine section**

Open `.kiro/steering/UI-PATTERNS.md` and append at the end:

```markdown
---

## 11. Production Order State Machine

### States

```
draft → planned → released → in_progress → completed
                  └─ waiting_issue (auto-blocked on material shortage)

Off-ramps: any active state → on_hold (resumable) or cancelled (terminal)
```

Removed states (kept in DB for audit): `material_check`, `ready`

### Role Authority

| Role               | Allowed transitions                                   |
|--------------------|-------------------------------------------------------|
| PPIC               | draft→planned, planned→released                       |
| System (auto)      | planned→released / waiting_issue, waiting→released    |
| Warehouse Operator | released→in_progress (after full material issue)      |
| Production         | in_progress→completed                                 |
| Any                | *→on_hold, *→cancelled                                |

### Key Rules

- PPIC releases; Extension B auto-runs the stock check. If any material is short, status becomes `waiting_issue` automatically.
- Extension C watches for batches becoming `stored_available` and re-runs the check; orders auto-release when all shortages clear.
- Extension A (validator) enforces both the transition map AND role authority for every status change.
- Warehouse Operator: `released → in_progress` is blocked until all `material_request_items.issued_qty >= requested_qty`.
- Production: only `in_progress → completed`. Cannot start production (WO does that).
```

- [ ] **Step 2: Commit**

```bash
git add .kiro/steering/UI-PATTERNS.md
git commit -m "docs: add production order state machine and role authority section to UI-PATTERNS.md"
```

---

## Verification Checklist

After all tasks are complete, run through these 5 scenarios manually in the app:

1. **Happy path — materials available:** PPIC creates order, clicks "Release for Production" → green toast "Order released" → order shows Released status → Warehouse picks materials on `/warehouse/production/{id}` → all lines satisfied → Start Production enabled → click → WO sees "In Progress" → Production marks as Finished.

2. **Auto-block — material shortage:** PPIC creates order, clicks "Release for Production" → orange toast "Order blocked: short by..." → order shows Waiting Issue → PPIC detail page shows Material Check panel with red shortage rows.

3. **Auto-release on restock:** A batch for the short material is approved → stored_available → Extension C fires → order automatically moves from Waiting Issue to Released (refresh PPIC detail to verify).

4. **Role guard:** Log in as Warehouse Operator → navigate to PPIC production list → cannot access transition buttons beyond `in_progress`. Log in as Production → no "Start Production" button visible, only "Mark as Finished" when in_progress.

5. **Data migration:** No production orders in the system have status `material_check` or `ready` after Task 2.

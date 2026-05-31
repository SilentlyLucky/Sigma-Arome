# Production Order Pipeline Refactor — Design Spec

**Date:** 2026-05-31
**Scope:** Simplify the production_orders status pipeline from 9 to 6 states, replace the manual material-check steps with a fully automated stock check, enforce strict role-based status authority, and add a dedicated WO picking detail page.

---

## Final State Machine

```
draft → planned → released → in_progress → completed
                  └─ waiting_issue (auto, on stock shortage)

Off-ramps from any active state:
  * → on_hold   (resumable to released)
  * → cancelled (terminal)
```

**Removed states:** `material_check`, `ready`
**Kept states:** `draft`, `planned`, `released`, `waiting_issue`, `in_progress`, `completed`, `on_hold`, `cancelled`

The `material_check` and `ready` enum values are NOT deleted from Postgres (preserved for audit history). They are removed from the dropdown choices and the validator transition map only. All live rows in those states are migrated to `released`.

---

## Role Authority Matrix

| Role | Allowed transitions |
|---|---|
| PPIC | `draft → planned`, `planned → released` (triggers auto material check) |
| System (auto, Extension B) | `planned → released` (check passes) or `planned → waiting_issue` (shortage) |
| System (auto, Extension C) | `waiting_issue → released` (restock detected) |
| Warehouse Operator (WO) | `released → in_progress` — only after all material_request_items fully issued |
| Production | `in_progress → completed` |
| Any role with permission | `* → on_hold`, `* → cancelled` |

**PPIC cannot move past `released`.** WO cannot move past `in_progress`. Production cannot move backwards. All enforced server-side in Extension A via role lookup.

---

## Backend Extensions (DaaS MCP — 3 total)

### Extension A — Update existing validator

- **ID:** `fc88df0b-0fd1-45cf-be78-4277fc937a18`
- **Event:** `production_orders.items.update`
- **Type:** filter
- **Sort:** 0

**VALID_TRANSITIONS map:**

```js
const VALID_TRANSITIONS = {
  draft:          ['planned', 'cancelled'],
  planned:        ['released', 'waiting_issue', 'cancelled'],
  waiting_issue:  ['released', 'cancelled', 'on_hold'],
  released:       ['in_progress', 'on_hold', 'cancelled'],
  in_progress:    ['completed', 'on_hold'],
  on_hold:        ['released', 'cancelled'],
  completed:      [],
  cancelled:      [],
};
```

**Role guard logic:**

1. Read `context.accountability.user` to get the current user ID.
2. Query `daas_user_roles` where `directus_user = userId`, read the role name.
3. Apply the authority matrix:
   - `ppic` role: may only transition to `planned`, `released`, `on_hold`, `cancelled`. Blocked from `released → in_progress` and beyond.
   - `warehouse_operator` role: may only trigger `released → in_progress`. Blocked from `in_progress → completed`.
   - `production` role: may only trigger `in_progress → completed`. Blocked from any backwards move.
   - Admin/system: unrestricted.
4. On rejection, throw a clear error: `"Role '{role}' is not authorized to move production order from '{from}' to '{to}'."`.

Return `payload` unchanged if transition is valid.

### Extension B — Auto material check on release (new)

- **Event:** `production_orders.items.update`
- **Type:** filter
- **Sort:** -10 (must run before Extension A)
- **Name:** `Production Order - Auto Material Check on Release`

**Logic:**

1. Trigger only when `payload.status === 'released'` AND `current.status === 'planned'`. Otherwise return `payload` unchanged.
2. Fetch the production order: `bom_id`, `planned_qty`.
3. Fetch all `bom_items` for that BOM: `material_id`, `qty_per_unit`, `unit`.
4. For each ingredient: `requested_qty = qty_per_unit * planned_qty`.
5. Sum available stock: `SELECT SUM(qty) FROM batches WHERE material_id = X AND status = 'stored_available'`.
6. Compute `shortage_qty = MAX(0, requested_qty - available_qty)`.
7. Find the `material_request` for this production order, then update each matching `material_request_items` row: set `stock_available` and `shortage_qty`.
8. Decision:
   - All `shortage_qty === 0` → leave `payload.status = 'released'`.
   - Any `shortage_qty > 0` → override `payload.status = 'waiting_issue'`, set `payload.notes` (or a dedicated field) to: `"Auto-blocked: short by {qty} {unit} of {material_name}; ..."`.
9. `console.log` one-line summary: `"[AutoCheck] order {id}: {released|waiting_issue} — {N} shortages"`.
10. Use `services.items('...', { elevated: true })` for all reads/writes.

### Extension C — Recheck on stock available (new)

- **Event:** `batches.items.update`
- **Type:** action
- **Sort:** 30
- **Name:** `Production Order - Recheck Waiting Orders on Stock Available`

**Logic:**

1. Trigger only when `payload.status === 'stored_available'` AND `current.status !== 'stored_available'`.
2. Get `material_id` from the updated batch.
3. Find all `material_request_items` rows where `material_id = X` AND `shortage_qty > 0`.
4. For each parent production order (via `material_request_id → material_request → production_order_id`), re-run the same shortage logic from Extension B.
5. If all shortages are now zero → PATCH the production order from `waiting_issue → released` using `services.items('production_orders', { elevated: true }).updateOne(id, { status: 'released' })`.
6. `console.log`: `"[Recheck] batch {batchId} stored → rechecked {N} orders, released {M}"`.

---

## Required New Fields (DaaS MCP)

Before the extensions can write shortage data, two fields must exist on `material_request_items`:

| Field | Type | Purpose |
|---|---|---|
| `stock_available` | `decimal` | Stock qty found in `stored_available` batches at check time |
| `shortage_qty` | `decimal` | `MAX(0, requested_qty - stock_available)` |

Add both fields via `mcp_daas_fields create` if they do not already exist. They are written by Extension B and read by the PPIC Material Check Result panel and Extension C.

---

## Schema + Data Migration (DaaS MCP)

### Field update

Update `production_orders.status` field meta:
```json
{
  "interface": "select-dropdown",
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
```

### Data migration

One-time update: all `production_orders` rows where `status IN ('material_check', 'ready')` → set `status = 'released'`.

---

## PPIC Frontend Changes (3 files)

### `app/(authenticated)/ppic/production/create/page.tsx`

- Rename "Submit Order" button → **"Release for Production"**.
- On click: POST with `status: 'planned'`, then immediately PATCH `status: 'released'` on the returned order ID to trigger Extension B.
- After PATCH, re-read the order status:
  - `released` → green toast: `"Order released — materials confirmed available."` → route to `/ppic/production`.
  - `waiting_issue` → orange toast: `"Order created but blocked: {first shortage line}."` → route to `/ppic/production/{id}`.
- "Save Draft" path unchanged (creates with `status: 'draft'`, routes to list).

### `app/(authenticated)/ppic/production/[id]/page.tsx`

- Remove `STATUS_TRANSITIONS` map and all `material_check`/`ready` entries from it.
- New simplified `STATUS_TRANSITIONS` for PPIC:
  ```js
  {
    draft:   [{ value: 'planned', label: 'Submit for Planning', color: 'blue' }, { value: 'cancelled', label: 'Cancel', color: 'red' }],
    planned: [{ value: 'released', label: 'Release for Production', color: 'teal' }, { value: 'cancelled', label: 'Cancel', color: 'red' }],
    // released and beyond: no PPIC action buttons
  }
  ```
- Add **Material Check Result panel** (shown when `material_request_items` exist for this order):
  - Table: Material | Requested | Available | Shortage
  - Red highlight on rows where `shortage_qty > 0`.
  - Shown for all statuses so PPIC can see the check history.
- `CollectionForm` remains for all statuses but is rendered with `mode="view"` (read-only) when status is `released` or beyond. Only `draft` and `planned` use `mode="edit"`.
- Update `STATUS_COLORS` and `STATUS_LABELS` to remove `material_check` and `ready`.

### `app/(authenticated)/ppic/page.tsx` (dashboard)

- Change `prodReady` count query from `status: { _in: ['ready', 'released'] }` to `status: { _eq: 'released' }`.
- Remove any `material_check` references in the dashboard count queries.

---

## Warehouse Frontend Changes (2 files)

### `app/(authenticated)/warehouse/page.tsx`

- Verify the production picking queue already filters on `status: released` — no change expected. Confirm and adjust if needed.
- The picking queue table rows should link to the new `warehouse/production/[id]` page (add `onClick → router.push`).

### New: `app/(authenticated)/warehouse/production/[id]/page.tsx`

A WO-specific production order detail page.

**Data fetched:**
- Production order: `order_number`, `status`, `product_id`, `planned_qty`, `unit`.
- Product name (resolve `product_id`).
- `material_requests` for this order → `material_request_items` for each request → material names.

**Layout:**
```
Header: "Production Order {order_number}"   Badge: {status}
Subtitle: "{product_name} | {planned_qty} {unit}"

Section: Materials to Issue
Table:
  Material | Required | Issued | Shortage | Status
  Rose...  | 2.5 L    | 2.5 L  | —        | ✓ Done
  Ethanol  | 10 L     | 6 L    | 4 L      | ⚠ Remaining  ← red row

[Start Production] button:
  - Disabled with Mantine Tooltip listing unfulfilled lines when any issued_qty < requested_qty
  - Enabled (color="violet") when all lines satisfied
  - On click: PATCH production_orders/{id} status → in_progress
  - On success: green toast, navigate back to /warehouse
  - On server rejection (role or issue guard): show error from API response
```

**Server-side guard** (inside Extension A): Reject `released → in_progress` if any `material_request_items` for this production order has `issued_qty < requested_qty`. Error: `"Cannot start production: {material_name} not fully issued ({issued} of {requested} {unit})"`.

---

## Production Frontend Changes (1 file)

### `app/(authenticated)/production/orders/[id]/page.tsx`

- Remove `status === 'ready'` from the "Start Production" button condition — Production role no longer triggers this transition (WO does).
- Keep only:
  - "Mark as Finished" button when `status === 'in_progress'`.
  - Completion alert when `status === 'completed'`.
- Update `STATUS_COLORS` and `STATUS_LABELS` to remove `material_check` and `ready`.

---

## Documentation

### `.kiro/steering/UI-PATTERNS.md`

Add new section:

```markdown
## Production Order State Machine

### States
draft → planned → released → in_progress → completed
                  └─ waiting_issue (auto-blocked on material shortage)

Off-ramps: any active state → on_hold (resumable) or cancelled (terminal)

Removed states (kept in DB for audit): material_check, ready

### Role Authority
| Role               | Allowed transitions                              |
|--------------------|--------------------------------------------------|
| PPIC               | draft→planned, planned→released                  |
| System (auto)      | planned→released / waiting_issue, waiting→released |
| Warehouse Operator | released→in_progress (after full material issue) |
| Production         | in_progress→completed                            |
| Any                | *→on_hold, *→cancelled                           |
```

---

## Files Changed

| File | Change |
|------|--------|
| DaaS Extension `fc88df0b` | Update VALID_TRANSITIONS + add role guard |
| DaaS Extension (new) | Auto material check filter on release |
| DaaS Extension (new) | Recheck waiting orders on stock available |
| `production_orders.status` field (DaaS MCP) | Remove material_check/ready choices |
| `production_orders` items (DaaS MCP) | Migrate material_check/ready rows → released |
| `app/(authenticated)/ppic/production/create/page.tsx` | Rename button, two-step release flow |
| `app/(authenticated)/ppic/production/[id]/page.tsx` | Simplified transitions, material check panel |
| `app/(authenticated)/ppic/page.tsx` | Fix prodReady count query |
| `app/(authenticated)/warehouse/page.tsx` | Add link to new WO detail page |
| `app/(authenticated)/warehouse/production/[id]/page.tsx` | New WO picking + start production page |
| `app/(authenticated)/production/orders/[id]/page.tsx` | Remove ready/start-production, keep finish |
| `.kiro/steering/UI-PATTERNS.md` | Add state machine + role matrix section |

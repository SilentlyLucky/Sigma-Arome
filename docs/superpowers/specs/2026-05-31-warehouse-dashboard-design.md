# Warehouse Operation Dashboard — UI Redesign Spec

> **For agentic workers:** Use `superpowers:executing-plans` or `superpowers:subagent-driven-development` to implement the plan that follows from this spec.

**Goal:** Redesign the Warehouse Operation dashboard and sidebar into a modern, enterprise-grade SaaS UI — clean, action-oriented, green-only branding, optimised for warehouse operators.

**Approach:** Arrow-pipeline flow + task card grid for putaway + minimal table for production materials.

---

## Brand & Color System

| Token | Value |
|---|---|
| Primary Green | `#2E7D32` |
| Primary Hover | `#1B5E20` |
| Primary Light | `#E8F5E9` |
| Primary Border | `#C8E6C9` |
| Background | `#FAFBFA` |
| Card Background | `#FFFFFF` |
| Border | `#E8ECE8` |
| Divider | `#EEF2EE` |
| Text Heading | `#1F2937` |
| Text Body | `#4B5563` |
| Text Muted | `#6B7280` |
| Text Placeholder | `#9CA3AF` |

No orange, blue, or teal accents anywhere on these pages. Green is the only accent.

---

## Files Changed

| File | Change |
|---|---|
| `app/(authenticated)/warehouse/layout.tsx` | Full sidebar + header redesign |
| `app/(authenticated)/warehouse/page.tsx` | Full dashboard redesign |

---

## Section 1 — Layout & Sidebar (`layout.tsx`)

### Header (height 64px)

- Background: `#FFFFFF`, border-bottom: `1px solid #E8ECE8`, box-shadow: `0 1px 3px rgba(0,0,0,0.04)`
- Left: green leaf icon box (32×32, `border-radius: 8px`, `backgroundColor: #2E7D32`) + "Sigma Arome" `fw={700}` `#1F2937` + "Warehouse" muted `#9CA3AF`
- Right: `<NotificationBell role="warehouse" />` + Avatar menu (unchanged logic)

### Sidebar (width 268px)

- Background: `#FFFFFF`, border-right: `1px solid #E8ECE8`
- No `p="xs"` padding on `AppShell.Navbar` — use `p={0}`, manage spacing inside

**Brand block** (top, border-bottom `#EEF2EE`):
```
px=20, py=20
"WAREHOUSE OPS"   ← xs, fw=600, uppercase, #9CA3AF, letterSpacing 0.06em
"Warehouse Operation"  ← Title order=5, fw=700, #1F2937
```

**Nav sections** (px=12, py=12), 4 groups:

| Section label | Items |
|---|---|
| OVERVIEW | Dashboard, Floor Plan |
| RECEIVING | Expected Deliveries, Receive Raw Materials |
| INVENTORY | Batch Inventory, Put Away Approved, Storage Suggestions |
| HISTORY | Movement Log |

Section labels: `xs`, `fw=600`, `tt="uppercase"`, `#9CA3AF`, `letterSpacing: 0.06em`.

NavLink style per item:
- `borderRadius: 10px`, `marginBottom: 2px`, padding `9px 12px`
- `variant="light"`, `color="primary"` (Mantine maps to `#2E7D32`)
- Active: background `#E8F5E9`, text `#2E7D32`, `fw=600`
- Inactive: text `#4B5563`, `fw=500`
- Icon: 16px, `strokeWidth=1.75`, color matches text state
- Section dividers: `<Divider color="#EEF2EE" />` — only between groups, not before the first

### AppShell styles prop

```ts
styles={{
  header: { backgroundColor: '#FFFFFF', borderBottom: '1px solid #E8ECE8', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  navbar: { backgroundColor: '#FFFFFF', borderRight: '1px solid #E8ECE8' },
  main:   { backgroundColor: '#FAFBFA', minHeight: '100vh' },
}}
```

### Production Issuing nav item removal

Remove the "Production Orders" nav item from the sidebar. The production picking queue is surfaced on the dashboard. The `/warehouse/production` route still exists but isn't in primary nav.

---

## Section 2 — Dashboard Page (`page.tsx`)

### Page Header

```tsx
<Group gap={16} align="center" mb={32}>
  <Box style={{ width:48, height:48, borderRadius:12, backgroundColor:'#E8F5E9', display:'flex', alignItems:'center', justifyContent:'center' }}>
    <IconTruckDelivery size={24} color="#2E7D32" strokeWidth={1.75} />
  </Box>
  <div>
    <Title order={2} fw={700} style={{ color:'#1F2937', lineHeight:1.2 }}>Warehouse Operations</Title>
    <Text size="sm" style={{ color:'#6B7280', marginTop:2 }}>
      Receive materials, manage QC flow, assign storage, send to production.
    </Text>
  </div>
</Group>
```

---

### KPI Cards (4 across)

`SimpleGrid cols={{ base:2, md:4 }} spacing="md"`

Each card — `Paper p="lg" withBorder` with `boxShadow: '0 2px 8px rgba(0,0,0,0.04)'`:

```
┌─────────────────────────────────────────┐
│ DELIVERIES EXPECTED     [icon box 36×36]│  ← xs uppercase #9CA3AF
│                                         │
│  12                                     │  ← fw=700, fontSize≈36, #1F2937 (or #2E7D32 if active)
│                                         │
│ Raw material orders on the way          │  ← xs, #6B7280
│ View deliveries →                       │  ← xs link, #2E7D32
└─────────────────────────────────────────┘
```

Active state (count > 0): number color `#2E7D32`, icon box bg `#E8F5E9`, icon color `#2E7D32`. Inactive (count = 0): number color `#9CA3AF`, icon box bg `#F3F5F3`, icon color `#9CA3AF`.

Cards:

| Label | Icon | Link |
|---|---|---|
| Deliveries Expected | `IconTruckDelivery` | `/warehouse/incoming` |
| Waiting for QC | `IconBarcode` | `/warehouse/batches` |
| Approved — Needs Storage | `IconMapPin` | `/warehouse/putaway` |
| Stored & Ready | `IconPackage` | `/warehouse/batches` |

Cards are clickable (`onClick={() => router.push(...)}`, `cursor: pointer`).

---

### Warehouse Pipeline (arrow flow)

Single `Paper p="xl" withBorder` container, `boxShadow: '0 2px 8px rgba(0,0,0,0.04)'`.

Header row:
```
"Warehouse Flow"   fw=600, #1F2937
"Where work is currently sitting."   xs, #6B7280
                                    [badge: "N open actions" or "All clear"]  → primary/green color
```

Pipeline row — `Group justify="space-between" align="flex-start" wrap="nowrap"` with 4 stage columns separated by `→` arrow Text:

Each stage (`Stack gap={4} align="center" style={{ flex:1 }}`):
```
  {count}        ← fw=800, fontSize≈28, #2E7D32 if >0 else #D1D9D1
  STAGE LABEL    ← xs, fw=600, uppercase, #9CA3AF
  description    ← xs, #6B7280, textAlign center
```

Arrow between stages: `<Text size="xl" style={{ color:'#D1D9D1', alignSelf:'flex-start', paddingTop:8 }}>→</Text>`

No progress bars. The counts are the signal.

---

### Putaway Task Cards

Section header row:
```
"Needs Storage Assignment · {n}"    fw=600, #1F2937
                    "Go to putaway →"  xs link, #2E7D32
```

`SimpleGrid cols={{ base:1, sm:2 }} spacing="sm"` — each card:

```
┌────────────────────────────────────────┐
│  PK-2024-001               50 kg       │  ← batch_number fw=600 #1F2937 | qty+unit #6B7280
│  Batch cleared for storage             │  ← xs, #9CA3AF
│                                        │
│                  [ Assign Location ]   │  ← Button size="sm" color="primary" variant="filled"
└────────────────────────────────────────┘
```

Card: `Paper p="md" withBorder`, `borderColor: #E8ECE8`, `boxShadow: '0 1px 4px rgba(0,0,0,0.04)'`.

Button navigates to `/warehouse/slotting`.

Empty state (all batches stored):
```
[✓ icon box, #E8F5E9 bg]   All batches stored
                            No approved batches waiting for a storage bin.
```

---

### Production Materials

Section header: `"Materials Needed for Production"`, `fw=600`, `#1F2937`.

Sub-section **Ready to Send** (if `pendingTasks.length > 0`):

Label: `"Ready to Send · {n}"`, `fw=500`, `#2E7D32`.

Table — `Table` with NO `withTableBorder withColumnBorders`. Use row hover (`#F9FAF9`). Row height ~52px via `py={14}` on `Table.Td`.

Columns: Order | Material | Batch | Location | Qty | Action

- Order: `fw=500`, green underline on hover, clickable → `/warehouse/production/{id}`
- Batch: monospace `xs`
- Location: `Badge size="xs" color="primary" variant="light"`
- Action: `<Button size="compact-sm" color="primary">Send to Production</Button>` (loading state preserved)

Sub-section **No Stock Available** (if `blockedTasks.length > 0`):

No table. Instead a `Paper p="md"` with amber-tinted left border (`borderLeft: '3px solid #D97706'`):

```
⚠  No Stock Available · {n} materials blocked
   {material_name}   {requested_qty} {unit}   Order: {order_number}
   {material_name}   ...
```

Each blocked item as a `Group` row with muted text. No buttons (nothing to act on).

Empty state (no pick tasks at all):
```
[✓ icon]  No materials needed right now.
          Production has no open material requests waiting on the warehouse.
```

---

## Data & Logic

All data fetching logic is **unchanged** — same API calls, same state variables, same `issueBatch()` function, same `loadPickQueue()`. Only the JSX render is replaced.

The `MetricCard` and `EmptyQueueState` sub-components are removed and replaced with inline JSX to keep the file flat and readable.

---

## Non-Goals

- No changes to `/warehouse/incoming`, `/warehouse/batches`, `/warehouse/putaway`, `/warehouse/slotting`, or any other warehouse sub-pages.
- No new API endpoints.
- No changes to notification logic.
- No dark mode support (app is locked to light mode).

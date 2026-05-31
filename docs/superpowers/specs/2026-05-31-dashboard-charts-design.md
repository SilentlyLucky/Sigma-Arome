# Dashboard Charts Design

**Date:** 2026-05-31
**Scope:** Replace `StatusBar` and `Pipeline` helper components on all role dashboards with proper charts using `@mantine/charts`.

---

## Goal

Every dashboard currently visualizes status breakdowns and pipeline flows using hand-rolled `StatusBar` (proportional div strip) and `Pipeline` (arrow-step boxes) components. These are replaced with `DonutChart` and `BarChart` from `@mantine/charts` to give users richer, more readable at-a-glance information.

---

## Library

**Package:** `@mantine/charts` v8 + `recharts` (peer dependency)

```bash
npm install @mantine/charts recharts
```

Chosen because:
- Matches existing Mantine v8 version exactly — same theming system, color tokens, spacing
- No additional design system to maintain
- `DonutChart` and `BarChart` are available out of the box

---

## Chart Type Rules

| Current component | Replacement | Rationale |
|---|---|---|
| `StatusBar` | `DonutChart` | Composition data (shares of a whole) — donuts communicate proportion better than a thin strip |
| `Pipeline` | `BarChart` | Volume-at-stage data — bars convey magnitude per stage; left-to-right ordering preserves the flow metaphor |

---

## Per-Dashboard Changes

### Manager (`app/(authenticated)/manager/page.tsx`)

**Remove:** `Pipeline` component, two `StatusBar` instances, `React` import (used only for `React.Fragment` in Pipeline).

**Add:**

1. `BarChart` — End-to-End Operations Pipeline
   - Data: 5 bars — On Order, In QC, Stored & Ready, In Production, Completed
   - Colors: blue, orange, teal, violet, green
   - Height: 180px

2. `DonutChart` — Production Orders breakdown
   - Segments: Blocked (red), Ready to start (lime), Running (violet), Completed (green)
   - Size: 160px, thickness: 30

3. `DonutChart` — Batch Quality Status
   - Segments: Waiting (orange), In review (blue), On hold (yellow), Rejected (red), Stored & ready (green)
   - Size: 160px, thickness: 30

### Production (`app/(authenticated)/production/page.tsx`)

**Remove:** `StatusBar` component.

**Add:**

1. `DonutChart` — Production Order Status
   - Segments: Blocked (red), Ready to start (lime), Running (violet), Completed (green)
   - Size: 160px, thickness: 30

### PPIC (`app/(authenticated)/ppic/page.tsx`)

**Remove:** `StatusBar` component.

**Add:**

1. `DonutChart` — Material Order Status
   - Segments: Ordered (blue), Partially received (yellow)
   - Size: 160px, thickness: 30

2. `DonutChart` — Production Readiness
   - Segments: Draft / planning (gray), Waiting for materials (red), Ready to start (lime), Running (violet)
   - Size: 160px, thickness: 30

### Warehouse (`app/(authenticated)/warehouse/page.tsx`)

**Remove:** `Pipeline` component, `React` import (used only for `React.Fragment` in Pipeline).

**Add:**

1. `BarChart` — Warehouse Flow
   - Data: 4 bars — Deliveries Due, Waiting QC, Approved→Store, Stored & Ready
   - Colors: blue, orange, teal, green
   - Height: 180px

### QC (`app/(authenticated)/qc/page.tsx`)

**Remove:** `StatusBar` component.

**Add:**

1. `DonutChart` — Batch Quality Status Breakdown
   - Segments: Waiting (orange), In review (blue), On hold (yellow), Rejected (red), Approved total (green)
   - Size: 160px, thickness: 30

### Logistic (`app/(authenticated)/logistic/page.tsx`)

**Remove:** `Pipeline` component, `React` import (used only for `React.Fragment` in Pipeline).

**Add:**

1. `BarChart` — Material Request Pipeline
   - Data: 4 bars — Submitted, Approved, Being Sent, Completed
   - Colors: orange, blue, cyan, green
   - Height: 180px

### Admin (`app/(authenticated)/admin/page.tsx`)

No changes — admin dashboard has no status charts.

---

## Data Flow

No new API calls. All chart data is derived from the existing `counts` state fetched via `POST /api/batch-counts`. Chart `data` arrays are computed inline from the existing `n('key')` helper in each file.

Example (DonutChart data):
```ts
const productionDonutData = [
  { name: 'Blocked', value: n('prodBlocked'), color: 'red.5' },
  { name: 'Ready to start', value: n('prodReady'), color: 'lime.5' },
  { name: 'Running', value: n('prodActive'), color: 'violet.5' },
  { name: 'Completed', value: n('prodCompleted'), color: 'green.5' },
];
```

Example (BarChart data):
```ts
const warehouseBarData = [
  { stage: 'Deliveries Due', count: n('incoming'), color: 'blue.5' },
  { stage: 'Waiting QC', count: n('qcPending'), color: 'orange.5' },
  { stage: 'Approved→Store', count: n('approvedWaiting'), color: 'teal.5' },
  { stage: 'Stored & Ready', count: n('stored'), color: 'green.5' },
];
```

---

## Layout

Each chart replaces the existing `StatusBar`/`Pipeline` content inside its existing `<Paper>` wrapper. The Paper header text and any `Anchor` links below the chart are kept. No layout restructuring outside the chart area.

DonutCharts will be centered inside the Paper with `withLegend` enabled to retain the label+count context.

BarCharts will span full width of the Paper.

---

## Segments that are zero

Both `DonutChart` and `BarChart` handle zero-value segments gracefully — they simply render nothing for that segment. No special handling needed.

---

## Files Changed

- `package.json` — add `@mantine/charts`, `recharts`
- `app/(authenticated)/manager/page.tsx`
- `app/(authenticated)/production/page.tsx`
- `app/(authenticated)/ppic/page.tsx`
- `app/(authenticated)/warehouse/page.tsx`
- `app/(authenticated)/qc/page.tsx`
- `app/(authenticated)/logistic/page.tsx`

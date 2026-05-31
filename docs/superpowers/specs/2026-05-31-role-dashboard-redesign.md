# Role Dashboard Redesign

Date: 2026-05-31

## Goal

Improve each role dashboard so it works as a daily workspace, not only a collection of status counters. Each dashboard should answer three questions:

1. What should I do now?
2. Is my area healthy?
3. What is stuck, overdue, or risky?

The design mixes operational task lists with lightweight analytics. Charts are used only when they make a bottleneck, trend, or split easier to understand than a table.

## Shared Dashboard Pattern

Each role dashboard should follow a consistent structure:

1. Priority section at the top
   - Three to five role-specific action cards.
   - Each card links to the relevant page or filtered queue.
   - Labels should use user-facing wording, not backend status names.

2. Analytics section in the middle
   - KPI cards for important counts.
   - One compact visual when helpful: pipeline bar, status breakdown, donut, or trend line.
   - Avoid decorative charts that do not help decisions.

3. Queue and exception section at the bottom
   - Tables or short lists for tasks, blockers, overdue records, and decisions needed.
   - Empty states should explain what "good" looks like.

## Role Designs

### Manager

Purpose: give a cross-functional operating view and surface exceptions that need attention.

Priority cards:
- Production blocked by missing materials.
- QC holds or rejected batches needing review.
- Raw material deliveries overdue or due soon.
- Warehouse or production bottlenecks.

Analytics:
- End-to-end operations pipeline: raw material orders, receiving, QC, storage, production, completion.
- Department bottleneck cards for PPIC, Warehouse, QC, Production, and Logistics.
- Simple status split for production and QC.

Queues and exceptions:
- Production orders blocked by material availability.
- QC hold/reject list.
- Late expected deliveries.
- Storage capacity or location assignment risks.

### Warehouse

Purpose: help warehouse users receive, store, and send materials without hunting across pages.

Priority cards:
- Raw materials expected today.
- Received batches waiting for QC.
- QC-approved batches waiting for putaway.
- Materials ready to send to production.

Analytics:
- Warehouse flow pipeline: expected delivery, received, waiting QC, approved, stored, issued.
- Storage utilization summary if capacity fields are available.
- Ready vs blocked production material requests.

Queues and exceptions:
- Putaway queue with batch, material, hazard, and suggested location status.
- Production send queue with available batch and bin.
- Blocked items with no production-ready stock.
- Temporary/manual override locations.

### QC

Purpose: prioritize inspections and make quality workload visible.

Priority cards:
- Batches waiting for inspection.
- Oldest batch waiting.
- Holds needing decision.
- Rejected batches needing follow-up.

Analytics:
- QC status breakdown: waiting, in review, approved, held, rejected.
- Optional pass/hold/reject trend if timestamps support it.
- Aging indicator for batches waiting too long.

Queues and exceptions:
- Inspection priority queue sorted by age and production impact.
- Hold list with reason and age.
- Rejected list with reason and next step.

### PPIC

Purpose: show planning readiness across purchasing, formulas, materials, and production.

Priority cards:
- Raw material orders to follow up.
- Production orders blocked by material.
- Low or unavailable materials for planned production.
- Products/formulas needing setup.

Analytics:
- Material order status split.
- Production readiness split: ready, blocked, in production.
- Material availability coverage for active production orders.

Queues and exceptions:
- Overdue expected deliveries.
- Production orders without enough available material.
- Products without active formula.
- Formula materials missing unit or quantity.

### Production

Purpose: show what can start, what is running, and what is blocked.

Priority cards:
- Orders ready to start.
- Active production orders due soon.
- Finished production waiting QC or storage.
- Orders blocked by materials.

Analytics:
- Production order status breakdown.
- Due-date risk summary.
- Optional completion trend if history is reliable.

Queues and exceptions:
- Ready-to-start queue.
- Active work queue.
- Blocked orders with missing materials.
- Finished goods waiting next step.

### Logistics

Purpose: coordinate material movement and finished goods handoff.

Priority cards:
- Material requests waiting review.
- Approved requests waiting to send.
- Materials currently being sent.
- Finished goods needing storage.

Analytics:
- Request status breakdown.
- Issue progress pipeline.
- Blocked request count.

Queues and exceptions:
- Requests awaiting approval.
- Approved issue list.
- Blocked requests without available stock.
- Finished goods putaway queue.

### Admin

Purpose: keep setup, access, and master data healthy.

Priority cards:
- Setup areas incomplete.
- Users without role or access.
- Roles with missing permissions.
- Recent sensitive changes.

Analytics:
- Setup completion progress.
- Master data health by area.
- Audit activity trend for the last seven days if available.

Queues and exceptions:
- Empty required master data areas.
- Users missing role/access.
- Roles with no policy or incomplete action permissions.
- Missing QC templates, hazard classes, or warehouse bins.

## Chart Guidelines

Use charts only when they reduce reading effort:

- Pipeline bar for process flow and bottlenecks.
- Stacked status bar for status distribution.
- Donut chart for simple part-to-whole splits, such as capacity used vs available.
- Small trend line for manager/admin trend context.
- Keep urgent work as lists, not charts.

Charts should be compact and secondary to action lists on operational dashboards. Manager and Admin can be more analytics-heavy.

## Data Flow

Use the existing `POST /api/batch-counts` endpoint for aggregated counts wherever possible. For task queues, fetch only the fields needed by each list. Prefer batched requests and shared helper functions over many individual browser fetches.

Data should be transformed into role-friendly labels at the dashboard layer:

- `stored_available` becomes "ready for production".
- `qc_pending` becomes "waiting for QC".
- `approved` becomes "approved, ready to store".
- Backend workflow names should not appear directly in dashboard copy.

## Interaction Rules

- Every KPI or priority card should be clickable when there is a useful destination.
- Task rows should link to the detail page or workflow page where the action happens.
- Empty states should be specific, for example: "No batches are waiting for putaway right now."
- Alerts should explain the operational impact, not the database condition.

## Implementation Order

1. Manager dashboard first to define the cross-role model and shared visual components.
2. Warehouse and QC next because they are the most operational and queue-driven.
3. PPIC, Production, and Logistics after shared patterns are proven.
4. Admin last, focused on setup health and exceptions.

## Out of Scope

- Heavy BI/reporting.
- Complex historical trend analytics unless the existing data supports it cleanly.
- New database schema changes.
- Decorative charts that do not lead to action.

## Verification

Each dashboard update should be verified with:

- TypeScript build.
- Production build.
- Manual browser check for desktop and narrow/mobile width.
- Empty-state review where practical.

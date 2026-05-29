# Sigma Arome Smart Operations — Phase Tracking

## Phase 0: Foundation ✅ COMPLETE

**Completed:** 2026-05-28

### Deliverables
- [x] Project bootstrapped (Next.js 16 + Mantine v8 + TypeScript 5.x)
- [x] 47 Buildpad UI components installed via CLI
- [x] All npm dependencies installed and resolved
- [x] Auth proxy routes (login, logout, callback, user)
- [x] DaaSProviderWrapper in authenticated layout
- [x] DaaS CORS configured (localhost:3000, localhost:3001, Amplify URL)
- [x] Environment variables configured (.env.local)
- [x] OAuth config stub (lib/oauth/config.ts)
- [x] Build passes (`pnpm build` — zero errors)
- [x] TypeScript compiles (`tsc --noEmit` — zero errors)

### DaaS Backend Setup
- [x] 7 roles created: Administrator, Manager, PPIC, Warehouse Operation, QC, Logistic, Production
- [x] 8 master data collections: suppliers, raw_materials, products, warehouse_locations, hazard_classes, storage_rules, qc_templates, iot_sensors
- [x] Relations configured (hazard_class → materials, materials → storage_rules, etc.)
- [x] Admin Full Access policy (admin_access: true) → Administrator role
- [x] Master Data Read Only policy → all non-admin roles

### Admin UI (Phase 1 — Admin Role)
- [x] Admin AppShell layout with sidebar navigation
- [x] Admin Dashboard with stat cards and quick actions
- [x] Suppliers CRUD (list + create + edit)
- [x] Raw Materials CRUD (list + create + edit)
- [x] Products CRUD (list + create + edit)
- [x] Warehouse Locations CRUD (list + create + edit)
- [x] Hazard Classes CRUD (list + create + edit)
- [x] Storage Rules CRUD (list + create + edit)
- [x] QC Templates CRUD (list + create + edit)
- [x] IoT Sensors CRUD (list + create + edit)
- [x] User Management (list view)
- [x] Audit Log (list view — uses DaaS built-in daas_activity)

---

## Phase 1: Admin Role ✅ COMPLETE

**Completed:** 2026-05-29

### Deliverables

#### Screens
- [x] Admin Dashboard — PRD 17.1 KPIs (active users, roles configured, master data completion, audit events 24h, setup checklist)
- [x] User Management — full create/edit/suspend/activate with role assignment
- [x] Role Management (`/admin/roles`) — view all roles, create/edit custom roles
- [x] Module Permission Configuration (`/admin/permissions`) — module access matrix + DaaS policies + role→policy assignments
- [x] Field Visibility Configuration (`/admin/field-visibility`) — field-level visibility matrix per role per collection
- [x] Action/Button Permission Configuration (`/admin/action-permissions`) — action permission matrix per role
- [x] Audit Log (`/admin/audit-log`) — read-only DaaS activity log with info banner

#### API Routes Added
- [x] `GET/POST /api/roles` — DaaS roles proxy
- [x] `GET/PATCH/DELETE /api/roles/[id]` — DaaS role detail proxy
- [x] `GET/POST /api/users` — DaaS users proxy
- [x] `PATCH/DELETE /api/users/[id]` — DaaS user detail proxy
- [x] `GET/POST /api/policies` — DaaS policies proxy
- [x] `GET/POST /api/access` — DaaS access entries proxy

#### Role-Based Routing
- [x] `app/page.tsx` — server-side role detection → redirects to role-specific dashboard
  - Administrator → /admin
  - Manager → /manager
  - PPIC → /ppic
  - Warehouse Operation → /warehouse
  - QC → /qc
  - Logistic → /logistic
  - Production → /production

#### RBAC via DaaS MCP
- [x] Manager Read Policy — read access to all master data + inventory
- [x] PPIC Operational Policy — read master data (field-restricted), read inventory
- [x] Warehouse Operation Policy — read master data, read+create+update inventory, update warehouse_locations
- [x] QC Operational Policy — read raw_materials, products, qc_templates, hazard_classes, warehouse_locations (limited), iot_sensors (limited), inventory (limited)
- [x] Logistic Coordination Policy — read suppliers (limited), raw_materials, products, warehouse_locations (limited), iot_sensors (limited), inventory
- [x] Production Execution Policy — read raw_materials (limited), products, warehouse_locations (limited), inventory (limited)
- [x] All 6 policies linked to their respective roles via access entries

#### Admin Layout
- [x] Sidebar reorganized into sections: Overview, Access Control, Master Data, Audit
- [x] New nav items: Role Management, Module Permissions, Field Visibility, Action Permissions

#### Validation
- [x] `pnpm build` — zero errors, zero TypeScript errors
- [x] Buildpad-First check — zero forbidden raw Mantine components in admin pages

### Acceptance Criteria Status
- [x] Admin can create required master data (suppliers, materials, products, locations, hazard classes, QC templates, sensors)
- [x] Admin can create at least one user per primary role
- [x] Admin actions are logged (DaaS automatic activity log)
- [x] Non-admin users cannot access Admin pages (DaaS admin_access policy enforced)
- [x] Role management UI exists
- [x] Module permission configuration UI exists
- [x] Field visibility configuration UI exists
- [x] Action/button permission configuration UI exists
- [x] Role-based login routing implemented

---

## Phase 2: PPIC Role ✅ COMPLETE

**Completed:** 2026-05-29

### Deliverables

#### DaaS Collections Created
- [x] `raw_material_orders` — order_number (auto), material_id (M2O), supplier_id (M2O), ordered_qty, unit, expected_arrival_date, priority, status, notes, created_by
- [x] `production_orders` — order_number (auto), product_id (M2O), planned_qty, unit, status, priority, planned_start_date, notes, created_by
- [x] `material_requests` — request_number (auto), production_order_id (M2O), material_id (M2O), requested_qty, unit, priority, status, notes, requested_by

#### DaaS Extensions (Auto-number Generation)
- [x] `Auto-generate Raw Material Order Number` — filter hook on create → RM-ORD-YYYYMMDD-NNN
- [x] `Auto-generate Production Order Number` — filter hook on create → PROD-YYYYMMDD-NNN
- [x] `Auto-generate Material Request Number` — filter hook on create → MR-YYYYMMDD-NNN

#### RBAC Permissions
- [x] PPIC: full CRUD on raw_material_orders, production_orders, material_requests (own items only for update)
- [x] Manager: read all three collections
- [x] Warehouse Operation: read raw_material_orders (limited fields)
- [x] Logistic: read material_requests + production_orders (limited fields)

#### Screens
- [x] PPIC Layout (AppShell with sidebar: Overview, Ordering, Planning)
- [x] PPIC Dashboard — 8 KPI widgets (orders waiting, partial, QC pending, approved, hold, requests pending, prod waiting, prod in progress)
- [x] Raw Material Orders — list + create + detail
- [x] Production Orders — list + create + detail
- [x] Material Requests — list + create + detail
- [x] Material Readiness — read-only view of order statuses

#### Status Workflows (controlled via select-dropdown choices)
- [x] Raw Material Order: Draft → Ordered → Partially Received → Received → Closed → Cancelled
- [x] Production Order: Draft → Material Checked → Material Requested → Movement Coordinated → Waiting Issue → Ready → In Production → Completed → FG Created
- [x] Material Request: Pending → Coordinated → Assigned → Issued → Received → Cancelled

#### Validation
- [x] `pnpm build` — zero errors
- [x] All pages use Buildpad CollectionList + CollectionForm (no raw Mantine)

### Acceptance Criteria Status
- [x] PPIC can create raw material order
- [x] PPIC can track order status (ordered, partially received, received, closed, cancelled)
- [x] PPIC can create production plan
- [x] PPIC can see material readiness view
- [x] PPIC can create material request
- [x] PPIC cannot approve QC (no QC actions in PPIC UI)
- [x] PPIC cannot physically issue material (no issue actions)
- [x] PPIC cannot execute production stages (no production execution actions)
- [x] PPIC cannot access sales/customer/shipping/invoicing screens (not built)

---

## Phase 3: Warehouse Operation Role — NEXT

### Planned
- [ ] PPIC Dashboard with role-specific widgets
- [ ] Raw Material Orders collection + CRUD
- [ ] Production Orders collection + CRUD
- [ ] Material Requests collection + CRUD
- [ ] Material Readiness view
- [ ] PPIC-specific RBAC permissions
- [ ] Order status workflow

---

## Phase 2: Warehouse Operation Role

### Planned
- [ ] Warehouse Operation Dashboard
- [ ] Raw Material Receiving
- [ ] Batch ID generation
- [ ] Storage Assignment
- [ ] Warehouse Map
- [ ] Material Issue to Production
- [ ] Finished Product Putaway

---

## Phase 3: QC Role

### Planned
- [ ] QC Dashboard / Workbench
- [ ] QC Queue (raw material + finished product)
- [ ] QC Sampling
- [ ] Computer Vision mock review
- [ ] QC Decision (approve/hold/reject)

---

## Phase 4: Logistic Role

### Planned
- [ ] Logistic Dashboard
- [ ] Material Request Queue
- [ ] Movement Priority Board
- [ ] Handoff monitoring

---

## Phase 5: Production Role

### Planned
- [ ] Production Dashboard
- [ ] Production Execution
- [ ] Consumption tracking
- [ ] Yield/output recording
- [ ] FG Batch creation

---

## Phase 6: Manager Role

### Planned
- [ ] Manager Dashboard (cross-functional KPIs)
- [ ] Batch Traceability
- [ ] Exception management
- [ ] Alert overview

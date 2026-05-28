# Kiro PRD: AromeFlow AI — Sigma Arome Integrated Operations Website

## 0. Kiro Build Instruction

Use this PRD as the implementation source for Kiro.

Paste this into Kiro Chat from the `test-starter.zip` starter project:

```text
/create-project Build AromeFlow AI, an integrated web-based manufacturing operations platform for Sigma Arome. Use the enterprise Buildpad/DaaS template and follow the test-starter.zip Kiro guide. Build in phases 0-5. Use Next.js, TypeScript, Mantine v8, Buildpad UI components, DaaS collections, Supabase auth, RBAC, workflow state machines, file upload, DaaS activity/audit logging, Playwright tests, and AWS Amplify-compatible build output. Do not build the entire app at once. Implement the MVP demo flow first: receiving → QC with AI image analysis → storage recommendation → inventory/cold-chain alert → PPIC demand planning → production order → finished goods → dispatch → supervisor traceability.
```

Recommended template: **enterprise** because this project needs RBAC, workflows, file uploads, relations, activity/audit logging, and complex operational traceability.

Important Kiro/buildpad constraints from the starter:

- Use the **two-tier architecture**: `Frontend Next.js → DaaS Backend → Supabase PostgreSQL`.
- Frontend data access must go through **Next.js proxy routes / DaaS**, not directly to Supabase tables.
- Use **Supabase Auth** for authentication.
- Use **DaaS RBAC**, **DaaS workflows**, **DaaS files**, and **DaaS activity/audit logs** instead of custom implementations where available.
- Implement **role-specific UI/data visibility**: role-aware navigation, dashboards, table columns, default filters, visible actions, and read-only summary views. Do not show all readable data to every role.
- Do **not** create a custom audit table unless DaaS activity logging is unavailable. Use the DaaS activity API/UI for audit history.
- Use **Buildpad UI components first** for forms, lists, filters, file upload, relation selectors, and collection pages.
- Do not use raw Mantine inputs/tables when a Buildpad component exists.
- Build phase by phase and run tests after each phase.
- Do not expose or commit `.env.local` or `.kiro/settings/mcp.json` secrets.

---

## 1. Product Summary

### Product Name
**AromeFlow AI**

### Product Type
Role-based web operations platform for natural-extract manufacturing.

### One-line Description
AromeFlow AI tracks every raw-material batch from delivery arrival to QC, warehouse storage, PPIC planning, production, finished goods, and dispatch, with AI-assisted QC, storage recommendations, cold-chain alerts, demand planning, and supervisor traceability.

### Target Users
Sigma Arome operations teams: Warehouse, QC, PPIC, Production, Dispatch, HSE, Supervisor, Admin, and Management.

---

## 2. Problem Statement

Sigma Arome currently suffers from fragmented systems, repeated data entry, manual QC bottlenecks, spreadsheet-based storage decisions, cold-chain tracking in files, unclear production visibility, and weak batch traceability.

The real problem is not only manual work. The real problem is **loss of operational control across the raw-material-to-dispatch chain**.

The website must become the single source of truth for:

- raw-material receiving;
- QC inspection and release;
- warehouse placement and storage safety;
- inventory quantity, status, and location;
- cold-chain and expiry monitoring;
- demand-driven PPIC planning;
- production execution;
- finished goods release;
- dispatch/shipment;
- supervisor exceptions and traceability.

---

## 3. Product Vision

Create a web-based operations control platform where every batch, movement, QC decision, production action, alert, and dispatch event is visible, traceable, and role-controlled.

AI and IoT should assist human decisions, not replace them.

Core principle:

> AI recommends. Humans approve. The system records everything.

---

## 4. MVP Goals

| Goal | Requirement |
|---|---|
| Eliminate duplicate entry | One batch record feeds QC, warehouse, PPIC, production, and dispatch |
| Improve QC speed | AI image analysis supports QC inspection |
| Improve storage decisions | AI/rule engine recommends safe warehouse location |
| Improve cold-chain control | Simulated sensor readings create temperature alerts |
| Improve PPIC realism | PPIC plans from demand data, not only inventory |
| Improve traceability | Supervisor can view complete batch timeline |
| Improve auditability | DaaS activity logs show who changed what and when |
| Win competition demo | Show integrated flow, not isolated CRUD screens |

---

## 5. Non-goals for MVP

Do not build these in the first demo:

- full ERP integration;
- full supplier portal;
- full customer portal;
- real IoT hardware integration;
- real trained ML model;
- full financial procurement workflow;
- advanced production optimization;
- mobile app;
- external laboratory integration.

These can be presented as future development.

---

## 6. MVP Demo Flow

The website must support this exact demo journey:

1. Login as **Warehouse Operator**.
2. Create a raw-material receiving record.
3. System generates internal batch ID and QR/barcode value.
4. Batch status becomes **Awaiting QC**.
5. Login as **QC**.
6. Open QC queue.
7. Upload/capture raw-material image.
8. Simulated AI returns quality score, defects, confidence, and recommendation.
9. QC approves or rejects the batch.
10. Approved batch creates warehouse storage task.
11. Login as **Warehouse Operator**.
12. Open storage task.
13. System recommends best storage location based on cold-chain, hazard class, capacity, and FEFO.
14. Warehouse confirms placement.
15. Inventory becomes **Available**.
16. Simulated sensor creates cold-chain temperature breach.
17. Login as **Supervisor**.
18. Supervisor sees critical alert and affected batch.
19. Login as **PPIC**.
20. Create or import demand data: product, quantity, due date, priority, customer/order reference.
21. System checks finished goods stock, raw-material availability, QC status, expiry, and capacity.
22. PPIC creates production order.
23. System reserves material batch.
24. Production starts and completes job.
25. Finished goods batch is created and released.
26. Dispatch ships finished goods.
27. Supervisor opens one batch timeline showing receiving → QC → storage → alert → production → finished goods → dispatch.

---

## 7. User Roles

### Active Input Users

| Role | Purpose |
|---|---|
| Warehouse Operator | Receives materials, confirms storage, moves inventory, stages production materials |
| QC | Performs raw-material and finished-goods inspections |
| PPIC | Creates demand records, production plans, reservations, and replenishment recommendations |
| Production Team | Executes production orders and records actual usage/output |
| Dispatch | Prepares and confirms shipments |
| HSE | Handles hazard/cold-chain incidents and corrective actions |
| Admin | Configures users, roles, master data, locations, thresholds |

### Review / Approval Users

| Role | Purpose |
|---|---|
| Supervisor | Monitors operation, approves exceptions/overrides, resolves escalations |
| QC Lead | Optional: final QC decision for high-risk batches |
| PPIC Lead | Optional: final production plan approval |

### Read-only Users

| Role | Purpose |
|---|---|
| Management | KPI and operational overview |
| Sales / Customer Service | View finished goods and shipment status only if needed |

---

## 8. RBAC Requirements

Use DaaS RBAC permissions. Do not hardcode permissions only in the UI.

Legend: C=create, R=read, U=update, A=approve/transition, X=reject/transition, E=export/config view.

| Module | Warehouse | QC | PPIC | Production | Dispatch | HSE | Supervisor | Admin | Management |
|---|---|---|---|---|---|---|---|---|---|
| Receiving | C/R/U | R | R | R | R | R | R/A | Config | R/E |
| Raw Material Batch | C/R/U | R/U/A/X | R | R | R | R | R/A | Config | R/E |
| QC Inspection | R | C/R/U/A/X | R | R | R | R | R/A | Config | R/E |
| Warehouse Location | C/R/U | R | R | R | R | R/U | R/A | Config | R/E |
| Inventory Movement | C/R/U | R | R | R/U limited | R/U limited | R | R/A | Config | R/E |
| Sensor Monitoring | R | R | R | R | R | R/U | R/A | Config | R/E |
| Alerts | R/U assigned | R/U assigned | R/U assigned | R assigned | R/U assigned | R/U assigned | R/A | Config | R/E |
| Demand Records | R | R | C/R/U/A | R | R | R | R/A | Config | R/E |
| Production Order | R | R | C/R/U/A | R/U execution | R | R | R/A | Config | R/E |
| Production Execution | R | R | R | C/R/U | R | R | R/A | Config | R/E |
| Finished Goods QC | R | C/R/U/A/X | R | R | R | R | R/A | Config | R/E |
| Dispatch | R/U | R | R/U plan | R | C/R/U | R | R/A | Config | R/E |
| Reports | R limited | R limited | R/E | R limited | R limited | R limited | R/E | R/E | R/E |
| Admin Settings | No | No | No | No | No | No | R | Config | No |
| Activity/Audit Logs | No | R own module | R own module | R own module | R own module | R own module | R/E | R/E | R/E limited |

Delete should be disabled for operational records. Use cancel, void, reverse, or adjust with reason.


---

## 8A. Role-Specific UI and Data Visibility Requirements

This requirement is critical for Kiro. **RBAC is not enough.** The website must not simply allow users to read the database and then show the same interface to everyone. Each role must have a different dashboard, navigation menu, table columns, filters, actions, forms, and data scope.

### Core Rule

A user may technically have read access to several collections, but the UI should only show data that is relevant to that role's job.

Example:

- PPIC may read raw-material batches, inventory, QC status, demand records, and production orders, but PPIC does not need to see warehouse receiving form details, packaging photos, sensor-device maintenance fields, or every warehouse movement note by default.
- Warehouse may read production orders for staging materials, but Warehouse does not need to see demand forecast assumptions, customer pricing, management KPI exports, or PPIC forecast calculations.
- QC may read receiving and batch data, but QC does not need to see production scheduling controls or dispatch planning actions.

Therefore Kiro must implement **role-aware UI rendering** in addition to DaaS RBAC.

### Implementation Requirement for Kiro

Create a role-aware layout system:

- `getCurrentUserRole()` or equivalent auth helper.
- `roleNavigationConfig` for sidebar/menu items.
- `roleDashboardConfig` for dashboard cards and widgets.
- `roleTableColumnConfig` for visible table columns by role.
- `roleActionConfig` for buttons/actions available by role.
- `roleDataScopeConfig` for default filters and allowed record scope.

Do not rely only on hiding buttons in the frontend. Backend/DaaS permissions must still enforce create/update/approve restrictions.

---

### 8A.1 Role Landing Dashboards

| Role | Default Landing Page | Main UI Purpose |
|---|---|---|
| Warehouse Operator | `/warehouse` or `/warehouse/receiving` | Complete physical warehouse tasks quickly |
| QC | `/qc/queue` | Inspect batches and make QC decisions |
| PPIC | `/ppic/planning` | Convert demand into feasible production plans |
| Production Team | `/production/orders` | Execute released work orders |
| Dispatch | `/dispatch/shipments` | Ship released finished goods |
| HSE | `/monitoring/hse` or `/alerts?type=safety` | Resolve hazard and cold-chain incidents |
| Supervisor | `/supervisor` | Monitor full operation and exceptions |
| Admin | `/admin/users` | Configure users, roles, and master data |
| Management | `/reports` or `/supervisor?view=executive` | View KPIs and trends only |

---

### 8A.2 Sidebar / Navigation by Role

| Role | Show in Sidebar | Hide from Sidebar |
|---|---|---|
| Warehouse Operator | Receiving, Storage Tasks, Inventory, Locations, Movement Tasks, Assigned Alerts | PPIC Forecast, Demand Planning, Admin Settings, Management Reports, QC Approval Actions |
| QC | QC Queue, QC Inspections, Batch Lookup, Finished Goods QC, Assigned Alerts | Receiving Create Form, Storage Confirmation, PPIC Planning, Dispatch Create Form, Admin Settings |
| PPIC | Demand, Planning, Inventory Availability, Production Orders, Material Reservations, Forecast/Replenishment, Alerts | QC Decision Forms, Warehouse Movement Forms, Sensor Device Config, Admin Settings |
| Production Team | Released Work Orders, Material Receipt, Production Execution, Output Recording, Assigned Alerts | Demand Forecast, QC Approval, Warehouse Receiving, Dispatch Planning, Admin Settings |
| Dispatch | Dispatch Queue, Finished Goods Available to Ship, Shipment Records, Loading Validation, Assigned Alerts | Raw Material QC Forms, PPIC Forecast, Warehouse Receiving, Production Execution, Admin Settings |
| HSE | Safety Alerts, Hazard Map, Cold-chain Incidents, Corrective Actions, Affected Batches | PPIC Demand, Production Scheduling, Dispatch Planning, Admin Settings |
| Supervisor | Control Tower, Alerts, Batch Timeline, Exceptions, Reports, Audit Logs, All Operational Read Views | Admin Configuration unless also Admin |
| Admin | Users, Roles, Master Data, Locations, QC Specs, Alert Thresholds, System Settings, Audit Logs | Operational task execution unless also assigned operational role |
| Management | Executive Dashboard, KPI Reports, Traceability Search, Export Center | Operational create/update forms, Admin Settings, Task Queues |

---

### 8A.3 Data Visibility Scope by Role

| Data Area | Warehouse | QC | PPIC | Production | Dispatch | HSE | Supervisor | Admin | Management |
|---|---|---|---|---|---|---|---|---|---|
| Supplier Name | Read | Read | Read | Limited | Limited | Limited | Read | Config | Summary |
| Supplier Contact / Commercial Info | Hidden | Hidden | Limited | Hidden | Hidden | Hidden | Read | Config | Hidden |
| Raw Material Batch ID | Read | Read | Read | Read if assigned | Limited | Read if risk-related | Read | Config | Summary |
| Receiving Quantity | Create/Update before QC | Read | Read | Limited | Hidden | Hidden | Read | Config | Summary |
| Packaging Condition | Create/Update | Read | Hidden by default | Hidden | Hidden | Hidden | Read | Config | Hidden |
| QC Status | Read | Create/Update/Approve | Read | Read if assigned | Read for FG only | Read if hazard-related | Read/Approve exception | Config | Summary |
| QC Test Details | Read limited | Full | Summary only | Hidden | Hidden | Read if safety-related | Full | Config | Summary |
| AI QC Result | Read | Full | Summary only | Hidden | Hidden | Read if safety-related | Full | Config | Summary |
| Warehouse Location | Create/Update | Read | Read | Read if assigned | Read for FG only | Read | Read | Config | Summary |
| Inventory Quantity | Update by transaction | Read | Full planning view | Read assigned materials | Read FG only | Read risk-related | Full | Config | Summary |
| Inventory Movement Notes | Create/Update own tasks | Read if QC-related | Summary only | Read assigned | Read FG movement | Read incident-related | Full | Config | Summary |
| Sensor Readings | Read assigned zone | Read if affects QC batch | Summary risk only | Hidden | Hidden | Full for incidents | Full | Config | Summary |
| Demand Records | Hidden | Hidden | Create/Update/Approve | Read released demand only | Read dispatch-related | Hidden | Read/Approve exception | Config | Summary |
| Forecast Assumptions | Hidden | Hidden | Full | Hidden | Hidden | Hidden | Summary/Review | Config | Summary |
| Production Orders | Read staging needs | Read QC-related | Create/Update/Release | Execute assigned | Read dispatch-related | Hidden | Full | Config | Summary |
| Material Consumption | Read warehouse-issued qty | Read if QC issue | Full | Create/Update actuals | Hidden | Hidden | Full | Config | Summary |
| Finished Goods | Read location | QC release | Read availability | Create output | Full dispatch view | Hidden | Full | Config | Summary |
| Shipment Records | Read warehouse loading tasks | Hidden except FG quality issue | Read plan/status | Hidden | Create/Update | Hidden | Full | Config | Summary |
| Audit Logs | Hidden | Own module only | Own module only | Own module only | Own module only | Own module only | Full | Full | Limited summary |

---

### 8A.4 Role-Specific Table Column Requirements

Use different table column sets for the same collection depending on role.

#### Inventory Table

| Role | Columns to Show |
|---|---|
| Warehouse | Batch ID, Material, Quantity, Unit, Status, Current Location, Storage Task, Expiry, Movement Action |
| QC | Batch ID, Material, Supplier, Received Date, QC Status, AI Flag, Inspection Status, QC Decision Action |
| PPIC | Material, Available Qty, Reserved Qty, QC Pending Qty, Expiry Risk, FEFO Priority, Production Coverage Days, Shortage Flag |
| Production | Production Order, Required Material, Reserved Batch, Quantity to Use, Staging Status, Scan/Confirm Action |
| Dispatch | Finished Goods Batch, Available Qty, Release Status, Allocated Order, Shipment Status, Loading Action |
| HSE | Batch ID, Hazard Class, Location, Temperature Status, Incompatibility Alert, Incident Status |
| Supervisor | Batch ID, Material, Supplier, QC Status, Location, Inventory Status, Production Link, Alert Count, Last Action |
| Management | Material Category, Total Available, Total Reserved, Near Expiry Count, Rejection Rate, Stock Risk |

#### Production Orders Table

| Role | Columns to Show |
|---|---|
| PPIC | Order No, Demand Ref, Product, Quantity, Due Date, Material Readiness, Capacity Conflict, Status, Release Action |
| Warehouse | Order No, Product, Required Materials, Pick/Staging Status, Due Time, Staging Action |
| Production | Order No, Product, Quantity, Scheduled Time, Material Ready, Start/Pause/Complete Action |
| QC | Order No, Product, FG QC Required, QC Status, Inspection Action |
| Dispatch | Order No, Finished Goods Batch, Release Status, Dispatch Due Date, Shipment Link |
| Supervisor | Order No, Demand Ref, Status, Delay Risk, Material Risk, QC Risk, Owner, Last Update |
| Management | Planned vs Actual Output, Delay Count, Completion Rate, Yield Summary |

#### Alerts Table

| Role | Columns to Show |
|---|---|
| Warehouse | Severity, Alert Type, Affected Location, Affected Batch, Required Warehouse Action, Timer |
| QC | Severity, QC Alert Type, Batch, Inspection Delay/Failure Reason, Required QC Action |
| PPIC | Severity, Demand/Material/Production Risk, Affected Order, Shortage Qty, Required Planning Action |
| Production | Severity, Work Order, Delay/Material Issue, Required Production Action |
| Dispatch | Severity, Shipment, FG Release/Loading Issue, Required Dispatch Action |
| HSE | Severity, Hazard/Cold-chain Type, Location, Affected Batches, Corrective Action |
| Supervisor | Severity, Business Impact, Affected Process, Owner, Time Open, Escalation Action |
| Management | Critical Count, Area, Impact, Resolution Time, Trend |

---

### 8A.5 Role-Specific Action Buttons

| Role | Primary Actions to Show | Actions to Hide |
|---|---|---|
| Warehouse | Create Receiving, Generate QR, Confirm Storage, Move Stock, Stage Material, Confirm Loading | Approve QC, Create Forecast, Configure Users |
| QC | Start Inspection, Upload Image, Run AI QC, Approve, Reject, Quarantine, Request Retest | Create Receiving, Release Production, Ship Goods |
| PPIC | Create Demand, Import Forecast, Check Material Readiness, Create Production Order, Reserve Material, Release Plan | QC Approve, Warehouse Movement, Ship Goods |
| Production | Start Job, Pause Job, Confirm Material Receipt, Record Usage, Complete Job, Record Output | Change Demand, Approve QC, Modify Warehouse Location |
| Dispatch | Create Shipment, Pick FG, Confirm Loading, Mark Shipped, Mark Delivered | Modify QC, Create Production Order, Change Raw Material Inventory |
| HSE | Acknowledge Safety Alert, Create Incident, Record Corrective Action, Close Safety Case | Create Demand, Approve QC, Ship Goods |
| Supervisor | Approve Override, Escalate Alert, Close Exception, View Timeline, Export Report | Routine receiving/task input unless override needed |
| Admin | Create User, Assign Role, Configure Master Data, Configure Thresholds | Operational approvals unless also assigned Supervisor/QC role |
| Management | View Report, Export KPI, Open Traceability Summary | Create/update/approve operational records |

---

### 8A.6 Default Filters by Role

| Role | Default Data Filter |
|---|---|
| Warehouse | Show assigned warehouse tasks, today’s inbound, batches needing physical movement, open warehouse alerts |
| QC | Show batches with `qc_status = Pending / Under QC / Retest Required`, plus QC alerts |
| PPIC | Show demand with open planning status, production orders not closed, material shortages, near-expiry stock useful for FEFO |
| Production | Show released production orders assigned to the user/team or scheduled today |
| Dispatch | Show released finished goods and shipments planned/today/pending loading |
| HSE | Show open safety, hazard, cold-chain, and segregation alerts |
| Supervisor | Show all critical/high alerts, delayed tasks, exceptions, overrides, and end-to-end process health |
| Admin | Show system configuration and user/role records |
| Management | Show aggregated KPI and trend data only, not raw operational task lists by default |

---

### 8A.7 Page-Level UI Rules

1. If a user lacks create/update/approve permission, the page must be read-only and hide form controls.
2. If a user has read access only for dependency visibility, show summary cards instead of full operational forms.
3. Do not show all fields just because the user can read the collection.
4. Dangerous actions must require confirmation and reason: QC reject, quarantine release, inventory adjustment, production override, shipment cancellation, alert closure.
5. Supervisor can see broad operational context, but only Admin should configure users and master data.
6. Management should see aggregated data and drill-down summaries, not daily task execution screens.
7. For cross-role pages, use role-specific tabs. Example: Inventory page shows Warehouse columns for Warehouse, planning columns for PPIC, and risk columns for Supervisor.

---

### 8A.8 Kiro Acceptance Criteria for Role-Specific UI

- When logged in as Warehouse, the sidebar does not show PPIC demand forecast or QC approval pages.
- When logged in as PPIC, the inventory page shows planning-focused columns, not warehouse packaging and movement-entry fields.
- When logged in as QC, the QC decision buttons are visible, but production release and dispatch buttons are hidden.
- When logged in as Production, only released work orders and execution actions are shown.
- When logged in as Dispatch, only released finished goods can be selected for shipment.
- When logged in as Supervisor, the dashboard shows full-process health, alerts, exceptions, and batch timeline, not routine data-entry forms.
- When logged in as Management, dashboards show aggregated KPIs and export options, not operational edit buttons.
- If a user manually opens a route outside their role, DaaS/RBAC blocks restricted actions and the UI displays an unauthorized or read-only state.


---

## 9. Information Architecture and Routes

Use authenticated dashboard layout with role-aware navigation.

| Route | Page | Main Role |
|---|---|---|
| `/login` | Login | All |
| `/dashboard` | Role-aware landing dashboard | All |
| `/supervisor` | Supervisor Control Tower | Supervisor, Management |
| `/warehouse/receiving` | Receiving list and create form | Warehouse |
| `/warehouse/storage-tasks` | Approved batches awaiting placement | Warehouse |
| `/warehouse/locations` | Warehouse location map/list | Warehouse, HSE, Supervisor |
| `/qc/queue` | QC inspection queue | QC |
| `/qc/inspections/[id]` | QC inspection detail | QC, Supervisor |
| `/inventory` | Batch inventory table | Warehouse, PPIC, Supervisor |
| `/monitoring/cold-chain` | Sensor chart and cold-chain alerts | Warehouse, HSE, Supervisor |
| `/alerts` | Alert inbox | Assigned users, Supervisor |
| `/ppic/demand` | Demand records | PPIC |
| `/ppic/planning` | Planning dashboard | PPIC |
| `/production/orders` | Production work orders | Production, PPIC |
| `/production/orders/[id]` | Production execution detail | Production |
| `/finished-goods` | Finished goods inventory | QC, Dispatch, PPIC |
| `/dispatch/shipments` | Shipment list and create form | Dispatch |
| `/traceability/[batchId]` | Batch timeline | Supervisor, QC, PPIC |
| `/reports` | KPI reports | Supervisor, Management |
| `/admin/users` | User management | Admin |
| `/admin/master-data` | Material, location, threshold setup | Admin |

---

## 10. DaaS Collections and Data Model

Use DaaS collections, fields, relations, workflows, files, and activity logging. The data model below is the target schema for Kiro.

### 10.1 `suppliers`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | system |
| `supplier_code` | text | unique |
| `name` | text | required |
| `contact_name` | text | optional |
| `contact_email` | email | optional |
| `phone` | text | optional |
| `status` | enum | active, inactive |

### 10.2 `materials`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | system |
| `material_code` | text | unique |
| `name` | text | required |
| `category` | enum | fruit, botanical, extract, powder, solvent, packaging, other |
| `unit` | enum | kg, g, L, mL, drum, bag, box |
| `hazard_class` | enum | none, flammable, oxidizer, corrosive, irritant, cold_chain, other |
| `requires_cold_chain` | boolean | yes/no |
| `min_temp_c` | number | nullable |
| `max_temp_c` | number | nullable |
| `shelf_life_days` | number | optional |
| `qc_required` | boolean | default true |
| `status` | enum | active, inactive |

### 10.3 `finished_good_products`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | system |
| `product_code` | text | unique |
| `name` | text | required |
| `unit` | enum | kg, L, bottle, pack |
| `requires_fg_qc` | boolean | default true |
| `target_stock_qty` | number | for demand planning |
| `status` | enum | active, inactive |

### 10.4 `expected_deliveries`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | system |
| `expected_delivery_no` | text | unique |
| `supplier_id` | relation | suppliers |
| `material_id` | relation | materials |
| `expected_qty` | number | required |
| `expected_date` | date | required |
| `po_reference` | text | optional |
| `status` | enum | expected, arrived, cancelled |

### 10.5 `receiving_records`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | system |
| `receiving_no` | text | unique |
| `expected_delivery_id` | relation | nullable |
| `supplier_id` | relation | suppliers |
| `material_id` | relation | materials |
| `received_qty` | number | required |
| `unit` | text | copied from material |
| `arrival_time` | datetime | required |
| `delivery_note_no` | text | optional |
| `packaging_condition` | enum | good, damaged, leaking, incomplete |
| `receiver_user_id` | user relation | current user |
| `attachment_files` | file relation | COA/delivery note/photos |
| `notes` | textarea | optional |

### 10.6 `raw_material_batches`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | system |
| `batch_no` | text | generated, unique, e.g. RM-2026-0001 |
| `receiving_record_id` | relation | receiving_records |
| `supplier_id` | relation | suppliers |
| `material_id` | relation | materials |
| `quantity_received` | number | required |
| `quantity_available` | number | updated by movements/reservations |
| `unit` | text | required |
| `supplier_lot_no` | text | optional |
| `manufacture_date` | date | optional |
| `expiry_date` | date | required or generated from shelf life |
| `current_location_id` | relation | warehouse_locations, nullable |
| `qc_status` | enum | pending, under_qc, approved, rejected, quarantined, retest_required |
| `inventory_status` | enum | awaiting_qc, approved_for_storage, available, reserved, staged, consumed, expired, returned, disposed |
| `qr_code_value` | text | generated |
| `temperature_risk_status` | enum | normal, warning, breach |
| `created_by` | user relation | system/current user |

### 10.7 `qc_inspections`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | system |
| `inspection_no` | text | unique |
| `batch_id` | relation | raw_material_batches |
| `inspection_type` | enum | raw_material, finished_good |
| `inspector_user_id` | user relation | QC user |
| `started_at` | datetime | optional |
| `completed_at` | datetime | optional |
| `sample_qty` | number | optional |
| `visual_result` | enum | pass, review, fail |
| `color_result` | enum | pass, review, fail |
| `contamination_result` | enum | pass, review, fail |
| `manual_notes` | textarea | optional |
| `qc_images` | files | uploaded/captured images |
| `ai_score` | number | 0-100 |
| `ai_confidence` | number | 0-1 or 0-100 |
| `ai_detected_issues` | json/text | e.g. color mismatch, foreign matter |
| `ai_recommendation` | enum | pass, review, reject |
| `decision` | enum | approved, rejected, quarantined, retest_required |
| `decision_reason` | textarea | required for reject/quarantine/retest |
| `status` | enum/workflow | pending, sampling, in_progress, ai_flagged, passed, failed, retest_required, quarantined, closed |

### 10.8 `warehouse_locations`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | system |
| `location_code` | text | unique, e.g. CR-A-01 |
| `zone` | enum | quarantine, cold_room, dry_storage, hazardous, finished_goods, dispatch |
| `name` | text | required |
| `capacity_qty` | number | optional |
| `used_qty` | number | optional/computed |
| `allowed_hazard_classes` | multi-select/json | allowed classes |
| `min_temp_c` | number | nullable |
| `max_temp_c` | number | nullable |
| `status` | enum | empty, reserved, occupied, full, restricted, maintenance |

### 10.9 `inventory_movements`

Use movement records as the source of truth for inventory history.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | system |
| `movement_no` | text | unique |
| `batch_id` | relation | raw_material_batches or finished_goods_batches |
| `movement_type` | enum | receive, store, move, reserve, release_reservation, stage, issue_to_production, consume, adjust, dispose, ship |
| `from_location_id` | relation | nullable |
| `to_location_id` | relation | nullable |
| `quantity` | number | required |
| `unit` | text | required |
| `production_order_id` | relation | nullable |
| `shipment_id` | relation | nullable |
| `status` | enum | draft, pending_confirmation, completed, cancelled, discrepancy, adjusted |
| `performed_by` | user relation | current user |
| `reason` | textarea | required for adjust/cancel/discrepancy |

### 10.10 `sensor_devices`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | system |
| `device_code` | text | unique |
| `location_id` | relation | warehouse_locations |
| `sensor_type` | enum | temperature, humidity, combined |
| `status` | enum | active, inactive, maintenance |

### 10.11 `sensor_readings`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | system |
| `sensor_device_id` | relation | sensor_devices |
| `location_id` | relation | warehouse_locations |
| `temperature_c` | number | required for cold-chain demo |
| `humidity_pct` | number | optional |
| `reading_time` | datetime | required |
| `source` | enum | simulated, iot |

### 10.12 `alerts`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | system |
| `alert_no` | text | unique |
| `alert_type` | enum | qc_delay, qc_rejection, cold_chain_breach, low_stock, near_expiry, hazard_violation, production_delay, shipment_blocked |
| `severity` | enum | critical, high, medium, low |
| `title` | text | required |
| `description` | textarea | required |
| `affected_batch_id` | relation | nullable |
| `location_id` | relation | nullable |
| `assigned_role` | enum | warehouse, qc, ppic, production, dispatch, hse, supervisor |
| `status` | enum/workflow | open, acknowledged, in_progress, resolved, escalated |
| `acknowledged_by` | user relation | nullable |
| `resolved_by` | user relation | nullable |
| `resolution_note` | textarea | required when resolved |

### 10.13 `demand_records`

This is mandatory. PPIC cannot plan production from inventory alone.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | system |
| `demand_no` | text | unique |
| `demand_source` | enum | customer_order, sales_forecast, internal_stock_target, sample_request, replenishment_signal |
| `customer_or_reference` | text | optional |
| `product_id` | relation | finished_good_products |
| `quantity_required` | number | required |
| `required_date` | date | required |
| `priority` | enum | urgent, high, normal, low |
| `status` | enum | draft, confirmed, planned, fulfilled, cancelled |
| `created_by` | user relation | PPIC/Sales/Admin |
| `notes` | textarea | optional |

### 10.14 `production_orders`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | system |
| `production_order_no` | text | unique |
| `demand_record_id` | relation | demand_records, nullable |
| `product_id` | relation | finished_good_products |
| `planned_qty` | number | required |
| `planned_start` | datetime | required |
| `planned_end` | datetime | required |
| `priority` | enum | urgent, high, normal, low |
| `material_readiness_status` | enum | ready, shortage, qc_pending, expiry_risk |
| `status` | enum/workflow | draft, material_check, awaiting_approval, released, materials_reserved, staged, in_production, paused, completed, qc_pending, closed, cancelled |
| `created_by` | user relation | PPIC |
| `approved_by` | user relation | Supervisor/PPIC Lead nullable |
| `notes` | textarea | optional |

### 10.15 `material_reservations`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | system |
| `production_order_id` | relation | production_orders |
| `batch_id` | relation | raw_material_batches |
| `material_id` | relation | materials |
| `reserved_qty` | number | required |
| `unit` | text | required |
| `status` | enum | reserved, staged, consumed, released, cancelled |

### 10.16 `production_executions`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | system |
| `production_order_id` | relation | production_orders |
| `started_at` | datetime | optional |
| `completed_at` | datetime | optional |
| `operator_user_id` | user relation | production user |
| `actual_output_qty` | number | optional |
| `yield_pct` | number | optional |
| `loss_qty` | number | optional |
| `execution_notes` | textarea | optional |
| `status` | enum | not_started, running, paused, completed, cancelled |

### 10.17 `finished_goods_batches`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | system |
| `fg_batch_no` | text | generated unique |
| `production_order_id` | relation | production_orders |
| `product_id` | relation | finished_good_products |
| `quantity_produced` | number | required |
| `quantity_available` | number | required |
| `unit` | text | required |
| `fg_qc_status` | enum | pending, released, blocked |
| `current_location_id` | relation | warehouse_locations nullable |
| `status` | enum/workflow | produced, awaiting_qc, released, blocked, stored, allocated, picked, shipped, returned |
| `expiry_date` | date | optional |

### 10.18 `shipments`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | system |
| `shipment_no` | text | unique |
| `customer_or_destination` | text | required |
| `planned_ship_date` | date | required |
| `actual_ship_time` | datetime | optional |
| `status` | enum/workflow | planned, picking, ready_to_load, loaded, in_transit, delivered, failed_delayed, cancelled |
| `created_by` | user relation | Dispatch |
| `notes` | textarea | optional |

### 10.19 `shipment_items`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | system |
| `shipment_id` | relation | shipments |
| `finished_goods_batch_id` | relation | finished_goods_batches |
| `quantity` | number | required |
| `unit` | text | required |

---

## 11. Workflow / Lifecycle Requirements

Use DaaS workflows for status-heavy entities where possible.

### Raw Material Batch Lifecycle

`received → awaiting_qc → under_qc → approved_for_storage → stored → available → reserved → staged → consumed`

Exception states:

`rejected`, `quarantined`, `retest_required`, `expired`, `returned`, `disposed`

Rules:

- Batch cannot become available before QC approval.
- Batch cannot be reserved if rejected, quarantined, expired, or not available.
- Batch cannot be consumed unless linked to a production order.

### QC Inspection Lifecycle

`pending → sampling → in_progress → ai_flagged/review → passed/failed/retest_required/quarantined → closed`

Rules:

- AI recommendation is not the final decision.
- QC decision requires human action.
- Rejection/quarantine/retest requires reason.

### Alert Lifecycle

`open → acknowledged → in_progress → resolved`

Optional escalation:

`open → escalated → resolved`

Rules:

- Critical alerts must appear in Supervisor Control Tower.
- Resolution requires a note.

### Production Order Lifecycle

`draft → material_check → awaiting_approval → released → materials_reserved → staged → in_production → completed → qc_pending → closed`

Exception states:

`paused`, `cancelled`

Rules:

- Production order cannot be released without material readiness unless Supervisor override is logged.
- Reserved batches reduce available quantity.

### Finished Goods Lifecycle

`produced → awaiting_qc → released → stored → allocated → picked → shipped`

Exception states:

`blocked`, `returned`

Rules:

- Finished goods cannot be shipped if blocked or QC not released.

### Shipment Lifecycle

`planned → picking → ready_to_load → loaded → in_transit → delivered`

Exception states:

`failed_delayed`, `cancelled`

---

## 12. AI and Simulation Requirements

### 12.1 AI Visual QC MVP

Implement a simulated AI QC service suitable for demo.

Recommended implementation:

- Use file upload on QC inspection.
- Add a Next.js API route or service function: `/api/ai/qc-analyze`.
- Input: inspection ID, image file reference, material type.
- Output: `ai_score`, `ai_confidence`, `ai_detected_issues`, `ai_recommendation`.
- For MVP, return deterministic demo values using simple rules/random seed.
- Show an AI Recommendation Card on QC screen.

Acceptance:

- QC can upload an image.
- AI card returns score and recommendation.
- QC must still make final approve/reject/quarantine decision.

### 12.2 Storage Recommendation MVP

Implement rule-based recommendation.

Inputs:

- material hazard class;
- cold-chain requirement;
- location zone;
- location capacity;
- FEFO/expiry;
- restricted/maintenance status.

Output:

- recommended location;
- explanation;
- risk warning if no valid location.

Acceptance:

- Cold-chain material recommends cold room.
- Hazardous material avoids incompatible locations.
- Restricted/full locations are not recommended.

### 12.3 Cold-chain Simulation MVP

Implement simulated sensor readings.

Options:

- Seed sensor readings manually; or
- create a button “Simulate Temperature Breach”; or
- use a simple client/service generator.

Acceptance:

- Temperature chart displays readings.
- Breach creates alert.
- Affected location and batches are shown.
- Supervisor receives critical alert.

### 12.4 PPIC Demand Planning MVP

Demand data is mandatory.

PPIC must be able to create demand records with:

- source;
- product;
- quantity;
- due date;
- priority;
- customer/order reference;
- status.

Planning logic:

`Demand → finished goods check → raw material availability → QC status check → expiry risk check → production capacity check → production order/replenishment recommendation`

Acceptance:

- PPIC can create demand.
- System flags whether demand can be fulfilled.
- PPIC can convert demand into production order.

---

## 13. Page-Level Requirements

### 13.1 Supervisor Control Tower

Must show:

- inbound deliveries today;
- QC pending/failed/retest;
- warehouse storage tasks;
- cold-chain and hazard alerts;
- low-stock and near-expiry warnings;
- production orders by status;
- shipments by status;
- critical unresolved exceptions;
- batch traceability search.

Use cards, badges, charts, and CollectionList components.

### 13.2 Batch Timeline Page

Must show timeline events from DaaS records/activity:

- received;
- QC started/completed;
- AI QC result generated;
- stored/moved;
- alert generated/resolved;
- reserved for production;
- consumed;
- finished goods created;
- shipped.

This is the most important competition demo page.

### 13.3 Warehouse Receiving Page

Must allow:

- create receiving record;
- select supplier/material;
- enter quantity and delivery details;
- upload documents/photos;
- generate raw material batch;
- print/display QR value.

### 13.4 QC Queue and Inspection Page

Must allow:

- list pending inspections;
- start inspection;
- upload image;
- run AI analysis;
- enter manual results;
- approve/reject/quarantine/retest;
- require reason for exceptions.

### 13.5 Inventory Page

Must show:

- batch number;
- material;
- quantity available;
- status;
- location;
- expiry date;
- QC status;
- cold-chain risk;
- reservation status.

Filters:

- material;
- status;
- location;
- near expiry;
- QC status.

### 13.6 PPIC Demand and Planning Pages

Must allow:

- create demand record;
- see demand list by due date and priority;
- see material readiness;
- see finished goods availability;
- create production order;
- reserve materials;
- show shortage/QC delay/expiry conflicts.

### 13.7 Production Page

Must allow:

- view released production orders;
- view required materials;
- start job;
- record actual usage;
- complete job;
- create finished goods batch.

### 13.8 Dispatch Page

Must allow:

- create shipment;
- select released finished goods;
- block unreleased/blocked FG;
- confirm picking/loading/shipping;
- update shipment status.

---

## 14. Functional Requirements

### Authentication and RBAC

- Users must log in.
- Users must have role-based navigation.
- UI actions must respect DaaS permissions.
- Admin can manage users/roles if enabled by template.

### Receiving

- Warehouse creates receiving record.
- System creates raw material batch.
- Batch gets QR/barcode value.
- Batch enters Awaiting QC.
- QC receives task.

### QC

- QC sees inspection queue.
- QC uploads image.
- AI returns analysis.
- QC records inspection data.
- QC approves/rejects/quarantines/retests.
- Status updates batch.

### Warehouse

- Warehouse sees approved batches awaiting storage.
- System recommends location.
- Warehouse confirms actual placement.
- Inventory becomes available.
- Movement record is created.

### Monitoring and Alerts

- Sensor readings display as chart/list.
- Threshold breach creates alert.
- Alert assigned to relevant roles.
- Supervisor sees all critical alerts.

### Demand and PPIC

- PPIC creates demand records.
- System compares demand with FG stock, raw materials, QC status, expiry, capacity.
- PPIC creates production order.
- Materials are reserved.

### Production

- Production team sees released work orders.
- Production starts/completes job.
- Raw materials are consumed.
- Finished goods batch is created.

### Dispatch

- Dispatch creates shipment.
- Dispatch can only ship released finished goods.
- Shipment links to finished goods and traceability chain.

### Audit/Activity

- Use DaaS activity logging.
- Supervisor/Admin can view activity history.
- Activity must cover create/update/status transitions/approvals.

---

## 15. Buildpad Component Requirements

Use Buildpad components wherever possible:

| Need | Use |
|---|---|
| Collection tables | `CollectionList` |
| Forms | `CollectionForm` / `VForm` |
| Filters | `FilterPanel` |
| Inputs | `Input`, `Textarea`, `SelectDropdown`, `DateTime` |
| Files/images | `Upload`, `Files`, `FileImage` |
| Relations | `ListM2O`, `ListM2M`, `ListO2M` |
| Boolean/toggle | `Boolean`, `Toggle` |

Custom components are allowed for:

- dashboard cards;
- supervisor control tower layout;
- timeline visualization;
- AI recommendation card;
- sensor chart;
- role-based navigation;
- composite page layouts.

---

## 16. Implementation Plan for Kiro

### Phase 0 — Foundation

Deliverables:

- Bootstrap project with Buildpad CLI.
- Configure environment variables.
- Set app name: `AromeFlow AI`.
- Set authenticated layout and navigation.
- Configure Supabase auth and DaaS provider.
- Configure test infrastructure.
- Create `PHASES.md`.
- Validate `pnpm install`, `pnpm build`, and starter tests.

### Phase 1 — Data Foundation

Deliverables:

- Create DaaS collections listed in section 10.
- Configure relations.
- Configure RBAC roles.
- Configure lifecycle statuses/workflows.
- Seed demo data: suppliers, materials, products, locations, users, sensor devices.

### Phase 2 — Core UI

Deliverables:

- Role-aware dashboard layout.
- Receiving pages.
- QC queue and inspection page.
- Inventory page.
- Warehouse storage tasks.
- PPIC demand and planning pages.
- Production order page.
- Dispatch page.
- Supervisor control tower first version.

### Phase 3 — Business Logic

Deliverables:

- Receiving creates batch and QC task.
- QC decision updates batch status.
- Storage recommendation logic.
- Inventory movement and quantity updates.
- Demand readiness calculation.
- Production material reservation.
- Finished goods creation.
- Shipment validation.

### Phase 4 — Relations and Traceability

Deliverables:

- Batch timeline page.
- Link raw material → production order → finished goods → shipment.
- Activity/audit viewer.
- File attachments for COA/QC images.
- Related lists on detail pages.

### Phase 5 — Polish, Tests, and Demo Readiness

Deliverables:

- Playwright E2E tests for full demo flow.
- Error states and empty states.
- Accessibility check.
- Dashboard visual polish.
- Seed-data reset script if possible.
- README demo instructions.
- Amplify build validation.

---

## 17. Test Requirements

Use Playwright for E2E and Vitest for utilities/business logic.

### E2E Tests

1. Warehouse can receive raw material and generate batch.
2. QC can inspect batch, run AI analysis, and approve.
3. Warehouse can store approved batch using recommendation.
4. Cold-chain breach creates alert.
5. PPIC can create demand and production order.
6. Production can consume material and create finished goods.
7. Dispatch can ship released finished goods.
8. Supervisor can open traceability timeline.
9. User without permission cannot approve QC.
10. Unreleased finished goods cannot be shipped.

### Unit Tests

- storage recommendation rules;
- demand readiness calculation;
- material reservation eligibility;
- status transition guards;
- cold-chain alert severity logic.

---

## 18. Seed Data for Demo

Create these demo records:

### Users

- `warehouse@sima.test` — Warehouse Operator
- `qc@sima.test` — QC
- `ppic@sima.test` — PPIC
- `production@sima.test` — Production Team
- `dispatch@sima.test` — Dispatch
- `hse@sima.test` — HSE
- `supervisor@sima.test` — Supervisor
- `admin@sima.test` — Admin

### Materials

| Material | Type | Cold-chain | Hazard | Shelf Life |
|---|---|---|---|---|
| Fresh Citrus Peel | Fruit/Botanical | Yes | None | 14 days |
| Vanilla Botanical Extract | Extract | Yes | Irritant | 90 days |
| Ginger Powder | Powder | No | None | 180 days |
| Solvent Blend A | Solvent | No | Flammable | 365 days |

### Locations

| Location | Zone | Constraint |
|---|---|---|
| QR-01 | Quarantine | Awaiting QC only |
| CR-A-01 | Cold Room | -4°C to 20°C |
| DRY-B-01 | Dry Storage | Non-cold-chain |
| HAZ-C-01 | Hazardous | Flammable/controlled |
| FG-D-01 | Finished Goods | Released FG |
| DSP-01 | Dispatch | Ready to ship |

### Finished Goods Products

- Citrus Natural Extract 5L
- Ginger Powder Extract 1kg
- Vanilla Aroma Concentrate 1L

### Demand Records

- Customer Order: Citrus Natural Extract 5L, qty 100, due in 7 days, high priority.
- Forecast: Ginger Powder Extract 1kg, qty 50, due in 14 days, normal priority.

---

## 19. Acceptance Criteria

The MVP is complete when:

- A user can log in by role.
- Warehouse can receive raw material and create batch.
- Batch appears in QC queue.
- QC can upload image and receive AI recommendation.
- QC can approve/reject with status update.
- Warehouse can confirm storage based on recommendation.
- Inventory shows available quantity and location.
- Cold-chain alert can be simulated and appears in Supervisor dashboard.
- PPIC can create demand data and production order.
- System reserves only approved available materials.
- Production can consume reserved material and create finished goods.
- Dispatch can ship only released finished goods.
- Supervisor can view full traceability timeline.
- DaaS activity/audit logs show critical actions.
- Playwright demo-flow test passes.
- `pnpm build` passes.

---

## 20. Competition Pitch Alignment

The website should visually prove these value propositions:

1. **Integrated operations** — one system connects warehouse, QC, PPIC, production, and dispatch.
2. **AI-assisted QC** — computer vision supports faster, more consistent inspection.
3. **AI storage intelligence** — system recommends safer placement and prevents hazard/cold-chain mistakes.
4. **Real-time alerts** — supervisors see critical issues before quality is damaged.
5. **Demand-driven PPIC** — production plans start from demand, not only available stock.
6. **Traceability** — every batch can be traced from raw-material receiving to finished-goods shipment.
7. **Feasible MVP** — AI and IoT can be simulated while the workflow and data model are realistic.

---

## 21. Final Build Priority

Kiro should build in this order:

1. Foundation/auth/RBAC.
2. Core collections and seed data.
3. Receiving → QC → storage vertical slice.
4. Inventory and movement tracking.
5. Cold-chain alert simulation.
6. PPIC demand and production order.
7. Production execution and finished goods.
8. Dispatch.
9. Supervisor control tower and traceability timeline.
10. Tests, polish, and demo script.

Do not start with every module at once. Build one thin working vertical slice first, then expand.

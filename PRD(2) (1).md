# PRD: Sigma Arome Smart Operations & IoT QC Platform

**Version:** 2.0
**Format:** Kiro-ready PRD
**Architecture Style:** Microservices-oriented modular monorepo for MVP
**Target:** Hackathon / competition prototype using the provided `test-starter.zip` Kiro template
**Product:** Website-based smart operations platform for natural extract manufacturing
**Source Direction:** Based on your Sigma Arome smart operations, IoT QC, warehouse, production, dashboard, RBAC, and traceability prompt. 

---

# 1. Executive Summary

Sigma Arome needs a web-based smart operations system that improves visibility and control across raw material receiving, QC, warehouse storage, cold-chain monitoring, production, finished goods release, shipping, and auditability.

The product should not be positioned as a fully automated factory. It should be positioned as a **Smart Operations Control Tower** where IoT and computer vision support human decisions.

The MVP will be built as a **modular monorepo** using the Kiro starter template, but the PRD will define service boundaries in a microservices-friendly way. This allows the team to build quickly for the hackathon while still presenting a scalable architecture.

The system will support role-specific dashboards and role-specific UI views. PPIC, Warehouse, QC, Manager, Production, Maintenance, Auditor, and Admin may read some of the same underlying records, but they should not see the same screens, columns, filters, or action buttons.

---

# 2. Product Vision

Create a practical, auditable smart operations website that gives Sigma Arome one source of truth for:

* Raw material receiving.
* Batch ID generation.
* QC sampling and inspection.
* Computer vision-assisted QC review.
* QC approval, rejection, or hold.
* Smart warehouse storage assignment.
* Cold-chain and warehouse IoT monitoring.
* Alert handling.
* Production scheduling.
* Raw material issuance.
* Production execution.
* Finished goods QC.
* Shipping readiness and dispatch.
* Role-based dashboards.
* Audit trail and traceability.

The product should feel realistic for a natural extract manufacturer serving F&B, cosmetics, and wellness customers.

---

# 3. Problem Statement

Sigma Arome currently faces operational risks caused by fragmented systems, spreadsheet-based storage tracking, manual QC bottlenecks, cold-chain monitoring gaps, manual batch movement logging, and unclear production visibility.

The current process creates these problems:

| Problem                              | Business Impact                                                    |
| ------------------------------------ | ------------------------------------------------------------------ |
| Manual QC and fragmented logs        | Slow release, inconsistent inspection records                      |
| Spreadsheet-based warehouse tracking | Location errors, poor FEFO control, hazard conflict risk           |
| Cold-chain issues detected late      | Product quality and compliance risk                                |
| Poor batch traceability              | Hard to trace raw material to finished goods and customer shipment |
| No shared operational dashboard      | Managers cannot quickly see bottlenecks                            |
| Manual movement logging              | Missing or inaccurate batch history                                |
| No strong role separation            | Fraud, mistake, and compliance risk                                |
| No structured audit log              | Hard to prove who made critical decisions                          |

---

# 4. Goals and Non-Goals

## 4.1 Product Goals

| Goal                       | Description                                                                                      | Success Indicator                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Centralize operations      | Create one website for PPIC, Warehouse, QC, Production, Maintenance, Manager, Auditor, and Admin | Users can complete the end-to-end batch flow in one platform        |
| Improve batch traceability | Track raw material batch from arrival to finished goods and shipping                             | Batch detail page shows full movement and genealogy                 |
| Improve QC visibility      | Show QC queue, CV result, QC decision, and status history                                        | QC Staff can approve, reject, or hold with required notes           |
| Improve warehouse control  | Recommend storage based on hazard, cold-chain, FEFO, and capacity                                | System generates storage recommendation before putaway              |
| Monitor cold-chain risk    | Simulate or ingest IoT sensor readings                                                           | Alerts trigger when temperature exceeds range                       |
| Support role-specific UI   | Show each role only the data and actions relevant to their work                                  | PPIC, Warehouse, QC, and Manager dashboards are different           |
| Enforce release controls   | Prevent production or shipping from using unreleased batches                                     | System blocks invalid material issue or dispatch                    |
| Enable auditability        | Log critical actions and decisions                                                               | Audit log records who, what, when, old value, new value, and reason |

## 4.2 Non-Goals for MVP

| Non-Goal                            | Reason                                               |
| ----------------------------------- | ---------------------------------------------------- |
| Full ERP replacement                | Too broad for hackathon                              |
| Full MES replacement                | MVP only needs basic production tracking             |
| Full LIMS implementation            | QC parameter entry is enough for prototype           |
| Real hardware dependency            | Sensor data should be simulated for demo reliability |
| Fully trained computer vision model | Controlled mock results are acceptable for MVP       |
| Accounting and costing              | Not required for the operations demo                 |
| Complex ML forecasting              | CSV/mock forecast is enough                          |

---

# 5. Target Users and Personas

## 5.1 Admin

**Objective:** Configure the system.

**Needs:**

* Manage users.
* Manage roles and permissions.
* Manage master data.
* Manage hazard rules.
* Manage storage policies.
* View audit logs.

**Should not be default actor for:**

* QC approval.
* Warehouse putaway.
* Production completion.
* Shipping dispatch.

---

## 5.2 Manager / Plant Head

**Objective:** Monitor plant performance and approve exceptions.

**Needs:**

* See cross-functional KPIs.
* Monitor QC bottlenecks.
* Monitor rejected and hold batches.
* Monitor cold-chain risk.
* Monitor production schedule adherence.
* View batch traceability.
* Approve high-risk exceptions.

---

## 5.3 PPIC Staff

**Objective:** Plan demand, purchasing, production, and shipping.

**Needs:**

* Create demand forecast.
* Create purchase order.
* Check material availability.
* Create production schedule.
* Create shipping schedule.
* See inventory from planning perspective.

**PPIC should not see everything Warehouse sees.**

PPIC needs availability, shortage risk, reserved quantity, production readiness, and shipping readiness. PPIC does not need detailed rack/bin operational tasks unless relevant to schedule risk.

---

## 5.4 Warehouse Operator

**Objective:** Execute physical movement of goods.

**Needs:**

* Receive raw materials.
* Generate batch ID.
* Confirm putaway.
* View warehouse map.
* Handle warehouse alerts.
* Issue raw materials to production.
* Store finished goods.
* Dispatch shipments.

**Warehouse should not approve QC.**

Warehouse may read QC status, but cannot edit QC results or release batches.

---

## 5.5 QC Staff

**Objective:** Inspect and release or block materials and finished goods.

**Needs:**

* View QC queue.
* Create sample record.
* Upload/review inspection image.
* Review computer vision result.
* Enter QC parameters.
* Approve, reject, or hold batch.
* Release finished goods.

**QC should not edit receiving quantity or warehouse location.**

---

## 5.6 Production Staff

**Objective:** Execute production orders.

**Needs:**

* View assigned production orders.
* Confirm material received from warehouse.
* Log production stages.
* Record consumption.
* Record output and yield.
* Create finished goods batch.

**Production should not release finished goods QC.**

---

## 5.7 Maintenance / IoT Technician

**Objective:** Maintain sensor reliability.

**Needs:**

* View sensor status.
* View calibration due dates.
* Resolve sensor offline alerts.
* Record maintenance actions.
* Validate or override faulty sensor readings with reason.

---

## 5.8 Auditor / Viewer

**Objective:** Review records without editing.

**Needs:**

* Read-only batch traceability.
* Read-only dashboards.
* Audit log search.
* Export reports if allowed.

---

# 6. Architecture Direction

## 6.1 Recommended Architecture

The product should use a **microservices-oriented modular monorepo**.

For the hackathon MVP, implement one deployable web application with internal service modules. For the future roadmap, split service modules into independently deployable microservices.

## 6.2 MVP Architecture

```text
Kiro Starter Project
│
├── Web App / UI
│   ├── Role dashboards
│   ├── Receiving screens
│   ├── QC screens
│   ├── Warehouse map
│   ├── IoT monitoring
│   ├── Alert center
│   ├── Production screens
│   ├── Shipping screens
│   └── Admin screens
│
├── API Layer
│   ├── Auth and RBAC API
│   ├── Master Data API
│   ├── Batch API
│   ├── QC API
│   ├── Warehouse API
│   ├── IoT API
│   ├── Alert API
│   ├── Production API
│   ├── Shipping API
│   └── Audit API
│
├── Service Modules
│   ├── auth-rbac-service
│   ├── master-data-service
│   ├── receiving-batch-service
│   ├── qc-service
│   ├── computer-vision-service
│   ├── warehouse-inventory-service
│   ├── iot-telemetry-service
│   ├── alert-service
│   ├── production-service
│   ├── shipping-service
│   ├── dashboard-reporting-service
│   └── audit-log-service
│
└── Shared Database for MVP
    ├── auth tables
    ├── master data tables
    ├── batch tables
    ├── qc tables
    ├── warehouse tables
    ├── iot tables
    ├── alert tables
    ├── production tables
    ├── shipping tables
    └── audit tables
```

## 6.3 Future Production Architecture

```text
Frontend
  ↓
API Gateway / BFF
  ↓
Independent Services
  ├── Auth & RBAC Service
  ├── Master Data Service
  ├── Receiving & Batch Service
  ├── QC Service
  ├── Computer Vision Service
  ├── Warehouse & Inventory Service
  ├── IoT Telemetry Service
  ├── Alert Service
  ├── Production Service
  ├── Shipping Service
  ├── Dashboard / Reporting Service
  └── Audit Log Service

Event Bus
  ├── BatchCreated
  ├── QCDecisionRecorded
  ├── StorageAssigned
  ├── InventoryMoved
  ├── SensorAnomalyDetected
  ├── AlertCreated
  ├── ProductionCompleted
  ├── FinishedGoodsReleased
  └── ShipmentDispatched
```

---

# 7. Service Boundaries

| Service                       | Responsibility                                                    | MVP Implementation     |
| ----------------------------- | ----------------------------------------------------------------- | ---------------------- |
| Auth & RBAC Service           | Users, roles, permissions, login, page access, action access      | Internal module        |
| Master Data Service           | Suppliers, customers, materials, products, hazards, storage rules | Internal module        |
| Receiving & Batch Service     | PO receiving, receipt, batch ID, batch status                     | Internal module        |
| QC Service                    | QC queue, sampling, parameter results, approval/reject/hold       | Internal module        |
| Computer Vision Service       | Image upload, mock CV result, defect score, recommendation        | Mock module            |
| Warehouse & Inventory Service | Storage assignment, putaway, inventory lots, warehouse map        | Internal module        |
| IoT Telemetry Service         | Simulated sensor readings, sensor status, temperature range       | Mock/simulation module |
| Alert Service                 | Create, assign, acknowledge, resolve alerts                       | Internal module        |
| Production Service            | Production schedule, material issue, execution, consumption       | Internal module        |
| Shipping Service              | Shipping schedule, dispatch, shipping readiness                   | Internal module        |
| Dashboard Service             | KPI calculation and role-specific dashboard data                  | Internal module        |
| Audit Log Service             | Immutable log for critical actions                                | Shared internal module |

---

# 8. Event Model

The system should treat major status changes as events.

| Event                          | Trigger                           | Produced By        | Consumed By                        |
| ------------------------------ | --------------------------------- | ------------------ | ---------------------------------- |
| `RawMaterialReceived`          | Warehouse receives PO             | Receiving Service  | Batch, Audit, Dashboard            |
| `BatchCreated`                 | Batch ID generated                | Batch Service      | QC, Audit, Dashboard               |
| `QCInspectionStarted`          | QC opens inspection               | QC Service         | Dashboard, Audit                   |
| `CVResultGenerated`            | Image is uploaded or mock CV runs | CV Service         | QC, Audit                          |
| `QCDecisionRecorded`           | QC approves/rejects/holds         | QC Service         | Warehouse, Alert, Dashboard, Audit |
| `StorageRecommendationCreated` | Approved batch needs location     | Warehouse Service  | Warehouse, Dashboard, Audit        |
| `PutawayConfirmed`             | Warehouse confirms storage        | Warehouse Service  | Inventory, Dashboard, Audit        |
| `SensorReadingRecorded`        | IoT reading created               | IoT Service        | Alert, Dashboard                   |
| `SensorAnomalyDetected`        | Reading outside range             | IoT Service        | Alert Service                      |
| `AlertCreated`                 | Rule violation occurs             | Alert Service      | Dashboard, Audit                   |
| `ProductionOrderCreated`       | PPIC creates schedule             | Production Service | Warehouse, Dashboard, Audit        |
| `MaterialIssued`               | Warehouse issues material         | Warehouse Service  | Production, Audit                  |
| `ProductionCompleted`          | Production records output         | Production Service | FG QC, Dashboard, Audit            |
| `FinishedGoodsReleased`        | QC approves finished goods        | QC Service         | Shipping, Dashboard, Audit         |
| `ShipmentDispatched`           | Warehouse dispatches goods        | Shipping Service   | Dashboard, Audit                   |

---

# 9. MVP Scope

## 9.1 Must-Have MVP

| Feature                      | Description                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| Role-based login             | Users log in as Admin, Manager, PPIC, Warehouse, QC, Production, Maintenance, or Auditor |
| Role-specific dashboard      | Each role sees different cards, tables, and actions                                      |
| Raw material receiving       | Warehouse receives material against PO or mock PO                                        |
| Batch ID generation          | System generates unique batch ID                                                         |
| QC queue                     | QC sees batches pending inspection                                                       |
| QC inspection detail         | QC enters sampling and inspection result                                                 |
| Computer vision simulation   | Mock result shows defect type, confidence, recommendation                                |
| QC decision                  | QC approves, rejects, or holds batch                                                     |
| Smart storage recommendation | System recommends location based on temperature, hazard, FEFO, capacity                  |
| Warehouse map                | Warehouse sees zones, locations, occupancy, and tasks                                    |
| Simulated IoT monitoring     | Temperature/humidity readings by zone                                                    |
| Alert center                 | Alerts for temperature anomaly, near expiry, hazard conflict, QC hold                    |
| Production schedule          | PPIC creates production order                                                            |
| Material issue               | Warehouse issues approved material to production                                         |
| Production execution         | Production logs stages, consumption, output                                              |
| Finished goods QC            | QC releases finished goods                                                               |
| Shipping schedule            | PPIC schedules shipment for approved finished goods                                      |
| Dispatch                     | Warehouse confirms outbound shipment                                                     |
| Manager dashboard            | Cross-functional KPI dashboard                                                           |
| Audit log                    | Critical events are logged                                                               |

## 9.2 Nice-to-Have

| Feature               | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| QR/barcode scanning   | Simulated with batch ID input or browser camera              |
| COA document upload   | Mock document upload                                         |
| Batch genealogy graph | Visual raw material → production → finished goods → shipment |
| Notification mock     | Email/WhatsApp/SMS mock in UI                                |
| Sensor health page    | Offline, active, calibration due                             |
| CSV forecast import   | Upload mock demand data                                      |

## 9.3 Future Version

| Feature                    | Description                                      |
| -------------------------- | ------------------------------------------------ |
| Real IoT integration       | MQTT/gateway ingestion                           |
| Real CV model              | Trained on Sigma Arome-specific inspection images |
| ERP integration            | PO, inventory, finance, invoice sync             |
| Mobile warehouse app       | Scanner-first warehouse workflow                 |
| LIMS integration           | Full lab testing workflow                        |
| Supplier quality analytics | Rejection trends, supplier scorecard             |
| Advanced forecasting       | ML demand planning                               |
| CAPA/deviation workflow    | Compliance improvement loop                      |

---

# 10. End-to-End Product Flow

## 10.1 Planning

1. PPIC enters or uploads demand forecast.
2. System estimates raw material requirements using BOM.
3. PPIC creates purchase order.
4. Manager can view demand and shortage risk.

## 10.2 Receiving

1. Warehouse receives raw material.
2. Warehouse enters PO, supplier, material, quantity, delivery note, COA status, expiry date.
3. System creates receipt.
4. System generates batch ID.
5. Batch status becomes `QC Pending`.
6. Location becomes `Receiving / Quarantine`.

## 10.3 QC

1. QC sees batch in QC queue.
2. QC creates sample record.
3. QC uploads/selects inspection image.
4. Computer Vision Service returns simulated defect score.
5. QC enters manual QC parameters.
6. QC decides: Approved, Rejected, or Hold.
7. System logs decision.
8. Approved batch moves to storage assignment.
9. Rejected/Hold batch remains in quarantine and triggers alert.

## 10.4 Warehouse Storage

1. System recommends storage slot.
2. Recommendation checks hazard, cold-chain, capacity, FEFO, and zone rules.
3. Warehouse confirms putaway.
4. Batch status becomes `Available`.
5. Inventory lot is created.

## 10.5 IoT and Alerts

1. Simulated IoT readings are generated by zone.
2. System compares readings to allowed temperature/humidity range.
3. If out of range, alert is created.
4. Assigned role acknowledges alert.
5. Assigned role resolves alert with action note.
6. Audit log records the alert lifecycle.

## 10.6 Production

1. PPIC creates production order.
2. System checks approved material availability.
3. Warehouse issues material to production.
4. Production logs process stages.
5. Production records consumption and output.
6. System creates finished goods batch.

## 10.7 Finished Goods and Shipping

1. QC inspects finished goods.
2. QC approves, rejects, or holds finished goods.
3. PPIC schedules shipment only for approved finished goods.
4. Warehouse dispatches shipment.
5. Manager can see full traceability.

---

# 11. Role-Based UI and Data Visibility

This is a core requirement.

The system must not only control CRUD access. It must also control:

* Which dashboard widgets are visible.
* Which records are shown.
* Which columns are shown.
* Which buttons are shown.
* Which details are masked or summarized.
* Which workflow actions are available.
* Which alerts are assigned.
* Which exports are allowed.

## 11.1 Role-Based UI Rules

| Rule ID  | Requirement                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------- |
| RBUI-001 | The system shall render different dashboard cards for each role.                                   |
| RBUI-002 | The system shall render different table columns for each role, even on shared data modules.        |
| RBUI-003 | The system shall filter records based on operational relevance, not only database read permission. |
| RBUI-004 | The system shall hide action buttons that the current role cannot perform.                         |
| RBUI-005 | The system shall show workflow tasks based on the role’s operational responsibility.               |
| RBUI-006 | The system shall show sensitive QC, supplier, and audit details only to authorized roles.          |
| RBUI-007 | The system shall display read-only summary views for roles that need awareness but not detail.     |
| RBUI-008 | The system shall prevent direct URL access to unauthorized screens.                                |
| RBUI-009 | The system shall log attempted unauthorized actions.                                               |
| RBUI-010 | The system shall apply both frontend visibility control and backend authorization.                 |

## 11.2 PPIC vs Warehouse Example

| Data Area          | PPIC Staff UI                                                              | Warehouse Operator UI                                        |
| ------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Inventory          | Planning view: available stock, reserved stock, shortage risk              | Physical view: exact location, rack, bin, putaway status     |
| Batch list         | Batch status, material availability, expiry risk                           | Batch movement tasks, receiving status, location scan        |
| QC status          | Summary only: Pending, Approved, Hold, Rejected                            | Summary only: can move only if Approved                      |
| QC parameters      | Hidden or summary                                                          | Hidden or summary                                            |
| Supplier           | Supplier name and PO status                                                | Supplier name, delivery note, received quantity              |
| Warehouse location | Zone-level availability                                                    | Exact rack/bin/slot                                          |
| Production         | Material readiness and schedule impact                                     | Picking and issue task                                       |
| Actions            | Create PO, create production schedule, reserve material, schedule shipment | Receive, putaway, issue, dispatch                            |
| Alerts             | Material shortage, shipping blocked, near expiry                           | Temperature, misplaced batch, putaway, dispatch, near expiry |

## 11.3 Role-Specific Dashboard Widgets

| Widget                 |    Admin | Manager |     PPIC | Warehouse |       QC | Production | Maintenance | Auditor |
| ---------------------- | -------: | ------: | -------: | --------: | -------: | ---------: | ----------: | ------: |
| Open alerts            |        R |       R |        R |         R |        R |          R |           R |       R |
| QC pending             |        R |       R |  Summary |   Summary | Detailed |          X |           X |       R |
| Receiving tasks        |        X | Summary |  Summary |  Detailed |        X |          X |           X |       R |
| Putaway tasks          |        X | Summary |        X |  Detailed |        X |          X |           X |       R |
| Production schedule    |        X |       R | Detailed |   Summary |  Summary |   Detailed |           X |       R |
| Material shortage risk |        X |       R | Detailed |   Summary |        X |    Summary |           X |       R |
| Sensor status          |        R |       R |        X |   Summary |        X |          X |    Detailed |       R |
| Audit log              |        R |       R |        X |         X |        X |          X |           X |       R |
| User management        | Detailed |       X |        X |         X |        X |          X |           X |       X |

## 11.4 Role-Specific Batch Detail Views

| Field / Section      | Admin | Manager |      PPIC | Warehouse | QC | Production |        Maintenance | Auditor |
| -------------------- | ----: | ------: | --------: | --------: | -: | ---------: | -----------------: | ------: |
| Batch ID             |     R |       R |         R |         R |  R |          R |                  R |       R |
| Material name        |     R |       R |         R |         R |  R |          R |                  R |       R |
| Supplier             |     R |       R |         R |         R |  R |          X |                  X |       R |
| Received quantity    |     R |       R |         R |         R |  R |          R |                  X |       R |
| Exact warehouse slot |     R |       R | Zone only |         R |  R |          X | R if sensor-linked |       R |
| QC summary status    |     R |       R |         R |         R |  R |          R |                  X |       R |
| QC parameter details |     R |       R |   Summary |         X |  R |          X |                  X |       R |
| CV result details    |     R |       R |   Summary |         X |  R |          X |                  X |       R |
| Movement history     |     R |       R |         R |         R |  R |          R |                  X |       R |
| Sensor history       |     R |       R |         X |         R |  X |          X |                  R |       R |
| Audit history        |     R |       R |         X |         X |  X |          X |                  X |       R |

---

# 12. RBAC Matrix

Legend:

* C = Create
* R = Read
* U = Update
* D = Delete
* A = Approve
* X = No Access

| Module                 |   Admin | Manager |    PPIC | Warehouse |      QC | Production | Maintenance | Auditor |
| ---------------------- | ------: | ------: | ------: | --------: | ------: | ---------: | ----------: | ------: |
| Demand Forecast        |       R |       R |   C/R/U |         X |       X |          R |           X |       R |
| Purchase Order         |       R |       R |   C/R/U |         R |       R |          X |           X |       R |
| Raw Material Arrival   |       R |       R |       R |     C/R/U |       R |          X |           X |       R |
| Batch Master           |       R |       R |       R |     C/R/U |     R/U |          R |           X |       R |
| QC Inspection          |       R |       R |       R |         R |   C/R/U |          X |           X |       R |
| QC Decision            |       R |     R/A |       R |         R | C/R/U/A |          X |           X |       R |
| Computer Vision Result |       R |       R | Summary |         X |   C/R/U |          X |           X |       R |
| Warehouse Storage      |       R |       R |       R |     C/R/U |       R |          R |           X |       R |
| Inventory Lots         |       R |       R |       R |     C/R/U |       R |          R |           X |       R |
| IoT Monitoring         |       R |       R |       X |         R |       X |          X |       C/R/U |       R |
| Alert Management       |       R |     R/A |       R |       R/U |   R/U/A |        R/U |       C/R/U |       R |
| Production Schedule    |       R |     R/A |   C/R/U |         R |       R |          R |           X |       R |
| Material Issue         |       R |       R |       R |     C/R/U |       X |        R/U |           X |       R |
| Production Execution   |       R |       R |       R |         R |       R |      C/R/U |           X |       R |
| Finished Goods QC      |       R |     R/A |       R |         R | C/R/U/A |          R |           X |       R |
| Shipping Schedule      |       R |       R |   C/R/U |       R/U |       R |          X |           X |       R |
| Dispatch               |       R |       R |       R |     C/R/U |       X |          X |           X |       R |
| Dashboard / Analytics  |       R |       R |       R |         R |       R |          R |           R |       R |
| Master Data            | C/R/U/D |       R |       R |         R |       R |          R |           R |       R |
| User Management        | C/R/U/D |       X |       X |         X |       X |          X |           X |       X |
| Audit Log              |       R |       R |       X |         X |       X |          X |           X |       R |

---

# 13. Permission Restrictions

| Risk                                      | Restriction                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| Warehouse approving poor-quality material | Warehouse can view QC status but cannot approve QC                     |
| QC editing received quantity              | QC cannot edit PO, receipt quantity, or warehouse movement             |
| PPIC scheduling unreleased material       | Production schedule must check approved inventory                      |
| Production using held material            | Material issue must block Hold/Rejected batches                        |
| Shipping unreleased finished goods        | Dispatch must require Finished Goods QC Approved                       |
| Admin bypassing operational controls      | Admin manages configuration but is not default operational approver    |
| Fraudulent status changes                 | Critical status changes require audit log                              |
| Silent override                           | Override requires reason, actor, timestamp, and permission             |
| Deleted traceability records              | Use soft delete or inactive status; never hard delete critical history |

---

# 14. Functional Requirements

## 14.1 Authentication and RBAC

| ID       | Requirement                                                              | Priority |
| -------- | ------------------------------------------------------------------------ | -------- |
| AUTH-001 | The system shall allow users to log in with role-based identity          | Must     |
| AUTH-002 | The system shall redirect users to their role-specific dashboard         | Must     |
| AUTH-003 | The system shall enforce backend permissions for every restricted action | Must     |
| AUTH-004 | The system shall hide unauthorized buttons and screens in the UI         | Must     |
| AUTH-005 | Admin shall be able to create, update, deactivate users                  | Must     |
| AUTH-006 | Admin shall assign roles to users                                        | Must     |
| AUTH-007 | Unauthorized access attempts shall be logged                             | Nice     |

## 14.2 Role-Specific Dashboard

| ID       | Requirement                                                                                     | Priority |
| -------- | ----------------------------------------------------------------------------------------------- | -------- |
| DASH-001 | Manager dashboard shall show cross-functional KPIs                                              | Must     |
| DASH-002 | PPIC dashboard shall show planning, shortage risk, production readiness, and shipping readiness | Must     |
| DASH-003 | Warehouse dashboard shall show receiving, putaway, movement, alert, and dispatch tasks          | Must     |
| DASH-004 | QC dashboard shall show QC queue, AI-flagged lots, hold lots, and FG QC pending                 | Must     |
| DASH-005 | Production dashboard shall show production orders, material readiness, WIP, and yield           | Must     |
| DASH-006 | Maintenance dashboard shall show sensor status, anomalies, and calibration due                  | Must     |
| DASH-007 | Auditor dashboard shall show read-only audit and traceability summary                           | Must     |

## 14.3 Receiving and Batch

| ID      | Requirement                                                                | Priority |
| ------- | -------------------------------------------------------------------------- | -------- |
| REC-001 | Warehouse shall create raw material receipt against PO or mock PO          | Must     |
| REC-002 | System shall validate supplier, material, quantity, expiry, and COA status | Must     |
| REC-003 | System shall generate unique batch ID                                      | Must     |
| REC-004 | New batch status shall default to QC Pending                               | Must     |
| REC-005 | New batch location shall default to Receiving / Quarantine                 | Must     |
| REC-006 | System shall log receiving action in audit log                             | Must     |

## 14.4 QC

| ID     | Requirement                                                | Priority |
| ------ | ---------------------------------------------------------- | -------- |
| QC-001 | QC Staff shall see QC Pending batches in QC queue          | Must     |
| QC-002 | QC Staff shall create sample record                        | Must     |
| QC-003 | QC Staff shall enter QC parameter results                  | Must     |
| QC-004 | QC Staff shall review CV result when image is available    | Must     |
| QC-005 | QC Staff shall approve, reject, or hold batch              | Must     |
| QC-006 | Reject/Hold decision shall require reason code and notes   | Must     |
| QC-007 | System shall prevent non-QC roles from making QC decisions | Must     |

## 14.5 Computer Vision

| ID     | Requirement                                                            | Priority |
| ------ | ---------------------------------------------------------------------- | -------- |
| CV-001 | QC Staff shall upload or select sample inspection image                | Must     |
| CV-002 | System shall display defect type, confidence score, and recommendation | Must     |
| CV-003 | CV result shall be marked as decision support only                     | Must     |
| CV-004 | CV result shall be stored with timestamp and model/rule version        | Nice     |
| CV-005 | Future version shall support real model inference                      | Future   |

## 14.6 Warehouse and Inventory

| ID     | Requirement                                                           | Priority |
| ------ | --------------------------------------------------------------------- | -------- |
| WH-001 | System shall recommend storage location for approved batch            | Must     |
| WH-002 | Recommendation shall consider temperature, hazard, FEFO, and capacity | Must     |
| WH-003 | Warehouse shall confirm putaway                                       | Must     |
| WH-004 | System shall block rejected batches from available storage            | Must     |
| WH-005 | Override shall require permission and reason                          | Nice     |
| WH-006 | Warehouse map shall show zones, slots, and occupancy                  | Must     |

## 14.7 IoT Monitoring

| ID      | Requirement                                                      | Priority |
| ------- | ---------------------------------------------------------------- | -------- |
| IOT-001 | System shall display simulated temperature and humidity readings | Must     |
| IOT-002 | System shall compare readings against zone thresholds            | Must     |
| IOT-003 | System shall create alert for temperature anomaly                | Must     |
| IOT-004 | Maintenance shall see sensor status and calibration due          | Nice     |
| IOT-005 | System shall support real IoT ingestion in future                | Future   |

## 14.8 Alert Management

| ID        | Requirement                                                                                                   | Priority |
| --------- | ------------------------------------------------------------------------------------------------------------- | -------- |
| ALERT-001 | System shall create alerts for temperature anomaly, near expiry, hazard conflict, QC hold, and shipping block | Must     |
| ALERT-002 | Assigned users shall acknowledge alerts                                                                       | Must     |
| ALERT-003 | Assigned users shall resolve alerts with action note                                                          | Must     |
| ALERT-004 | Critical alerts shall remain visible until resolved                                                           | Must     |
| ALERT-005 | Alert lifecycle shall be logged                                                                               | Must     |

## 14.9 Production

| ID       | Requirement                                             | Priority |
| -------- | ------------------------------------------------------- | -------- |
| PROD-001 | PPIC shall create production order                      | Must     |
| PROD-002 | System shall check approved material availability       | Must     |
| PROD-003 | Warehouse shall issue approved material to production   | Must     |
| PROD-004 | Production shall log process stages                     | Must     |
| PROD-005 | Production shall record material consumption and output | Must     |
| PROD-006 | System shall create finished goods batch                | Must     |

## 14.10 Finished Goods QC and Shipping

| ID       | Requirement                                                    | Priority |
| -------- | -------------------------------------------------------------- | -------- |
| FGQC-001 | QC shall inspect finished goods batch                          | Must     |
| FGQC-002 | QC shall approve, reject, or hold finished goods               | Must     |
| SHIP-001 | PPIC shall create shipping schedule                            | Must     |
| SHIP-002 | System shall block shipping unless FG QC is Approved           | Must     |
| SHIP-003 | Warehouse shall confirm dispatch                               | Must     |
| SHIP-004 | Dispatch shall record customer, batch, quantity, and timestamp | Must     |

## 14.11 Audit Log

| ID      | Requirement                                                                                          | Priority |
| ------- | ---------------------------------------------------------------------------------------------------- | -------- |
| AUD-001 | System shall log create, update, approve, reject, hold, override, issue, dispatch, and admin actions | Must     |
| AUD-002 | Audit log shall include user, action, entity, entity ID, old value, new value, timestamp, and reason | Must     |
| AUD-003 | Audit log shall be read-only                                                                         | Must     |
| AUD-004 | Auditor shall filter audit logs by user, batch, module, date, and action                             | Nice     |

---

# 15. EARS-Style Acceptance Requirements for Kiro

## 15.1 Batch Receiving

* **WHEN** a Warehouse Operator receives raw material, **THE SYSTEM SHALL** create a receipt record.
* **WHEN** a receipt is created, **THE SYSTEM SHALL** generate a unique batch ID.
* **WHEN** a batch is created, **THE SYSTEM SHALL** set status to `QC Pending`.
* **WHEN** the receiving quantity exceeds PO tolerance, **THE SYSTEM SHALL** flag a warning or hold condition.

## 15.2 QC Decision

* **WHEN** QC Staff opens a QC Pending batch, **THE SYSTEM SHALL** show sample details, COA status, CV result, and QC input fields.
* **WHEN** QC Staff selects Reject or Hold, **THE SYSTEM SHALL** require reason code and notes.
* **IF** the user is not QC Staff or authorized Manager, **THE SYSTEM SHALL NOT** allow QC approval.
* **WHEN** QC decision is saved, **THE SYSTEM SHALL** write an audit log.

## 15.3 Storage Assignment

* **WHEN** a batch is approved, **THE SYSTEM SHALL** recommend a storage location.
* **WHEN** storage is recommended, **THE SYSTEM SHALL** check temperature compatibility, hazard compatibility, FEFO, and capacity.
* **IF** no compatible location exists, **THE SYSTEM SHALL** create a storage exception alert.
* **WHEN** Warehouse confirms putaway, **THE SYSTEM SHALL** update inventory location.

## 15.4 IoT Alerts

* **WHEN** a sensor reading exceeds threshold, **THE SYSTEM SHALL** create an alert.
* **WHEN** an alert is created, **THE SYSTEM SHALL** assign it to the relevant role.
* **WHEN** an alert is resolved, **THE SYSTEM SHALL** require resolution note.
* **WHEN** an alert changes status, **THE SYSTEM SHALL** write an audit log.

## 15.5 Production and Shipping

* **WHEN** PPIC creates production order, **THE SYSTEM SHALL** check raw material availability.
* **IF** required material is not Approved and Available, **THE SYSTEM SHALL** block production start or require manager override.
* **WHEN** production is completed, **THE SYSTEM SHALL** create finished goods batch.
* **IF** finished goods QC is not Approved, **THE SYSTEM SHALL** block shipping.
* **WHEN** dispatch is confirmed, **THE SYSTEM SHALL** record customer, FG batch, quantity, and timestamp.

---

# 16. Database Entities

| Entity                 | Key Fields                                                                                | Relationships                 |
| ---------------------- | ----------------------------------------------------------------------------------------- | ----------------------------- |
| Users                  | user_id, name, email, role_id, status, last_login                                         | Belongs to Role               |
| Roles                  | role_id, role_name, description                                                           | Has many Users                |
| Permissions            | permission_id, role_id, module, action, data_scope                                        | Defines RBAC                  |
| Suppliers              | supplier_id, name, approval_status, rating, contact                                       | Linked to POs and receipts    |
| Customers              | customer_id, name, contact, address                                                       | Linked to shipping orders     |
| Raw Materials          | material_id, name, category, hazard_class_id, temp_min, temp_max, shelf_life_days         | Used in PO, batch, BOM        |
| Products               | product_id, name, category, storage_requirement                                           | Linked to BOM and FG batches  |
| Bill of Materials      | bom_id, product_id, material_id, required_qty                                             | Used for planning             |
| Purchase Orders        | po_id, supplier_id, material_id, ordered_qty, expected_date, status                       | Has receipts                  |
| Raw Material Receipts  | receipt_id, po_id, received_qty, delivery_note, coa_status, received_by, received_at      | Generates batch               |
| Batches                | batch_id, receipt_id, material_id, supplier_lot, expiry_date, status, current_location_id | Central traceability entity   |
| QC Inspections         | qc_id, batch_id, sample_id, inspection_type, status, inspector_id                         | Has results and CV            |
| QC Parameters          | parameter_id, material_id, name, min_limit, max_limit, method                             | Defines QC checklist          |
| QC Results             | result_id, qc_id, parameter_id, value, pass_fail, notes                                   | Linked to QC inspection       |
| CV Results             | cv_id, qc_id, image_url, defect_type, confidence_score, recommendation, model_version     | Supports QC decision          |
| Warehouse Locations    | location_id, zone, rack, bin, temp_zone, capacity, status                                 | Holds inventory               |
| Inventory Lots         | inventory_id, batch_id, location_id, quantity, reserved_qty, status                       | Tracks inventory              |
| Storage Rules          | rule_id, hazard_class_id, temp_min, temp_max, compatible_zone, segregation_rule           | Used by slotting              |
| Hazard Classes         | hazard_class_id, name, incompatible_with                                                  | Linked to materials           |
| IoT Sensors            | sensor_id, location_id, sensor_type, status, calibration_due_date                         | Produces readings             |
| Sensor Readings        | reading_id, sensor_id, value, unit, timestamp, status                                     | Triggers alerts               |
| Alerts                 | alert_id, type, severity, entity_type, entity_id, assigned_to, status, resolved_at        | Linked to events              |
| Production Orders      | production_order_id, product_id, planned_qty, planned_date, status                        | Consumes materials            |
| Material Issues        | issue_id, production_order_id, batch_id, quantity_issued, issued_by                       | Links warehouse to production |
| Material Consumption   | consumption_id, production_order_id, batch_id, quantity_used                              | Genealogy                     |
| Finished Goods Batches | fg_batch_id, production_order_id, product_id, quantity, status                            | Linked to FG QC               |
| Finished Goods QC      | fg_qc_id, fg_batch_id, result, inspector_id, release_status, notes                        | Controls shipping             |
| Shipping Orders        | shipping_id, customer_id, fg_batch_id, quantity, schedule_date, dispatch_status           | Outbound traceability         |
| Audit Logs             | audit_id, user_id, action, entity, entity_id, old_value, new_value, timestamp, reason     | Immutable audit trail         |

---

# 17. Process Input / Output / Logging

|  # | Process               | Actor         | Input                       | System Output    | Audit / Log        | Validation             | KPI                |
| -: | --------------------- | ------------- | --------------------------- | ---------------- | ------------------ | ---------------------- | ------------------ |
|  1 | Demand Forecast       | PPIC          | Product, period, demand qty | Forecast ID      | Forecast created   | Valid product/period   | Forecast demand    |
|  2 | Raw Material Ordering | PPIC          | Supplier, material, qty     | PO number        | PO created         | Approved supplier      | Open PO            |
|  3 | Raw Material Arrival  | Warehouse     | PO, qty, COA, delivery note | Receipt ID       | Receiving log      | PO match               | Incoming lots      |
|  4 | Batch Creation        | System        | Receipt data                | Batch ID         | Batch creation log | Unique ID              | New batches        |
|  5 | QC Sampling           | QC            | Batch, sample qty           | Sample ID        | Sampling log       | QC Pending only        | Samples pending    |
|  6 | CV Inspection         | QC/System     | Image                       | CV score/result  | CV result log      | Image exists           | AI flagged lots    |
|  7 | QC Validation         | QC            | QC parameter results        | QC result        | Inspection log     | Required params        | QC cycle time      |
|  8 | QC Decision           | QC            | Decision, reason            | Batch status     | Decision log       | Reason for Hold/Reject | Pass rate          |
|  9 | Storage Assignment    | System        | Batch, rules                | Recommended slot | Rule log           | Compatible slot        | Utilization        |
| 10 | Putaway               | Warehouse     | Batch, slot                 | Inventory lot    | Movement log       | Approved only          | Putaway completion |
| 11 | IoT Monitoring        | System        | Sensor reading              | Reading status   | Sensor log         | Range check            | Anomaly count      |
| 12 | Alert Handling        | Assigned user | Action note                 | Alert status     | Alert lifecycle    | Closure note           | Open alerts        |
| 13 | Production Scheduling | PPIC          | Product, qty, date          | Production order | Schedule log       | Material availability  | Schedule adherence |
| 14 | Material Issue        | Warehouse     | Batch, qty                  | Issue record     | Issue log          | Approved only          | Issue accuracy     |
| 15 | Production Execution  | Production    | Stage, consumption, output  | Production log   | Execution log      | Material issued        | Yield              |
| 16 | Finished Goods QC     | QC            | FG test results             | Release status   | FG QC log          | Params complete        | FG release rate    |
| 17 | FG Storage            | Warehouse     | FG batch, location          | FG inventory     | Putaway log        | FG approved            | FG inventory       |
| 18 | Shipping Schedule     | PPIC          | Customer, FG batch, date    | Shipping order   | Schedule log       | FG approved            | Shipping readiness |
| 19 | Dispatch              | Warehouse     | Shipment, qty               | Dispatch record  | Dispatch log       | Batch matches schedule | On-time dispatch   |
| 20 | Dashboard Reporting   | System        | Operational data            | KPI views        | Report access log  | Role scope             | KPI summary        |
| 21 | Admin Control         | Admin         | Users/rules/master data     | Config update    | Admin log          | Admin only             | Config changes     |
| 22 | Audit Logging         | System        | Critical action             | Audit record     | Immutable log      | Required fields        | Audit completeness |

---

# 18. Website Screens

| Screen               | Purpose                | Roles                           | Key Actions            | Key Data                  |
| -------------------- | ---------------------- | ------------------------------- | ---------------------- | ------------------------- |
| Login                | User authentication    | All                             | Login                  | Email, role               |
| Role Dashboard       | Role-specific overview | All                             | Open tasks             | KPIs, alerts, tasks       |
| Demand Forecast      | Plan demand            | PPIC, Manager                   | Create/upload forecast | Product, period, demand   |
| Purchase Orders      | Manage orders          | PPIC, Manager                   | Create/edit PO         | Supplier, material, qty   |
| Receiving            | Receive raw material   | Warehouse                       | Create receipt         | PO, COA, qty              |
| Batch Detail         | Trace one batch        | Relevant roles                  | View status/history    | QC, inventory, movement   |
| QC Queue             | Manage QC workload     | QC                              | Start inspection       | QC Pending batches        |
| QC Detail            | Record QC              | QC                              | Enter parameters       | Sample, COA, results      |
| CV Review            | Review AI result       | QC, Manager                     | Review recommendation  | Image, defect, confidence |
| QC Decision          | Release/block batch    | QC                              | Approve/reject/hold    | Result, reason            |
| Storage Assignment   | Assign location        | Warehouse                       | Confirm slot           | Suggested location        |
| Warehouse Map        | Visual warehouse       | Warehouse, Manager              | View occupancy         | Zone, rack, bin           |
| IoT Monitoring       | Monitor environment    | Warehouse, Maintenance, Manager | View readings          | Temp, humidity, sensor    |
| Alert Center         | Resolve exceptions     | Assigned roles                  | Acknowledge/resolve    | Severity, owner, status   |
| Production Schedule  | Plan production        | PPIC, Production, Manager       | Create order           | Product, qty, date        |
| Material Issue       | Issue material         | Warehouse, Production           | Issue batch            | Batch, qty, FEFO          |
| Production Execution | Track production       | Production                      | Log stages/output      | Status, yield             |
| Finished Goods QC    | Release FG             | QC                              | Approve/reject/hold    | FG batch, QC result       |
| Shipping Schedule    | Plan shipment          | PPIC, Warehouse                 | Schedule shipment      | Customer, FG batch        |
| Dispatch             | Ship goods             | Warehouse                       | Confirm dispatch       | Batch, qty, customer      |
| Reports              | Analyze operations     | Manager, Auditor                | Filter/export          | KPIs, traceability        |
| Admin Settings       | Configure system       | Admin                           | Manage users/rules     | Users, roles, master data |
| Audit Log            | Review actions         | Admin, Manager, Auditor         | Search/filter          | User, action, timestamp   |

---

# 19. Dashboard KPIs

## Manager

* Open alerts by severity.
* QC pending count.
* QC pass/reject rate.
* Quarantine lots.
* Rejected lots by supplier.
* Cold-chain anomaly count.
* Production schedule adherence.
* Raw material shortage risk.
* Finished goods readiness.
* Shipping readiness.

## PPIC

* Forecast vs available stock.
* Material shortage risk.
* Open purchase orders.
* Production orders by status.
* Material reservation status.
* Finished goods available.
* Shipping schedule readiness.

## Warehouse

* Receiving tasks pending.
* Putaway tasks pending.
* Warehouse utilization.
* Near-expiry lots.
* Misplaced batch alerts.
* Material issue tasks.
* Dispatch tasks today.

## QC

* QC pending lots.
* QC cycle time.
* AI-flagged lots.
* Hold lots awaiting decision.
* Rejected lots.
* Finished goods QC pending.

## Production

* Production orders today.
* Material readiness.
* Work in progress.
* Yield variance.
* Delayed production orders.

## Maintenance

* Offline sensors.
* Calibration due sensors.
* Temperature anomaly by zone.
* Sensor alert resolution time.

## Admin

* Active users.
* Role changes.
* Failed login attempts.
* Master data changes.
* Audit log activity.

## Auditor

* Audit events by module.
* Batch traceability completeness.
* Exception approvals.
* Rejected/held batch history.
* Dispatch compliance.

---

# 20. Alert Types

| Alert Type          | Trigger                                         | Severity   | Owner                   |
| ------------------- | ----------------------------------------------- | ---------- | ----------------------- |
| Temperature Anomaly | Reading outside allowed range                   | High       | Warehouse / Maintenance |
| Humidity Anomaly    | Humidity outside range                          | Medium     | Warehouse / Maintenance |
| Sensor Offline      | No reading for expected interval                | Medium     | Maintenance             |
| Calibration Due     | Calibration date approaching                    | Low/Medium | Maintenance             |
| Near Expiry         | Batch near expiry threshold                     | Medium     | Warehouse / PPIC        |
| Hazard Conflict     | Incompatible materials assigned near each other | High       | Warehouse / Manager     |
| QC Hold             | Batch placed on hold                            | Medium     | QC / Manager            |
| Material Shortage   | Production order lacks approved stock           | High       | PPIC                    |
| Shipping Blocked    | Shipment uses unreleased FG                     | High       | PPIC / Warehouse        |

---

# 21. Non-Functional Requirements

| Category             | Requirement                                                          |
| -------------------- | -------------------------------------------------------------------- |
| Usability            | Common role tasks should be reachable within 3 clicks from dashboard |
| Security             | Backend must enforce role permissions, not only frontend hiding      |
| Performance          | MVP dashboards should load within 3 seconds using demo data          |
| Reliability          | Demo must work without real IoT hardware                             |
| Data Integrity       | Critical records should be soft-deleted or status-locked             |
| Auditability         | Critical actions must always generate audit log                      |
| Maintainability      | Code should be separated by service/module boundary                  |
| Scalability          | Service boundaries should allow future extraction into microservices |
| Compliance Readiness | Support QC release, quarantine, rejection, traceability, and audit   |
| Demo Reliability     | Seed data must support a complete end-to-end scenario                |

---

# 22. Kiro / Starter Template Implementation Guidance

## 22.1 Recommended Kiro Spec Structure

```text
.kiro/
  specs/
    sima-arome-smart-operations/
      requirements.md
      design.md
      tasks.md
  steering/
    product.md
    tech.md
    structure.md
docs/
  PRD.md
```

## 22.2 Recommended Project Modules

```text
src/
  app/
    dashboard/
    receiving/
    qc/
    warehouse/
    iot/
    alerts/
    production/
    shipping/
    admin/
    audit/
  services/
    auth-rbac/
    master-data/
    receiving-batch/
    qc/
    computer-vision/
    warehouse-inventory/
    iot-telemetry/
    alerts/
    production/
    shipping/
    dashboard-reporting/
    audit-log/
  components/
    role/
    dashboard/
    tables/
    forms/
    workflow/
    warehouse-map/
    alerts/
  data/
    seed/
    mock-iot/
    mock-cv/
```

## 22.3 Implementation Rules for Kiro

* Build role-based UI first.
* Seed realistic demo users for every role.
* Use mock data for IoT and CV.
* Enforce backend authorization for every mutation.
* Build vertical slice before adding extra features.
* Use service modules even if deployed as one app.
* Keep audit log implementation simple but consistent.
* Avoid hardcoding UI permissions only in components; use central permission config.
* Do not include `.env.local` or secrets in competition submission.

---

# 23. MVP Demo Scenario

## Scenario: Raw Material to Shipment with Cold-Chain Alert

1. Warehouse logs in.
2. Warehouse receives raw material from supplier.
3. System generates batch ID `RM-2026-001`.
4. Batch status becomes `QC Pending`.
5. QC logs in.
6. QC opens QC queue.
7. QC reviews CV result showing “Packaging dent detected, confidence 82%.”
8. QC enters manual results and approves batch with note.
9. Warehouse sees storage recommendation: Cold Zone A, Rack C1.
10. Warehouse confirms putaway.
11. IoT dashboard shows Cold Zone A temperature rising above limit.
12. System creates high-severity temperature alert.
13. Maintenance acknowledges and resolves alert.
14. PPIC creates production order.
15. Warehouse issues approved material to production.
16. Production logs consumption and output.
17. System creates finished goods batch.
18. QC approves finished goods.
19. PPIC creates shipping schedule.
20. Warehouse dispatches shipment.
21. Manager opens dashboard and sees full traceability and audit trail.

---

# 24. Acceptance Criteria

The MVP is accepted if it can demonstrate:

| Acceptance Area    | Criteria                                                          |
| ------------------ | ----------------------------------------------------------------- |
| Role-specific UI   | Each role sees different dashboard, columns, filters, and actions |
| Batch creation     | Receiving creates batch ID and QC Pending status                  |
| QC workflow        | QC can approve/reject/hold with reason                            |
| CV support         | CV result appears as recommendation only                          |
| Warehouse slotting | Approved batch gets storage recommendation                        |
| IoT alert          | Simulated anomaly creates alert                                   |
| Alert handling     | User can acknowledge and resolve alert                            |
| Production         | Approved material can be issued and consumed                      |
| FG QC              | Finished goods must be approved before shipping                   |
| Shipping block     | Unreleased FG cannot be dispatched                                |
| Audit log          | Critical actions appear in audit log                              |
| Traceability       | Batch page shows receiving → QC → storage → production → shipping |

---

# 25. Risks and Mitigations

| Risk                          | Impact                  | Mitigation                                   |
| ----------------------------- | ----------------------- | -------------------------------------------- |
| Scope too large               | Team may not finish     | Build vertical slice first                   |
| Microservices overengineering | Slower delivery         | Implement modular monorepo MVP               |
| CV model weak                 | Demo may fail           | Use controlled mock CV results               |
| No hardware sensors           | Demo dependency risk    | Use simulated IoT feed                       |
| UI too generic                | Role separation unclear | Build role-specific dashboards and columns   |
| Missing audit log             | Compliance story weak   | Log from first workflow                      |
| Warehouse rules too simple    | Less realistic          | Include hazard, temp, FEFO, and capacity     |
| Judges challenge realism      | Pitch risk              | Emphasize human QC approval and auditability |

---

# 26. Build Priority

## Phase 1: Foundation

1. Seed users and roles.
2. Create permission config.
3. Create role dashboard layout.
4. Create master data seed.
5. Create audit log helper.

## Phase 2: Core Vertical Slice

1. Receiving form.
2. Batch ID generation.
3. QC queue.
4. QC detail.
5. CV mock result.
6. QC decision.

## Phase 3: Warehouse and IoT

1. Storage recommendation.
2. Warehouse map.
3. Inventory lot update.
4. Simulated IoT readings.
5. Alert center.

## Phase 4: Production and Shipping

1. Production schedule.
2. Material issue.
3. Production execution.
4. Finished goods QC.
5. Shipping schedule.
6. Dispatch.

## Phase 5: Pitch Polish

1. Manager dashboard.
2. Batch traceability page.
3. Audit log page.
4. Demo data.
5. Final UI polish.

---

# 27. Final Product Positioning

The product should be pitched as:

> **A Smart Operations Control Tower for Natural Extract Manufacturing.**

Recommended pitch line:

> “Sigma Arome does not need a fantasy fully automated factory. It needs a practical, auditable operations platform that connects QC, warehouse, IoT monitoring, production, and shipping into one role-based system. Our MVP uses simulated IoT and computer vision to demonstrate how batch traceability, cold-chain visibility, and QC release control can work in a real manufacturing environment.”

This PRD is designed so Kiro can turn it into requirements, design, tasks, workflows, collections, RBAC, and API routes while still keeping the hackathon MVP buildable.

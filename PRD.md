# Product Requirements Document (PRD)

# Sigma Arome Smart Operations Website

## Scope: PPIC Raw Material Order → Finished Product Warehouse Putaway

---

## 1. Document Control

| Item                        | Details                                                                                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product Name                | Sigma Arome Smart Operations Website                                                                                                                                                               |
| Product Type                | Web-based manufacturing operations system with PPIC, QC, warehouse operation, logistics, production, IoT monitoring, and batch traceability                                                       |
| Current MVP Scope Boundary  | Starts when PPIC creates a raw material order and ends when QC-approved finished product is placed into finished goods warehouse                                                                  |
| Excluded for Current MVP    | Sales order, customer order, customer shipping/dispatch, delivery, invoicing, payment, full ERP integration                                                                                       |
| Future Scope                | Advanced forecasting, supplier portal, supplier scoring, full procurement approval, sales, customer dispatch, invoicing, ERP integration, real IoT, real CV model, maintenance role, auditor role |
| Primary Build Roles         | Admin, Manager, PPIC, Warehouse Operation, QC, Logistic, Production                                                                                                                               |
| Future / Secondary Roles    | Maintenance / IoT Technician, Auditor / Viewer                                                                                                                                                    |
| Target Build Style          | Build role by role, with role-specific dashboard, UI, table columns, action buttons, data visibility, and backend authorization                                                                   |
| Kiro / Buildpad Instruction | Before implementation, Kiro must read Buildpad documentation and use Buildpad-native features where possible before writing custom code                                                           |

---

## 2. Executive Summary

Sigma Arome needs a practical smart operations website to control the internal manufacturing flow from **PPIC raw material ordering** until **finished product warehouse putaway**.

The product is **not a full ERP** and **not a sales system**. PPIC is included because PPIC must be able to create raw material orders and production plans. However, PPIC must not manage sales orders, customer shipping, invoices, payments, or customer delivery in the current MVP.

The MVP flow is:

```text
Admin Setup
→ PPIC Raw Material Order
→ Warehouse Raw Material Receiving
→ Batch ID Creation
→ Raw Material QC Sampling
→ Computer Vision-Assisted QC Review
→ Raw Material QC Decision
→ Warehouse Storage Assignment
→ Raw Material Putaway
→ IoT / Storage Condition Monitoring
→ Alert Handling
→ PPIC Production Planning
→ PPIC Material Request
→ Logistic Internal Movement Coordination
→ Warehouse Material Issue to Production
→ Production Execution
→ Finished Product Batch Creation
→ Finished Product QC
→ Logistic / Warehouse Finished Product Putaway
→ Manager Dashboard, Traceability, and Audit Log
```

The first implementation must focus on these roles:

1. Admin
2. Manager
3. PPIC
4. Warehouse Operation
5. QC
6. Logistic
7. Production

The system must not treat database read access as equal UI access. PPIC, QC, Warehouse Operation, Logistic, Production, Manager, and Admin may read some of the same records, but they must see different dashboards, fields, table columns, filters, and action buttons based on their work.

---

## 3. Buildpad + Kiro Implementation Directive

## 3.1 Mandatory Instruction for Kiro / AI Agent

Before implementing any feature, the Kiro AI agent must read and follow the official Buildpad documentation:

```text
https://app.buildpad.ai/docs
```

Kiro must inspect the competition starter project structure and check whether each requested feature can be built using Buildpad-supported capabilities before writing custom code.

Kiro must especially check Buildpad documentation for:

* Starter project conventions.
* Specs-driven development.
* Phased implementation.
* Collections and data modeling.
* Role-based access control.
* Permission-aware UI.
* Linked data and relationships.
* Forms and CRUD screens.
* File uploads.
* Workflow status transitions.
* Event hooks / automation.
* Dashboard and analytics patterns.
* AI-assisted features, if available.

## 3.2 Buildpad-First Rule

When Buildpad provides a native or documented method, use that method first.

Custom code should only be used when:

1. The behavior is specific to Sigma Arome business rules.
2. Buildpad does not provide a documented pattern.
3. The feature requires custom validation, workflow transition, or computed logic.
4. The feature requires simulated IoT or simulated computer vision behavior not provided directly by Buildpad.

## 3.3 Kiro Prompt Instruction to Include in Every Implementation Task

```text
Before implementing this task, read the Buildpad documentation at https://app.buildpad.ai/docs and inspect this project's Buildpad/Kiro starter structure. If Buildpad provides a native or documented way to implement the feature, use the Buildpad-supported approach first. Check especially: collections/data modeling, RBAC roles and policies, permission-aware UI, linked data, file uploads, workflow automation, event hooks, dashboard analytics, and Kiro skills. Only write custom logic when the feature requires Sigma Arome-specific business rules or is not covered by Buildpad's documented capabilities.
```

## 3.4 Buildpad Feature Mapping

| PRD Area         | Buildpad Capability to Check First               | Implementation Direction                                                                            |
| ---------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Role-based login | Buildpad auth / starter auth pattern             | Use starter auth and role mapping before custom login                                               |
| RBAC             | Role-based access, policies, permission-aware UI | Enforce permissions at UI and backend/data layer                                                    |
| Role dashboards  | Dashboard / analytics patterns                   | Build different dashboards for Admin, Manager, PPIC, Warehouse Operation, QC, Logistic, Production  |
| Data model       | Buildpad collections / schema pattern            | Create collections for orders, batches, QC, inventory, production, alerts, sensors, audit logs      |
| Linked data      | Relations / references                           | Link raw material order → receipt → batch → QC → inventory → material issue → production → FG batch |
| File upload      | Upload support                                   | Use documented upload pattern for QC images and optional COA/delivery note                          |
| Workflow status  | Workflow automation / event hooks                | Use controlled status changes for orders, QC, storage, issue, production, FG QC, FG putaway         |
| Alert creation   | Event hooks / automation                         | Trigger alerts from temperature anomaly, QC hold, hazard conflict, near expiry                      |
| Audit log        | Event hooks / extensions                         | Automatically write audit log for critical workflow changes                                         |
| CV mock          | Custom logic if needed                           | Simulate CV result if no native feature exists                                                      |
| IoT mock         | Custom logic if needed                           | Generate readings and alerts using mock/demo data                                                   |

---

## 4. Problem Statement

Sigma Arome's internal factory flow needs stronger control over raw material ordering, receiving, QC, storage, production readiness, production execution, finished product release, and traceability.

Current operational pain points include:

* PPIC cannot easily create raw material orders and monitor whether material has arrived, passed QC, and become available for production.
* Raw material receiving is manually recorded.
* Batch IDs and movement records may be fragmented.
* QC queues and decisions are not visible in real time.
* Warehouse storage decisions rely too much on manual judgment or spreadsheets.
* Logistic teams need better visibility into material requests, internal movement tasks, and handoff status.
* Cold-chain and storage-condition risks may be detected late.
* Material movement from warehouse to production is difficult to trace.
* Production progress and raw material consumption are not clearly connected to finished product batches.
* Finished product release and storage are not always connected to batch genealogy.
* Managers lack one dashboard for PPIC readiness, QC bottlenecks, warehouse status, logistic handoffs, alerts, and production progress.

---

## 5. Product Vision

Create a role-based smart operations website that gives Sigma Arome one source of truth for internal batch movement, PPIC readiness, QC release, warehouse storage, logistic coordination, IoT alerts, production execution, finished product release, and traceability.

The product must be realistic:

* PPIC orders raw materials and plans production, but does not manage sales.
* Warehouse Operation handles physical receiving, putaway, inventory location, picking, and storage confirmation.
* Logistic coordinates internal movement and material handoff between PPIC, Warehouse Operation, and Production.
* QC makes final QC decisions.
* Computer vision supports inspection but does not automatically approve material.
* IoT readings support monitoring but require human handling for alerts.
* Production records actual consumption and output.
* Every critical decision is auditable.

---

## 6. Product Goals

| Goal                              | Description                                                                                | Success Indicator                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Enable PPIC raw material ordering | Let PPIC create raw material orders for internal production needs                          | PPIC can create and track raw material orders without sales features |
| Control warehouse receiving       | Record incoming raw material and create internal batch identity                            | Every received lot has a unique batch ID                             |
| Improve QC visibility             | Show QC queue, sampling, CV result, and decision status                                    | QC can process pending batches from one workbench                    |
| Support QC with computer vision   | Use image-based inspection support for visible defects, label issues, and packaging damage | QC page shows defect score and recommendation                        |
| Improve warehouse storage         | Recommend storage locations based on status, temperature, hazard, capacity, and FEFO       | Approved batches receive storage recommendation                      |
| Improve logistic coordination     | Track PPIC material requests, internal movement, material issue, and production handoff    | Logistic can see and coordinate all open material movement tasks     |
| Improve PPIC production readiness | Let PPIC check approved stock and create production plans/material requests               | PPIC can see material readiness before production                    |
| Monitor storage condition         | Display simulated or real temperature/humidity readings                                    | Alerts appear when readings exceed limits                            |
| Trace material to production      | Link raw material batches to production plans and finished product batches                | Batch detail page shows genealogy                                    |
| Control finished product release  | Require FG QC before product becomes available in FG warehouse                             | Only approved FG batch can be put into available FG storage          |
| Enforce role-specific UI          | Each role sees relevant data and actions only                                              | UI differs by role, not only by page access                          |
| Maintain audit trail              | Log critical changes and approvals                                                         | Audit log shows who, what, when, and why                             |

---

## 7. Scope

## 7.1 In Scope for Current MVP

| Module                             | Included? | Description                                                                                                                                  |
| ---------------------------------- | --------: | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Role-based login                   |       Yes | Users log in and are redirected to role-specific dashboard                                                                                   |
| Admin settings                     |       Yes | Users, roles, supplier master, material master, product master, warehouse zones, storage rules, hazard rules, QC templates                   |
| PPIC raw material ordering         |       Yes | PPIC creates raw material orders for internal production needs only                                                                          |
| Raw material receiving             |       Yes | Warehouse Operation records raw material arrival, preferably against PPIC order                                                              |
| Batch ID generation                |       Yes | System generates internal batch ID                                                                                                           |
| Raw material QC queue              |       Yes | QC sees batches pending inspection                                                                                                           |
| QC sampling                        |       Yes | QC records sample details                                                                                                                    |
| Computer vision-assisted review    |       Yes | Simulated/simple image result shown to QC                                                                                                    |
| QC decision                        |       Yes | QC approves, rejects, or holds raw material                                                                                                  |
| Quarantine handling                |       Yes | Hold/rejected lots stay in quarantine or blocked status/location                                                                             |
| Storage assignment                 |       Yes | System recommends storage location for approved batches                                                                                      |
| Warehouse map                      |       Yes | Shows receiving, quarantine, raw material, staging, and finished goods zones                                                                 |
| Warehouse Operation                |       Yes | Must-have physical warehouse module: receiving, batch labels, putaway, inventory location, movement logs, picking/issue, FG putaway          |
| Logistic coordination              |       Yes | Must-have internal movement coordination: material request queue, movement prioritization, issue coordination, production handoff monitoring |
| Raw material putaway               |       Yes | Warehouse Operation confirms physical storage                                                                                                |
| IoT monitoring                     |       Yes | Simulated or real readings for storage areas                                                                                                 |
| Alert center                       |       Yes | Alerts for temperature anomaly, near expiry, hazard conflict, sensor issue, QC hold, delayed handoff                                         |
| PPIC production planning           |       Yes | PPIC creates production plans and checks material readiness                                                                                 |
| Material request                   |       Yes | PPIC requests approved material for production                                                                                               |
| Material issue                     |       Yes | Logistic coordinates; Warehouse Operation physically issues material to Production                                                           |
| Production execution               |       Yes | Production logs process stage, consumption, yield, and output                                                                                |
| Finished product batch             |       Yes | System creates finished product batch from production plan                                                                                  |
| Finished product QC                |       Yes | QC releases, rejects, or holds finished product                                                                                              |
| Finished product warehouse putaway |       Yes | Logistic coordinates; Warehouse Operation confirms final storage                                                                             |
| Manager dashboard                  |       Yes | Shows internal factory KPIs only                                                                                                             |
| Batch traceability                 |       Yes | Raw material order → receipt → raw material batch → production plan → finished product batch                                                |
| Audit log                          |       Yes | Tracks critical actions                                                                                                                      |

## 7.2 Out of Scope for Current MVP

| Excluded Module                      | Reason                                                                      | Future Phase                |
| ------------------------------------ | --------------------------------------------------------------------------- | --------------------------- |
| Sales order                          | Happens after finished product warehouse                                    | Future sales module         |
| Customer order management            | Outside current internal operations scope                                   | Future sales module         |
| Shipping / dispatch to customer      | After final product is placed into warehouse                                | Future logistics module     |
| Customer delivery                    | Outside current internal operations scope                                   | Future logistics module     |
| Invoice / payment                    | Not relevant to this MVP                                                    | Future ERP integration      |
| Full procurement approval workflow   | Current MVP only needs simple PPIC raw material order creation and tracking | Future procurement module   |
| Supplier portal / supplier scorecard | Useful but not needed for first internal flow                               | Future supplier module      |
| Advanced demand forecasting          | Beyond first MVP; PPIC may manually create orders first                     | Future PPIC planning module |
| Real IoT hardware dependency         | MVP should work without hardware                                            | Future real deployment      |
| Fully trained CV model               | Requires dataset and validation                                             | Future AI model phase       |
| Maintenance / IoT technician role    | Useful, but not one of the first implementation roles                       | Future role expansion       |
| Auditor / Viewer role                | Useful, but not one of the first implementation roles                       | Future governance module    |

---

## 8. Primary Users and Role-Specific Purpose

## 8.1 Admin

**Purpose:** Configure the system foundation.

**Primary UI:** Admin Control Center.

**Primary Data:** Users, roles, permissions, suppliers, raw materials, products, warehouse zones, storage rules, hazard rules, QC templates, simulated sensors, audit logs.

**Main Actions:** Create users, assign roles, create master data, configure rules, review audit log.

**Should Not Be Default Actor For:** QC approval, warehouse putaway, logistic issue coordination, PPIC planning, production execution, finished product QC.

## 8.2 Manager

**Purpose:** Monitor factory health, bottlenecks, QC status, PPIC readiness, warehouse operation, logistic handoffs, alerts, production progress, and traceability.

**Primary UI:** Executive Operations Dashboard.

**Primary Data:** Summarized KPIs, exceptions, batch status, inventory readiness, production status, QC bottlenecks, logistic delays, alert severity, audit summary.

**Main Actions:** Review performance, monitor alerts, view traceability, approve controlled exceptions if enabled.

## 8.3 PPIC

**Purpose:** Order raw materials for internal production needs, monitor incoming material status, plan internal production based on approved material availability, and coordinate production readiness.

**Primary UI:** PPIC Planning Dashboard.

**Primary Data:** Raw material orders, supplier/material list, order status, receiving status, QC status summary, approved material availability, raw material readiness, production plan status, material request status, finished product output status.

**Main Actions:** Create raw material order, monitor raw material order status, check material readiness, create production plan, create material request, monitor production progress, monitor FG QC pending, monitor FG stored status.

**Current MVP Boundary:** PPIC can create simple raw material orders for operational use. PPIC must not manage sales orders, customer orders, customer shipping, invoicing, payment, or customer delivery.

## 8.4 Warehouse Operation

**Purpose:** Execute physical warehouse operations inside the factory.

**Primary UI:** Warehouse Operation Dashboard.

**Primary Data:** Incoming raw material tasks, receiving records, batch labels, exact locations, storage assignment, warehouse map, inventory lots, putaway tasks, pick tasks, issue confirmation, FG putaway tasks, warehouse alerts.

**Main Actions:** Receive raw material, generate/view batch label, confirm putaway, update physical location, pick material, issue material to Production, put away approved finished product, acknowledge warehouse alerts.

## 8.5 QC

**Purpose:** Inspect raw materials and finished products, review CV result, and make QC decisions.

**Primary UI:** QC Workbench.

**Primary Data:** QC queue, samples, optional COA summary, CV results, QC parameters, defect records, hold/reject reasons, QC decision history.

**Main Actions:** Create sample, enter QC result, review CV result, approve, reject, hold.

## 8.6 Logistic

**Purpose:** Coordinate internal material movement and handoffs between PPIC, Warehouse Operation, and Production.

**Primary UI:** Logistic Coordination Dashboard.

**Primary Data:** PPIC material requests, movement priorities, open issue tasks, warehouse task status, production handoff status, FG handoff status, logistic alerts, delayed movement records.

**Main Actions:** Review material requests, prioritize movement, assign/confirm movement tasks, monitor issue-to-production status, coordinate FG putaway, escalate blocked handoffs.

**Important Distinction:** Warehouse Operation performs the physical warehouse actions. Logistic coordinates the internal movement process and monitors whether the handoff is completed on time.

## 8.7 Production

**Purpose:** Execute production using approved issued raw material and create finished product output.

**Primary UI:** Production Execution Board.

**Primary Data:** Production orders, material readiness, issued batches, process stages, consumption, yield, output batch.

**Main Actions:** Confirm material received, start production, update stage, record consumption, record yield/output, complete production.

---

## 9. Role-Based UI and Data Visibility Requirements

## 9.1 Principle

Access control is not enough. The system must also control what each role sees on screen.

Two roles may both have read access to the same database entity, but they should not see the same columns, filters, dashboard cards, or actions.

Examples:

* PPIC sees raw material order status, material readiness, production plan status, material request status, and FG output status.
* Warehouse Operation sees exact bin, rack, scan status, putaway tasks, physical pick/issue actions, warehouse map controls, quarantine stock, available stock, and FG putaway tasks.
* QC sees sample result, CV score, QC parameter values, and QC decision buttons.
* Logistic sees movement priorities, material requests, issue coordination, handoff delays, and internal movement status.
* Production sees issued materials, production stages, consumption, yield, and output entry.
* Manager sees summarized operational status, bottlenecks, and exceptions.
* Admin sees setup and configuration, not daily operational action buttons by default.

## 9.2 Role-Based UI Rules

| Requirement ID | Requirement                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RBUI-001       | The system shall render dashboard widgets based on user role.                                                                                                                                |
| RBUI-002       | The system shall apply role-specific table columns for shared data such as raw material orders, batches, inventory, QC status, material requests, alerts, production plans, and FG batches. |
| RBUI-003       | The system shall filter records by operational relevance, not only permission level.                                                                                                         |
| RBUI-004       | The system shall hide action buttons that the current role is not allowed to use.                                                                                                            |
| RBUI-005       | The system shall show exact warehouse location controls only to Warehouse Operation.                                                                                                         |
| RBUI-006       | The system shall show exact warehouse location read-only views to Manager, Logistic, and Admin when relevant.                                                                                |
| RBUI-007       | The system shall show detailed QC parameter values only to QC, Manager, and Admin.                                                                                                           |
| RBUI-008       | The system shall show production execution action buttons only to Production.                                                                                                                |
| RBUI-009       | The system shall show raw material ordering, production planning, and material request actions only to PPIC.                                                                                 |
| RBUI-010       | The system shall show physical receiving, putaway, pick, issue, and FG putaway actions only to Warehouse Operation.                                                                          |
| RBUI-011       | The system shall show movement prioritization and handoff coordination actions only to Logistic.                                                                                             |
| RBUI-012       | The system shall show approval actions only to authorized roles.                                                                                                                             |
| RBUI-013       | Admin shall see configuration actions, but not be the default actor for QC, PPIC, Warehouse Operation, Logistic, or Production workflow actions.                                             |

## 9.3 Role-Specific Shared Data View

| Field / Action                   | Admin | Manager                | PPIC              | Warehouse Operation   | QC                | Logistic               | Production               |
| -------------------------------- | ----- | ---------------------- | ----------------- | --------------------- | ----------------- | ---------------------- | ------------------------ |
| Raw Material Order No.           | Show  | Show                   | Show              | Show    | Summary           | Show coordination view | Hide                     |
| Batch ID                         | Show  | Show                   | Show              | Show                  | Show              | Show                   | Show if issued/needed    |
| Material Name                    | Show  | Show                   | Show              | Show                  | Show              | Show                   | Show                     |
| Supplier Lot                     | Show  | Show                   | Summary           | Show                  | Show              | Summary                | Hide by default          |
| QC Status                        | Show  | Show                   | Summary           | Summary               | Detailed          | Summary                | Summary                  |
| QC Parameter Values              | Show  | Show                   | Hide by default   | Hide                  | Show              | Hide                   | Hide                     |
| CV Result                        | Show  | Summary                | Hide              | Hide                  | Show              | Hide                   | Hide                     |
| Exact Location                   | Show  | Show                   | Zone summary      | Show/edit             | Read-only summary | Show read-only         | Pick/issue location only |
| Available Quantity               | Show  | Show                   | Planning quantity | Physical quantity     | Show if relevant  | Movement quantity      | Issued/required qty only |
| Expiry Date                      | Show  | Show                   | Show              | Show                  | Show              | Show                   | Show if issued           |
| Production Readiness             | Show  | Show                   | Show              | Read-only             | Read-only         | Show handoff status    | Show                     |
| Material Request Status          | Show  | Show                   | Show              | Fulfillment task view | Hide              | Show coordination view | Show read-only           |
| Receive Button                   | Hide  | Hide                   | Hide              | Show                  | Hide              | Hide                   | Hide                     |
| QC Decision Button               | Hide  | Manager exception only | Hide              | Hide                  | Show              | Hide                   | Hide                     |
| Create Raw Material Order Button | Hide  | Hide or exception      | Show              | Hide                  | Hide              | Hide                   | Hide                     |
| Create Production Order Button   | Hide  | Hide or exception      | Show              | Hide                  | Hide              | Hide                   | Hide                     |
| Create Material Request Button   | Hide  | Hide                   | Show              | Hide                  | Hide              | Hide                   | Hide                     |
| Prioritize Movement Button       | Hide  | Hide or exception      | Hide              | Hide                  | Hide              | Show                   | Hide                     |
| Putaway Button                   | Hide  | Hide                   | Hide              | Show                  | Hide              | Hide                   | Hide                     |
| Issue to Production Button       | Hide  | Hide                   | Hide              | Show                  | Hide              | Coordinate only        | Confirm receipt only     |
| Production Action Button         | Hide  | Hide                   | Hide              | Hide                  | Hide              | Hide                   | Show                     |

---

## 10. End-to-End Process Flow

## 10.1 Admin Setup

1. Admin logs in.
2. Admin creates users for Admin, Manager, PPIC, Warehouse Operation, QC, Logistic, and Production.
3. Admin configures suppliers, raw materials, finished products, warehouse locations, hazard classes, storage rules, QC parameter templates, and simulated sensors.
4. System records all setup actions in audit log.

## 10.2 PPIC Raw Material Ordering

1. PPIC logs in.
2. PPIC opens Raw Material Order page.
3. PPIC creates raw material order with:

   * material name
   * required quantity
   * unit
   * expected arrival date
   * supplier name, if available
   * priority
   * notes / reason
4. System generates raw material order number.
5. Order status becomes `Ordered / Waiting Arrival`.
6. Warehouse Operation can see expected incoming raw material orders for receiving preparation.
7. Logistic can see incoming order summary for movement planning.
8. Manager can view raw material order status in summary.
9. Audit log records order creation and status changes.

## 10.3 Raw Material Receiving

1. Warehouse Operation logs in.
2. Warehouse Operation opens Raw Material Receiving page.
3. Warehouse Operation selects matching PPIC raw material order if available.
4. Warehouse Operation records incoming material:

   * material name
   * supplier name or supplier lot
   * received quantity
   * unit
   * expiry date or manufacturing date
   * packaging condition
   * delivery note reference, if available
5. System generates receipt number.
6. System links receipt to PPIC raw material order when applicable.
7. System generates internal batch ID.
8. Batch status becomes `QC Pending`.
9. Batch location becomes `Receiving / Quarantine`.
10. Raw material order status updates to `Partially Received` or `Received`.
11. Audit log records receipt and batch creation.

## 10.4 Raw Material QC

1. QC logs in.
2. QC dashboard shows QC Pending batches.
3. QC opens QC inspection detail.
4. QC creates sample record.
5. QC uploads/selects inspection image.
6. System displays computer vision-assisted result:

   * defect type
   * confidence score
   * recommendation
7. QC records manual QC parameters.
8. QC decides:

   * Approve
   * Hold
   * Reject
9. System updates batch status.
10. Audit log records decision and reason.

## 10.5 Storage Assignment and Raw Material Putaway

1. Approved raw material triggers storage assignment.
2. System checks:

   * material storage temperature
   * hazard class
   * available capacity
   * quarantine/approved status
   * FEFO priority
3. System recommends warehouse location.
4. Warehouse Operation confirms location and putaway.
5. Batch status becomes `Stored - Available`.
6. Logistic and PPIC can see material availability summary.
7. Audit log records putaway.

## 10.6 IoT Monitoring and Alert Handling

1. System receives or simulates sensor readings.
2. System compares readings against storage thresholds.
3. If reading is out of range, system creates alert.
4. Alert appears on Warehouse Operation, Logistic, and Manager dashboards based on relevance.
5. Warehouse Operation handles physical storage-related alerts.
6. Logistic monitors movement impact and escalates if material availability or production handoff is affected.
7. Alert status becomes `Resolved` or `Escalated`.
8. Audit log records alert lifecycle.

## 10.7 PPIC Production Planning and Material Request

1. PPIC opens Material Readiness view.
2. PPIC checks approved available raw material.
3. PPIC creates production plan for a product.
4. System checks material readiness based on approved available raw material.
5. PPIC creates material request to Logistic.
6. Production order status becomes `Waiting Material Issue` or `Ready for Production`.
7. Audit log records production plan and material request.

## 10.8 Logistic Movement Coordination

1. Logistic opens Material Request Queue.
2. Logistic reviews material request from PPIC.
3. Logistic checks material availability, priority, production schedule, and warehouse task status.
4. Logistic creates or prioritizes internal movement/issue task for Warehouse Operation.
5. Logistic monitors whether Warehouse Operation has issued material and whether Production has confirmed receipt.
6. Logistic escalates delayed or blocked handoffs.
7. Audit log records coordination status changes.

## 10.9 Warehouse Material Issue to Production

1. Warehouse Operation receives issue task.
2. Warehouse Operation selects approved available raw material batch.
3. System validates:

   * batch status is `Stored - Available`
   * batch is not expired
   * batch is not on hold
   * quantity is sufficient
4. Warehouse Operation issues material to Production.
5. Production confirms material received.
6. Inventory quantity decreases.
7. Audit log records issue transaction.

## 10.10 Production Execution

1. Production opens assigned production plan.
2. Production starts production after material is issued and received.
3. System links production plan to issued raw material batches.
4. Production records production stage updates.
5. Production records material consumption.
6. Production records output quantity and yield.
7. System creates finished product batch.
8. Finished product status becomes `FG QC Pending`.
9. Audit log records production completion.

## 10.11 Finished Product QC

1. QC sees finished product QC queue.
2. QC opens finished product batch.
3. QC records finished product QC parameters.
4. QC decides:

   * Approved
   * Hold
   * Rejected
5. Approved finished product becomes eligible for FG warehouse putaway.
6. Hold/rejected finished product remains in quarantine or blocked status.
7. Audit log records decision.

## 10.12 Finished Product Warehouse Putaway

1. Logistic sees FG putaway readiness and coordinates task priority.
2. Warehouse Operation sees approved finished product putaway task.
3. System recommends finished goods warehouse location.
4. Warehouse Operation confirms physical putaway.
5. Finished product batch status becomes `Stored - Finished Goods Available`.
6. Current MVP ends here.

---

## 11. Functional Requirements

## 11.1 Authentication and Role Routing

| ID       | Requirement                                                                 | Priority  |
| -------- | --------------------------------------------------------------------------- | --------- |
| AUTH-001 | Users must log in using account credentials.                                | Must Have |
| AUTH-002 | System must identify user role after login.                                 | Must Have |
| AUTH-003 | System must redirect user to role-specific dashboard.                       | Must Have |
| AUTH-004 | User must not access pages outside role permission.                         | Must Have |
| AUTH-005 | Unauthorized action buttons must not be visible.                            | Must Have |
| AUTH-006 | Backend/data layer must reject unauthorized actions even if UI is bypassed. | Must Have |

## 11.2 Admin Configuration

| ID        | Requirement                                                                              | Priority  |
| --------- | ---------------------------------------------------------------------------------------- | --------- |
| ADMIN-001 | Admin must manage users and assign roles.                                                | Must Have |
| ADMIN-002 | Admin must manage supplier master data.                                                  | Must Have |
| ADMIN-003 | Admin must manage raw material master data.                                              | Must Have |
| ADMIN-004 | Admin must manage finished product master data.                                          | Must Have |
| ADMIN-005 | Admin must manage warehouse locations and zones.                                         | Must Have |
| ADMIN-006 | Admin must manage hazard classes and storage rules.                                      | Must Have |
| ADMIN-007 | Admin must manage QC parameter templates.                                                | Must Have |
| ADMIN-008 | Admin must configure simulated sensors if Buildpad-supported or via custom mock records. | Must Have |
| ADMIN-009 | Admin must view audit logs.                                                              | Must Have |

## 11.3 PPIC Raw Material Ordering and Planning

| ID       | Requirement                                                                                                                       | Priority  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- | --------- |
| PPIC-001 | PPIC must create raw material order.                                                                                              | Must Have |
| PPIC-002 | Raw material order must include material, quantity, unit, expected arrival date, supplier if available, priority, and notes.      | Must Have |
| PPIC-003 | System must generate unique raw material order number.                                                                            | Must Have |
| PPIC-004 | Raw material order status must support Draft, Ordered / Waiting Arrival, Partially Received, Received, Closed, Cancelled.         | Must Have |
| PPIC-005 | PPIC must see ordered, partially received, received, QC pending, approved, hold, and rejected material statuses.                  | Must Have |
| PPIC-006 | PPIC must see approved raw material availability summary.                                                                         | Must Have |
| PPIC-007 | PPIC must create production plan.                                                                                                | Must Have |
| PPIC-008 | System must check material readiness before production plan is marked ready.                                                     | Must Have |
| PPIC-009 | PPIC must create material request to Logistic.                                                                                    | Must Have |
| PPIC-010 | PPIC must monitor material request status, production progress, FG QC status, and FG stored status.                               | Must Have |
| PPIC-011 | PPIC must not manage sales order, customer order, customer shipping, invoicing, payment, or customer delivery in the current MVP. | Must Have |

## 11.4 Warehouse Operation

| ID     | Requirement                                                                                                    | Priority  |
| ------ | -------------------------------------------------------------------------------------------------------------- | --------- |
| WH-001 | Warehouse Operation must view raw material orders expected for receiving.                                      | Must Have |
| WH-002 | Warehouse Operation must create raw material receiving record, preferably linked to a PPIC raw material order. | Must Have |
| WH-003 | System must generate receipt number.                                                                           | Must Have |
| WH-004 | System must generate unique internal batch ID.                                                                 | Must Have |
| WH-005 | Newly received raw material must default to QC Pending.                                                        | Must Have |
| WH-006 | Newly received raw material must default to Receiving / Quarantine location.                                   | Must Have |
| WH-007 | Warehouse Operation must confirm putaway only for approved batches.                                            | Must Have |
| WH-008 | Warehouse Operation must view and update exact inventory location.                                             | Must Have |
| WH-009 | Warehouse Operation must fulfill material issue tasks assigned/coordinated by Logistic.                        | Must Have |
| WH-010 | Warehouse Operation must issue only approved and available raw material batches.                               | Must Have |
| WH-011 | Warehouse Operation must put away only QC-approved finished product.                                           | Must Have |
| WH-012 | System must support warehouse movement logs.                                                                   | Must Have |

## 11.5 QC and Computer Vision-Assisted QC

| ID     | Requirement                                                                 | Priority  |
| ------ | --------------------------------------------------------------------------- | --------- |
| QC-001 | QC must see QC Pending raw material queue.                                  | Must Have |
| QC-002 | QC must create sample record.                                               | Must Have |
| QC-003 | QC must enter manual QC parameter results.                                  | Must Have |
| QC-004 | QC must upload or select inspection image.                                  | Must Have |
| QC-005 | System must display CV defect result, confidence score, and recommendation. | Must Have |
| QC-006 | CV result must be marked as decision support only.                          | Must Have |
| QC-007 | MVP may simulate CV result using mock data.                                 | Must Have |
| QC-008 | QC must approve, reject, or hold raw material batch.                        | Must Have |
| QC-009 | Hold and reject decisions must require reason code.                         | Must Have |
| QC-010 | System must block non-QC role from making QC decision.                      | Must Have |

## 11.6 Logistic Coordination

| ID      | Requirement                                                                                                     | Priority  |
| ------- | --------------------------------------------------------------------------------------------------------------- | --------- |
| LOG-001 | Logistic must see PPIC material request queue.                                                                  | Must Have |
| LOG-002 | Logistic must view material availability and warehouse task status.                                             | Must Have |
| LOG-003 | Logistic must prioritize or assign internal movement tasks to Warehouse Operation.                              | Must Have |
| LOG-004 | Logistic must monitor material issue status from Warehouse Operation to Production.                             | Must Have |
| LOG-005 | Logistic must monitor finished product readiness for warehouse putaway.                                         | Must Have |
| LOG-006 | Logistic must escalate blocked or delayed handoffs.                                                             | Must Have |
| LOG-007 | Logistic must not perform QC approval.                                                                          | Must Have |
| LOG-008 | Logistic must not execute production stages.                                                                    | Must Have |
| LOG-009 | Logistic may coordinate physical task priority but Warehouse Operation confirms physical location and movement. | Must Have |

## 11.7 Storage Assignment, Warehouse Map, and IoT Alerts

| ID        | Requirement                                                                                                                         | Priority     |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| STOR-001  | System must recommend location only for approved raw material batches or approved FG batches.                                       | Must Have    |
| STOR-002  | Recommendation must consider storage temperature.                                                                                   | Must Have    |
| STOR-003  | Recommendation must consider hazard compatibility.                                                                                  | Must Have    |
| STOR-004  | Recommendation must consider location capacity.                                                                                     | Must Have    |
| STOR-005  | Recommendation should consider FEFO.                                                                                                | Nice to Have |
| MAP-001   | Warehouse map must show receiving/quarantine, raw material storage, cold storage, production staging, and finished goods warehouse. | Must Have    |
| MAP-002   | Warehouse map must show slot status: empty, occupied, reserved, blocked, alert.                                                     | Must Have    |
| IOT-001   | System must display temperature and humidity readings by zone.                                                                      | Must Have    |
| IOT-002   | MVP may use simulated sensor data.                                                                                                  | Must Have    |
| ALERT-001 | System must create alerts for temperature anomaly, near expiry, hazard conflict, QC hold, and delayed handoff.                      | Must Have    |
| ALERT-002 | Alert resolution must require action notes.                                                                                         | Must Have    |
| ALERT-003 | Manager must see all critical open alerts.                                                                                          | Must Have    |

## 11.8 Material Issue to Production

| ID        | Requirement                                                                                 | Priority  |
| --------- | ------------------------------------------------------------------------------------------- | --------- |
| ISSUE-001 | PPIC must create material request to Logistic.                                              | Must Have |
| ISSUE-002 | Logistic must coordinate material issue task.                                               | Must Have |
| ISSUE-003 | Warehouse Operation must physically issue only approved and available raw material batches. | Must Have |
| ISSUE-004 | System must block held, rejected, expired, or insufficient batches.                         | Must Have |
| ISSUE-005 | Production must confirm received material.                                                  | Must Have |
| ISSUE-006 | Inventory quantity must decrease after issue.                                               | Must Have |
| ISSUE-007 | Issue transaction must link raw material batch to production plan.                         | Must Have |

## 11.9 Production Execution

| ID       | Requirement                                                                                                             | Priority  |
| -------- | ----------------------------------------------------------------------------------------------------------------------- | --------- |
| PROD-001 | Production must see assigned production plans.                                                                         | Must Have |
| PROD-002 | Production must start production plan only after material is issued and received, unless Manager exception is enabled. | Must Have |
| PROD-003 | Production must record stage updates.                                                                                   | Must Have |
| PROD-004 | Production must record actual material consumption.                                                                     | Must Have |
| PROD-005 | Production must record output quantity and yield.                                                                       | Must Have |
| PROD-006 | System must create finished product batch after production completion.                                                  | Must Have |
| PROD-007 | Finished product batch must link to consumed raw material batches.                                                      | Must Have |

## 11.10 Finished Product QC and Putaway

| ID     | Requirement                                                              | Priority  |
| ------ | ------------------------------------------------------------------------ | --------- |
| FG-001 | QC must see finished product QC queue.                                   | Must Have |
| FG-002 | QC must enter finished product QC result.                                | Must Have |
| FG-003 | QC must approve, reject, or hold finished product batch.                 | Must Have |
| FG-004 | Hold and reject must require reason code.                                | Must Have |
| FG-005 | Only approved finished product can be stored as available FG inventory.  | Must Have |
| FG-006 | Logistic must coordinate FG putaway readiness.                           | Must Have |
| FG-007 | Warehouse Operation must confirm physical FG putaway.                    | Must Have |
| FG-008 | System must update FG batch status to Stored - Finished Goods Available. | Must Have |
| FG-009 | Current MVP must end after FG putaway.                                   | Must Have |

## 11.11 Audit Log

| ID        | Requirement                                                                                                                                                                                                                                            | Priority  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| AUDIT-001 | System must log PPIC raw material order, receiving, batch creation, QC decision, storage, PPIC production plan, material request, logistic coordination, material issue, production completion, FG QC, FG putaway, alert handling, and admin changes. | Must Have |
| AUDIT-002 | Audit log must include user, role, action, entity, entity ID, timestamp, old value, new value, and reason when applicable.                                                                                                                             | Must Have |
| AUDIT-003 | Audit log must be read-only for all normal users.                                                                                                                                                                                                      | Must Have |
| AUDIT-004 | Admin and Manager must view audit logs in MVP.                                                                                                                                                                                                         | Must Have |

---

## 12. Business Rules

## 12.1 Raw Material Order Status Flow

```text
Draft
→ Ordered / Waiting Arrival
→ Partially Received
→ Received
→ Closed
```

Rules:

* PPIC creates raw material orders.
* Warehouse Operation receives raw material against the order when possible.
* Receiving can be partial or complete.
* Raw material order does not represent sales, shipping, invoice, or payment.
* Cancelled or closed orders cannot receive new batches unless reopened by authorized role.

## 12.2 Raw Material Batch Status Flow

```text
Received
→ QC Pending
→ Under QC
→ Approved / Hold / Rejected
→ Storage Assigned
→ Stored - Available
→ Requested for Production
→ Movement Coordinated
→ Issued to Production
→ Consumed in Production
```

Rules:

* New raw material batch must start as `QC Pending`.
* Only QC can approve, hold, or reject.
* Hold/reject requires reason.
* Only Approved batch can receive storage assignment.
* Only Stored - Available batch can be requested by PPIC.
* Logistic coordinates the handoff.
* Warehouse Operation physically issues the material.
* Rejected batch cannot be used in production.

## 12.3 Production Order Status Flow

```text
Draft
→ Material Readiness Checked
→ Material Requested
→ Movement Coordinated
→ Waiting Material Issue
→ Ready for Production
→ In Production
→ Completed
→ FG Batch Created
```

Rules:

* PPIC creates the production plan.
* PPIC creates material request.
* Logistic coordinates the movement.
* Warehouse Operation issues material.
* Production executes the order.
* Production cannot start until material issue is confirmed, unless Manager exception is enabled.

## 12.4 Finished Product Batch Status Flow

```text
Created from Production
→ FG QC Pending
→ FG Approved / FG Hold / FG Rejected
→ FG Storage Coordinated
→ FG Storage Assigned
→ Stored - Finished Goods Available
```

Rules:

* Finished product batch must be created from production plan.
* Finished product batch must link to consumed raw material batches.
* Only QC can release finished product.
* Logistic coordinates FG putaway readiness.
* Warehouse Operation confirms physical FG putaway.
* Only FG Approved batch can be put away into available finished goods storage.
* MVP ends when FG batch is stored in warehouse.

## 12.5 Role Separation Rules

* Admin configures the system but should not be used for routine operational decisions.
* Manager reviews exceptions and performance but should not perform routine data entry by default.
* PPIC can order raw materials, create production plans, and request material, but cannot manage sales or physically issue inventory.
* Warehouse Operation can receive, store, pick, issue, and put away, but cannot approve QC.
* QC can approve or reject quality status but cannot perform warehouse putaway or production execution.
* Logistic coordinates material movement and handoffs but does not approve QC or execute production.
* Production executes production but cannot change QC or warehouse storage status.

---

## 13. RBAC Matrix

Legend: C = Create, R = Read, U = Update, D = Delete, A = Approve, X = No Access.

| Module                         |   Admin |   Manager |           PPIC |    Warehouse Operation |                   QC |            Logistic |            Production |
| ------------------------------ | ------: | --------: | -------------: | ---------------------: | -------------------: | ------------------: | --------------------: |
| User Management                | C/R/U/D |         X |              X |                      X |                    X |                   X |                     X |
| Master Data                    | C/R/U/D |         R |              R |                      R |                    R |                   R |                     R |
| Supplier Master                | C/R/U/D |         R |              R |              R summary |            R summary |                   R |                     X |
| Raw Material Order             | C/R/U/D |         R |        C/R/U/D |                     R  |            R summary | R coordination view |                     X |
| Raw Material Receiving         | C/R/U/D |         R |              R |                  C/R/U |                    R |            R status |                     X |
| Batch Master                   | C/R/U/D |         R |     R planning |         C/R/U location |          R/U quality |          R movement |             R limited |
| Raw Material QC                | C/R/U/D |         R |      R summary |              R summary |              C/R/U/A |           R summary |                     X |
| CV Review                      | C/R/U/D | R summary |              X |                      X |                C/R/U |                   X |                     X |
| Storage Assignment             | C/R/U/D |         R |      R summary |                  C/R/U |                    R |      R coordination |             R limited |
| Warehouse Map                  | C/R/U/D |         R | R zone summary |                  C/R/U |            R limited |         R read-only |             R limited |
| IoT Monitoring                 | C/R/U/D |         R |      R summary |     R/U alert handling |            R summary |      R coordination |             R limited |
| Alert Center                   | C/R/U/D |       R/A |              R |   R/U warehouse alerts | R/U/A quality alerts | R/U logistic alerts | R/U production alerts |
| PPIC Production Planning       | C/R/U/D |       R/A |        C/R/U/D |                      R |                    R |      R coordination |                     R |
| Material Request               | C/R/U/D |         R |        C/R/U/D |            R task view |                    R |      R/U coordinate |                     R |
| Internal Movement Coordination | C/R/U/D |         R |              R |     R/U task execution |                    X |               C/R/U |              R status |
| Material Issue                 | C/R/U/D |         R |              R |   C/R/U physical issue |                    R |      R/U coordinate |           R/U confirm |
| Production Execution           | C/R/U/D |         R |              R |                      R |                    R |            R status |                 C/R/U |
| Finished Product QC            | C/R/U/D |         R |      R summary |                      R |              C/R/U/A |      R coordination |                     R |
| Finished Product Putaway       | C/R/U/D |         R |      R summary | C/R/U physical putaway |                    R |      R/U coordinate |                     R |
| Dashboard                      | C/R/U/D |         R |              R |                      R |                    R |                   R |                     R |
| Audit Log                      | C/R/U/D |         R |              X |                      X |                    X |                   X |                     X |

---

## 14. Role-by-Role Implementation Plan

## Implementation Principle

Build the web app one role at a time. Each role must be usable independently before adding the next role.

Recommended first-role implementation order:

```text
1. Admin
2. PPIC
3. Warehouse Operation
4. QC
5. Logistic
6. Production
7. Manager
```

This order works because Admin creates setup data, PPIC creates the raw material order, Warehouse Operation starts the physical flow, QC controls release, Logistic coordinates material handoffs, Production executes production, and Manager views the end-to-end control tower.

---

## 14.1 Phase 1 — Admin Role

## Goal

Create the system foundation.

## Screens

* Admin Dashboard
* User Management
* Role Management
* Supplier Master
* Material Master
* Product Master
* Warehouse Location Master
* Hazard Class Rules
* Storage Rules
* QC Parameter Template
* Simulated Sensor Setup
* Audit Log Viewer

## Acceptance Criteria

* Admin can create required master data.
* Admin can create at least one user per primary role.
* Admin actions are logged.
* Non-admin users cannot access Admin pages.

---

## 14.2 Phase 2 — PPIC Role

## Goal

Enable raw material ordering and internal production planning without sales functionality.

## Screens

* PPIC Dashboard
* Raw Material Order List
* Create Raw Material Order
* Raw Material Order Detail
* Material Readiness View
* Production Order List
* Create Production Order
* Material Request Form
* Material Request Status
* Production Progress Monitor
* Finished Product Status Monitor

## PPIC Dashboard Widgets

* Raw material orders waiting arrival
* Raw material orders partially received
* Approved raw materials available
* Materials pending QC
* Materials on QC hold
* Material shortage risk
* Material requests pending Logistic action
* Production orders waiting material
* Production orders in progress
* Finished product batches awaiting QC
* Finished product batches stored today

## Acceptance Criteria

* PPIC can create raw material order.
* PPIC can track ordered, received, QC pending, approved, hold, and rejected material.
* PPIC can create production plan.
* PPIC can see material readiness.
* PPIC can create material request.
* PPIC cannot approve QC.
* PPIC cannot physically issue material.
* PPIC cannot execute production stages.
* PPIC cannot access sales order, customer order, shipping, invoicing, payment, or delivery screens.

---

## 14.3 Phase 3 — Warehouse Operation Role

## Goal

Enable physical warehouse operation: receiving, putaway, inventory location, movement logs, issue execution, and finished product putaway.

## Screens

* Warehouse Operation Dashboard
* Expected Incoming Orders
* Raw Material Receiving
* Batch Label / Batch Detail
* Storage Assignment
* Warehouse Map
* Raw Material Putaway
* Issue Task Queue
* Material Issue to Production
* Finished Product Putaway
* Warehouse Alerts

## Warehouse Dashboard Widgets

* Expected incoming raw material orders
* Raw materials received today
* Batches in Receiving / Quarantine
* Approved batches waiting for putaway
* Issue tasks assigned by Logistic
* Finished product putaway tasks
* Warehouse alerts
* Storage utilization

## Acceptance Criteria

* Warehouse Operation can receive raw material against PPIC order.
* Newly created batch appears in QC queue.
* Warehouse Operation cannot approve QC.
* Warehouse Operation can put away only approved batches.
* Warehouse Operation can issue only available approved raw material.
* Warehouse Operation can put away only approved finished product.

---

## 14.4 Phase 4 — QC Role

## Goal

Enable raw material QC and finished product QC.

## Screens

* QC Dashboard
* Raw Material QC Queue
* Raw Material QC Detail
* Computer Vision Review
* QC Decision Modal
* Finished Product QC Queue
* Finished Product QC Detail
* QC Hold / Reject List

## QC Dashboard Widgets

* Raw material QC pending
* Raw material under QC
* AI/CV flagged inspections
* Hold batches
* Rejected batches
* Finished product QC pending
* Average QC cycle time

## Acceptance Criteria

* QC can see QC Pending batches.
* QC can record inspection results.
* QC can approve/hold/reject raw material.
* QC decision changes batch status.
* QC can release finished product.
* Hold/reject requires reason.
* QC decisions are logged.

---

## 14.5 Phase 5 — Logistic Role

## Goal

Enable internal material movement coordination and handoff monitoring.

## Screens

* Logistic Dashboard
* Material Request Queue
* Movement Priority Board
* Internal Movement Task Detail
* Material Issue Status Monitor
* Production Handoff Monitor
* Finished Product Putaway Coordination
* Logistic Alerts

## Logistic Dashboard Widgets

* Open material requests from PPIC
* Requests waiting warehouse execution
* Material issue tasks in progress
* Delayed production handoffs
* FG putaway tasks pending
* Escalated logistic alerts
* Movement completion rate

## Acceptance Criteria

* Logistic can see PPIC material requests.
* Logistic can prioritize or coordinate issue tasks.
* Logistic can monitor Warehouse Operation issue status.
* Logistic can monitor Production receipt status.
* Logistic can coordinate FG putaway readiness.
* Logistic cannot approve QC.
* Logistic cannot execute production stages.
* Logistic cannot replace Warehouse Operation physical confirmation.

---

## 14.6 Phase 6 — Production Role

## Goal

Enable production execution from approved issued raw material to finished product batch creation.

## Screens

* Production Dashboard
* Production Order List
* Production Order Detail
* Material Received Confirmation
* Production Stage Log
* Consumption Entry
* Yield and Output Entry
* Finished Product Batch Summary

## Production Dashboard Widgets

* Production orders ready to start
* Waiting for material issue
* Orders in progress
* Completed today
* Yield variance
* Finished product batches awaiting QC

## Acceptance Criteria

* Production cannot start without issued material unless Manager override exists.
* Production can confirm material receipt.
* Production can record consumption by raw material batch.
* Production can record output and yield.
* Completing production creates finished product batch.
* Finished product batch status becomes FG QC Pending.
* Production records are visible in batch genealogy.

---

## 14.7 Phase 7 — Manager Role

## Goal

Provide cross-functional visibility and exception management.

## Screens

* Manager Dashboard
* Operations Overview
* PPIC Planning Overview
* QC Performance
* Warehouse Operation Overview
* Logistic Overview
* Production Overview
* Alert Overview
* Batch Traceability
* Exception Approval
* Audit Summary

## Manager Dashboard Widgets

* Raw material orders by status
* Raw material batches by status
* QC pending count
* QC pass/hold/reject rate
* Approved material availability
* Material shortage risk
* Warehouse storage utilization
* Open logistic handoff delays
* Open alerts by severity
* Production orders by status
* Finished product batches awaiting QC
* Finished product stored today
* Critical exceptions

## Acceptance Criteria

* Manager can see end-to-end status from raw material order to FG putaway.
* Manager can open any batch and see full traceability.
* Manager can see PPIC, QC, Warehouse Operation, Logistic, and Production bottlenecks.
* Manager can see critical alerts.
* Manager does not accidentally perform operational tasks by default.

---

## 15. Website Screens

| Screen                        | Primary Role                             | Purpose                                                                 | Main Actions                            |
| ----------------------------- | ---------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------- |
| Login                         | All                                      | Authenticate user                                                       | Login                                   |
| Admin Dashboard               | Admin                                    | System setup overview                                                   | Navigate to settings                    |
| User Management               | Admin                                    | Manage users                                                            | Create, update, deactivate              |
| Master Data                   | Admin                                    | Manage suppliers/materials/products/locations/rules                     | CRUD master records                     |
| PPIC Dashboard                | PPIC                                     | Production planning overview                                            | Open ordering and planning tasks        |
| Raw Material Order            | PPIC                                     | Order raw materials for internal production                             | Create and track raw material orders    |
| Material Readiness            | PPIC                                     | Check ordered, received, QC pending, and approved material availability | Review readiness and shortage risk      |
| Create Production Order       | PPIC                                     | Plan internal production                                                | Create production plan                 |
| Material Request              | PPIC                                     | Request material from Logistic                                          | Create/track request                    |
| Warehouse Operation Dashboard | Warehouse Operation                      | Physical warehouse task overview                                        | Open receiving, putaway, issue tasks    |
| Raw Material Receiving        | Warehouse Operation                      | Record incoming raw material                                            | Create receipt and batch                |
| Batch Detail                  | All                                 | View batch status and history                                           | Role-specific actions                   |
| Storage Assignment            | Warehouse Operation                      | Assign approved batch to location                                       | Confirm putaway                         |
| Warehouse Map                 | Warehouse Operation / Manager / Logistic | Visualize storage                                                       | View/confirm location depending on role |
| Material Issue                | Warehouse Operation / Production         | Transfer material to production                                         | Issue and confirm receipt               |
| QC Dashboard                  | QC                                       | QC workload view                                                        | Open QC tasks                           |
| Raw Material QC Queue         | QC                                       | Pending raw material inspections                                        | Start inspection                        |
| Raw Material QC Detail        | QC                                       | Record raw material inspection                                          | Enter result and decide                 |
| CV Review                     | QC                                       | Review AI inspection result                                             | Use as support, continue QC             |
| Finished Product QC Queue     | QC                                       | Pending FG inspections                                                  | Start FG QC                             |
| Finished Product QC Detail    | QC                                       | Record FG QC decision                                                   | Approve/hold/reject                     |
| Logistic Dashboard            | Logistic                                 | Movement coordination overview                                          | Review requests and handoffs            |
| Material Request Queue        | Logistic                                 | Coordinate PPIC material requests                                       | Prioritize/assign movement              |
| Movement Priority Board       | Logistic                                 | Monitor internal transfer status                                        | Escalate delays                         |
| Production Dashboard          | Production                               | Production work overview                                                | Open production plan                   |
| Production Order Detail       | Production                               | Execute production                                                      | Start, update, complete                 |
| Alert Center                  | Manager/QC/Warehouse/Logistic/Production | Manage exceptions                                                       | Acknowledge/resolve based on role       |
| IoT Monitoring                | Manager/Warehouse/Logistic               | Monitor sensor readings                                                 | View alerts/readings                    |
| Manager Dashboard             | Manager                                  | Factory control overview                                                | Review KPIs/exceptions                  |
| Operations Overview           | Manager                                  | View internal flow status                                               | Drill down by role/process              |
| Batch Traceability            | Manager/Admin                            | Trace batch genealogy                                                   | View raw material order → FG batch      |
| Audit Log                     | Admin/Manager                            | Review system actions                                                   | Search/filter/export                    |

---

## 16. Data Model

## 16.1 Core Entities

| Entity                   | Key Fields                                                                                                                                    | Description                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| users                    | user_id, name, email, password_hash, role_id, status                                                                                          | System users                                                               |
| roles                    | role_id, role_name, description                                                                                                               | Roles: Admin, Manager, PPIC, Warehouse Operation, QC, Logistic, Production |
| permissions              | permission_id, role_id, module, action                                                                                                        | Role permissions                                                           |
| suppliers                | supplier_id, supplier_name, contact, status, notes                                                                                            | Supplier master for PPIC raw material ordering                             |
| raw_materials            | material_id, name, category, hazard_class_id, temp_min, temp_max, shelf_life_days, unit                                                       | Raw material master                                                        |
| products                 | product_id, name, category, storage_requirement, unit                                                                                         | Finished product master                                                    |
| warehouse_locations      | location_id, zone, rack, bin, location_type, temp_zone, capacity, status                                                                      | Storage locations                                                          |
| hazard_classes           | hazard_class_id, name, description                                                                                                            | Hazard categories                                                          |
| storage_rules            | rule_id, material_id, hazard_class_id, temp_min, temp_max, allowed_location_type, incompatible_hazard_class                                   | Slotting rules                                                             |
| raw_material_orders      | order_id, material_id, supplier_id, ordered_qty, unit, expected_arrival_date, priority, status, created_by_ppic, created_at, notes            | PPIC raw material order                                                    |
| raw_material_receipts    | receipt_id, order_id, material_id, received_qty, unit, supplier_lot, received_by_warehouse, received_at, packaging_condition, notes           | Receiving record linked to PPIC order when available                       |
| batches                  | batch_id, receipt_id, material_id, batch_type, qty, unit, expiry_date, status, current_location_id                                            | Raw material batch                                                         |
| qc_inspections           | qc_id, batch_id, inspection_type, sample_id, status, inspector_id, started_at, completed_at                                                   | QC inspection header                                                       |
| qc_parameters            | parameter_id, material_or_product_id, target_type, name, min_limit, max_limit, method, required                                               | QC checklist master                                                        |
| qc_results               | result_id, qc_id, parameter_id, value, pass_fail, notes                                                                                       | QC parameter result                                                        |
| cv_results               | cv_id, qc_id, image_url, defect_type, confidence_score, recommendation, model_version                                                         | CV decision-support output                                                 |
| inventory_lots           | inventory_id, batch_id, location_id, qty, unit, inventory_status                                                                              | Inventory by location                                                      |
| inventory_movements      | movement_id, batch_id, from_location_id, to_location_id, qty, movement_type, moved_by, moved_at                                               | Movement history                                                           |
| iot_sensors              | sensor_id, location_id, sensor_type, status, calibration_due_date                                                                             | Sensor master or simulated sensor                                          |
| sensor_readings          | reading_id, sensor_id, value, unit, reading_time, status                                                                                      | Sensor readings                                                            |
| alerts                   | alert_id, alert_type, severity, entity_type, entity_id, assigned_to_role, assigned_to_user, status, created_at, resolved_at, resolution_note  | Operational alerts                                                         |
| production_orders        | production_order_id, product_id, planned_qty, status, created_by_ppic, created_at, started_at, completed_at                                   | Internal production plan                                                  |
| material_requests        | request_id, production_order_id, requested_material_id, requested_qty, requested_by_ppic, assigned_to_logistic, status, created_at            | PPIC request to Logistic                                                   |
| logistic_movement_tasks  | task_id, request_id, task_type, priority, assigned_to_warehouse, status, created_by_logistic, created_at, completed_at                        | Logistic coordination task                                                 |
| material_issues          | issue_id, request_id, task_id, production_order_id, batch_id, qty_issued, issued_by_warehouse, received_by_production, issued_at, received_at | Warehouse to Production issue                                              |
| production_stage_logs    | stage_log_id, production_order_id, stage_name, status, started_at, completed_at, operator_id, notes                                           | Production stage tracking                                                  |
| material_consumption     | consumption_id, production_order_id, batch_id, qty_used, recorded_by, recorded_at                                                             | Actual consumption                                                         |
| finished_product_batches | fg_batch_id, production_order_id, product_id, qty, unit, status, current_location_id, created_at                                              | Finished product batch                                                     |
| finished_goods_qc        | fg_qc_id, fg_batch_id, inspector_id, result, decision, reason, completed_at                                                                   | Finished product QC                                                        |
| audit_logs               | audit_id, user_id, role_id, action, entity, entity_id, old_value, new_value, reason, created_at                                               | Immutable audit trail                                                      |

## 16.2 Key Relationships

```text
suppliers 1 → many raw_material_orders
raw_material_orders 1 → many raw_material_receipts
raw_material_receipts 1 → many batches
batches 1 → many qc_inspections
qc_inspections 1 → many qc_results
qc_inspections 1 → many cv_results
batches 1 → many inventory_movements
batches 1 → many material_issues
production_orders 1 → many material_requests
material_requests 1 → many logistic_movement_tasks
logistic_movement_tasks 1 → many material_issues
production_orders 1 → many material_issues
production_orders 1 → many material_consumption
production_orders 1 → many finished_product_batches
finished_product_batches 1 → many finished_goods_qc
warehouse_locations 1 → many inventory_lots
warehouse_locations 1 → many iot_sensors
iot_sensors 1 → many sensor_readings
alerts can relate to batch, location, sensor, QC inspection, material request, logistic movement task, or production plan
audit_logs can relate to any critical entity
```

---

## 17. Dashboard KPIs by Primary Role

## 17.1 Admin

| KPI                            | Purpose                           |
| ------------------------------ | --------------------------------- |
| Active users                   | Monitor user setup                |
| Roles configured               | Ensure access control setup       |
| Master data completion         | Ensure operational readiness      |
| Warehouse locations configured | Ensure warehouse setup readiness  |
| Materials/products configured  | Ensure production setup readiness |
| Recent admin changes           | Configuration governance          |
| Audit log count                | System activity visibility        |

## 17.2 Manager

| KPI                            | Purpose                      |
| ------------------------------ | ---------------------------- |
| Raw material orders by status  | Incoming material visibility |
| Raw material batches by status | End-to-end visibility        |
| QC pending count               | Bottleneck tracking          |
| QC pass/hold/reject rate       | Quality performance          |
| Approved material availability | Production readiness         |
| Material shortage risk         | PPIC and production risk     |
| Warehouse storage utilization  | Capacity control             |
| Open logistic handoff delays   | Internal movement risk       |
| Open critical alerts           | Risk management              |
| Production orders by status    | Factory execution visibility |
| FG QC pending                  | Release bottleneck           |
| FG stored today                | Completed internal output    |
| Traceability completeness      | Compliance readiness         |

## 17.3 PPIC

| KPI                                    | Purpose                       |
| -------------------------------------- | ----------------------------- |
| Raw material orders waiting arrival    | Incoming material tracking    |
| Raw material orders partially received | Receiving progress tracking   |
| Approved materials available           | Production planning readiness |
| Materials pending QC                   | Planning risk                 |
| Materials on hold                      | Production risk               |
| Material requests pending Logistic     | Handoff visibility            |
| Production orders waiting material     | Bottleneck tracking           |
| Production orders in progress          | Schedule visibility           |
| Finished product awaiting QC           | Release tracking              |
| Finished product stored                | Completed internal output     |

## 17.4 Warehouse Operation

| KPI                              | Purpose                      |
| -------------------------------- | ---------------------------- |
| Expected incoming orders         | Receiving preparation        |
| Raw materials received today     | Receiving workload           |
| QC Pending batches in quarantine | Space and handoff visibility |
| Approved batches waiting putaway | Putaway workload             |
| Storage utilization              | Capacity control             |
| Issue tasks assigned             | Production support workload  |
| Finished product putaway tasks   | FG warehouse workload        |
| Warehouse alerts                 | Operational risk             |

## 17.5 QC

| KPI                   | Purpose                           |
| --------------------- | --------------------------------- |
| RM QC pending         | Raw material QC workload          |
| RM under QC           | Active inspections                |
| AI/CV flagged lots    | Risk-prioritized QC               |
| Hold lots             | Investigation workload            |
| Rejected lots         | Quality control indicator         |
| FG QC pending         | Finished product release workload |
| Average QC cycle time | Bottleneck visibility             |

## 17.6 Logistic

| KPI                                        | Purpose                         |
| ------------------------------------------ | ------------------------------- |
| Open material requests                     | Work queue                      |
| Movement tasks waiting warehouse execution | Internal handoff tracking       |
| Delayed material issues                    | Production readiness risk       |
| Production handoffs pending confirmation   | Coordination workload           |
| FG putaway coordination tasks              | Finished goods handoff tracking |
| Escalated logistic alerts                  | Risk visibility                 |
| Average movement completion time           | Logistic performance            |

## 17.7 Production

| KPI                     | Purpose               |
| ----------------------- | --------------------- |
| Production orders ready | Work queue            |
| Waiting for material    | Dependency visibility |
| Orders in progress      | Execution tracking    |
| Completed orders today  | Output tracking       |
| Yield variance          | Process performance   |
| FG batches awaiting QC  | Handoff visibility    |

---

## 18. Acceptance Criteria

## 18.1 End-to-End Demo Acceptance Criteria

The MVP is successful if the team can demo this complete flow:

1. Admin configures users, suppliers, materials, products, warehouse locations, QC parameters, and storage rules.
2. PPIC creates raw material order.
3. Warehouse Operation receives raw material against the order.
4. System creates batch ID and sets status to QC Pending.
5. QC sees the batch in QC queue.
6. QC records sample and reviews CV result.
7. QC approves the raw material batch.
8. System recommends storage location.
9. Warehouse Operation confirms putaway.
10. IoT monitoring shows warehouse readings.
11. System generates a temperature alert.
12. Warehouse Operation resolves the physical alert or Logistic escalates if it affects movement/production readiness.
13. PPIC creates production plan and material request.
14. Logistic reviews and coordinates the material request.
15. Warehouse Operation issues approved raw material to Production.
16. Production confirms material receipt.
17. Production logs material consumption and output.
18. System creates finished product batch.
19. QC releases finished product.
20. Logistic coordinates FG putaway.
21. Warehouse Operation puts finished product into FG warehouse.
22. Manager sees full flow on dashboard.
23. Manager opens batch traceability from raw material order to finished product.

## 18.2 Role-Based UI Acceptance Criteria

* Each primary role lands on a different dashboard.
* Each primary role sees different widgets.
* Each primary role sees different table columns where appropriate.
* Each primary role sees only relevant action buttons.
* A role with read access does not automatically see every field.
* PPIC sees raw material ordering, planning, and readiness views, not warehouse physical operation buttons or sales screens.
* Warehouse Operation sees physical movement views, not QC decision buttons.
* QC sees inspection details, not production execution buttons.
* Logistic sees handoff coordination and movement status, not QC approval or production execution buttons.
* Production sees issued materials and production stages, not QC approval buttons.
* Manager sees summary and exception views, not routine data-entry forms by default.
* Unauthorized users cannot perform hidden actions through direct URL/API access.

## 18.3 Control Acceptance Criteria

* Warehouse Operation cannot approve QC.
* QC cannot perform warehouse putaway.
* PPIC cannot issue material physically.
* Logistic cannot approve QC or execute production.
* Production cannot consume unissued material.
* PPIC cannot manage sales, customer order, shipping to customer, invoicing, payment, or delivery.
* Held or rejected material cannot be requested or issued to production.
* Finished product cannot be stored as available until FG QC approval.
* Critical actions appear in audit log.

---

## 19. Non-Functional Requirements

| Category        | Requirement                                                                                                                |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Usability       | Role dashboards should make each role's next task obvious.                                                                 |
| Performance     | Demo data pages should load within 3 seconds.                                                                              |
| Security        | Role and permission checks must exist on frontend and backend/data layer.                                                  |
| Auditability    | Critical workflow actions must be logged.                                                                                  |
| Data Integrity  | Raw material order, batch, production, movement, and FG status transitions must be controlled.                             |
| Reliability     | MVP must work with simulated IoT and CV data.                                                                              |
| Maintainability | Code should be modular by domain: admin, manager, ppic, warehouse-operation, qc, logistic, production, IoT, alerts, audit. |
| Scalability     | Architecture should allow future sales, procurement, ERP, real IoT, real CV, maintenance role, and auditor role.           |

---

## 20. Suggested Modular Architecture

For MVP, build as a modular web application. The product can be microservices-oriented in design, but should be implemented simply enough for the competition.

```text
/apps/web
/apps/api

/modules/auth-rbac
/modules/admin
/modules/master-data
/modules/manager
/modules/ppic
/modules/warehouse-operation
/modules/qc
/modules/logistic
/modules/production
/modules/inventory
/modules/computer-vision
/modules/iot-monitoring
/modules/alerts
/modules/finished-goods
/modules/dashboard-reporting
/modules/audit-log
```

## 20.1 Future Microservices Mapping

| Future Service                | Current MVP Module  |
| ----------------------------- | ------------------- |
| Auth & RBAC Service           | auth-rbac           |
| Master Data Service           | admin/master data   |
| Manager Reporting Service     | manager/dashboard   |
| PPIC Planning Service         | ppic                |
| Warehouse Operation Service   | warehouse-operation |
| QC Service                    | qc                  |
| Logistic Coordination Service | logistic            |
| Computer Vision Service       | computer-vision     |
| IoT Telemetry Service         | iot                 |
| Alert Service                 | alerts              |
| Production Service            | production          |
| Finished Goods Service        | finished-goods      |
| Audit Service                 | audit               |

---

## 21. MVP Build Priority

## Sprint 1 — Buildpad/Kiro Setup and Admin

* Read Buildpad documentation.
* Inspect Buildpad/Kiro starter structure.
* Define collections/data schema using Buildpad-supported patterns if available.
* Include supplier and raw material order collections.
* Configure role-based login.
* Seed primary roles: Admin, Manager, PPIC, Warehouse Operation, QC, Logistic, Production.
* Build Admin screens.
* Build audit logging foundation.

## Sprint 2 — PPIC Raw Material Ordering

* PPIC dashboard.
* Raw material order list.
* Create raw material order.
* Raw material order status tracking.
* Material readiness view foundation.
* No sales order, customer order, shipping, invoicing, payment, or delivery screens.

## Sprint 3 — Warehouse Receiving and Batch Creation

* Warehouse Operation dashboard.
* Expected incoming orders.
* Raw material receiving form linked to PPIC raw material order.
* Batch ID generation.
* Batch detail page.
* QC Pending status.
* Receiving/quarantine location.
* Inventory lot and movement log foundation.

## Sprint 4 — QC Raw Material

* QC dashboard.
* QC queue.
* QC detail.
* CV mock result.
* Approve/hold/reject workflow.
* QC decision audit log.

## Sprint 5 — Warehouse Storage and Alerts

* Storage recommendation.
* Warehouse map.
* Putaway workflow.
* Simulated sensor readings.
* Alert center.

## Sprint 6 — PPIC Production Planning and Logistic Coordination

* Production order creation.
* Material request creation.
* Material request status tracking.
* Logistic dashboard.
* Material request queue.
* Movement priority board.
* Logistic handoff monitoring.

## Sprint 7 — Warehouse Issue and Production Execution

* Issue task queue for Warehouse Operation.
* Material issue workflow.
* Production dashboard.
* Material receipt confirmation.
* Production stage updates.
* Material consumption.
* Finished product batch creation.

## Sprint 8 — Finished Product QC and FG Putaway

* FG QC queue.
* FG QC decision.
* Logistic FG putaway coordination.
* FG storage assignment.
* Warehouse Operation FG putaway confirmation.

## Sprint 9 — Manager Dashboard and Traceability

* Manager dashboard.
* Operations overview.
* PPIC/QC/Warehouse/Logistic/Production bottleneck views.
* Batch traceability.
* Audit summary.

---

## 22. Future Roadmap

## Future Phase 1 — Advanced PPIC and Procurement

* Demand forecast.
* Advanced purchase request approval.
* Advanced purchase order approval.
* Supplier portal.
* Supplier quality scorecard.

## Future Phase 2 — After Finished Product Warehouse

* Sales order.
* Shipping schedule.
* Dispatch to customer.
* Delivery tracking.
* Customer complaints.
* Return handling.
* Invoice and payment integration.

## Future Phase 3 — Governance and Maintenance Roles

* Maintenance / IoT Technician role.
* Auditor / Viewer role.
* Sensor calibration workflow.
* Audit export.
* Compliance reports.

## Future Phase 4 — Advanced Technology

* Real IoT sensor integration.
* MQTT gateway.
* Real computer vision model.
* ERP integration.
* Mobile barcode scanning.
* Predictive quality analytics.
* Digital twin warehouse map.

---

## 23. Final Product Positioning

This MVP should be positioned as:

> A role-based smart factory operations website that controls the internal flow from PPIC raw material ordering to finished product warehouse putaway, with QC release, warehouse operation, logistic coordination, production traceability, IoT monitoring, and auditability.

The pitch should emphasize:

* Practical manufacturing flow.
* Clear MVP scope boundary.
* Buildpad-first Kiro implementation.
* Focused first roles: Admin, Manager, PPIC, Warehouse Operation, QC, Logistic, Production.
* PPIC can order raw materials and plan production, but does not manage sales.
* Warehouse Operation and Logistic are separated: Warehouse Operation executes physical movement; Logistic coordinates internal handoffs.
* Role-specific UI and data visibility.
* Human QC control.
* IoT and computer vision as decision-support tools.
* Batch genealogy from raw material order to finished product.
* Audit-ready operational records.

The product should not be pitched as a complete ERP or sales platform yet. It is the internal operations foundation that future procurement, sales, customer shipping, maintenance, audit, and ERP modules can connect to later.

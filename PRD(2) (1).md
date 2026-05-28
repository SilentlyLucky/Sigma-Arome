# Product Requirements Document (PRD)

# Sigma Arome Smart Operations Website

## Scope: Raw Material Warehouse Receiving → Finished Product Warehouse Putaway

---

## 1. Document Control

| Item                     | Details                                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Product Name             | Sigma Arome Smart Operations Website                                                                                           |
| Product Type             | Web-based manufacturing operations system with QC, warehouse, production, IoT monitoring, and batch traceability              |                                                                               |
| Scope Boundary           | Starts when raw material arrives at warehouse and ends when approved finished product is placed into finished goods warehouse |
| Excluded for Current MVP | Demand forecasting, purchase planning, sales, customer order management, shipping, invoicing, external ERP integration        |
| Future Scope             | Forecasting, purchasing, supplier management expansion, sales order, dispatch, delivery, invoicing, ERP integration           |
| Target Build Style       | Role-by-role implementation with role-specific UI, data visibility, and action permissions                                    |

---

## 2. Executive Summary

Sigma Arome needs a practical smart operations website to control and monitor the internal factory flow from raw material arrival until finished product storage.

This PRD scopes the MVP to the internal production chain only:

```text
Raw Material Arrival
→ Batch ID Creation
→ QC Sampling
→ Computer Vision-Assisted QC Review
→ QC Decision
→ Smart Storage Assignment
→ Raw Material Putaway
→ IoT Warehouse Monitoring
→ Alert Handling
→ Material Issue to Production
→ Production Execution
→ Finished Product Batch Creation
→ Finished Product QC
→ Finished Product Warehouse Putaway
→ Dashboard, Traceability, and Audit Log
```

The product should not include sales, external customer shipment, demand forecasting, or supplier purchasing in the current version. Those can be future modules.

The system must be implemented role by role. Each role should have a different UI, different dashboard, different table columns, different action buttons, and different data scope, even when several roles read from the same database.

---

## 3. Problem Statement

Sigma Arome's factory operations need stronger control over raw material quality, warehouse storage, cold-chain risks, production visibility, and finished product release.

Current operational pain points include:

* Raw material receiving is manually recorded.
* Batch IDs and movement records may be fragmented.
* QC queues and decisions are not visible in real time.
* Warehouse storage decisions depend on manual judgment or spreadsheets.
* Cold-chain and storage-condition risks may be detected late.
* Material movement from warehouse to production is difficult to trace.
* Production progress and raw material consumption are not connected clearly to finished product batches.
* Finished product release and storage are not always connected to batch genealogy.
* Managers lack a single dashboard showing batch status, QC bottlenecks, warehouse alerts, and production progress.

---

## 4. Product Vision

Create a role-based smart operations website that gives Sigma Arome one source of truth for internal batch movement, QC release, storage status, IoT alerts, production execution, finished product release, and traceability.

The product should be realistic for manufacturing operations:

* QC Staff makes the final QC decision.
* Computer vision supports inspection but does not automatically approve material.
* IoT readings support monitoring but require human handling for alerts.
* Warehouse movement is confirmed using batch and location records.
* Every critical decision is auditable.

---

## 5. Product Goals

| Goal                             | Description                                                                                | Success Indicator                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Control raw material receiving   | Record incoming raw material and create internal batch identity                            | Every received lot has a unique batch ID                            |
| Improve QC visibility            | Show QC queue, sampling, CV result, and decision status                                    | QC Staff can process pending batches from one screen                |
| Support QC with computer vision  | Use image-based inspection support for visible defects, label issues, and packaging damage | QC page shows defect score and recommendation                       |
| Improve warehouse storage        | Recommend storage locations based on status, temperature, hazard, capacity, and FEFO       | Approved batches receive storage recommendation                     |
| Monitor storage condition        | Display simulated or real temperature/humidity readings                                    | Alerts appear when readings exceed limits                           |
| Trace material to production     | Link raw material batches to production orders and finished product batches                | Batch detail page shows genealogy                                   |
| Control finished product release | Require FG QC before finished product can become available in warehouse                    | Only approved finished product can be put into FG available storage |
| Enforce role-specific work       | Each role sees only relevant data and actions                                              | UI differs by role, not only by page access                         |
| Maintain audit trail             | Log all critical changes and approvals                                                     | Audit log shows who, what, when, and why                            |

---

## 6. Scope

## 6.1 In Scope for Current MVP

| Module                             | Included? | Description                                                                         |
| ---------------------------------- | --------: | ----------------------------------------------------------------------------------- |
| Role-based login                   |       Yes | Users log in and are redirected to role-specific dashboard                          |
| Raw material receiving             |       Yes | Warehouse records raw material arrival                                              |
| Batch ID generation                |       Yes | System generates internal batch ID                                                  |
| Raw material QC queue              |       Yes | QC sees batches pending inspection                                                  |
| QC sampling                        |       Yes | QC records sample details                                                           |
| Computer vision-assisted review    |       Yes | Simulated or simple image result shown to QC                                        |
| QC decision                        |       Yes | QC approves, rejects, or holds raw material                                         |
| Quarantine handling                |       Yes | Hold/rejected lots stay in quarantine status/location                               |
| Smart storage assignment           |       Yes | System recommends storage location for approved batches                             |
| Warehouse map                      |       Yes | Shows raw material and finished goods zones                                         |
| Raw material putaway               |       Yes | Warehouse confirms physical storage                                                 |
| IoT monitoring                     |       Yes | Simulated or real sensor readings for storage areas                                 |
| Alert center                       |       Yes | Alerts for temperature anomaly, near expiry, hazard conflict, sensor issue, QC hold |
| Material issue to production       |       Yes | Warehouse issues approved raw material to production                                |
| Production execution               |       Yes | Production logs process stage, consumption, yield, and output                       |
| Finished product batch             |       Yes | System creates finished product batch from production order                         |
| Finished product QC                |       Yes | QC releases, rejects, or holds finished product                                     |
| Finished product warehouse putaway |       Yes | Warehouse stores approved finished product                                          |
| Manager dashboard                  |       Yes | Shows internal factory KPIs only                                                    |
| Batch traceability                 |       Yes | Raw material batch → production → finished product batch                            |
| Audit log                          |       Yes | Tracks critical actions                                                             |
| Admin settings                     |       Yes | Users, roles, master data, storage rules, hazard rules                              |

## 6.2 Out of Scope for Current MVP

| Excluded Module              | Reason                                        | Future Phase              |
| ---------------------------- | --------------------------------------------- | ------------------------- |
| Demand forecasting           | Happens before raw material warehouse arrival | Future planning module    |
| Purchase order creation      | Outside current scope boundary                | Future procurement module |
| Supplier scoring             | Useful but not needed for internal flow MVP   | Future quality analytics  |
| Sales order                  | Happens after finished product warehouse      | Future sales module       |
| Shipping / dispatch          | After final product is placed into warehouse  | Future logistics module   |
| Customer delivery            | Outside current internal operations scope     | Future logistics module   |
| Invoice / payment            | Not relevant to warehouse-to-production MVP   | Future ERP integration    |
| Full ERP integration         | Too large for hackathon MVP                   | Future integration phase  |
| Real IoT hardware dependency | MVP should work without hardware              | Future real deployment    |
| Fully trained CV model       | Requires dataset and validation               | Future AI model phase     |

---

## 7. Users and Role-Specific Purpose

## 7.1 Admin

**Purpose:** Configure the system, users, roles, master data, hazard rules, storage rules, and audit visibility.

**Primary UI:** Admin Control Center.

**Primary Data:** Users, roles, permissions, materials, products, warehouse zones, sensors, storage rules, hazard rules, audit logs.

**Should Not Be Default Actor For:** QC approval, raw material putaway, production execution, finished product QC.

## 7.2 Manager / Plant Head

**Purpose:** Monitor factory health, bottlenecks, alerts, QC status, production progress, and traceability.

**Primary UI:** Executive Operations Dashboard.

**Primary Data:** Summarized KPIs, exception records, batch status, production status, QC bottlenecks, alert severity, audit summaries.

**Main Actions:** Review, approve major exceptions, view traceability, monitor performance.

## 7.3 Warehouse Operator

**Purpose:** Receive raw material, confirm storage, issue material to production, and put away finished product.

**Primary UI:** Warehouse Task Dashboard.

**Primary Data:** Receiving tasks, batch labels, storage assignments, exact locations, warehouse map, movement tasks, warehouse alerts.

**Main Actions:** Receive, create batch, confirm putaway, move batch, issue material, store finished product, acknowledge warehouse alerts.

## 7.4 QC Staff

**Purpose:** Inspect raw materials and finished products, review CV result, and make QC decisions.

**Primary UI:** QC Workbench.

**Primary Data:** QC queue, samples, COA summary if available, CV results, QC parameters, defect records, hold/reject reasons.

**Main Actions:** Create sample, enter QC result, review CV result, approve, reject, hold.

## 7.5 Production Staff

**Purpose:** Execute production using approved raw material and create finished product output.

**Primary UI:** Production Execution Board.

**Primary Data:** Production orders, material readiness, issued batches, process stages, consumption, yield, output batch.

**Main Actions:** Start production, record stage, consume material, record yield, complete production.

## 7.6 Maintenance / IoT Technician

**Purpose:** Monitor sensor health and resolve sensor or storage-condition technical issues.

**Primary UI:** IoT Maintenance Dashboard.

**Primary Data:** Sensors, readings, calibration status, sensor alerts, anomaly history.

**Main Actions:** Acknowledge sensor alert, mark sensor checked, enter calibration/maintenance notes.

## 7.7 Auditor / Viewer

**Purpose:** Review records, traceability, and audit logs without changing operations.

**Primary UI:** Read-Only Audit & Traceability View.

**Primary Data:** Batch history, QC decisions, movement logs, production records, audit logs.

**Main Actions:** Search, filter, view, export if allowed.

---

## 8. Role-Based UI and Data Visibility Requirements

## 8.1 Principle

Access control is not enough. The system must also control what each role sees on screen.

Two roles may both have read access to the same database entity, but they should not see the same columns, filters, dashboard cards, or actions.

Example:

* PPIC is future scope for this MVP, so PPIC screens are not implemented now.
* Warehouse sees exact bin, rack, scan status, and movement action.
* QC sees sample result, CV score, QC parameter values, and decision buttons.
* Manager sees summarized operational status and exceptions.
* Auditor sees read-only history and audit trail.

## 8.2 Role-Based UI Rules

| Requirement ID | Requirement                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| RBUI-001       | The system shall render dashboard widgets based on user role.                                                                            |
| RBUI-002       | The system shall apply role-specific table columns for shared data such as batches, inventory, QC status, alerts, and production orders. |
| RBUI-003       | The system shall filter records by operational relevance, not only permission level.                                                     |
| RBUI-004       | The system shall hide action buttons that the current role is not allowed to use.                                                        |
| RBUI-005       | The system shall show exact warehouse location only to Warehouse, Manager, Admin, and Auditor roles.                                     |
| RBUI-006       | The system shall show detailed QC parameter values only to QC, Manager, Admin, and Auditor roles.                                        |
| RBUI-007       | The system shall show production execution action buttons only to Production Staff.                                                      |
| RBUI-008       | The system shall show sensor maintenance actions only to Maintenance / IoT Technician.                                                   |
| RBUI-009       | The system shall show approval actions only to authorized roles.                                                                         |
| RBUI-010       | The system shall show all operational records to Auditor in read-only mode.                                                              |

## 8.3 Role-Specific Batch List Views

| Field / Action             | Admin | Manager                | Warehouse    | QC                | Production               | Maintenance                     | Auditor |
| -------------------------- | ----- | ---------------------- | ------------ | ----------------- | ------------------------ | ------------------------------- | ------- |
| Batch ID                   | Show  | Show                   | Show         | Show              | Show                     | Show if sensor/location related | Show    |
| Material Name              | Show  | Show                   | Show         | Show              | Show                     | Show if relevant                | Show    |
| Supplier Lot               | Show  | Show                   | Show         | Show              | Hide by default          | Hide                            | Show    |
| QC Status                  | Show  | Show                   | Summary only | Detailed          | Summary only             | Hide unless alert related       | Show    |
| QC Parameter Values        | Show  | Show                   | Hide         | Show              | Hide                     | Hide                            | Show    |
| CV Result                  | Show  | Summary                | Hide         | Show              | Hide                     | Hide                            | Show    |
| Exact Location             | Show  | Show                   | Show         | Read-only summary | Pick/issue location only | Sensor zone only                | Show    |
| Quantity                   | Show  | Show                   | Show         | Show              | Issued/required qty only | Hide                            | Show    |
| Expiry Date                | Show  | Show                   | Show         | Show              | Show if issued           | Hide                            | Show    |
| Production Link            | Show  | Show                   | Read-only    | Read-only         | Show                     | Hide                            | Show    |
| Receive Button             | Hide  | Hide                   | Show         | Hide              | Hide                     | Hide                            | Hide    |
| QC Decision Button         | Hide  | Manager exception only | Hide         | Show              | Hide                     | Hide                            | Hide    |
| Putaway Button             | Hide  | Hide                   | Show         | Hide              | Hide                     | Hide                            | Hide    |
| Issue to Production Button | Hide  | Hide                   | Show         | Hide              | Confirm receipt only     | Hide                            | Hide    |
| Production Action Button   | Hide  | Hide                   | Hide         | Hide              | Show                     | Hide                            | Hide    |
| Sensor Action Button       | Hide  | Hide                   | Hide         | Hide              | Hide                     | Show                            | Hide    |

---

## 9. End-to-End Process Flow

## 9.1 Raw Material Receiving

1. Warehouse Operator logs in.
2. Operator opens Raw Material Receiving page.
3. Operator records incoming material:

   * material name
   * supplier name or supplier lot, if available
   * received quantity
   * unit
   * expiry date or manufacturing date
   * packaging condition
   * delivery note reference, if available
4. System generates receipt number.
5. System generates internal batch ID.
6. Batch status becomes `QC Pending`.
7. Batch location becomes `Receiving / Quarantine`.
8. Audit log records receipt and batch creation.

## 9.2 Raw Material QC

1. QC Staff logs in.
2. QC dashboard shows QC Pending batches.
3. QC Staff opens QC inspection detail.
4. QC Staff creates sample record.
5. QC Staff uploads/selects inspection image.
6. System displays computer vision-assisted result:

   * defect type
   * confidence score
   * recommendation
7. QC Staff records manual QC parameters.
8. QC Staff decides:

   * Approve
   * Hold
   * Reject
9. System updates batch status.
10. Audit log records decision and reason.

## 9.3 Smart Storage Assignment

1. Approved raw material triggers storage assignment.
2. System checks:

   * material storage temperature
   * hazard class
   * available capacity
   * quarantine/approved status
   * FEFO priority
3. System recommends warehouse location.
4. Warehouse Operator confirms location.
5. Batch status becomes `Stored - Available`.
6. Audit log records putaway.

## 9.4 IoT Monitoring and Alert Handling

1. System receives or simulates sensor readings.
2. System compares readings against storage thresholds.
3. If reading is out of range, system creates alert.
4. Alert appears on Warehouse, Maintenance, and Manager dashboards.
5. Assigned user acknowledges alert.
6. User enters corrective action.
7. Alert status becomes Resolved.
8. Audit log records alert lifecycle.

## 9.5 Material Issue to Production

1. Production Staff sees available production task.
2. Warehouse receives material issue task.
3. Warehouse selects approved raw material batch.
4. System validates:

   * batch status is Available
   * batch is not expired
   * batch is not on hold
   * quantity is sufficient
5. Warehouse issues material to production.
6. Production confirms material received.
7. Inventory quantity decreases.
8. Audit log records issue transaction.

## 9.6 Production Execution

1. Production Staff starts production order.
2. System links production order to issued raw material batches.
3. Production Staff records production stage updates.
4. Production Staff records material consumption.
5. Production Staff records output quantity and yield.
6. System creates finished product batch.
7. Finished product status becomes `FG QC Pending`.
8. Audit log records production completion.

## 9.7 Finished Product QC

1. QC Staff sees finished product QC queue.
2. QC Staff opens finished product batch.
3. QC Staff records finished product QC parameters.
4. QC Staff decides:

   * Approved
   * Hold
   * Rejected
5. Approved finished product becomes eligible for FG warehouse putaway.
6. Hold/rejected finished product remains in quarantine or blocked status.
7. Audit log records decision.

## 9.8 Finished Product Warehouse Putaway

1. Warehouse sees approved finished product putaway task.
2. System recommends finished goods warehouse location.
3. Warehouse confirms putaway.
4. Finished product batch status becomes `Stored - Finished Goods Available`.
5. Current MVP ends here.

---

## 10. Functional Requirements

## 10.1 Authentication and Role Routing

| ID       | Requirement                                           | Priority  |
| -------- | ----------------------------------------------------- | --------- |
| AUTH-001 | Users must log in using account credentials.          | Must Have |
| AUTH-002 | System must identify user role after login.           | Must Have |
| AUTH-003 | System must redirect user to role-specific dashboard. | Must Have |
| AUTH-004 | User must not access pages outside role permission.   | Must Have |
| AUTH-005 | Unauthorized action buttons must not be visible.      | Must Have |

## 10.2 Raw Material Receiving

| ID         | Requirement                                                                  | Priority     |
| ---------- | ---------------------------------------------------------------------------- | ------------ |
| RM-REC-001 | Warehouse Operator must create raw material receiving record.                | Must Have    |
| RM-REC-002 | System must generate receipt number.                                         | Must Have    |
| RM-REC-003 | System must generate unique internal batch ID.                               | Must Have    |
| RM-REC-004 | Newly received raw material must default to QC Pending.                      | Must Have    |
| RM-REC-005 | Newly received raw material must default to Receiving / Quarantine location. | Must Have    |
| RM-REC-006 | System must support packaging condition notes.                               | Must Have    |
| RM-REC-007 | System should support delivery note or COA attachment.                       | Nice to Have |

## 10.3 Batch Management

| ID        | Requirement                                                                                   | Priority  |
| --------- | --------------------------------------------------------------------------------------------- | --------- |
| BATCH-001 | Each batch must have unique internal batch ID.                                                | Must Have |
| BATCH-002 | Batch must track material, quantity, unit, status, location, expiry date, and source receipt. | Must Have |
| BATCH-003 | Batch detail must show movement history.                                                      | Must Have |
| BATCH-004 | Batch detail must show QC history.                                                            | Must Have |
| BATCH-005 | Batch detail must show production genealogy if used in production.                            | Must Have |
| BATCH-006 | Batch status changes must follow controlled workflow.                                         | Must Have |

## 10.4 Raw Material QC

| ID        | Requirement                                                | Priority  |
| --------- | ---------------------------------------------------------- | --------- |
| RM-QC-001 | QC Staff must see QC Pending raw material queue.           | Must Have |
| RM-QC-002 | QC Staff must create sample record.                        | Must Have |
| RM-QC-003 | QC Staff must enter manual QC parameter results.           | Must Have |
| RM-QC-004 | QC Staff must review CV result when image is available.    | Must Have |
| RM-QC-005 | QC Staff must approve, reject, or hold raw material batch. | Must Have |
| RM-QC-006 | Hold and reject decisions must require reason code.        | Must Have |
| RM-QC-007 | System must block non-QC role from making QC decision.     | Must Have |

## 10.5 Computer Vision-Assisted QC

| ID     | Requirement                                                                 | Priority  |
| ------ | --------------------------------------------------------------------------- | --------- |
| CV-001 | QC Staff must be able to upload or select sample image.                     | Must Have |
| CV-002 | System must display CV defect result, confidence score, and recommendation. | Must Have |
| CV-003 | CV result must be marked as decision support only.                          | Must Have |
| CV-004 | CV result must be stored with inspection record.                            | Must Have |
| CV-005 | MVP may simulate CV result using mock data.                                 | Must Have |

## 10.6 Storage Assignment

| ID       | Requirement                                               | Priority     |
| -------- | --------------------------------------------------------- | ------------ |
| STOR-001 | System must recommend location only for approved batches. | Must Have    |
| STOR-002 | Recommendation must consider storage temperature.         | Must Have    |
| STOR-003 | Recommendation must consider hazard compatibility.        | Must Have    |
| STOR-004 | Recommendation must consider location capacity.           | Must Have    |
| STOR-005 | Recommendation should consider FEFO.                      | Nice to Have |
| STOR-006 | Warehouse Operator must confirm putaway.                  | Must Have    |
| STOR-007 | Putaway must update inventory location.                   | Must Have    |

## 10.7 Warehouse Map

| ID         | Requirement                                                                                                                         | Priority  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------- |
| WH-MAP-001 | Warehouse map must show receiving/quarantine, raw material storage, cold storage, production staging, and finished goods warehouse. | Must Have |
| WH-MAP-002 | Warehouse map must show slot status: empty, occupied, reserved, blocked, alert.                                                     | Must Have |
| WH-MAP-003 | User must click location to see batches stored there.                                                                               | Must Have |
| WH-MAP-004 | Warehouse role must see exact rack/bin/slot.                                                                                        | Must Have |
| WH-MAP-005 | Manager and Auditor must see exact location in read-only mode.                                                                      | Must Have |

## 10.8 IoT Monitoring

| ID      | Requirement                                                    | Priority     |
| ------- | -------------------------------------------------------------- | ------------ |
| IOT-001 | System must display temperature and humidity readings by zone. | Must Have    |
| IOT-002 | MVP may use simulated sensor data.                             | Must Have    |
| IOT-003 | System must compare readings against allowed thresholds.       | Must Have    |
| IOT-004 | System must create alert for out-of-range readings.            | Must Have    |
| IOT-005 | Maintenance must see sensor health and calibration status.     | Nice to Have |

## 10.9 Alert Management

| ID        | Requirement                                             | Priority  |
| --------- | ------------------------------------------------------- | --------- |
| ALERT-001 | System must create alerts for temperature anomaly.      | Must Have |
| ALERT-002 | System must create alerts for near-expiry raw material. | Must Have |
| ALERT-003 | System must create alerts for hazard conflict.          | Must Have |
| ALERT-004 | System must create alerts for QC hold.                  | Must Have |
| ALERT-005 | Assigned users must acknowledge alerts.                 | Must Have |
| ALERT-006 | Assigned users must resolve alerts with action notes.   | Must Have |
| ALERT-007 | Manager must see all critical open alerts.              | Must Have |

## 10.10 Material Issue to Production

| ID        | Requirement                                                            | Priority  |
| --------- | ---------------------------------------------------------------------- | --------- |
| ISSUE-001 | Warehouse must issue only approved and available raw material batches. | Must Have |
| ISSUE-002 | System must block held, rejected, expired, or insufficient batches.    | Must Have |
| ISSUE-003 | Production Staff must confirm received material.                       | Must Have |
| ISSUE-004 | Inventory quantity must decrease after issue.                          | Must Have |
| ISSUE-005 | Issue transaction must link raw material batch to production order.    | Must Have |

## 10.11 Production Execution

| ID       | Requirement                                                            | Priority  |
| -------- | ---------------------------------------------------------------------- | --------- |
| PROD-001 | Production Staff must see assigned production orders.                  | Must Have |
| PROD-002 | Production Staff must start production order.                          | Must Have |
| PROD-003 | Production Staff must record stage updates.                            | Must Have |
| PROD-004 | Production Staff must record actual material consumption.              | Must Have |
| PROD-005 | Production Staff must record output quantity and yield.                | Must Have |
| PROD-006 | System must create finished product batch after production completion. | Must Have |
| PROD-007 | Finished product batch must link to consumed raw material batches.     | Must Have |

## 10.12 Finished Product QC

| ID        | Requirement                                                             | Priority  |
| --------- | ----------------------------------------------------------------------- | --------- |
| FG-QC-001 | QC Staff must see finished product QC queue.                            | Must Have |
| FG-QC-002 | QC Staff must enter finished product QC result.                         | Must Have |
| FG-QC-003 | QC Staff must approve, reject, or hold finished product batch.          | Must Have |
| FG-QC-004 | Hold and reject must require reason code.                               | Must Have |
| FG-QC-005 | Only approved finished product can be stored as available FG inventory. | Must Have |

## 10.13 Finished Product Warehouse Putaway

| ID        | Requirement                                                              | Priority  |
| --------- | ------------------------------------------------------------------------ | --------- |
| FG-WH-001 | Warehouse must see approved FG putaway tasks.                            | Must Have |
| FG-WH-002 | System must recommend finished goods warehouse location.                 | Must Have |
| FG-WH-003 | Warehouse must confirm FG putaway.                                       | Must Have |
| FG-WH-004 | System must update FG batch status to Stored - Finished Goods Available. | Must Have |
| FG-WH-005 | Current MVP must end after FG putaway.                                   | Must Have |

## 10.14 Audit Log

| ID        | Requirement                                                                                                                                          | Priority  |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| AUDIT-001 | System must log receiving, batch creation, QC decision, storage, issue, production completion, FG QC, FG putaway, alert handling, and admin changes. | Must Have |
| AUDIT-002 | Audit log must include user, role, action, entity, entity ID, timestamp, old value, new value, and reason when applicable.                           | Must Have |
| AUDIT-003 | Audit log must be read-only for all normal users.                                                                                                    | Must Have |
| AUDIT-004 | Auditor, Manager, and Admin must view audit logs.                                                                                                    | Must Have |

---

## 11. Business Rules

## 11.1 Raw Material Batch Status Flow

```text
Received
→ QC Pending
→ Under QC
→ Approved / Hold / Rejected
→ Storage Assigned
→ Stored - Available
→ Issued to Production
→ Consumed in Production
```

Rules:

* New raw material batch must start as `QC Pending`.
* Only QC Staff can approve, hold, or reject.
* Hold/reject requires reason.
* Only Approved batch can receive storage assignment.
* Only Stored - Available batch can be issued to production.
* Rejected batch cannot be used in production.

## 11.2 Finished Product Batch Status Flow

```text
Created from Production
→ FG QC Pending
→ FG Approved / FG Hold / FG Rejected
→ FG Storage Assigned
→ Stored - Finished Goods Available
```

Rules:

* Finished product batch must be created from production order.
* Finished product batch must link to consumed raw material batches.
* Only QC Staff can release finished product.
* Only FG Approved batch can be put away into available finished goods storage.
* MVP ends when FG batch is stored in warehouse.

## 11.3 Warehouse Rules

* Warehouse can receive material but cannot approve QC.
* Warehouse can put away only approved raw material or approved finished goods.
* Warehouse can issue only approved raw material to production.
* Exact location changes must be logged.
* Location override must require reason.

## 11.4 QC Rules

* Computer vision result is recommendation only.
* QC Staff must make final decision.
* QC decisions must include timestamp and user.
* Hold/reject must include reason code.
* QC result cannot be deleted, only superseded or corrected through controlled update.

## 11.5 Production Rules

* Production cannot consume material that has not been issued.
* Actual consumption must link to raw material batch ID.
* Finished product output must create FG batch.
* Yield variance should be displayed on production and manager dashboards.

## 11.6 IoT and Alert Rules

* Sensor readings outside threshold must create alert.
* Critical alert must remain open until resolved.
* Alert resolution requires action note.
* Sensor failure must not silently mark storage as safe.

---

## 12. RBAC Matrix

Legend: C = Create, R = Read, U = Update, D = Delete, A = Approve, X = No Access.

| Module                   |   Admin |   Manager | Warehouse |        QC |  Production | Maintenance | Auditor |
| ------------------------ | ------: | --------: | --------: | --------: | ----------: | ----------: | ------: |
| User Management          | C/R/U/D |         X |         X |         X |           X |           X |       X |
| Master Data              | C/R/U/D |         R |         R |         R |           R |           R |       R |
| Raw Material Receiving   |       R |         R |     C/R/U |         R |           X |           X |       R |
| Batch Master             |       R |         R |     C/R/U |       R/U |           R |   R limited |       R |
| Raw Material QC          |       R |         R | R summary |   C/R/U/A |           X |           X |       R |
| CV Review                |       R | R summary |         X |     C/R/U |           X |           X |       R |
| Storage Assignment       |       R |         R |     C/R/U |         R |           R |           X |       R |
| Warehouse Map            |       R |         R |     C/R/U | R limited |   R limited | R zone only |       R |
| IoT Monitoring           |       R |         R |         R |         R |   R limited |       C/R/U |       R |
| Alert Center             |       R |       R/A |       R/U |     R/U/A | R/U limited |       C/R/U |       R |
| Material Issue           |       R |         R |     C/R/U |         R | R/U confirm |           X |       R |
| Production Execution     |       R |         R |         R |         R |       C/R/U |           X |       R |
| Finished Product QC      |       R |         R |         R |   C/R/U/A |           R |           X |       R |
| Finished Product Putaway |       R |         R |     C/R/U |         R |           R |           X |       R |
| Dashboard                |       R |         R |         R |         R |           R |           R |       R |
| Audit Log                |       R |         R |         X |         X |           X |           X |       R |

---

## 13. Role-by-Role Implementation Plan

## Implementation Principle

Build the web app one role at a time. Each role must be usable independently before adding the next role.

Recommended order:

```text
1. Admin
2. Warehouse Operator
3. QC Staff
4. Production Staff
5. Maintenance / IoT Technician
6. Manager / Plant Head
7. Auditor / Viewer
```

This order works because Admin creates setup data, Warehouse starts the real process, QC controls release, Production consumes material, Maintenance handles IoT alerts, Manager views everything, and Auditor validates traceability.

---

## 13.1 Phase 1 — Admin Role

## Goal

Create the system foundation.

## Screens

* Admin Dashboard
* User Management
* Role Management
* Material Master
* Product Master
* Warehouse Location Master
* Hazard Class Rules
* Storage Rules
* Sensor Master
* Audit Log Viewer

## Admin Dashboard Widgets

* Total users
* Active roles
* Master data completion
* Warehouse locations configured
* Sensors configured
* Recent admin changes

## Admin Actions

* Create users.
* Assign roles.
* Create raw material master.
* Create product master.
* Create warehouse locations.
* Define storage temperature ranges.
* Define hazard classes.
* Define sensors.
* View audit logs.

## Acceptance Criteria

* Admin can create all required master data.
* Admin can create at least one user per role.
* Admin actions are logged.
* Non-admin users cannot access Admin pages.

---

## 13.2 Phase 2 — Warehouse Operator Role

## Goal

Enable raw material receiving and warehouse movement.

## Screens

* Warehouse Dashboard
* Raw Material Receiving
* Batch Label / Batch Detail
* Storage Assignment
* Warehouse Map
* Raw Material Putaway
* Material Issue to Production
* Finished Product Putaway
* Warehouse Alerts

## Warehouse Dashboard Widgets

* Raw materials waiting to receive
* Batches in quarantine / QC Pending
* Approved batches waiting for putaway
* Material issue tasks
* Finished product putaway tasks
* Warehouse alerts
* Storage utilization

## Warehouse-Specific Data View

Warehouse sees:

* Batch ID
* Material name
* Physical quantity
* Unit
* Status
* Exact location
* Storage recommendation
* Putaway task
* Issue task
* Alert status

Warehouse does not need to see:

* Detailed QC parameter values
* Full CV model result details
* Admin configuration internals
* Manager-only performance analytics

## Warehouse Actions

* Receive raw material.
* Generate batch ID.
* Print or view batch label.
* Confirm raw material putaway.
* Move batch location.
* Issue raw material to production.
* Put away approved finished product.
* Acknowledge and resolve warehouse-related alerts.

## Acceptance Criteria

* Warehouse can create raw material batch.
* Newly created batch appears in QC queue.
* Warehouse cannot approve QC.
* Warehouse can put away only approved batches.
* Warehouse can issue only available approved raw material.
* Warehouse can put away only approved finished product.

---

## 13.3 Phase 3 — QC Staff Role

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

## QC-Specific Data View

QC sees:

* Batch ID
* Material name
* Supplier lot if available
* Sample ID
* QC parameter values
* CV result
* Inspection image
* Packaging condition
* COA/document summary if available
* Hold/reject reason
* Decision history

QC does not need to see:

* Exact warehouse bin after release except summary location
* Full user management
* Sensor maintenance actions
* Production stage editing buttons

## QC Actions

* Start QC inspection.
* Create sample record.
* Upload/select inspection image.
* Review CV result.
* Enter QC parameter values.
* Approve raw material.
* Hold raw material.
* Reject raw material.
* Approve finished product.
* Hold finished product.
* Reject finished product.

## Acceptance Criteria

* QC can see QC Pending batches.
* QC can record inspection results.
* QC can approve/hold/reject raw material.
* QC decision changes batch status.
* QC can release finished product.
* Hold/reject requires reason.
* QC decisions are logged.

---

## 13.4 Phase 4 — Production Staff Role

## Goal

Enable production execution from approved raw material to finished product batch creation.

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

## Production-Specific Data View

Production sees:

* Production order ID
* Product name
* Required material summary
* Issued raw material batch ID
* Issued quantity
* Process stage
* Consumption quantity
* Output quantity
* Yield
* FG batch ID

Production does not need to see:

* Detailed supplier information
* Detailed QC parameter values
* Warehouse full map controls
* Admin settings
* Sensor configuration

## Production Actions

* Confirm material received.
* Start production.
* Update production stage.
* Record material consumption.
* Record output quantity.
* Complete production.
* Generate finished product batch.

## Acceptance Criteria

* Production cannot start without issued material unless manager override exists.
* Production can record consumption by raw material batch.
* Completing production creates finished product batch.
* Finished product batch status becomes FG QC Pending.
* Production records are visible in batch genealogy.

---

## 13.5 Phase 5 — Maintenance / IoT Technician Role

## Goal

Enable monitoring and handling of sensor-related issues.

## Screens

* IoT Maintenance Dashboard
* Sensor List
* Sensor Detail
* Sensor Reading History
* Sensor Alert Detail
* Calibration / Maintenance Notes

## Maintenance Dashboard Widgets

* Active sensors
* Offline sensors
* Calibration due
* Temperature anomalies
* Humidity anomalies
* Open sensor alerts
* Average alert resolution time

## Maintenance-Specific Data View

Maintenance sees:

* Sensor ID
* Sensor type
* Sensor location zone
* Current reading
* Last reading time
* Calibration due date
* Sensor status
* Alert history

Maintenance does not need to see:

* QC parameter details
* Production consumption details
* Admin user management
* Supplier information
* Financial or sales data

## Maintenance Actions

* Acknowledge sensor alert.
* Add maintenance note.
* Mark sensor checked.
* Update sensor status.
* Record calibration action.

## Acceptance Criteria

* Maintenance can see sensor health.
* Maintenance can resolve sensor-related alerts.
* Sensor actions are logged.
* Maintenance cannot change QC or warehouse movement status.

---

## 13.6 Phase 6 — Manager / Plant Head Role

## Goal

Provide cross-functional visibility and exception management.

## Screens

* Manager Dashboard
* Operations Overview
* QC Performance
* Warehouse Overview
* Production Overview
* Alert Overview
* Batch Traceability
* Exception Approval
* Audit Summary

## Manager Dashboard Widgets

* Raw material batches by status
* QC pending count
* QC pass/hold/reject rate
* Warehouse utilization
* Open alerts by severity
* Production orders by status
* Finished product batches awaiting QC
* Finished product stored today
* Critical exceptions

## Manager-Specific Data View

Manager sees:

* Summary and exception-focused views
* Batch history
* QC decision summary
* Production progress
* Alert severity
* Warehouse utilization
* Audit summaries

Manager does not need default access to:

* Routine data-entry forms
* Admin user creation actions
* Sensor calibration editing actions
* Warehouse scan confirmation buttons

## Manager Actions

* View all operational records.
* Approve controlled exceptions if enabled.
* Review alerts.
* Review audit trail.
* View traceability.

## Acceptance Criteria

* Manager can see end-to-end status from receiving to FG putaway.
* Manager can open any batch and see full traceability.
* Manager can see critical alerts.
* Manager does not accidentally perform operational tasks by default.

---

## 13.7 Phase 7 — Auditor / Viewer Role

## Goal

Provide read-only traceability and compliance review.

## Screens

* Auditor Dashboard
* Batch Search
* Batch Traceability Detail
* QC Decision History
* Movement History
* Production Genealogy
* Audit Log Search

## Auditor Dashboard Widgets

* Recent batch status changes
* Recent QC decisions
* Recent movement logs
* Recent production completions
* Recent FG QC releases
* Audit log completeness

## Auditor-Specific Data View

Auditor sees:

* All relevant records in read-only mode
* Batch details
* QC decisions
* Movement history
* Production genealogy
* Alert history
* Audit logs

Auditor does not see:

* Create/edit/delete buttons
* Approval buttons
* Operational task buttons
* Admin configuration edit buttons

## Auditor Actions

* Search batch.
* View traceability.
* View audit log.
* Filter records.
* Export report if enabled.

## Acceptance Criteria

* Auditor cannot change operational data.
* Auditor can trace finished product batch back to raw material batches.
* Auditor can see who approved, moved, issued, produced, and stored each batch.

---

## 14. Website Screens

| Screen                     | Primary Role                  | Purpose                             | Main Actions                            |
| -------------------------- | ----------------------------- | ----------------------------------- | --------------------------------------- |
| Login                      | All                           | Authenticate user                   | Login                                   |
| Admin Dashboard            | Admin                         | System setup overview               | Navigate to settings                    |
| User Management            | Admin                         | Manage users                        | Create, update, deactivate              |
| Master Data                | Admin                         | Manage materials/products/locations | CRUD master records                     |
| Warehouse Dashboard        | Warehouse                     | Daily warehouse tasks               | Open receiving, putaway, issue tasks    |
| Raw Material Receiving     | Warehouse                     | Record incoming raw material        | Create receipt and batch                |
| Batch Detail               | Multiple                      | View batch status and history       | Role-specific actions                   |
| Storage Assignment         | Warehouse                     | Assign approved batch to location   | Confirm putaway                         |
| Warehouse Map              | Warehouse/Manager/Auditor     | Visualize storage                   | View/confirm location depending on role |
| QC Dashboard               | QC                            | QC workload view                    | Open QC tasks                           |
| Raw Material QC Queue      | QC                            | Pending raw material inspections    | Start inspection                        |
| Raw Material QC Detail     | QC                            | Record raw material inspection      | Enter result and decide                 |
| CV Review                  | QC                            | Review AI inspection result         | Accept as support, continue QC          |
| Finished Product QC Queue  | QC                            | Pending FG inspections              | Start FG QC                             |
| Finished Product QC Detail | QC                            | Record FG QC decision               | Approve/hold/reject                     |
| Production Dashboard       | Production                    | Production work overview            | Open production order                   |
| Production Order Detail    | Production                    | Execute production                  | Start, update, complete                 |
| Material Issue             | Warehouse/Production          | Transfer material to production     | Issue and confirm receipt               |
| IoT Monitoring             | Maintenance/Manager/Warehouse | Monitor sensor readings             | View alerts/readings                    |
| Sensor Detail              | Maintenance                   | Maintain sensor status              | Update status, note calibration         |
| Alert Center               | Multiple                      | Manage exceptions                   | Acknowledge/resolve based on role       |
| Manager Dashboard          | Manager                       | Factory control overview            | Review KPIs/exceptions                  |
| Batch Traceability         | Manager/Auditor               | Trace batch genealogy               | View raw material → FG                  |
| Audit Log                  | Admin/Manager/Auditor         | Review system actions               | Search/filter/export                    |

---

## 15. Data Model

## 15.1 Core Entities

| Entity                   | Key Fields                                                                                                            | Description                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| users                    | user_id, name, email, password_hash, role_id, status                                                                  | System users                  |
| roles                    | role_id, role_name, description                                                                                       | User roles                    |
| permissions              | permission_id, role_id, module, action                                                                                | Role permissions              |
| raw_materials            | material_id, name, category, hazard_class_id, temp_min, temp_max, shelf_life_days, unit                               | Raw material master           |
| products                 | product_id, name, category, storage_requirement, unit                                                                 | Finished product master       |
| warehouse_locations      | location_id, zone, rack, bin, location_type, temp_zone, capacity, status                                              | Storage locations             |
| hazard_classes           | hazard_class_id, name, description                                                                                    | Hazard categories             |
| storage_rules            | rule_id, material_id, hazard_class_id, temp_min, temp_max, allowed_location_type, incompatible_hazard_class           | Slotting rules                |
| raw_material_receipts    | receipt_id, material_id, received_qty, unit, supplier_lot, received_by, received_at, packaging_condition, notes       | Receiving record              |
| batches                  | batch_id, receipt_id, material_id, batch_type, qty, unit, expiry_date, status, current_location_id                    | Raw material batch            |
| qc_inspections           | qc_id, batch_id, inspection_type, sample_id, status, inspector_id, started_at, completed_at                           | QC inspection header          |
| qc_parameters            | parameter_id, material_id/product_id, name, min_limit, max_limit, method, required                                    | QC checklist master           |
| qc_results               | result_id, qc_id, parameter_id, value, pass_fail, notes                                                               | QC parameter result           |
| cv_results               | cv_id, qc_id, image_url, defect_type, confidence_score, recommendation, model_version                                 | CV decision-support output    |
| inventory_lots           | inventory_id, batch_id, location_id, qty, unit, inventory_status                                                      | Inventory by location         |
| inventory_movements      | movement_id, batch_id, from_location_id, to_location_id, qty, movement_type, moved_by, moved_at                       | Movement history              |
| iot_sensors              | sensor_id, location_id, sensor_type, status, calibration_due_date                                                     | Sensor master                 |
| sensor_readings          | reading_id, sensor_id, value, unit, reading_time, status                                                              | Sensor readings               |
| alerts                   | alert_id, alert_type, severity, entity_type, entity_id, assigned_to, status, created_at, resolved_at, resolution_note | Operational alerts            |
| production_orders        | production_order_id, product_id, planned_qty, status, created_by, created_at, started_at, completed_at                | Internal production order     |
| material_issues          | issue_id, production_order_id, batch_id, qty_issued, issued_by, received_by, issued_at, received_at                   | Warehouse to production issue |
| production_stage_logs    | stage_log_id, production_order_id, stage_name, status, started_at, completed_at, operator_id, notes                   | Production stage tracking     |
| material_consumption     | consumption_id, production_order_id, batch_id, qty_used, recorded_by, recorded_at                                     | Actual consumption            |
| finished_product_batches | fg_batch_id, production_order_id, product_id, qty, unit, status, current_location_id, created_at                      | Finished product batch        |
| finished_goods_qc        | fg_qc_id, fg_batch_id, inspector_id, result, decision, reason, completed_at                                           | Finished product QC           |
| audit_logs               | audit_id, user_id, role_id, action, entity, entity_id, old_value, new_value, reason, created_at                       | Immutable audit trail         |

## 15.2 Key Relationships

```text
raw_material_receipts 1 → many batches
batches 1 → many qc_inspections
qc_inspections 1 → many qc_results
qc_inspections 1 → many cv_results
batches 1 → many inventory_movements
batches 1 → many material_issues
production_orders 1 → many material_issues
production_orders 1 → many material_consumption
production_orders 1 → many finished_product_batches
finished_product_batches 1 → many finished_goods_qc
warehouse_locations 1 → many inventory_lots
warehouse_locations 1 → many iot_sensors
iot_sensors 1 → many sensor_readings
alerts can relate to batch, location, sensor, QC inspection, or production order
audit_logs can relate to any critical entity
```

---

## 16. Dashboard KPIs by Role

## 16.1 Admin

| KPI                    | Purpose                      |
| ---------------------- | ---------------------------- |
| Active users           | Monitor user setup           |
| Roles configured       | Ensure access control setup  |
| Master data completion | Ensure operational readiness |
| Recent admin changes   | Configuration governance     |
| Audit log count        | System activity visibility   |

## 16.2 Warehouse Operator

| KPI                              | Purpose                      |
| -------------------------------- | ---------------------------- |
| Raw materials received today     | Receiving workload           |
| QC Pending batches in quarantine | Space and handoff visibility |
| Approved batches waiting putaway | Putaway workload             |
| Raw material storage utilization | Warehouse capacity           |
| Material issue tasks             | Production support workload  |
| Finished product putaway tasks   | FG warehouse workload        |
| Warehouse alerts                 | Operational risk             |

## 16.3 QC Staff

| KPI                   | Purpose                           |
| --------------------- | --------------------------------- |
| RM QC pending         | Raw material QC workload          |
| RM under QC           | Active inspections                |
| AI/CV flagged lots    | Risk-prioritized QC               |
| Hold lots             | Investigation workload            |
| Rejected lots         | Quality control indicator         |
| FG QC pending         | Finished product release workload |
| Average QC cycle time | Bottleneck visibility             |

## 16.4 Production Staff

| KPI                     | Purpose               |
| ----------------------- | --------------------- |
| Production orders ready | Work queue            |
| Waiting for material    | Dependency visibility |
| Orders in progress      | Execution tracking    |
| Completed orders today  | Output tracking       |
| Yield variance          | Process performance   |
| FG batches awaiting QC  | Handoff visibility    |

## 16.5 Maintenance / IoT Technician

| KPI                   | Purpose                      |
| --------------------- | ---------------------------- |
| Active sensors        | Monitoring coverage          |
| Offline sensors       | Technical risk               |
| Calibration due       | Prevent sensor unreliability |
| Temperature anomalies | Storage condition risk       |
| Open sensor alerts    | Maintenance workload         |
| Resolution time       | Response performance         |

## 16.6 Manager / Plant Head

| KPI                            | Purpose                      |
| ------------------------------ | ---------------------------- |
| Raw material batches by status | End-to-end visibility        |
| QC pending count               | Bottleneck tracking          |
| QC pass/hold/reject rate       | Quality performance          |
| Warehouse utilization          | Capacity control             |
| Open critical alerts           | Risk management              |
| Production progress            | Factory execution visibility |
| FG QC pending                  | Release bottleneck           |
| FG stored today                | Completed internal output    |
| Traceability completeness      | Compliance readiness         |

## 16.7 Auditor / Viewer

| KPI                           | Purpose                |
| ----------------------------- | ---------------------- |
| Records reviewed              | Audit activity         |
| Recent QC decisions           | Quality decision trace |
| Recent material movements     | Movement trace         |
| Recent production completions | Genealogy trace        |
| Audit log completeness        | Compliance confidence  |

---

## 17. Acceptance Criteria

## 17.1 End-to-End Demo Acceptance Criteria

The MVP is successful if the team can demo this complete flow:

1. Admin configures users, materials, products, warehouse locations, and rules.
2. Warehouse logs in and receives raw material.
3. System creates batch ID and sets status to QC Pending.
4. QC logs in and sees the batch in QC queue.
5. QC records sample and reviews CV result.
6. QC approves the raw material batch.
7. System recommends storage location.
8. Warehouse confirms putaway.
9. IoT monitoring shows warehouse readings.
10. System generates a temperature alert.
11. Maintenance resolves the sensor/storage alert.
12. Warehouse issues approved raw material to production.
13. Production logs material consumption and output.
14. System creates finished product batch.
15. QC releases finished product.
16. Warehouse puts finished product into FG warehouse.
17. Manager sees full flow on dashboard.
18. Auditor sees traceability and audit log.

## 17.2 Role-Based UI Acceptance Criteria

* Each role lands on a different dashboard.
* Each role sees different widgets.
* Each role sees different table columns where appropriate.
* Each role sees only relevant action buttons.
* A role with read access does not automatically see every field.
* Unauthorized users cannot perform hidden actions through direct URL/API access.

## 17.3 Control Acceptance Criteria

* Warehouse cannot approve QC.
* QC cannot perform warehouse putaway.
* Production cannot consume unissued material.
* Held or rejected material cannot be issued to production.
* Finished product cannot be stored as available until FG QC approval.
* Critical actions appear in audit log.

---

## 18. Non-Functional Requirements

| Category        | Requirement                                                                               |
| --------------- | ----------------------------------------------------------------------------------------- |
| Usability       | Role dashboards should make each role's next task obvious.                                |
| Performance     | Demo data pages should load within 3 seconds.                                             |
| Security        | Role and permission checks must exist on frontend and backend/API layer.                  |
| Auditability    | Critical workflow actions must be logged.                                                 |
| Data Integrity  | Batch status transitions must be controlled.                                              |
| Reliability     | MVP must work with simulated IoT and CV data.                                             |
| Maintainability | Code should be modular by domain: warehouse, QC, production, IoT, alerts, audit, admin.   |
| Scalability     | Architecture should allow future sales, procurement, ERP, real IoT, and real CV services. |

---

## 19. Suggested Modular Architecture

For MVP, build as a modular web application. The product can be microservices-oriented in design, but it should be implemented simply enough for the competition.

```text
/apps/web
/apps/api
/modules/auth-rbac
/modules/admin
/modules/warehouse
/modules/qc
/modules/computer-vision
/modules/iot
/modules/alerts
/modules/production
/modules/finished-goods
/modules/dashboard
/modules/audit
```

## 19.1 Future Microservices Mapping

| Future Service          | Current MVP Module |
| ----------------------- | ------------------ |
| Auth & RBAC Service     | auth-rbac          |
| Master Data Service     | admin/master data  |
| Warehouse Service       | warehouse          |
| QC Service              | qc                 |
| Computer Vision Service | computer-vision    |
| IoT Telemetry Service   | iot                |
| Alert Service           | alerts             |
| Production Service      | production         |
| Finished Goods Service  | finished-goods     |
| Dashboard Service       | dashboard          |
| Audit Service           | audit              |

---

## 20. MVP Build Priority

## Sprint 1 — Setup and Admin

* Database schema.
* Seed master data.
* Role-based login.
* Admin screens.
* Audit logging foundation.

## Sprint 2 — Warehouse Receiving

* Warehouse dashboard.
* Raw material receiving form.
* Batch ID generation.
* Batch detail page.
* QC Pending status.

## Sprint 3 — QC Raw Material

* QC dashboard.
* QC queue.
* QC detail.
* CV mock result.
* Approve/hold/reject workflow.

## Sprint 4 — Storage and IoT

* Storage recommendation.
* Warehouse map.
* Putaway workflow.
* Sensor readings.
* Alert center.

## Sprint 5 — Production

* Production dashboard.
* Material issue.
* Production order execution.
* Material consumption.
* Finished product batch creation.

## Sprint 6 — Finished Product QC and FG Putaway

* FG QC queue.
* FG QC decision.
* FG storage assignment.
* FG putaway.

## Sprint 7 — Manager and Auditor

* Manager dashboard.
* Batch traceability.
* Audit log viewer.
* Auditor read-only interface.

---

## 21. Future Roadmap

## Future Phase 1 — Before Raw Material Arrival

* Demand forecast.
* Purchase request.
* Purchase order.
* Supplier portal.
* Supplier quality scorecard.

## Future Phase 2 — After Finished Product Warehouse

* Sales order.
* Shipping schedule.
* Dispatch.
* Delivery tracking.
* Customer complaints.
* Return handling.

## Future Phase 3 — Advanced Technology

* Real IoT sensor integration.
* MQTT gateway.
* Real computer vision model.
* ERP integration.
* Mobile barcode scanning.
* Predictive quality analytics.
* Digital twin warehouse map.

---

## 22. Final Product Positioning

This MVP should be positioned as:

> A role-based smart factory operations website that controls the internal flow from raw material receiving to finished product warehouse putaway, with QC release, smart storage, IoT monitoring, production traceability, and auditability.

The pitch should emphasize:

* Practical manufacturing flow.
* Clear scope boundary.
* Role-specific UI and data visibility.
* Human QC control.
* IoT and computer vision as decision-support tools.
* Batch genealogy from raw material to finished product.
* Audit-ready operational records.

The product should not be pitched as a complete ERP or sales platform yet. It is the internal operations foundation that future procurement, sales, shipping, and ERP modules can connect to later.

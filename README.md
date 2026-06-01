# Sigma Arome Smart Operations

> A role-based smart manufacturing operations platform for fragrance, essential oil, and chemical production, from raw material ordering to finished goods putaway.

---

## Overview

Sigma Arome Smart Operations is a web-based manufacturing operations system that controls the full internal factory flow for a fragrance and chemical manufacturer: raw material ordering, receiving, quality control, rule-based warehouse slotting, production execution, and finished goods storage. It gives every role one source of truth with its own dashboard, data visibility, and actions.

- **What it does:** Digitizes the internal manufacturing flow from PPIC raw material ordering through QC release, rule-based storage slotting, production, and finished goods putaway, with full batch traceability and an automatic audit trail.
- **Target users:** Admin, Manager, PPIC planners, Warehouse Operation staff, QC inspectors, Logistic coordinators, and Production operators at a fragrance, essential oil, and chemical manufacturer.
- **Main problem solved:** Manual, spreadsheet-driven, and fragmented control over batches, storage decisions, QC status, and traceability across warehouse and production.

---

## Live Demo / Public Link

- **Live Website:** https://main.dl8kg34ne80.amplifyapp.com
- **Demo Video:** https://youtu.be/gzTRbtz-OIA

---

## Screenshots

All screenshots live in the `./screenshots/` folder. Replace the placeholder images with your own captures using the exact file names listed below.

This project is a multi-module system, so screenshots are grouped by role/module. Capture at least one representative screen per module you want the judges to see. Skip or add rows as needed.

### Core / Shared

#### Landing Page / Home Page
![Landing Page](./screenshots/landing-page.png)

#### Login / Sign Up Page
![Login Page](./screenshots/login-page.png)

### Admin Module
[Master data, role based access control, audit log]

#### Admin Dashboard
![Admin Dashboard](./screenshots/admin-dashboard.png)

#### Warehouse Location (Floor Plan / Hierarchy)
![Warehouse Location](./screenshots/admin-warehouse-location.png)

#### Master Data Form (User Input Form)
![Master Data Form](./screenshots/admin-master-data-form.png)

### Warehouse Operation Module
[Receiving, putaway, rule based slotting, movement log]

#### Warehouse Dashboard
![Warehouse Dashboard](./screenshots/warehouse-dashboard.png)

#### Auto Slotting Recommendations (Result / Output Page)
![Auto Slotting](./screenshots/warehouse-auto-slotting.png)

#### Putaway Flow
![Putaway](./screenshots/warehouse-putaway.png)

### Quality Control Module
[QC queue, inspection, hold and release]

#### QC Inspection
![QC Inspection](./screenshots/qc-inspection.png)

### PPIC / Production Module
[Production planning, BOM, material requests]

#### Production Planning
![Production Planning](./screenshots/ppic-production.png)

#### Production Execution
![Production Execution](./screenshots/production-orders.png)

### Manager Module
[Reporting, traceability, oversight]

#### Manager Overview / Data Visualization
![Manager Overview](./screenshots/manager-overview.png)

---

## Problem Statement

Siga Arome's internal factory flow lacks strong digital control across raw material ordering, receiving, QC, storage, production readiness, execution, and finished product release. Today the main pain points are:

- PPIC cannot easily track whether ordered material has arrived, passed QC, and become available for production.
- Raw material receiving and batch records are recorded manually and can become fragmented.
- QC queues and decisions are not visible in real time.
- Warehouse storage decisions rely on manual judgment or spreadsheets, which is risky for hazardous and temperature-sensitive chemicals.
- Material movement from warehouse to production is hard to trace back to a finished product batch.
- Managers lack a single view of readiness, QC bottlenecks, warehouse status, and alerts.

---

## Solution

A role-based smart operations website that becomes the single source of truth for the internal flow. Each role gets a tailored dashboard and only the data and actions relevant to its work. The platform enforces business rules on the backend so steps cannot be skipped, and it records an automatic audit trail for every critical change.

A key component is the rule-based storage slotting engine. When a batch is QC released, the engine scores every eligible storage bin and recommends the top options, with each recommendation accompanied by a clear, auditable reason. The scoring considers temperature compatibility, hazard compatibility, available capacity, and occupancy, and it hard-eliminates any bin that is incompatible. The engine is fully explainable rather than a black box, which suits the compliance needs of chemical storage.

---

## Key Features

The platform is organized into role-based modules.

**Admin**
- Master data management for suppliers, raw materials, products, hazard classes, QC templates, and warehouse hierarchy.
- Role-based access control with policies, field visibility, and action permissions.
- Read-only audit log of all critical actions.

**Warehouse Operation**
- Rule-based auto slotting that recommends the best storage bins with explainable reasoning.
- Receiving, putaway, batch inventory, and full movement logging.
- Live warehouse floor plan grouped by Warehouse, Zone, Rack, and Bin.

**Quality Control**
- Inspection queue with computer-vision-assisted review (simulated for MVP).
- Approve, reject, and hold decisions that drive downstream status automatically.

**PPIC / Production**
- Raw material ordering and production planning.
- Bill of Materials and automatic material request generation.
- Production execution with consumption, yield, and finished goods batch creation.

**Manager**
- Operational overview, KPIs, and exception monitoring.
- End-to-end batch traceability from raw material order to finished product.

> Adjust this list to match the exact scope you demo to the judges.

---

## Tech Stack

**Frontend**
- Next.js 16 (App Router) with React 19 and TypeScript 5
- Mantine v8 component library with Buildpad UI components
- TailwindCss

**Backend**
- Next.js API routes acting as a server-side proxy
- Buildpad DaaS (Data-as-a-Service) for data access, runtime extensions, and business logic

**Database**
- PostgreSQL via Supabase (with Row-Level Security)

**APIs / Services**
- Buildpad DaaS REST API for collections, items, permissions, and extensions
- Supabase Auth for authentication (server-side, cookie-based)

**Deployment**
- AWS Amplify (auto-deploy on push to the main branch)

---

## Installation Steps

This project uses pnpm. Follow these steps to run it locally.

```bash
# 1. Clone the repository
git clone https://github.com/SilentlyLucky/Sigma-Arome.git

# 2. Move into the project folder
cd Sigma-Arome

# 3. Install dependencies
pnpm install

# 4. Start the development server
pnpm dev
```

Open `http://localhost:3000` in your browser.

> If you prefer npm, you can run `npm install` and `npm run dev` instead.

---

## Environment Variables

Create a file named `.env.local` in the project root and copy the keys below. A reference template is provided in `.env.example`.

```env
# Supabase (authentication)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Buildpad DaaS (data layer)
NEXT_PUBLIC_BUILDPAD_DAAS_URL=

# App URL
NEXT_PUBLIC_APP_URL=
```

> Security note: Never commit real secret keys or credentials to GitHub. Keep `.env.local` listed in `.gitignore`. Only commit `.env.example` with empty values. The `SUPABASE_SERVICE_ROLE_KEY` is highly privileged and must stay server-side only.

---

## Usage Instructions

For judges and first-time users:

1. Open the live website.
2. Log in with the role account you want to explore (Admin, Warehouse, QC, PPIC, Production, Logistic, or Manager). Each role lands on its own dashboard.
3. To see the core flow, start in Admin to review master data, then move to Warehouse to receive material and trigger QC.
4. In QC, inspect and release a batch. This automatically generates storage recommendations.
5. In Warehouse, open Putaway or Auto Slotting to view the rule-based recommendations and confirm a storage location.
6. Use the Manager module to view KPIs and full batch traceability.

> Provide the demo credentials for each role here so judges can log in quickly.

---

## Project Structure

```text
sigma-arome-starter/
├── app/
│   ├── (authenticated)/
│   │   ├── admin/          (master data, RBAC, audit log, warehouse location)
│   │   ├── warehouse/      (receiving, putaway, auto slotting, floor plan)
│   │   ├── qc/             (inspection queue and decisions)
│   │   ├── ppic/           (orders, BOM, production planning, requests)
│   │   ├── production/     (production execution)
│   │   ├── logistic/       (movement coordination)
│   │   └── manager/        (dashboards and traceability)
│   ├── api/                (server-side proxy routes to Buildpad DaaS)
│   └── layout.tsx
├── components/
│   └── ui/                 (Buildpad UI components)
├── lib/
│   ├── api/                (auth headers, DaaS URL helpers)
│   ├── supabase/           (server and client Supabase setup)
│   └── buildpad/           (field mappers and interface helpers)
├── public/
├── screenshots/
├── middleware.ts
├── amplify.yml
├── .env.example
├── package.json
└── README.md
```

---

## Team Members

- [Name] - [Role]
- [Name] - [Role]
- [Name] - [Role]

---

## Hackathon Theme

[Explain how this project fits the hackathon theme. For reference, this project demonstrates a production-grade, role-based operations platform built rapidly on the Buildpad DaaS platform, applying digital transformation and explainable rule-based automation to a real industrial workflow in fragrance and chemical manufacturing.]

---

## Challenges Faced

- [Challenge 1]
- [Challenge 2]
- [Challenge 3]

---

## Future Improvements

- [Improvement 1]
- [Improvement 2]
- [Improvement 3]

---

## License

This project is licensed under the [License Name] License.

---

## Acknowledgements

- Hackathon organizers: [Organizer name]
- Platform: Buildpad (DaaS, UI components, and starter conventions)
- Core libraries: Next.js, React, Mantine, Supabase, Tabler Icons, Recharts
- APIs and services used: Buildpad DaaS REST API, Supabase Auth, AWS Amplify
- Mentors and contributors: [Names or thanks]

---

## Screenshot File Checklist

Upload these files to the `./screenshots/` folder. The README already references each one by name. Capture only the modules you want to showcase; remove unused rows.

**Core / Shared**
- [ ] `landing-page.png` (Landing / Home page)
- [ ] `login-page.png` (Login or Sign Up page)
- [ ] `mobile-view.png` (Mobile responsive view)
- [ ] `empty-state.png` (Empty or error state)

**Admin**
- [ ] `admin-dashboard.png` (Admin dashboard)
- [ ] `admin-warehouse-location.png` (Warehouse location floor plan / hierarchy)
- [ ] `admin-master-data-form.png` (Master data input form)

**Warehouse Operation**
- [ ] `warehouse-dashboard.png` (Warehouse dashboard)
- [ ] `warehouse-auto-slotting.png` (Auto slotting result / output)
- [ ] `warehouse-putaway.png` (Putaway flow)

**Quality Control**
- [ ] `qc-inspection.png` (QC inspection)

**PPIC / Production**
- [ ] `ppic-production.png` (Production planning)
- [ ] `production-orders.png` (Production execution)

**Manager**
- [ ] `manager-overview.png` (Manager overview / data visualization)
 
 

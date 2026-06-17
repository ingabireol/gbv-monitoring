# GBV Monitor — Detailed System Documentation

**System:** Gender-Based Violence & Child Abuse Monitoring System  
**Client:** Ministry of Gender and Family Promotion (MIGEPROF), Republic of Rwanda  
**Scope:** National — covers all 30 districts of Rwanda  

---

## Table of Contents

1. [Problem Statement & Objectives](#1-problem-statement--objectives)
2. [System Architecture](#2-system-architecture)
3. [User Roles & Actors](#3-user-roles--actors)
4. [Detailed Actor Capabilities](#4-detailed-actor-capabilities)
5. [Complete System Workflow](#5-complete-system-workflow)
6. [Core Features Deep Dive](#6-core-features-deep-dive)
7. [Security & Privacy Model](#7-security--privacy-model)
8. [Data Model Overview](#8-data-model-overview)
9. [Notifications & Real-Time Communication](#9-notifications--real-time-communication)
10. [Reports & Analytics](#10-reports--analytics)
11. [Credentials Reference](#11-credentials-reference)

---

## 1. Problem Statement & Objectives

### The Problem Before This System

Rwanda, like many countries, faced significant challenges in handling GBV and child abuse cases:

| Problem | Impact |
|---|---|
| Paper-based case records | Cases were lost, misplaced, or inaccessible across agencies |
| No anonymous reporting channel | Victims and witnesses feared identity exposure, so incidents went unreported |
| No inter-agency coordination | Social workers, police, and partner institutions worked in silos with no shared visibility |
| Victims had no case visibility | Survivors had no way to track what was happening with their own case |
| No real-time data for policymakers | MIGEPROF had no live picture of case trends across districts |
| Referrals were informal | Victims referred to partner institutions (hospitals, shelters, legal aid) fell through the cracks |

### System Objectives

1. **Digitize** the entire case lifecycle — from incident report to resolution
2. **Enable anonymous reporting** to remove the barrier of identity exposure
3. **Coordinate** across Police (RNP), Social Workers, District Offices, and Partner Institutions on a single platform
4. **Give victims agency** — they can view, update, or withdraw their own cases
5. **Ensure accountability** — every action is timestamped and logged in a case timeline
6. **Support policymakers** with real-time analytics, district-level maps, and exportable reports

---

## 2. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│   React 18 + TypeScript + Vite (http://localhost:8080)      │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Victim  │ │  Police  │ │ SocWork  │ │DistrictAdmin │  │
│  │  Portal  │ │  Portal  │ │  Portal  │ │   Portal     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────────┐    │
│  │ Partner  │ │  Admin   │ │  Public (Anonymous)       │    │
│  │  Portal  │ │  Portal  │ │  Report / Track Status    │    │
│  └──────────┘ └──────────┘ └──────────────────────────┘    │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API + WebSocket
                        │ JWT Bearer Token (Authorization header)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│   Spring Boot 4.x (http://localhost:8083)                   │
│                                                             │
│  Auth → Controllers → Services → Repositories → DB         │
│                                                             │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ JWT Filter │  │  WebSocket   │  │  Scheduled Tasks │   │
│  │ (stateless)│  │  /ws (notif) │  │  (auto reports)  │   │
│  └────────────┘  └──────────────┘  └──────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │ Spring Data JPA
                        ▼
              ┌─────────────────────┐
              │    PostgreSQL DB     │
              │   (gbvmonitor)      │
              └─────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + TypeScript | Component-based UI with type safety |
| Build Tool | Vite 8 | Fast development server and bundler |
| Styling | Tailwind CSS + shadcn/ui | Design system with dark theme |
| State / API | RTK Query (Redux Toolkit) | Centralized API layer with caching |
| Charts | Recharts | Analytics visualizations |
| Backend | Spring Boot 4.x | REST API + WebSocket server |
| Security | Spring Security + JWT | Stateless authentication |
| Database | PostgreSQL | Relational data storage |
| ORM | Spring Data JPA + Hibernate | Database abstraction |
| Email | SMTP | PIN verification for victim registration |

---

## 3. User Roles & Actors

The system has **7 distinct roles**. Each role maps to a dedicated portal with its own sidebar, routes, and API permissions. A user can only access pages that match their role — enforced by `RoleGuard` on the frontend and Spring Security on the backend.

| Role | Portal URL | Who Uses It |
|---|---|---|
| `PUBLIC` / Anonymous | `/anonymous-report`, `/check-status` | Any member of the public |
| `VICTIM` | `/victim/*` | Registered survivors |
| `POLICE` | `/police/*` | RNP officers assigned to GBV cases |
| `SOCIAL_WORKER` | `/socialworker/*` | MIGEPROF-affiliated case workers |
| `DISTRICT_ADMIN` | `/districtadmin/*` | District-level government officials |
| `PARTNER` | `/partner/*` | Staff at partner institutions (hospitals, shelters, legal aid) |
| `ADMIN` | `/dashboard`, `/active-cases`, etc. | MIGEPROF system administrators |

---

## 4. Detailed Actor Capabilities

---

### 4.1 Anonymous Reporter (Public — No Account Required)

**Who they are:** Any Rwandan citizen — a neighbor, a witness, a community leader — who has seen or knows about a GBV or child abuse incident but does not want to reveal their identity.

**Why this role exists:** Research shows that a majority of GBV incidents go unreported because victims and witnesses fear retaliation. By allowing completely anonymous reporting, the system captures incidents that would otherwise be invisible.

**How it works:** No login, no account. Anyone can navigate to the public-facing anonymous report form.

| Feature | How It Works | Why It Matters |
|---|---|---|
| **Submit Anonymous Report** | Fill a form with incident details, type, location, and optional evidence. The system generates a unique Case ID. | Creates a traceable case without exposing the reporter's identity |
| **Upload Evidence** | Photos, documents attached to the report (multipart/form-data upload) | Strengthens the case with physical evidence |
| **Check Anonymous Status** | Enter Case ID at `/check-status` to see if the case was accepted, is in progress, or resolved | Keeps the reporter informed without requiring an account |
| **Chat with Police** | Two-way secure messaging with the assigned police officer using the Case ID as the session key | Allows investigators to gather more details without the reporter revealing their identity |

**Important:** The system **never** stores the reporter's identity. The Case ID is the only link between the reporter and their case.

---

### 4.2 Victim (Registered Account)

**Who they are:** A person who has directly experienced GBV or child abuse and has created a verified account in the system.

**Why this role exists:** Victims deserve more than just being a passive subject in the system. They need transparency, control, and a channel to communicate with their case team.

**Account creation flow:** Register at `/victim/register` → receive a PIN via email → verify PIN → account activated.

| Feature | How It Works | Why It Matters |
|---|---|---|
| **Register Victim Account** | Email-based PIN verification through SMTP | Ensures the account belongs to a real person without exposing identity to third parties |
| **Login** | Standard email + password | Access to private case data |
| **Submit Report** | Authenticated report with full personal details (stored privately) | Creates a named case linked to the victim's account |
| **View Cases** | See all cases tied to their account with current status | Victims are not left in the dark about what is happening |
| **Update Own Case** | Add new details, clarifications, or corrections | Cases evolve — new information should be capturable |
| **Withdraw Own Case** | The victim can choose to retract their report | Respects victim autonomy, especially in complex domestic situations |
| **View Notifications** | Alerts when case status changes, referrals are made, or updates are posted | Keeps the victim informed in real time |

---

### 4.3 Social Worker

**Who they are:** Trained case workers employed by MIGEPROF or partner organizations who are the frontline responders. They register cases, provide psychosocial support, and coordinate the victim's recovery journey.

**Why this role exists:** Social workers are the bridge between victims and the formal system. They register cases on behalf of victims who may not be able to do so themselves, and they manage the long-term recovery process.

| Feature | How It Works | Why It Matters |
|---|---|---|
| **Submit Report** | Register a new GBV case on behalf of a victim | Many victims are unable or too traumatized to self-report |
| **Case List** | View all cases the social worker is involved with | Manages caseload and priorities |
| **Manage Referrals** | Create referrals to partner institutions (medical, legal, shelter, psychosocial) | Routes victims to specialized services they need |
| **Manage Recovery Milestones** | Set, track, and complete recovery goals (e.g., "psychosocial assessment completed", "legal aid obtained") | Transforms vague "support" into measurable, trackable progress |
| **Reports & Export** | Filter cases by status, type, date range → export PDF/CSV | Generate evidence-based reports for supervisors and donors |
| **View Analytics** | Caseload trends, referral outcomes, case types breakdown | Data-driven workload management |
| **Update Profile** | Manage personal account credentials | Self-service account management |

---

### 4.4 Police Officer (RNP)

**Who they are:** Rwanda National Police officers who are assigned GBV cases in their district for investigation.

**Why this role exists:** Police are responsible for the formal legal investigation of GBV cases. They need a structured workspace to manage their caseload, communicate with reporters, and document their actions.

| Feature | How It Works | Why It Matters |
|---|---|---|
| **View Assigned Cases** | Cases assigned specifically to this officer, with priority scoring | Officers only see their own cases — no privacy crossover |
| **Accept / Reject Case** | Formally take on a case or decline with reason | Creates legal accountability and a formal audit trail |
| **Mark Case In Progress** | Status update to IN_PROGRESS | Informs all stakeholders that investigation is underway |
| **Chat with Anonymous Reporter** | Real-time two-way messaging via Case ID (polls every 5 seconds) | The only way to gather follow-up information from anonymous reporters without revealing their identity |
| **Case Updates / Log Notes** | Post investigation notes to the case timeline | Creates a timestamped, immutable investigation log |
| **Resolve Case** | Mark a case as RESOLVED once investigation concludes | Official closure of the case with full timeline preserved |
| **Manage Referrals** | View and coordinate referrals to other agencies | Ensures the victim gets appropriate services alongside the legal process |
| **View Analytics** | Personal and district-level case stats, overdue alerts | Helps officers prioritize and track their own performance |
| **Reports & Export** | Filter by Case ID, status, priority, date → PDF/CSV | Formal reporting to supervisors and RNP headquarters |

**Anonymous Chat — How It Works:**
```
Anonymous Reporter ──[Case ID]──► Police Chat Panel
                                       │
                          Polls backend every 5 seconds
                          for new messages
                                       │
                    Both parties see message thread
                    Neither side has identity of the other
```

---

### 4.5 District Administrator

**Who they are:** Government officials at the district level (e.g., Gasabo District) responsible for overseeing all GBV responses within their jurisdiction.

**Why this role exists:** Rwanda is administratively organized into districts, each of which has different GBV patterns, staffing levels, and resource allocations. District Admins ensure cases don't fall through the cracks and that resources are deployed appropriately.

| Feature | How It Works | Why It Matters |
|---|---|---|
| **Assign Cases** | Assign unassigned cases to available police officers in the district | Every case needs an owner — unassigned cases are a key risk indicator |
| **View Case Summary** | High-level overview: total cases, by status, by type, by officer | District leadership needs a dashboard without case-by-case detail |
| **View Cases on Map** | Geographic pin map of cases by location in the district | Reveals hotspots and patterns that are invisible in a table |
| **Submit Incident Reports** | Compile and submit formal district-level incident summaries | Required for national-level reporting to MIGEPROF |
| **Staff Directory** | View all officers and social workers under the district | Operational oversight of team composition and capacity |
| **Inter-Agency Referrals** | Coordinate referrals across institutions at the district level | Some referrals require district-level authority |
| **District Analytics** | Charts on case trends, resolution rates, officer performance | Evidence base for resource requests and policy decisions |
| **Export Report** | Export district case data as PDF/CSV | For official government records and MIGEPROF submissions |

---

### 4.6 System Administrator (MIGEPROF Admin)

**Who they are:** The central administrator at MIGEPROF headquarters with full system access across all districts and all roles.

**Why this role exists:** Someone needs to manage the whole system — create accounts, handle escalations, view the national picture, and ensure no case is permanently stuck.

| Feature | How It Works | Why It Matters |
|---|---|---|
| **View Cases Summary** | National dashboard — all cases across all districts | MIGEPROF leadership needs a national view |
| **Report Victim Case** | Register cases directly at the highest level | For cases escalated to national attention |
| **Case Assignments** | Assign any case to any officer across all districts | Override assignments, handle cross-district cases |
| **Case Updates** | Log notes on any case in the system | Central oversight and intervention capability |
| **View Victim Recovery Journey** | Full timeline of a victim's case: reports → referrals → milestones → resolution | Holistic view of whether the system is actually helping victims |
| **User Management** | Create, activate, deactivate, and assign roles to all staff accounts | Single point of control for system access |
| **Assign Referrals** | Route referrals to partner institutions from the center | Handle referrals that district-level cannot resolve |
| **View Notifications** | System-wide alerts — new cases, overdue cases, escalations | National-level awareness of urgent situations |
| **View Support Tracking** | Monitor ongoing support services across all victims | Ensure no victim is left without active support |
| **Export Reports** | National data exports for parliament, donors, and international bodies | Fulfills Rwanda's reporting obligations |

---

### 4.7 Partner Institution Officer

**Who they are:** Staff at organizations that receive referrals from the GBV system — Isange One Stop Centres, hospitals, legal aid organizations, women's shelters, psychosocial support centers.

**Why this role exists:** The GBV response is not just legal/police — it requires medical care, legal support, safe housing, and counseling. Partner institutions deliver these services. They need a portal to receive, acknowledge, and report on referrals.

| Feature | How It Works | Why It Matters |
|---|---|---|
| **View Referral Notifications** | Real-time alerts when a new referral is assigned to the institution | No referral can be "lost" — institutions are immediately notified |
| **View Referrals Assigned** | Full list of all referrals sent to the institution with case details | Operational management of the institution's GBV workload |
| **Respond to the Referral** | Accept, reject, or update the referral status (IN_PROGRESS, COMPLETED) | Creates accountability — the system knows if a referral was acted on |
| **Export Reports** | Filter referrals by status and date range → export PDF/CSV | For institutional reporting to MIGEPROF and donors |

---

## 5. Complete System Workflow

### 5.1 Case Lifecycle States

```
SUBMITTED → PENDING → ACCEPTED → IN_PROGRESS → RESOLVED
                  ↘                          ↗
                   REJECTED (at any pre-resolution stage)
```

| State | Meaning | Who Sets It |
|---|---|---|
| PENDING | Case received, awaiting officer assignment | System (automatic on submission) |
| ACCEPTED | Officer has taken on the case | Police Officer |
| REJECTED | Case declined (duplicate, jurisdiction, etc.) | Police Officer or Admin |
| IN_PROGRESS | Active investigation underway | Police Officer |
| RESOLVED | Case concluded | Police Officer |

---

### 5.2 End-to-End Flow

```
STEP 1 — INCIDENT REPORTED
═══════════════════════════════════════════════════════════════
  Path A: Anonymous Reporter
    → Submits form at /anonymous-report (no login)
    → System creates case + generates Case ID
    → Reporter uses Case ID to track and chat

  Path B: Victim (self-report)
    → Registers account → verifies email PIN → logs in
    → Submits report from /victim/report

  Path C: Social Worker (on behalf of victim)
    → Logs in → Registers case at /socialworker/register
    → Enters victim details, incident type, location

  Path D: Admin (escalation)
    → Logs in → Uses /incident-reports or /active-cases
    → Registers case directly

STEP 2 — CASE ASSIGNMENT
═══════════════════════════════════════════════════════════════
  → District Admin logs in → sees PENDING unassigned cases
  → Assigns case to available Police Officer in the district
  → Case status moves to: ACCEPTED (once officer confirms)
  → Officer gets notification of new assigned case

STEP 3 — POLICE INVESTIGATION
═══════════════════════════════════════════════════════════════
  → Officer views case in /police/cases
  → Accepts the case → status: ACCEPTED
  → If anonymous: chats with reporter via Case ID
  → Logs investigation notes to case timeline
  → Marks case IN_PROGRESS → status: IN_PROGRESS
  → Continues investigation...

STEP 4 — VICTIM SUPPORT (PARALLEL TO STEP 3)
═══════════════════════════════════════════════════════════════
  → Social Worker registers victim support plan
  → Creates recovery milestones (e.g., "Medical exam", "Legal aid")
  → Completes milestones as services are delivered
  → Creates referral to Partner Institution if specialized help needed

STEP 5 — REFERRAL TO PARTNER INSTITUTION
═══════════════════════════════════════════════════════════════
  → Referral created by Social Worker or Admin
  → Partner Institution Officer gets notification
  → Officer logs in → views referral → accepts/responds
  → Updates referral status to IN_PROGRESS → COMPLETED
  → System logs every status change

STEP 6 — CASE RESOLUTION
═══════════════════════════════════════════════════════════════
  → Police Officer marks case RESOLVED
  → Social Worker closes all recovery milestones
  → Full timeline preserved: reports, notes, referrals, milestones
  → Victim receives notification of resolution

STEP 7 — REPORTING & OVERSIGHT
═══════════════════════════════════════════════════════════════
  → District Admin generates district export report
  → Admin reviews national analytics dashboard
  → MIGEPROF submits to parliament / international bodies
```

---

### 5.3 Priority Scoring (How Cases Are Ranked)

The system auto-calculates a priority score (0–100) for each case so officers and admins see the most urgent cases first:

| Factor | Weight |
|---|---|
| Status = Critical | Base 90 |
| Status = Pending (unassigned) | Base 60 |
| Days open × 2 | Up to +20 |
| Unassigned bonus | +10 |
| Resolved / Rejected | Fixed 20 (deprioritized) |

Cases open >14 days are automatically flagged as **Critical**.

---

## 6. Core Features Deep Dive

### 6.1 Anonymous Reporting & Chat

Anonymous reporting is the system's most sensitive privacy feature. The design decisions:

- **No account required** — the form is publicly accessible, no cookies or tracking
- **Case ID as identity proxy** — the system assigns a random Case ID at submission. This ID is the *only* link between the reporter and the case
- **Chat is session-based on Case ID** — the police chat panel uses the Case ID as the session key. Neither side needs to reveal who they are
- **Polling every 5 seconds** — the chat panel polls the backend for new messages to simulate real-time communication without requiring a persistent WebSocket connection per anonymous session

### 6.2 Referral System

The referral system is what turns the GBV response from "police-only" into a multi-agency response:

```
Social Worker / Admin
        │
        │ creates referral with:
        │  - caseId
        │  - referredTo (institution name)
        │  - reason
        │  - institutionType (MEDICAL / LEGAL / SHELTER / PSYCHOSOCIAL)
        ▼
  Backend stores referral
        │
        ▼
  Partner Institution Officer
        │ gets notification
        │ sees referral in their portal
        │ responds: ACCEPTED → IN_PROGRESS → COMPLETED
        ▼
  Status visible to Social Worker & Admin
```

### 6.3 Recovery Milestones

Recovery is not a single event — it is a journey with concrete steps. The milestone system lets Social Workers define and track each step:

**Example milestone sequence for a domestic violence victim:**
1. Safety assessment completed
2. Medical examination done
3. Psychosocial counseling session 1
4. Legal aid consultation
5. Temporary shelter arranged
6. Follow-up counseling session 2
7. Court appearance supported
8. Long-term safety plan established

Each milestone is timestamped when completed. This creates the "Victim Recovery Journey" that the Admin can view.

### 6.4 Case Timeline

Every case maintains an immutable chronological timeline of events:

| Event Type | Triggered By |
|---|---|
| Case submitted | Any report submission |
| Case assigned | District Admin assigns |
| Status changed (ACCEPTED, IN_PROGRESS, etc.) | Police Officer |
| Investigation note logged | Police Officer or Admin |
| Referral created | Social Worker or Admin |
| Milestone completed | Social Worker |
| Case resolved | Police Officer |

The timeline is **append-only** — no entry can be deleted or modified. This is critical for legal accountability.

---

## 7. Security & Privacy Model

### 7.1 Authentication

- **JWT (JSON Web Token)** — stateless authentication. The backend issues a signed token on login; every subsequent request includes it in the `Authorization: Bearer <token>` header
- **24-hour expiry** — tokens expire automatically; users must re-login
- **No sessions stored on backend** — the backend is fully stateless; the token contains role and user ID

### 7.2 Role-Based Access Control

```
Frontend:  RoleGuard component wraps every route
           → redirects to /login if role doesn't match

Backend:   Spring Security @PreAuthorize annotations
           → returns 403 Forbidden if role doesn't match
           → enforced at the API level regardless of frontend state
```

This means even if someone bypasses the frontend UI, they cannot access data they are not authorized to see.

### 7.3 Victim Privacy

- Victim names are **never shown in public-facing** or cross-role views
- In shared tables (police dashboard, district admin), victims appear as `Victim #00142`
- Only the Social Worker assigned to the case sees full victim details
- Anonymous reports store **zero** personally identifiable information about the reporter

### 7.4 Public Endpoints (No Auth Required)

The only endpoints that require no authentication:
- `POST /api/auth/login` — login
- `POST /api/auth/register` — victim registration
- `POST /api/reports/anonymous` — anonymous report submission
- `GET /api/anonymous/**` — anonymous case status check and chat

All other endpoints require a valid JWT token.

### 7.5 Audit Logging

All security-relevant operations are recorded by `AuditLogService`:
- Login attempts (success and failure)
- Role-level access attempts
- Case status changes
- User management operations

---

## 8. Data Model Overview

### Core Entities and Relationships

```
User ──────────────────── has role (ADMIN | POLICE | SOCIAL_WORKER |
                                    DISTRICT_ADMIN | PARTNER | VICTIM)

Case ──────────────────── submitted by: User (victim) OR anonymous
     │                    assigned to:  User (police officer)
     │                    district:     District
     │
     ├── TimelineEvent[]  (immutable log of all case events)
     ├── Referral[]       (referrals created for this case)
     └── RecoveryMilestone[] (victim recovery steps)

Referral ─────────────── linked to: Case
         │               created by: User (social worker / admin)
         └──────────────  referred to: Institution (partner)

Notification ─────────── belongs to: User
                         triggered by: Case status changes, referrals, etc.

AnonymousChatMessage ─── linked by: caseId (no user identity stored)
```

### Key Field: Case Status Flow

```
Backend status values → Frontend display mapping:

PENDING          →  "Pending"
ACCEPTED         →  "Accepted"
REJECTED         →  "Rejected"
IN_PROGRESS      →  "In Progress"
INVESTIGATION    →  "In Progress"
RESOLVED         →  "Resolved"
CLOSED           →  "Resolved"
(days open > 14) →  "Critical"  (auto-upgrade)
```

---

## 9. Notifications & Real-Time Communication

### WebSocket Notifications

The backend exposes a WebSocket endpoint at `/ws`. When key events occur, the backend pushes a notification to the relevant user:

| Event | Recipient |
|---|---|
| New case submitted | District Admin, Admin |
| Case assigned to officer | Police Officer |
| Case status changed | Victim (if registered), Admin |
| New referral created | Partner Institution Officer |
| Referral status updated | Social Worker, Admin |
| Recovery milestone completed | Admin |

### Notification Structure

Each notification has:
- `id` — unique identifier
- `type` — e.g., `REFERRAL_ASSIGNED`, `CASE_STATUS_UPDATED`, `NEW_CASE`
- `message` — human-readable description
- `read` — boolean (mark as read)
- `createdAt` — timestamp

Victims and Partners can see their notifications in their portal's Notifications page. All notifications can be filtered by type and marked as read individually or all at once.

---

## 10. Reports & Analytics

Every role that has management responsibility has access to reports. The report system follows the same pattern across all portals:

### Report Filters (available per portal)

| Portal | Filter Options |
|---|---|
| Police | Case ID, Status, Priority, From Date, To Date |
| Social Worker | Status, Case Type, From Date, To Date |
| District Admin | District, Status, Date Range |
| Partner Institution | Referral Status, From Date, To Date |
| Admin | Status, District, Date Range |

### Export Formats

- **PDF** — formatted report with title, subtitle, column headers, and data rows. Generated client-side using `jsPDF` + `jspdf-autotable`
- **CSV** — raw data export for use in Excel or government data systems

### Analytics Dashboards

Role-specific analytics with charts (Recharts library):

| Portal | Charts Available |
|---|---|
| Police | Cases by District (bar chart), Case queue with priority scores |
| District Admin | Case trends over time, cases by type, resolution rates |
| Social Worker | Caseload over time, referral outcomes |
| Admin | National overview, district comparison, case type distribution |

---

## 11. Credentials Reference

All accounts below are **seeded automatically** every time the backend starts (via `DataSeeder`).

| Role | Username / Email | Password | Portal |
|---|---|---|---|
| System Admin | `admin@migeprof.gov.rw` | `Admin@2024` | `/dashboard` |
| Police Officer | `uwimana@rnp.gov.rw` | `Police@2024` | `/police/dashboard` |
| Social Worker | `uwase@migeprof.gov.rw` | `Social@2024` | `/socialworker/dashboard` |
| District Admin | `ndayisaba@gasabo.gov.rw` | `District@2024` | `/districtadmin/dashboard` |
| Partner Institution | `claire@isange.gov.rw` | `Partner@2024` | `/partner/dashboard` |
| Victim | `victim.demo` | `Victim@2024` | `/victim/dashboard` |

> **Anonymous reporting** — no credentials needed. Navigate to `/anonymous-report` or click "Report without an account" on the login page.

---

### Running the System

**Backend** (requires PostgreSQL running with database `gbvmonitor`):
```bash
cd backend
cp .env.example .env   # set DB credentials
./mvnw spring-boot:run
# → http://localhost:8083
# → Swagger UI: http://localhost:8083/swagger-ui.html
```

**Frontend**:
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
# → http://localhost:8080
```

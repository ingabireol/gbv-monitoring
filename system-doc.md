# GBV Monitor — System Documentation

**Ministry of Gender and Family Promotion (MIGEPROF) | Rwanda**

---

## 1. What Problem Does This System Solve?

Gender-Based Violence (GBV) and child abuse in Rwanda were historically under-reported and poorly tracked. Cases were handled on paper, referrals between agencies were lost, victims had no visibility into their own case, and government officials had no real-time picture of what was happening across districts.

**GBV Monitor** is a centralized digital platform that:
- Lets anyone (even anonymously) report a GBV or child abuse incident
- Tracks every case from report → investigation → resolution
- Coordinates across Police, Social Workers, Partner Institutions, and District Offices
- Gives each actor a role-specific portal so they see only what is relevant to them
- Provides analytics and exports for policy and oversight decisions

---

## 2. System Actors & Their Purpose

### Anonymous Reporter (Public)
**Who:** Any member of the public — no account needed.  
**Why:** Many victims or witnesses fear retaliation. Anonymous reporting removes that barrier.

| Functionality | Description |
|---|---|
| Submit Anonymous Report | File a report without revealing identity |
| Upload Evidence | Attach photos/documents to the report |
| Check Anonymous Status | Track case progress using the Case ID given at submission |
| Chat with Police | Communicate securely with the assigned officer via Case ID |

---

### Victim
**Who:** A verified survivor who has been registered in the system.  
**Why:** Victims deserve visibility into their own case and the support being provided to them.

| Functionality | Description |
|---|---|
| Register / Login | Create a secure account (PIN verified via email) |
| Submit Report | File a named incident report |
| View Cases | See all cases linked to their account |
| Update / Withdraw Own Case | Correct details or withdraw if needed |
| View Notifications | Receive updates about their case status |

---

### Social Worker
**Who:** MIGEPROF-affiliated case workers who handle victim support and recovery.  
**Why:** They are the frontline responders who register cases, coordinate care, and track recovery.

| Functionality | Description |
|---|---|
| Submit Report | Register a new GBV/child abuse case on behalf of a victim |
| Manage Referrals | Send victims to partner institutions (health, legal, shelter) |
| Manage Recovery Milestones | Track victim recovery steps and progress |
| Reports & Export | Generate filtered case reports, export as PDF/CSV |
| View Analytics | See caseload trends and outcomes |
| Update Profile | Maintain personal account details |

---

### Police Officer (RNP)
**Who:** Rwanda National Police officers assigned to GBV cases in their district.  
**Why:** Police investigate, accept/reject cases, and are the bridge for anonymous reporters who need a point of contact.

| Functionality | Description |
|---|---|
| View Assigned Cases | See all cases assigned to them |
| Accept / Reject Case | Formally take on or decline a case |
| Mark In Progress / Resolve | Update case lifecycle status |
| Chat with Anonymous Reporter | Two-way secure messaging via Case ID |
| Manage Referrals | Coordinate with other agencies |
| Case Updates | Log investigation notes to the timeline |
| View Analytics | See their performance and district stats |
| Reports & Export | Filter by Case ID, status, priority, date — export PDF/CSV |

---

### District Administrator
**Who:** Government officials overseeing GBV response in a specific district (e.g., Gasabo).  
**Why:** Districts need oversight of all cases in their jurisdiction without managing individual case actions.

| Functionality | Description |
|---|---|
| Assign Cases | Assign unassigned cases to officers in their district |
| View Case Summary | High-level view of all district cases |
| View Cases on Map | Geographic distribution of incidents |
| Submit Incident Reports | File district-level incident summaries |
| Staff Directory | View officers and social workers in the district |
| Inter-Agency Referrals | Coordinate referrals across institutions |
| District Analytics | Case trends, resolution rates, district stats |
| Export Report | Export district case data |

---

### System Administrator (MIGEPROF Admin)
**Who:** The central system administrator at MIGEPROF headquarters.  
**Why:** Full system oversight, user management, and national-level reporting.

| Functionality | Description |
|---|---|
| View Cases Summary | National-level case overview |
| Report Victim Case | Register cases directly |
| Case Assignments | Assign cases across the whole system |
| Case Updates | Log notes on any case |
| View Victim Recovery Journey | Full recovery timeline per victim |
| User Management | Create, disable, and manage all system accounts |
| Assign Referrals | Route referrals to partner institutions |
| View Notifications | System-wide alerts |
| View Support Tracking | Monitor ongoing victim support services |
| Export Reports | National data exports |

---

### Partner Institution Officer
**Who:** Staff at organizations like Isange One Stop Centre, legal aid offices, shelters, hospitals.  
**Why:** These institutions receive referrals and need a portal to acknowledge, respond to, and report on their workload.

| Functionality | Description |
|---|---|
| View Referral Notifications | Get notified when a new referral is assigned |
| View Referrals Assigned | See all referrals sent to their institution |
| Respond to the Referral | Accept, reject, or update the referral status |
| Export Reports | Generate filtered referral reports, export PDF/CSV |

---

## 3. End-to-End System Flow

```
INCIDENT OCCURS
     │
     ▼
┌─────────────────────────────────────────────────────┐
│  REPORT ENTRY  (3 paths)                             │
│  a) Anonymous Reporter → anonymous report + chat    │
│  b) Victim → logged-in report submission            │
│  c) Social Worker / Admin → registers on behalf     │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
            CASE CREATED IN SYSTEM
            (status: PENDING)
                       │
                       ▼
        DISTRICT ADMIN assigns case to Police Officer
            (status: ACCEPTED / REJECTED)
                       │
                       ▼
        POLICE OFFICER investigates
        - Chats with anonymous reporter if needed
        - Logs case updates to timeline
        - Marks case IN_PROGRESS
                       │
                       ▼
        SOCIAL WORKER registers victim support
        - Creates recovery milestones
        - Refers victim to Partner Institution
                       │
                       ▼
        PARTNER INSTITUTION receives referral
        - Acknowledges and responds
        - Provides service (medical, legal, shelter)
                       │
                       ▼
        POLICE OFFICER marks case RESOLVED
        SOCIAL WORKER closes recovery milestones
                       │
                       ▼
        ADMIN / DISTRICT ADMIN reviews
        - Analytics updated
        - Reports generated & exported
```

---

## 4. Key Technical Notes (Brief)

| Aspect | Detail |
|---|---|
| Frontend | React 18 + TypeScript + Vite, running at `localhost:8081` |
| Backend | Spring Boot 4.x REST API, running at `localhost:8083` |
| Auth | JWT tokens (24h expiry), stored in `localStorage` |
| Real-time | WebSocket at `/ws` for live notifications |
| Anonymous Chat | Police ↔ Reporter messaging via Case ID, polls every 5s |
| Database | PostgreSQL (`gbvmonitor`), schema managed by Hibernate |
| Roles | `ADMIN`, `DISTRICT_ADMIN`, `POLICE`, `SOCIAL_WORKER`, `PARTNER`, `VICTIM`, `PUBLIC` |
| Export | PDF and CSV export available on Police, Social Worker, Partner, and District Admin portals |

---

## 5. Credentials (Demo / Seeded Accounts)

| Role | Username | Password |
|---|---|---|
| System Admin | `admin@migeprof.gov.rw` | `Admin@2024` |
| Police Officer | `uwimana@rnp.gov.rw` | `Police@2024` |
| Social Worker | `uwase@migeprof.gov.rw` | `Social@2024` |
| District Admin | `ndayisaba@gasabo.gov.rw` | `District@2024` |
| Partner Institution | `claire@isange.gov.rw` | `Partner@2024` |
| Victim | `victim.demo` | `Victim@2024` |

> Anonymous reporting does not require any account — accessible from the login page.

---

## 6. Why This System Matters

1. **Privacy-first** — anonymous reporting and pseudonymized victim IDs protect survivors.
2. **Role separation** — each actor sees only what they need; no officer can access admin functions.
3. **Full traceability** — every status change, note, and referral is timestamped in the case timeline.
4. **No case falls through the cracks** — unassigned cases are visible to District Admins; overdue cases are flagged.
5. **Data for policy** — analytics and exportable reports let MIGEPROF measure trends and allocate resources.

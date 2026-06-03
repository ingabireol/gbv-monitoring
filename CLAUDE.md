# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GBV Monitor** — A government system for monitoring, reporting, and managing Gender-Based Violence and Child Abuse cases across Rwanda, built for MIGEPROF (Ministry of Gender and Family Promotion).

This is a full-stack monorepo with two independent sub-projects:
- `frontend/` — React 18 + TypeScript + Vite SPA
- `backend/` — Spring Boot 4.x REST API + WebSocket server

---

## Commands

### Frontend (`frontend/`)
```bash
npm install          # install dependencies
npm run dev          # dev server at http://localhost:5173
npm run build        # production build
npm run lint         # ESLint
npm run test         # run unit tests (vitest)
npm run test:watch   # vitest in watch mode
```

### Backend (`backend/`)
```bash
./mvnw spring-boot:run          # start server at http://localhost:8083
./mvnw test                     # run all tests
./mvnw test -Dtest=ClassName    # run a single test class
./mvnw clean package            # build JAR
```

Backend requires a running PostgreSQL instance. Copy `backend/.env.example` to `backend/.env` and set credentials before starting. The database name is `gbvmonitor` (must be created manually). The backend seeds default users on every startup via `DataSeeder`.

**Swagger UI** (when backend is running): `http://localhost:8083/swagger-ui.html`

---

## Architecture

### Backend (`com.gbvmonitor`)

Standard Spring Boot layered architecture: `controller → service interface → service impl → repository → entity`.

- **Security**: Stateless JWT via `JwtAuthenticationFilter`. Tokens expire after 24 hours. Public endpoints: `/api/auth/**`, `/api/reports/anonymous`, `/api/anonymous/**`.
- **Roles** (seeded by `DataSeeder`): `ADMIN`, `DISTRICT_ADMIN`, `POLICE`, `SOCIAL_WORKER`, `PARTNER`, `VICTIM`, `PUBLIC`.
- **Database**: PostgreSQL via Spring Data JPA. Flyway is present but **disabled** (`spring.flyway.enabled=false`); schema is managed by Hibernate `ddl-auto=update`.
- **WebSocket**: Configured at `/ws` via `WebSocketConfig` for real-time notifications.
- **Email**: SMTP-based email PIN verification for victim registration (`VictimEmailVerificationService`). Configure SMTP via `.env`.
- **Audit logging**: `AuditLogService` records security-relevant operations.
- **Scheduled tasks**: `SchedulerConfig` + `ScheduledReportService` for automated report generation.

Default seeded credentials (username = email for all except victim.demo):

| Role | Username | Password |
|------|----------|----------|
| ADMIN | admin@migeprof.gov.rw | Admin@2024 |
| POLICE | uwimana@rnp.gov.rw | Police@2024 |
| SOCIAL_WORKER | uwase@migeprof.gov.rw | Social@2024 |
| DISTRICT_ADMIN | ndayisaba@gasabo.gov.rw | District@2024 |
| PARTNER | claire@isange.gov.rw | Partner@2024 |
| VICTIM | victim.demo | Victim@2024 |

### Frontend (`frontend/src`)

**State management**: Two parallel layers — Redux Toolkit (RTK Query in `src/store/api.ts`) for all live backend calls, and a handful of in-memory Zustand-style stores (`src/lib/referralStore.ts`, `src/lib/anonymousReportStore.ts`) for offline-first prototype flows that haven't been migrated to the API yet.

**Auth**: Session stored in `localStorage` under keys `gbv_role`, `gbv_user`, `gbv_token`. `src/lib/auth.ts` provides the read/write helpers; `src/lib/authApi.ts` handles login/register HTTP calls. `RoleGuard` in `src/components/RoleGuard.tsx` protects routes.

**Role-based portals**: Six separate portal apps under `src/apps/`:
- `victim/` — case status, report submission, support tracking
- `police/` — assigned cases, referrals, analytics
- `socialworker/` — case registration, case list, referrals, reports
- `districtadmin/` — district-level oversight, staff, analytics
- `partner/` — referral inbox, services list

Pages shared across portals (e.g., `IncidentReporting`, `CaseManagement`) live in `src/pages/` and are reused by multiple role routes.

**API layer** (`src/store/api.ts`): Single RTK Query `createApi` instance covering all backend endpoints. The base URL defaults to `http://localhost:8083/api` and is overridable via `VITE_API_BASE_URL` env var.

**Frontend-specific patterns** (design system, component templates, data conventions) are documented in `frontend/CLAUDE.md` — read it before working on frontend UI.

### Frontend ↔ Backend contract

- Backend role names are SCREAMING_SNAKE_CASE (`SOCIAL_WORKER`); frontend maps these to camelCase (`socialworker`) in `src/lib/authApi.ts:mapBackendRoleToUserRole`.
- Report/case creation uses `multipart/form-data` (FormData). All other mutations use JSON.
- CORS is pre-configured for `localhost:5173`, `localhost:4173`, and `localhost:8080/8081`.

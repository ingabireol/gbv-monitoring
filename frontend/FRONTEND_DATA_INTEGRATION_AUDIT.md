# Frontend Data Integration Audit

Generated on 2026-03-22.

This audit separates pages into three states:

- `DB-backed now`: the routed screen is consuming backend API data.
- `Can be wired next`: a backend endpoint exists, but the page still needs frontend work.
- `Blocked by backend gap`: the current backend does not expose enough data for the page to stop using mocks safely.

## Shared Auth

- `DB-backed now`
  - `frontend/src/pages/Login.tsx`
  - `frontend/src/pages/VictimRegister.tsx`
- `Can be wired next`
  - password reset flow pages are still static confirmation screens

## Admin

- `DB-backed now`
  - `frontend/src/pages/AnalyticsDb.tsx`
    - uses `/api/analytics/cases-by-district`
    - uses `/api/analytics/trends`
    - uses `/api/analytics/resolution-rate`
  - `frontend/src/pages/CaseAssignmentsDb.tsx`
    - uses `/api/cases`
    - uses `/api/users?role=POLICE`
    - assigns through `/api/cases/{id}/assign`
  - `frontend/src/pages/CaseManagementDb.tsx`
    - uses `/api/cases`
    - updates status through `/api/cases/{id}/status`
  - `frontend/src/pages/CaseNotificationsDb.tsx`
    - uses `/api/template-notifications`
    - supports create, update, delete, and test-send actions
  - `frontend/src/pages/InterAgencyDb.tsx`
    - uses `/api/referrals`
    - uses `/api/cases`
    - uses `/api/users?role=PARTNER`
  - `frontend/src/pages/NotificationsDb.tsx`
    - uses `/api/notifications/user/{userId}`
    - writes read state through `/api/notifications/{id}/read`
  - `frontend/src/pages/PartnerInstitutionsDb.tsx`
    - uses `/api/users?role=PARTNER`
    - uses `/api/referrals`
    - note: this is derived from live partner staff and referral records, not a dedicated partner-institution model
  - `frontend/src/pages/SystemLogsDb.tsx`
    - uses `/api/audit-logs`
- `Blocked by backend gap`
  - `frontend/src/pages/Settings.tsx`
    - no settings, sessions, or privacy endpoints
  - `frontend/src/pages/ScheduledReports.tsx`
    - no scheduled-report API
  - `frontend/src/pages/RecoveryTracking.tsx`
    - no recovery tracking aggregate API
  - `frontend/src/pages/CaseSummary.tsx`
    - current backend analytics does not expose the rich summary breakdown used here

## Victim

- `DB-backed now`
  - `frontend/src/apps/victim/pages/VictimNotifications.tsx`
    - uses `/api/notifications/user/{userId}`
    - writes read state through `/api/notifications/{id}/read`
- `Can be wired next`
  - `frontend/src/apps/victim/pages/VictimNewReport.tsx`
    - backend report endpoints exist, but the routed page still submits a generated mock case reference
  - `frontend/src/apps/victim/pages/VictimCaseStatus.tsx`
    - backend has `/api/timeline-events/case/{caseId}` and `/api/milestones/case/{caseId}`
- `Blocked by backend gap`
  - `frontend/src/apps/victim/pages/VictimDashboard.tsx`
    - no victim-specific dashboard endpoint
  - `frontend/src/apps/victim/pages/VictimSupportTracking.tsx`
    - no support-service or appointment API for a victim
  - victim-specific case lookup by logged-in user is missing

## Police

- `DB-backed now`
  - `frontend/src/apps/police/pages/PoliceAssignedCasesDb.tsx`
    - uses `/api/cases`
    - filters records to the signed-in officer from `assignedOfficer`
    - updates status through `/api/cases/{id}/status`
  - `frontend/src/apps/police/pages/PoliceReferralsDb.tsx`
    - uses `/api/referrals`
    - uses `/api/cases`
    - uses `/api/users?role=PARTNER`
    - filters the shared referral registry to the signed-in officer's created referrals
    - note: creator scoping is based on stored referral metadata rather than a dedicated police-only endpoint
- `Can be wired next`
  - `frontend/src/apps/police/pages/PoliceAnalytics.tsx`
    - backend analytics endpoints can power a simplified version
- `Blocked by backend gap`
  - `frontend/src/apps/police/pages/PoliceDashboard.tsx`
    - no police-dashboard summary endpoint
  - `frontend/src/apps/police/pages/PoliceCaseDetail.tsx`
    - no backend endpoint for detailed evidence, notes, and officer activity in one response
  - `frontend/src/apps/police/pages/PoliceCaseUpdates.tsx`
    - no dedicated case update posting/list endpoint for officer notes
  - no police-specific case assignment filter endpoint

## Social Worker

- `DB-backed now`
  - `frontend/src/apps/socialworker/pages/SocialWorkerCasesDb.tsx`
    - uses `/api/cases`
    - updates status through `/api/cases/{id}/status`
    - note: backend still does not provide social-worker or district scoping, so this page shows the shared live case registry
- `DB-backed now`
  - `frontend/src/apps/socialworker/pages/SocialWorkerReferralsDb.tsx`
    - uses `/api/referrals`
    - uses `/api/cases`
    - uses `/api/users?role=PARTNER`
    - filters the shared referral registry to the signed-in social worker's created referrals
- `Can be wired next`
  - `frontend/src/apps/socialworker/pages/SocialWorkerReports.tsx`
    - backend analytics can support a simplified report view
- `Blocked by backend gap`
  - `frontend/src/apps/socialworker/pages/SocialWorkerDashboard.tsx`
    - no social-worker dashboard endpoint
  - `frontend/src/apps/socialworker/pages/SocialWorkerSupport.tsx`
    - no support-plan, counseling, notes, or milestone management API beyond generic case milestones
  - `frontend/src/apps/socialworker/pages/RegisterCase.tsx`
    - current backend report/case creation contracts do not match the full form data collected by the page

## District Admin

- `DB-backed now`
  - `frontend/src/apps/districtadmin/pages/DistrictAdminCasesDb.tsx`
    - uses `/api/cases`
    - note: backend still does not provide district-admin scoping, so this page shows the shared live case registry with client-side district filtering
  - `frontend/src/apps/districtadmin/pages/DistrictAdminReferralsDb.tsx`
    - uses `/api/referrals`
    - note: backend still does not provide district-scoped referrals, so this page shows the shared live referral registry
- `Can be wired next`
  - `frontend/src/apps/districtadmin/pages/DistrictAdminAnalytics.tsx`
    - backend analytics endpoints can support a reduced district view
- `Blocked by backend gap`
  - `frontend/src/apps/districtadmin/pages/DistrictAdminDashboard.tsx`
    - no district-admin dashboard summary endpoint
  - `frontend/src/apps/districtadmin/pages/DistrictAdminStaff.tsx`
    - no district staff management API
  - `frontend/src/apps/districtadmin/pages/DistrictAdminReports.tsx`
    - no district report aggregation/export API

## Partner

- `DB-backed now`
  - `frontend/src/apps/partner/pages/PartnerReferralsDb.tsx`
    - uses `/api/referrals`
    - filters the shared referral registry to the signed-in partner institution
    - updates status through `/api/referrals/{id}/status`
- `Blocked by backend gap`
  - `frontend/src/apps/partner/pages/PartnerDashboard.tsx`
    - no partner dashboard endpoint
  - `frontend/src/apps/partner/pages/PartnerServices.tsx`
    - no partner services catalog or beneficiary API

## Backend Coverage Summary

Existing backend APIs already available to the frontend:

- `/api/auth/*`
- `/api/cases`
- `/api/referrals`
- `/api/notifications`
- `/api/milestones`
- `/api/timeline-events`
- `/api/analytics`
- `/api/audit-logs`
- `/api/reports`
- `/api/users`
- `/api/template-notifications`

Main missing backend contracts for full frontend integration:

- role-scoped dashboards
- partner services
- victim support appointments and service tracking
- officer case notes and evidence detail
- scheduled reports
- district-scoped staff and reporting

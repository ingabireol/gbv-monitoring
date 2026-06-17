import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/language";

// Auth + guards
import { getUserRole } from "@/lib/auth";
import { RoleGuard } from "@/components/RoleGuard";
import Login from "./pages/Login.tsx";

// Admin pages
import Index from "./pages/Index.tsx";
import IncidentReporting from "./pages/IncidentReporting.tsx";
import CaseManagement from "./pages/CaseManagement.tsx";
import VictimSupport from "./pages/VictimSupport.tsx";
import InterAgency from "./pages/InterAgency.tsx";
import Analytics from "./pages/Analytics.tsx";
import Notifications from "./pages/Notifications.tsx";
import AnonymousReport from "./pages/AnonymousReport.tsx";
import RecoveryTracking from "./pages/RecoveryTracking.tsx";
import ScheduledReports from "./pages/ScheduledReports.tsx";
import CaseNotifications from "./pages/CaseNotifications.tsx";
import Settings from "./pages/Settings.tsx";
import UserManagement from "./pages/UserManagement.tsx";
import SystemLogs from "./pages/SystemLogs.tsx";
import PartnerInstitutions from "./pages/PartnerInstitutions.tsx";
import CaseAssignments from "./pages/CaseAssignments.tsx";
import CaseSummary from "./pages/CaseSummary.tsx";

// Victim pages
import VictimDashboard from "./apps/victim/pages/VictimDashboardLive.tsx";
import VictimCaseStatus from "./apps/victim/pages/VictimCaseStatusLive.tsx";
import VictimNewReport from "./apps/victim/pages/VictimNewReportLive.tsx";
import VictimNotifications from "./apps/victim/pages/VictimNotifications.tsx";
import VictimSupportTracking from "./apps/victim/pages/VictimSupportTrackingLive.tsx";

// Police pages
import PoliceDashboard from "./apps/police/pages/PoliceDashboard.tsx";
import PoliceAssignedCases from "./apps/police/pages/PoliceAssignedCases.tsx";
import PoliceCaseDetail from "./apps/police/pages/PoliceCaseDetail.tsx";
import PoliceReferrals from "./apps/police/pages/PoliceReferrals.tsx";
import PoliceAnalytics from "./apps/police/pages/PoliceAnalytics.tsx";
import PoliceCaseUpdates from "./apps/police/pages/PoliceCaseUpdates.tsx";
import PoliceReports from "./apps/police/pages/PoliceReports.tsx";

// Social worker pages
import SocialWorkerDashboard from "./apps/socialworker/pages/SocialWorkerDashboard.tsx";
import RegisterCase from "./apps/socialworker/pages/RegisterCase.tsx";
import SocialWorkerCases from "./apps/socialworker/pages/SocialWorkerCases.tsx";
import SocialWorkerSupport from "./apps/socialworker/pages/SocialWorkerSupport.tsx";
import SocialWorkerReferrals from "./apps/socialworker/pages/SocialWorkerReferrals.tsx";
import SocialWorkerReports from "./apps/socialworker/pages/SocialWorkerReports.tsx";

// District Admin pages
import DistrictAdminDashboard from "./apps/districtadmin/pages/DistrictAdminDashboard.tsx";
import DistrictAdminCases from "./apps/districtadmin/pages/DistrictAdminCases.tsx";
import DistrictAdminStaff from "./apps/districtadmin/pages/DistrictAdminStaff.tsx";
import DistrictAdminReferrals from "./apps/districtadmin/pages/DistrictAdminReferrals.tsx";
import DistrictAdminAnalytics from "./apps/districtadmin/pages/DistrictAdminAnalytics.tsx";
import DistrictAdminReports from "./apps/districtadmin/pages/DistrictAdminReports.tsx";

// Partner pages
import PartnerDashboard from "./apps/partner/pages/PartnerDashboard.tsx";
import PartnerReferrals from "./apps/partner/pages/PartnerReferrals.tsx";
import PartnerServices from "./apps/partner/pages/PartnerServices.tsx";
import PartnerNotifications from "./apps/partner/pages/PartnerNotifications.tsx";
import PartnerReports from "./apps/partner/pages/PartnerReports.tsx";

import VictimRegister from "./pages/VictimRegister.tsx";
import CheckStatus from "./pages/CheckStatusDb.tsx";
import AccountRequested from "./pages/AccountRequested.tsx";
import PasswordResetSent from "./pages/PasswordResetSent.tsx";
import AccountCreated from "./pages/AccountCreated.tsx";
import Profile from "./pages/Profile.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function RequireRole() {
  const role = getUserRole();
  if (!role) return <Navigate to="/login" replace />;
  if (role === "victim") return <Navigate to="/victim/dashboard" replace />;
  if (role === "police") return <Navigate to="/police/dashboard" replace />;
  if (role === "socialworker") return <Navigate to="/socialworker/dashboard" replace />;
  if (role === "districtadmin") return <Navigate to="/districtadmin/dashboard" replace />;
  if (role === "partner") return <Navigate to="/partner/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const role = getUserRole();
  if (!role) return <Navigate to="/login" replace />;
  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/anonymous-report" element={<AnonymousReport />} />
          <Route path="/check-status" element={<CheckStatus />} />
          <Route path="/account-requested" element={<AccountRequested />} />
          <Route path="/password-reset-sent" element={<PasswordResetSent />} />
          <Route path="/account-created" element={<AccountCreated />} />
          <Route path="/victim/register" element={<VictimRegister />} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />

          <Route path="/" element={<RequireRole />} />
          <Route path="/dashboard" element={<RoleGuard role="admin"><Index /></RoleGuard>} />
          <Route path="/incident-reports" element={<RoleGuard role="admin"><IncidentReporting /></RoleGuard>} />
          <Route path="/active-cases" element={<RoleGuard role="admin"><CaseManagement /></RoleGuard>} />
          <Route path="/case-assignments" element={<RoleGuard role="admin"><CaseAssignments /></RoleGuard>} />
          <Route path="/case-summary" element={<RoleGuard role="admin"><CaseSummary /></RoleGuard>} />
          <Route path="/victim-support" element={<RoleGuard role="admin"><VictimSupport /></RoleGuard>} />
          <Route path="/inter-agency" element={<RoleGuard role="admin"><InterAgency /></RoleGuard>} />
          <Route path="/partners" element={<RoleGuard role="admin"><PartnerInstitutions /></RoleGuard>} />
          <Route path="/analytics" element={<RoleGuard role="admin"><Analytics /></RoleGuard>} />
          <Route path="/scheduled-reports" element={<RoleGuard role="admin"><ScheduledReports /></RoleGuard>} />
          <Route path="/notifications" element={<RoleGuard role="admin"><Notifications /></RoleGuard>} />
          <Route path="/recovery-tracking" element={<RoleGuard role="admin"><RecoveryTracking /></RoleGuard>} />
          <Route path="/case-notifications" element={<RoleGuard role="admin"><CaseNotifications /></RoleGuard>} />
          <Route path="/user-management" element={<RoleGuard role="admin"><UserManagement /></RoleGuard>} />
          <Route path="/system-logs" element={<RoleGuard role="admin"><SystemLogs /></RoleGuard>} />
          <Route path="/settings" element={<RoleGuard role="admin"><Settings /></RoleGuard>} />

          <Route path="/victim/dashboard" element={<RoleGuard role="victim"><VictimDashboard /></RoleGuard>} />
          <Route path="/victim/case" element={<RoleGuard role="victim"><VictimCaseStatus /></RoleGuard>} />
          <Route path="/victim/report" element={<RoleGuard role="victim"><VictimNewReport /></RoleGuard>} />
          <Route path="/victim/notifications" element={<RoleGuard role="victim"><VictimNotifications /></RoleGuard>} />
          <Route path="/victim/support" element={<RoleGuard role="victim"><VictimSupportTracking /></RoleGuard>} />

          <Route path="/police/dashboard" element={<RoleGuard role="police"><PoliceDashboard /></RoleGuard>} />
          <Route path="/police/cases" element={<RoleGuard role="police"><PoliceAssignedCases /></RoleGuard>} />
          <Route path="/police/cases/:id" element={<RoleGuard role="police"><PoliceCaseDetail /></RoleGuard>} />
          <Route path="/police/referrals" element={<RoleGuard role="police"><PoliceReferrals /></RoleGuard>} />
          <Route path="/police/analytics" element={<RoleGuard role="police"><PoliceAnalytics /></RoleGuard>} />
          <Route path="/police/updates" element={<RoleGuard role="police"><PoliceCaseUpdates /></RoleGuard>} />
          <Route path="/police/reports" element={<RoleGuard role="police"><PoliceReports /></RoleGuard>} />

          <Route path="/socialworker/dashboard" element={<RoleGuard role="socialworker"><SocialWorkerDashboard /></RoleGuard>} />
          <Route path="/socialworker/register"  element={<RoleGuard role="socialworker"><RegisterCase /></RoleGuard>} />
          <Route path="/socialworker/cases"     element={<RoleGuard role="socialworker"><SocialWorkerCases /></RoleGuard>} />
          <Route path="/socialworker/support"   element={<RoleGuard role="socialworker"><SocialWorkerSupport /></RoleGuard>} />
          <Route path="/socialworker/referrals" element={<RoleGuard role="socialworker"><SocialWorkerReferrals /></RoleGuard>} />
          <Route path="/socialworker/reports"   element={<RoleGuard role="socialworker"><SocialWorkerReports /></RoleGuard>} />

          <Route path="/districtadmin/dashboard"       element={<RoleGuard role="districtadmin"><DistrictAdminDashboard /></RoleGuard>} />
          <Route path="/districtadmin/cases"           element={<RoleGuard role="districtadmin"><DistrictAdminCases /></RoleGuard>} />
          <Route path="/districtadmin/incident-reports" element={<RoleGuard role="districtadmin"><IncidentReporting /></RoleGuard>} />
          <Route path="/districtadmin/case-management" element={<RoleGuard role="districtadmin"><CaseManagement /></RoleGuard>} />
          <Route path="/districtadmin/case-assignments" element={<RoleGuard role="districtadmin"><CaseAssignments /></RoleGuard>} />
          <Route path="/districtadmin/victim-support"  element={<RoleGuard role="districtadmin"><VictimSupport /></RoleGuard>} />
          <Route path="/districtadmin/recovery-tracking" element={<RoleGuard role="districtadmin"><RecoveryTracking /></RoleGuard>} />
          <Route path="/districtadmin/coordination"    element={<RoleGuard role="districtadmin"><InterAgency /></RoleGuard>} />
          <Route path="/districtadmin/staff"           element={<RoleGuard role="districtadmin"><DistrictAdminStaff /></RoleGuard>} />
          <Route path="/districtadmin/referrals"       element={<RoleGuard role="districtadmin"><DistrictAdminReferrals /></RoleGuard>} />
          <Route path="/districtadmin/analytics"       element={<RoleGuard role="districtadmin"><DistrictAdminAnalytics /></RoleGuard>} />
          <Route path="/districtadmin/reports"         element={<RoleGuard role="districtadmin"><DistrictAdminReports /></RoleGuard>} />

          <Route path="/partner/dashboard"       element={<RoleGuard role="partner"><PartnerDashboard /></RoleGuard>} />
          <Route path="/partner/notifications"   element={<RoleGuard role="partner"><PartnerNotifications /></RoleGuard>} />
          <Route path="/partner/referrals"       element={<RoleGuard role="partner"><PartnerReferrals /></RoleGuard>} />
          <Route path="/partner/services"        element={<RoleGuard role="partner"><PartnerServices /></RoleGuard>} />
          <Route path="/partner/reports"         element={<RoleGuard role="partner"><PartnerReports /></RoleGuard>} />

          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;


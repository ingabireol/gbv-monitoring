import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  EyeOff,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Route,
  ScrollText,
  Settings,
  Shield,
  User,
  UserCog,
  Users,
} from "lucide-react";
import { clearRole, getCurrentUser } from "@/lib/auth";
import { getInitials, getRoleLabel, getUserDisplayName } from "@/lib/adminData";
import { TranslationKey, useLanguage } from "@/lib/language";

interface NavItem {
  titleKey: TranslationKey;
  icon: React.ElementType;
  href: string;
}

interface NavGroup {
  labelKey: TranslationKey;
  id: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: "Overview",
    labelKey: "overview",
    items: [
      { titleKey: "dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { titleKey: "caseSummary", icon: FileText, href: "/case-summary" },
      { titleKey: "profile", icon: User, href: "/profile" },
    ],
  },
  {
    id: "Case Management",
    labelKey: "caseManagement",
    items: [
      { titleKey: "incidentReports", icon: AlertTriangle, href: "/incident-reports" },
      { titleKey: "active", icon: Briefcase, href: "/active-cases" },
      { titleKey: "caseAssignments", icon: Users, href: "/case-assignments" },
      { titleKey: "report", icon: EyeOff, href: "/anonymous-report" },
    ],
  },
  {
    id: "Victim Services",
    labelKey: "victimServices",
    items: [
      { titleKey: "supportTracking", icon: HeartHandshake, href: "/victim-support" },
      { titleKey: "recoveryJourney", icon: Route, href: "/recovery-tracking" },
      { titleKey: "notifications", icon: Bell, href: "/notifications" },
      { titleKey: "caseUpdates", icon: MessageSquare, href: "/case-notifications" },
    ],
  },
  {
    id: "Coordination",
    labelKey: "coordination",
    items: [
      { titleKey: "interAgencyReferrals", icon: Building2, href: "/inter-agency" },
      { titleKey: "partnerInstitutions", icon: Users, href: "/partners" },
    ],
  },
  {
    id: "Analytics",
    labelKey: "analytics",
    items: [
      { titleKey: "reportsAndTrends", icon: BarChart3, href: "/analytics" },
      { titleKey: "scheduledReports", icon: Calendar, href: "/scheduled-reports" },
    ],
  },
  {
    id: "Administration",
    labelKey: "administration",
    items: [
      { titleKey: "userManagement", icon: UserCog, href: "/user-management" },
      { titleKey: "systemLogs", icon: ScrollText, href: "/system-logs" },
      { titleKey: "settings", icon: Settings, href: "/settings" },
    ],
  },
];

const districtAdminNavGroups: NavGroup[] = [
  {
    id: "Overview",
    labelKey: "overview",
    items: [
      { titleKey: "myDistrict", icon: LayoutDashboard, href: "/districtadmin/dashboard" },
      { titleKey: "caseSummary", icon: FileText, href: "/districtadmin/cases" },
      { titleKey: "profile", icon: User, href: "/profile" },
    ],
  },
  {
    id: "Case Management",
    labelKey: "caseManagement",
    items: [
      { titleKey: "incidentReports", icon: AlertTriangle, href: "/districtadmin/incident-reports" },
      { titleKey: "active", icon: Briefcase, href: "/districtadmin/case-management" },
      { titleKey: "caseAssignments", icon: Users, href: "/districtadmin/case-assignments" },
      { titleKey: "staffDirectory", icon: Users, href: "/districtadmin/staff" },
    ],
  },
  {
    id: "Victim Services",
    labelKey: "victimServices",
    items: [
      { titleKey: "supportTracking", icon: HeartHandshake, href: "/districtadmin/victim-support" },
      { titleKey: "recoveryJourney", icon: Route, href: "/districtadmin/recovery-tracking" },
    ],
  },
  {
    id: "Coordination",
    labelKey: "coordination",
    items: [
      { titleKey: "interAgencyReferrals", icon: Building2, href: "/districtadmin/coordination" },
      { titleKey: "referrals", icon: Building2, href: "/districtadmin/referrals" },
    ],
  },
  {
    id: "Analytics",
    labelKey: "analytics",
    items: [
      { titleKey: "districtAnalytics", icon: BarChart3, href: "/districtadmin/analytics" },
      { titleKey: "reports", icon: Calendar, href: "/districtadmin/reports" },
    ],
  },
];

export function DashboardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const currentUser = getCurrentUser();
  const displayName = getUserDisplayName(currentUser ?? undefined);
  const displayRole = getRoleLabel(currentUser?.role);
  const initials = getInitials(displayName);
  const groups = currentUser?.role === "districtadmin" ? districtAdminNavGroups : navGroups;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Overview: true,
    "Case Management": true,
    "Victim Services": true,
    Coordination: true,
    Analytics: true,
    Administration: true,
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = () => {
    clearRole();
    navigate("/login");
  };

  return (
    <>
      <div aria-hidden="true" className="w-[230px] shrink-0" />
      <aside className="fixed left-0 top-0 z-30 h-screen w-[230px] bg-sidebar border-r border-border flex flex-col shrink-0 overflow-hidden min-h-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-sm font-semibold text-foreground">GBV Monitor</h1>
              <p className="text-[10px] text-muted-foreground tracking-wide">MIGEPROF - Rwanda</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto py-3 px-2 space-y-1">
          {groups.map((group) => {
            const isOpen = openGroups[group.id] ?? false;
            return (
              <div key={group.id}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2 py-1.5 mb-0.5"
                >
                  <span className="label-text">{t(group.labelKey)}</span>
                  {isOpen ? (
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  )}
                </button>
                {isOpen && (
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <button
                          key={item.href}
                          onClick={() => navigate(item.href)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm transition-colors duration-200 ${
                            isActive
                              ? "bg-primary/15 text-primary border-l-[3px] border-primary font-medium rounded-none"
                              : "rounded-lg text-sidebar-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                        >
                          <item.icon className="w-4 h-4 shrink-0" />
                          <span>{t(item.titleKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{displayName}</p>
              <p className="text-[10px] text-muted-foreground">{displayRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t("signOut")}</span>
          </button>
        </div>
      </aside>
    </>
  );
}

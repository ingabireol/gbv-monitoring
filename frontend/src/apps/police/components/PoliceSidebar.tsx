import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowRightLeft,
  BadgeCheck,
  BarChart2,
  Bell,
  Briefcase,
  FileText,
  LayoutDashboard,
  LogOut,
  Shield,
  User,
} from "lucide-react";
import { clearRole, getCurrentUser } from "@/lib/auth";
import { useGetAssignedCasesQuery } from "@/store/api";
import { TranslationKey, useLanguage } from "@/lib/language";

const NAV = [
  { labelKey: "myDashboard" as TranslationKey, Icon: LayoutDashboard, href: "/police/dashboard" },
  { labelKey: "assignedCases" as TranslationKey, Icon: Briefcase, href: "/police/cases" },
  { labelKey: "caseUpdates" as TranslationKey, Icon: Bell, href: "/police/updates" },
  { labelKey: "referrals" as TranslationKey, Icon: ArrowRightLeft, href: "/police/referrals" },
  { labelKey: "districtAnalytics" as TranslationKey, Icon: BarChart2, href: "/police/analytics" },
  { labelKey: "reports" as TranslationKey, Icon: FileText, href: "/police/reports" },
  { labelKey: "profile" as TranslationKey, Icon: User, href: "/profile" },
];

export function PoliceSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const currentUser = getCurrentUser();
  const { data } = useGetAssignedCasesQuery(undefined, {
    skip: !currentUser,
    refetchOnMountOrArgChange: true,
  });

  const assignedCases = (data?.data ?? []) as Array<{ caseId?: string }>;
  const officerName = currentUser?.name || currentUser?.username || "Police Officer";
  const officerMeta = [currentUser?.district, `${assignedCases.length} case(s)`]
    .filter(Boolean)
    .join(" | ");

  const handleLogout = () => {
    clearRole();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <div aria-hidden="true" className="w-[220px] shrink-0" />
      <aside className="fixed top-0 left-0 z-30 h-screen w-[220px] bg-sidebar border-r border-border flex flex-col shrink-0 overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-foreground">GBV Monitor</p>
              <p className="text-[10px] text-muted-foreground">Police Portal | RNP</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          <p className="label-text px-2 py-1.5 mb-1">{t("officerPortal").toUpperCase()}</p>
          {NAV.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm transition-colors duration-200 text-left rounded-none ${
                  isActive
                    ? "bg-primary/15 text-primary border-l-[3px] border-primary font-medium"
                    : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.Icon className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs leading-tight">{t(item.labelKey)}</p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <BadgeCheck className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-foreground truncate">{officerName}</p>
              <p className="text-[9px] text-muted-foreground truncate">{officerMeta || "Signed-in officer"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors duration-200 py-1 rounded-none hover:bg-secondary"
          >
            <LogOut className="w-3 h-3" /> {t("exitPortal")}
          </button>
        </div>
      </aside>
    </>
  );
}

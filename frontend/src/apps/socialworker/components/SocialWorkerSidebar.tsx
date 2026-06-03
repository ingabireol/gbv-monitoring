import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FilePlus, Briefcase,
  HeartHandshake, ArrowRightLeft, BarChart3,
  Shield, LogOut, BadgeCheck, User,
} from "lucide-react";
import { clearRole, getCurrentUser } from "@/lib/auth";
import { TranslationKey, useLanguage } from "@/lib/language";

const NAV = [
  { labelKey: "dashboard" as TranslationKey, Icon: LayoutDashboard, href: "/socialworker/dashboard" },
  { labelKey: "report" as TranslationKey, Icon: FilePlus, href: "/socialworker/register" },
  { labelKey: "myCase" as TranslationKey, Icon: Briefcase, href: "/socialworker/cases" },
  { labelKey: "supportTracking" as TranslationKey, Icon: HeartHandshake, href: "/socialworker/support" },
  { labelKey: "referrals" as TranslationKey, Icon: ArrowRightLeft, href: "/socialworker/referrals" },
  { labelKey: "reports" as TranslationKey, Icon: BarChart3, href: "/socialworker/reports" },
  { labelKey: "profile" as TranslationKey, Icon: User, href: "/profile" },
];

export function SocialWorkerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();
  const { t } = useLanguage();

  const handleLogout = () => {
    clearRole();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <div aria-hidden="true" className="w-[220px] shrink-0" />
      <aside className="fixed top-0 left-0 z-30 h-screen w-[220px] bg-sidebar border-r border-border flex flex-col shrink-0 overflow-hidden">
        {/* Brand */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-foreground">GBV Monitor</p>
              <p className="text-[10px] text-muted-foreground">Social Worker Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          <p className="label-text px-2 py-1.5 mb-1">{t("workerPortal").toUpperCase()}</p>
          {NAV.map((item) => {
            const isActive =
              location.pathname === item.href ||
              location.pathname.startsWith(item.href + "/");
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

        {/* Footer */}
        <div className="p-3 border-t border-border space-y-2">
          <div className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-secondary">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <BadgeCheck className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-foreground truncate">{currentUser?.name || currentUser?.username || "Social Worker"}</p>
              <p className="text-[9px] text-muted-foreground truncate">{currentUser?.email || currentUser?.username || "Signed in"}</p>
              <p className="text-[9px] text-muted-foreground truncate">{currentUser?.district || ""}</p>
              <p className="text-[9px] text-muted-foreground truncate leading-tight mt-0.5">{currentUser?.institution || ""}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors duration-200 py-1 rounded-none hover:bg-secondary"
          >
            <LogOut className="w-3 h-3" /> {t("signOut")}
          </button>
        </div>
      </aside>
    </>
  );
}

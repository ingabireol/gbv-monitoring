import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, FilePlus, Bell,
  Shield, LogOut, Lock, HeartHandshake,
  User,
} from "lucide-react";
import { clearRole, getCurrentUser, getUserFirstName } from "@/lib/auth";
import { useGetMyCasesQuery } from "@/store/api";
import { TranslationKey, useLanguage } from "@/lib/language";

const NAV = [
  { labelKey: "home" as TranslationKey, Icon: LayoutDashboard, href: "/victim/dashboard" },
  { labelKey: "myCase" as TranslationKey, Icon: FileText, href: "/victim/case" },
  { labelKey: "report" as TranslationKey, Icon: FilePlus, href: "/victim/report" },
  { labelKey: "caseUpdates" as TranslationKey, Icon: Bell, href: "/victim/notifications" },
  { labelKey: "help" as TranslationKey, Icon: HeartHandshake, href: "/victim/support" },
  { labelKey: "profile" as TranslationKey, Icon: User, href: "/profile" },
];

export function VictimSidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { t } = useLanguage();
  const currentUser = getCurrentUser();
  const { data } = useGetMyCasesQuery(undefined, {
    skip: !currentUser,
    refetchOnMountOrArgChange: true,
  });
  const latestCase = ((data?.data ?? []) as Array<{ caseId?: string }>)[0];

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
            <p className="text-[10px] text-muted-foreground">Survivor Portal · MIGEPROF</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        <p className="label-text px-2 py-1.5 mb-1">{t("myPortal").toUpperCase()}</p>
        {NAV.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-3 text-sm transition-colors duration-200 text-left rounded-none ${
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
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <Lock className="w-3 h-3 text-primary shrink-0" />
          <p className="text-[9px] text-primary font-medium leading-tight">{t("privateEncryptedSession")}</p>
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="w-3 h-3 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-foreground truncate">
              {getUserFirstName(currentUser)}
            </p>
            <p className="text-[9px] text-muted-foreground truncate">
              {latestCase?.caseId || "No case filed yet"}
            </p>
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

import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRightLeft,
  BadgeCheck,
  Bell,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Shield,
  User,
} from "lucide-react";
import { clearRole, getCurrentUser } from "@/lib/auth";
import { getInitials } from "@/lib/adminData";
import { getPartnerAccountLabel, getPartnerInstitutionName, getPartnerLocation } from "@/apps/partner/lib/partnerData";
import { TranslationKey, useLanguage } from "@/lib/language";

const NAV = [
  { labelKey: "dashboard" as TranslationKey,      Icon: LayoutDashboard, href: "/partner/dashboard" },
  { labelKey: "notifications" as TranslationKey,  Icon: Bell,            href: "/partner/notifications" },
  { labelKey: "referrals" as TranslationKey,      Icon: ArrowRightLeft,  href: "/partner/referrals" },
  { labelKey: "services" as TranslationKey,       Icon: HeartHandshake,  href: "/partner/services" },
  { labelKey: "reports" as TranslationKey,        Icon: FileText,        href: "/partner/reports" },
  { labelKey: "profile" as TranslationKey,        Icon: User,            href: "/profile" },
];

export function PartnerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const currentUser = getCurrentUser();
  const institution = getPartnerInstitutionName(currentUser);
  const locationLabel = getPartnerLocation(currentUser);
  const accountLabel = getPartnerAccountLabel(currentUser);

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
              <p className="text-[10px] text-muted-foreground">Partner Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          <p className="label-text px-2 py-1.5 mb-1">{t("partnerPortal").toUpperCase()}</p>
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
                <p className="text-xs leading-tight">{t(item.labelKey)}</p>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <div className="flex items-start gap-2 px-2 py-2 rounded-lg bg-secondary">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold text-primary">
              {getInitials(institution)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-foreground truncate">{institution}</p>
              <p className="text-[9px] text-muted-foreground truncate">{accountLabel}</p>
              <p className="text-[9px] text-muted-foreground truncate">{locationLabel}</p>
            </div>
            <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors duration-200 py-1 rounded-none hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <LogOut className="w-3 h-3" /> {t("signOut")}
          </button>
        </div>
      </aside>
    </>
  );
}

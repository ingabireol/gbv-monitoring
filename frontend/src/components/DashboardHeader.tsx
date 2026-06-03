import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, Monitor, Moon, Search, Settings, Sun, User } from "lucide-react";
import { clearRole, getCurrentUser } from "@/lib/auth";
import { useGetCurrentProfileQuery, useGetNotificationsQuery } from "@/store/api";
import { getThemeMode, setThemeMode } from "@/lib/theme";
import { getInitials, getRoleLabel, getUserDisplayName } from "@/lib/adminData";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/lib/language";

export function DashboardHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const currentUser = getCurrentUser();
  const { data: profileData } = useGetCurrentProfileQuery(undefined, {
    skip: !currentUser,
  });
  const [search, setSearch] = useState("");
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const [themeMode, setThemeModeState] = useState(getThemeMode());

  const { data: notificationsData } = useGetNotificationsQuery(currentUser?.id ?? "", {
    skip: !currentUser?.id,
  });

  const unreadCount = useMemo(() => {
    const items = (notificationsData?.data ?? []) as Array<{ read?: boolean }>;
    return items.filter((item) => !item.read).length;
  }, [notificationsData]);

  const profile = profileData?.data;
  const displayName = profile?.displayName || profile?.username || getUserDisplayName(currentUser ?? undefined);
  const displayRole = getRoleLabel(profile?.role || currentUser?.role);
  const initials = getInitials(displayName);
  const sectionLabel = getSectionLabel(location.pathname, currentUser ? displayRole : t("workspace"));
  const pageLabel = getPageLabel(location.pathname);

  const handleThemeToggle = () => {
    const nextMode = themeMode === "dark" ? "light" : "dark";
    setThemeMode(nextMode);
    setThemeModeState(nextMode);
  };

  useEffect(() => {
    if (!avatarOpen) {
      return;
    }

    const handler = (event: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setAvatarOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [avatarOpen]);

  const handleSearchKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && search.trim()) {
      navigate(`/active-cases?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleSignOut = () => {
    setAvatarOpen(false);
    clearRole();
    navigate("/login");
  };

  return (
    <header className="h-[58px] bg-card border-b border-border flex items-center justify-between px-5 shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground">{sectionLabel}</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-primary font-medium">{pageLabel}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={handleSearchKey}
            placeholder={t("searchPlaceholder")}
            className="w-[230px] h-8 pl-8 pr-3 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200"
          />
        </div>

        <div className="relative group">
          <button
            onClick={() => navigate("/notifications")}
            className="relative w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-secondary transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1.5 whitespace-nowrap rounded bg-secondary border border-border px-2 py-1 text-[10px] text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
            {t("notifications")}
          </span>
        </div>

        <div className="relative group">
          <button
            onClick={() => navigate("/system-logs")}
            className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-secondary transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <Monitor className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1.5 whitespace-nowrap rounded bg-secondary border border-border px-2 py-1 text-[10px] text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
            {t("systemLogs")}
          </span>
        </div>

        <LanguageSelector />

        <button
          onClick={handleThemeToggle}
          className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-secondary transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-primary"
          title={themeMode === "dark" ? t("lightMode") : t("darkMode")}
        >
          {themeMode === "dark" ? (
            <Sun className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Moon className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        <div ref={avatarRef} className="relative">
          <button
            onClick={() => setAvatarOpen((open) => !open)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-xs font-semibold text-primary-foreground ring-2 ring-primary/30 hover:ring-primary/60 transition-all duration-200 focus:outline-none focus:ring-primary"
          >
            {initials}
          </button>

          {avatarOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-semibold text-foreground">{displayName}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{displayRole}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setAvatarOpen(false);
                    navigate("/profile");
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
                >
                  <User className="w-3.5 h-3.5 shrink-0" /> {t("myProfile")}
                </button>
                <button
                  onClick={() => {
                    setAvatarOpen(false);
                    navigate("/settings");
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
                >
                  <Settings className="w-3.5 h-3.5 shrink-0" /> {t("settings")}
                </button>
              </div>

              <div className="border-t border-border py-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors duration-150"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" /> {t("signOut")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function getSectionLabel(pathname: string, fallback: string): string {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  if (normalizedPath === "/victim" || normalizedPath.startsWith("/victim/")) {
    return "Victim";
  }
  if (normalizedPath === "/districtadmin" || normalizedPath.startsWith("/districtadmin/")) {
    return "District Administrator";
  }
  if (normalizedPath === "/police" || normalizedPath.startsWith("/police/")) {
    return "Police Officer";
  }
  if (normalizedPath === "/socialworker" || normalizedPath.startsWith("/socialworker/")) {
    return "Social Worker";
  }
  if (normalizedPath === "/partner" || normalizedPath.startsWith("/partner/")) {
    return "Partner Institution";
  }
  return fallback;
}

function getPageLabel(pathname: string): string {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const labels: Record<string, string> = {
    "/profile": "Profile",
    "/victim/dashboard": "Dashboard",
    "/victim/case": "My Case",
    "/victim/report": "New Report",
    "/victim/notifications": "Notifications",
    "/victim/support": "Support Services",
    "/dashboard": "Dashboard",
    "/user-management": "User Management",
    "/incident-reports": "Incident Reports",
    "/active-cases": "Case Management",
    "/victim-support": "Victim Support",
    "/inter-agency": "Coordination",
    "/analytics": "Analytics",
    "/notifications": "Notifications",
    "/recovery-tracking": "Recovery Tracking",
    "/scheduled-reports": "Scheduled Reports",
    "/case-notifications": "Case Notifications",
    "/settings": "Settings",
    "/system-logs": "System Logs",
    "/partner-institutions": "Partner Institutions",
    "/case-assignments": "Case Assignments",
    "/case-summary": "Case Summary",
    "/districtadmin/dashboard": "Dashboard",
    "/districtadmin/cases": "Case Overview",
    "/districtadmin/incident-reports": "Incident Reports",
    "/districtadmin/case-management": "Case Management",
    "/districtadmin/case-assignments": "Case Assignments",
    "/districtadmin/victim-support": "Victim Services",
    "/districtadmin/recovery-tracking": "Recovery Tracking",
    "/districtadmin/staff": "Staff Directory",
    "/districtadmin/coordination": "Coordination",
    "/districtadmin/referrals": "Referrals",
    "/districtadmin/analytics": "Analytics",
    "/districtadmin/reports": "Reports",
    "/police/dashboard": "Dashboard",
    "/police/cases": "Assigned Cases",
    "/police/referrals": "Referrals",
    "/police/analytics": "Analytics",
    "/police/updates": "Case Updates",
    "/socialworker/dashboard": "Dashboard",
    "/socialworker/register": "Register Case",
    "/socialworker/cases": "Cases",
    "/socialworker/support": "Support",
    "/socialworker/referrals": "Referrals",
    "/socialworker/reports": "Reports",
    "/partner/dashboard": "Dashboard",
    "/partner/referrals": "Referrals",
    "/partner/services": "Services",
    "/partner/reports": "Reports",
  };

  if (labels[normalizedPath]) {
    return labels[normalizedPath];
  }

  const lastSegment = normalizedPath.split("/").filter(Boolean).at(-1);
  if (!lastSegment) {
    return "Dashboard";
  }

  return lastSegment
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

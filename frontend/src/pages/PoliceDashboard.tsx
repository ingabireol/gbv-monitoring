import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, Briefcase, AlertTriangle, CheckCircle2,
  Clock, Search, ChevronRight, LogOut, Bell,
  MapPin, User, Plus, Filter,
} from "lucide-react";
import { clearRole } from "@/lib/auth";
import { toast } from "sonner";

/* ─── Types ──────────────────────────────────────────────── */
type CaseStatus   = "Critical" | "In Progress" | "Pending" | "Resolved";
type CasePriority = "High" | "Medium" | "Low";

interface AssignedCase {
  id: string;
  victimId: string;
  type: string;
  district: string;
  status: CaseStatus;
  priority: CasePriority;
  lastUpdated: string;
  daysOpen: number;
}

interface Alert {
  id: number;
  text: string;
  type: "new" | "update" | "overdue";
  time: string;
}

/* ─── Constants ──────────────────────────────────────────── */
const STATUS_CONFIG: Record<CaseStatus, { cls: string; dot: string }> = {
  "Critical":    { cls: "bg-destructive/15 text-destructive", dot: "bg-destructive" },
  "In Progress": { cls: "bg-info/15 text-info",               dot: "bg-info" },
  "Pending":     { cls: "bg-warning/15 text-warning",         dot: "bg-warning" },
  "Resolved":    { cls: "bg-success/15 text-success",         dot: "bg-success" },
};

const PRIORITY_CONFIG: Record<CasePriority, string> = {
  High:   "text-destructive",
  Medium: "text-warning",
  Low:    "text-muted-foreground",
};

const CASES: AssignedCase[] = [
  { id: "GBV-2024-0142", victimId: "Victim #00142", type: "Domestic Violence",   district: "Gasabo",   status: "In Progress", priority: "High",   lastUpdated: "2024-12-05", daysOpen: 87  },
  { id: "GBV-2024-0211", victimId: "Victim #00211", type: "Sexual Assault",      district: "Gasabo",   status: "Resolved",    priority: "High",   lastUpdated: "2024-12-04", daysOpen: 145 },
  { id: "GBV-2024-0305", victimId: "Victim #00305", type: "Economic Abuse",      district: "Gasabo",   status: "In Progress", priority: "Medium", lastUpdated: "2024-12-03", daysOpen: 52  },
  { id: "GBV-2024-0388", victimId: "Victim #00388", type: "Domestic Violence",   district: "Gasabo",   status: "Pending",     priority: "High",   lastUpdated: "2024-12-05", daysOpen: 1   },
  { id: "CA-2024-0089",  victimId: "Child #00089",  type: "Child Neglect",       district: "Gasabo",   status: "In Progress", priority: "High",   lastUpdated: "2024-12-05", daysOpen: 65  },
  { id: "CA-2024-0156",  victimId: "Child #00156",  type: "Physical Abuse",      district: "Gasabo",   status: "Critical",    priority: "High",   lastUpdated: "2024-12-04", daysOpen: 17  },
  { id: "GBV-2024-0178", victimId: "Victim #00178", type: "Stalking/Harassment", district: "Kicukiro", status: "Pending",     priority: "Medium", lastUpdated: "2024-12-02", daysOpen: 9   },
  { id: "GBV-2024-0098", victimId: "Victim #00098", type: "Emotional Abuse",     district: "Gasabo",   status: "Pending",     priority: "Low",    lastUpdated: "2024-12-03", daysOpen: 22  },
];

const ALERTS: Alert[] = [
  { id: 1, text: "CA-2024-0156 (Child #00156) has been escalated to Critical — immediate review required.",         type: "overdue", time: "09:22" },
  { id: 2, text: "New case GBV-2024-0388 assigned to you. Victim #00388 — Domestic Violence, Gasabo.",              type: "new",     time: "08:50" },
  { id: 3, text: "GBV-2024-0305 support services updated by social worker. Review the notes.",                       type: "update",  time: "08:15" },
  { id: 4, text: "GBV-2024-0098 has been open for 22 days without a status update. Please review.",                 type: "overdue", time: "Yesterday" },
];

const ALERT_CONFIG = {
  new:     { Icon: Plus,          cls: "text-success",     bg: "bg-success/10 border-success/20" },
  update:  { Icon: Bell,          cls: "text-info",        bg: "bg-info/10 border-info/20" },
  overdue: { Icon: AlertTriangle, cls: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
};

/* ─── Nav items ──────────────────────────────────────────── */
const NAV = [
  { label: "My Cases",         path: null,        active: true  },
  { label: "Incident Reports", path: "/incident-reports", active: false },
  { label: "Inter-Agency",     path: "/inter-agency",     active: false },
  { label: "Anonymous Reports",path: "/anonymous-report", active: false },
];

/* ─── Component ──────────────────────────────────────────── */
const PoliceDashboard = () => {
  const navigate = useNavigate();
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState<CaseStatus | "All">("All");
  const [alerts, setAlerts]         = useState<Alert[]>(ALERTS);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "police");
    return () => document.documentElement.removeAttribute("data-theme");
  }, []);

  const handleLogout = () => {
    clearRole();
    navigate("/login", { replace: true });
  };

  const filtered = CASES.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = c.id.toLowerCase().includes(q) || c.type.toLowerCase().includes(q) || c.district.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:    CASES.length,
    critical: CASES.filter((c) => c.status === "Critical").length,
    dueToday: CASES.filter((c) => c.daysOpen <= 1).length,
    resolved: CASES.filter((c) => c.status === "Resolved").length,
  };

  return (
    <div className="flex min-h-screen w-full bg-background">

      {/* Police Sidebar */}
      <aside className="w-[200px] min-h-screen bg-sidebar border-r border-border flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-info/15 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-info" />
            </div>
            <div>
              <p className="font-heading text-xs font-semibold text-foreground">GBV Monitor</p>
              <p className="text-[9px] text-muted-foreground">Police Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          <p className="label-text px-2 py-1.5 mb-0.5">CASE WORK</p>
          {NAV.map((item) => (
            <button
              key={item.label}
              onClick={() => item.path && navigate(item.path)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors duration-200 ${
                item.active
                  ? "bg-info/15 text-info border-l-[3px] border-info font-medium"
                  : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Officer card */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary">
            <div className="w-7 h-7 rounded-full bg-info/20 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-info" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-foreground truncate">Insp. Uwimana</p>
              <p className="text-[9px] text-muted-foreground">Gasabo District</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors duration-200 py-1"
          >
            <LogOut className="w-3 h-3" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="border-b border-border px-5 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-sm font-semibold text-foreground">My Dashboard</h2>
            <p className="text-[10px] text-muted-foreground">Gasabo District · Police Officer Portal</p>
          </div>
          <div className="flex items-center gap-2">
            {alerts.length > 0 && (
              <div className="relative">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-destructive flex items-center justify-center text-[8px] font-bold text-destructive-foreground">
                  {alerts.length}
                </span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "MY CASES",      value: stats.total,    color: "text-primary",     Icon: Briefcase },
              { label: "CRITICAL",      value: stats.critical, color: "text-destructive", Icon: AlertTriangle },
              { label: "NEW TODAY",     value: stats.dueToday, color: "text-warning",     Icon: Clock },
              { label: "RESOLVED",      value: stats.resolved, color: "text-success",     Icon: CheckCircle2 },
            ].map(({ label, value, color, Icon }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="label-text">{label}</p>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className={`text-2xl font-heading font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-5">

            {/* Cases table */}
            <div className="flex-1 min-w-0 bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border gap-3 flex-wrap">
                <h3 className="font-heading text-sm font-semibold text-foreground">Assigned Cases</h3>
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as CaseStatus | "All")}
                    className="h-7 rounded-lg bg-background border border-border text-xs text-foreground px-2 focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200"
                  >
                    <option value="All">All Status</option>
                    {(["Critical", "In Progress", "Pending", "Resolved"] as CaseStatus[]).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search…"
                      className="h-7 w-[120px] pl-7 pr-2 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="label-text px-4 py-2.5 text-left">CASE ID</th>
                      <th className="label-text px-4 py-2.5 text-left hidden sm:table-cell">VICTIM</th>
                      <th className="label-text px-4 py-2.5 text-left hidden md:table-cell">TYPE</th>
                      <th className="label-text px-4 py-2.5 text-left hidden lg:table-cell">DISTRICT</th>
                      <th className="label-text px-4 py-2.5 text-left">STATUS</th>
                      <th className="label-text px-4 py-2.5 text-left hidden sm:table-cell">DAYS OPEN</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => {
                      const sCfg = STATUS_CONFIG[c.status];
                      return (
                        <tr
                          key={c.id}
                          className={`border-b border-border last:border-0 hover:bg-secondary/40 transition-colors duration-150 ${
                            c.status === "Critical" ? "bg-destructive/5" : ""
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-foreground font-heading text-xs">{c.id}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{c.victimId}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.type}</td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-3 h-3" /> {c.district}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${sCfg.cls}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dot}`} />
                              {c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className={`flex items-center gap-1 text-xs font-medium ${
                              c.daysOpen > 30 ? "text-destructive" :
                              c.daysOpen > 7  ? "text-warning" : "text-muted-foreground"
                            }`}>
                              <Clock className="w-3 h-3" /> {c.daysOpen}d
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toast.success(`Opened ${c.id}`)}
                              className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 font-medium transition-colors duration-200"
                            >
                              Open <ChevronRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          No cases match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alerts feed */}
            <div className="w-full lg:w-[260px] shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <p className="label-text">ALERTS</p>
                <button
                  onClick={() => setAlerts([])}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Clear all
                </button>
              </div>
              {alerts.length === 0 && (
                <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                  <p className="text-xs text-muted-foreground">No new alerts</p>
                </div>
              )}
              {alerts.map((a) => {
                const cfg = ALERT_CONFIG[a.type];
                const AlertIcon = cfg.Icon;
                return (
                  <div key={a.id} className={`rounded-xl border p-3 ${cfg.bg}`}>
                    <div className="flex items-start gap-2">
                      <AlertIcon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${cfg.cls}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-foreground leading-relaxed">{a.text}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{a.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default PoliceDashboard;

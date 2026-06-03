import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  LogIn,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useGetAuditLogsQuery } from "@/store/api";

type LogStatus = "Success" | "Failed";
type ActionFilter = "All" | "Login" | "Login Failed" | "Case Updated" | "Report Submitted" | "Other";

interface AuditLogItem {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  status: LogStatus;
  module: string;
}

interface AuditLogApiItem {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
}

function formatTimestamp(value?: string): string {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function inferStatus(action: string): LogStatus {
  return action.toLowerCase().includes("fail") ? "Failed" : "Success";
}

function inferModule(action: string): string {
  const normalized = action.toLowerCase();
  if (normalized.includes("login")) {
    return "Auth";
  }
  if (normalized.includes("case")) {
    return "Case Management";
  }
  if (normalized.includes("report")) {
    return "Reporting";
  }
  if (normalized.includes("user")) {
    return "User Management";
  }
  return "System";
}

function normalizeAction(action: string): ActionFilter {
  const normalized = action.toLowerCase();
  if (normalized.includes("login failed") || (normalized.includes("login") && normalized.includes("fail"))) {
    return "Login Failed";
  }
  if (normalized.includes("login")) {
    return "Login";
  }
  if (normalized.includes("case updated")) {
    return "Case Updated";
  }
  if (normalized.includes("report submitted")) {
    return "Report Submitted";
  }
  return "Other";
}

function formatUserLabel(userId: string): string {
  if (!userId) {
    return "Unknown user";
  }
  return `${userId.slice(0, 8)}...`;
}

const ACTION_FILTERS: ActionFilter[] = ["All", "Login", "Login Failed", "Case Updated", "Report Submitted", "Other"];

const SystemLogs = () => {
  const [actionFilter, setActionFilter] = useState<ActionFilter>("All");
  const [search, setSearch] = useState("");
  const { data, error, isLoading, refetch } = useGetAuditLogsQuery();

  const logs = useMemo<AuditLogItem[]>(() => {
    const rawData = data?.data as
      | AuditLogApiItem[]
      | { content?: AuditLogApiItem[] }
      | undefined;

    const items = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.content)
        ? rawData.content
        : [];

    return items.map((item) => ({
      id: item.id,
      userId: item.userId,
      action: item.action,
      timestamp: item.timestamp,
      status: inferStatus(item.action),
      module: inferModule(item.action),
    }));
  }, [data]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesAction = actionFilter === "All" || normalizeAction(log.action) === actionFilter;
      const matchesSearch = !query
        || log.action.toLowerCase().includes(query)
        || log.module.toLowerCase().includes(query)
        || log.userId.toLowerCase().includes(query);
      return matchesAction && matchesSearch;
    });
  }, [actionFilter, logs, search]);

  const stats = useMemo(() => ({
    total: logs.length,
    logins: logs.filter((log) => normalizeAction(log.action) === "Login" || normalizeAction(log.action) === "Login Failed").length,
    changes: logs.filter((log) => log.module === "Case Management" || log.module === "Reporting" || log.module === "User Management").length,
    failed: logs.filter((log) => log.status === "Failed").length,
  }), [logs]);

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
              System Logs
            </h2>
            <p className="text-sm text-muted-foreground">
              Review audit events and recent system activity
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "TOTAL EVENTS", value: stats.total, Icon: Activity, color: "text-primary" },
              { label: "LOGIN EVENTS", value: stats.logins, Icon: LogIn, color: "text-info" },
              { label: "DATA CHANGES", value: stats.changes, Icon: ShieldAlert, color: "text-warning" },
              { label: "FAILED EVENTS", value: stats.failed, Icon: AlertTriangle, color: "text-destructive" },
            ].map(({ label, value, Icon, color }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="label-text">{label}</p>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className={`text-2xl font-heading font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-border flex-wrap">
              <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <select
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value as ActionFilter)}
                className="h-8 rounded-lg bg-background border border-border text-xs text-foreground px-2 focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200"
              >
                {ACTION_FILTERS.map((action) => (
                  <option key={action} value={action}>
                    {action === "All" ? "All Actions" : action}
                  </option>
                ))}
              </select>
              <div className="relative flex-1 min-w-[140px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search actions, modules, or user IDs..."
                  className="h-8 w-full pl-8 pr-3 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                Loading audit logs...
              </div>
            ) : error ? (
              <div className="px-4 py-12 text-center space-y-3">
                <p className="text-sm font-medium text-foreground">Unable to load audit logs</p>
                <p className="text-xs text-muted-foreground">
                  Please try again in a moment.
                </p>
                <button
                  onClick={() => void refetch()}
                  className="h-8 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="label-text px-4 py-2.5 text-left">TIMESTAMP</th>
                        <th className="label-text px-4 py-2.5 text-left">USER ID</th>
                        <th className="label-text px-4 py-2.5 text-left">ACTION</th>
                        <th className="label-text px-4 py-2.5 text-left hidden md:table-cell">MODULE</th>
                        <th className="label-text px-4 py-2.5 text-left">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr
                          key={log.id}
                          className={log.status === "Failed"
                            ? "border-b border-border last:border-0 bg-destructive/5 hover:bg-destructive/10"
                            : "border-b border-border last:border-0 hover:bg-secondary/40"}
                        >
                          <td className="px-4 py-3 text-muted-foreground font-mono text-[10px] whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                            {formatUserLabel(log.userId)}
                          </td>
                          <td className="px-4 py-3 text-foreground">{log.action}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                            {log.module}
                          </td>
                          <td className="px-4 py-3">
                            {log.status === "Success" ? (
                              <span className="inline-flex items-center gap-1 text-success">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-destructive">
                                <XCircle className="w-3.5 h-3.5" />
                                Failed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredLogs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No audit logs match the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-2.5 border-t border-border">
                  <p className="text-[10px] text-muted-foreground">
                    Showing {filteredLogs.length} of {logs.length} audit entries
                  </p>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SystemLogs;

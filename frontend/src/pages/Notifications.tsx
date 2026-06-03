import { useMemo, useState } from "react";
import type { ElementType } from "react";
import {
  AlertTriangle,
  Bell,
  BellOff,
  Check,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { getCurrentUser } from "@/lib/auth";
import { useGetNotificationsQuery, useMarkNotificationReadMutation } from "@/store/api";
import { toast } from "sonner";

type AlertType = "Critical Cases" | "Status Updates" | "System Alerts";
type AlertSeverity = "critical" | "warning" | "info" | "success";
type FilterTab = "All" | AlertType;

interface BackendNotification {
  id: string;
  type?: string;
  message?: string;
  read: boolean;
  createdAt?: string;
}

interface AlertItem {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const FILTER_TABS: FilterTab[] = ["All", "Critical Cases", "Status Updates", "System Alerts"];

const severityIcon: Record<AlertSeverity, ElementType> = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

const severityIconCls: Record<AlertSeverity, string> = {
  critical: "text-destructive",
  warning: "text-warning",
  info: "text-info",
  success: "text-success",
};

const severityLeftBorder: Record<AlertSeverity, string> = {
  critical: "border-l-[3px] border-l-destructive",
  warning: "border-l-[3px] border-l-warning",
  info: "border-l-[3px] border-l-info",
  success: "border-l-[3px] border-l-success",
};

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapNotificationType(type?: string): AlertType {
  const normalized = type?.toUpperCase() ?? "";
  if (normalized.includes("ALERT") || normalized.includes("URGENT")) {
    return "Critical Cases";
  }
  if (normalized.includes("STATUS") || normalized.includes("CASE")) {
    return "Status Updates";
  }
  return "System Alerts";
}

function mapSeverity(type: AlertType, read: boolean): AlertSeverity {
  if (type === "Critical Cases") {
    return read ? "warning" : "critical";
  }
  if (type === "Status Updates") {
    return read ? "success" : "info";
  }
  return "info";
}

function formatRelativeTime(createdAt?: string): string {
  if (!createdAt) {
    return "Unknown";
  }

  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) {
    return "Unknown";
  }

  const diffMinutes = Math.max(1, Math.floor((Date.now() - created) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return new Date(createdAt).toLocaleDateString();
}

const Notifications = () => {
  const currentUser = getCurrentUser();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [markNotificationRead, { isLoading: isMarkingRead }] = useMarkNotificationReadMutation();
  const { data, error, isLoading, refetch } = useGetNotificationsQuery(currentUser?.id ?? "", {
    skip: !currentUser?.id,
  });

  const alerts = useMemo<AlertItem[]>(() => {
    const items = (data?.data ?? []) as BackendNotification[];

    return items.map((item) => {
      const type = mapNotificationType(item.type);
      return {
        id: item.id,
        type,
        severity: mapSeverity(type, item.read),
        title: item.type ? toTitleCase(item.type) : type,
        description: item.message?.trim() || "No additional message was provided.",
        time: formatRelativeTime(item.createdAt),
        read: item.read,
      };
    });
  }, [data]);

  const visible = alerts.filter((alert) => {
    if (dismissedIds.has(alert.id)) {
      return false;
    }
    if (activeFilter !== "All" && alert.type !== activeFilter) {
      return false;
    }
    return true;
  });

  const unreadCount = alerts.filter((alert) => !dismissedIds.has(alert.id) && !alert.read).length;
  const criticalCount = alerts.filter((alert) => alert.type === "Critical Cases" && !dismissedIds.has(alert.id)).length;

  const markRead = async (id: string, alreadyRead: boolean) => {
    if (alreadyRead) {
      return;
    }

    try {
      await markNotificationRead(id).unwrap();
      await refetch();
    } catch {
      toast.error("Unable to mark notification as read");
    }
  };

  const markAllRead = async () => {
    const unread = alerts.filter((alert) => !dismissedIds.has(alert.id) && !alert.read);
    if (!unread.length) {
      return;
    }

    try {
      await Promise.all(unread.map((alert) => markNotificationRead(alert.id).unwrap()));
      await refetch();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Unable to update all notifications");
    }
  };

  const dismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
              Notifications and Alerts
            </h2>
            <p className="text-sm text-muted-foreground">
              Review alerts and updates for your account.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "TOTAL ALERTS", value: alerts.length, sub: "Across your account", color: "text-primary" },
              { label: "UNREAD", value: unreadCount, sub: "Require your attention", color: "text-warning" },
              { label: "CRITICAL ALERTS", value: criticalCount, sub: "Urgent case alerts", color: "text-destructive" },
            ].map((card) => (
              <div key={card.label} className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-2">{card.label}</p>
                <p className={`text-2xl font-bold font-heading ${card.color}`}>{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-secondary border border-border rounded-lg p-1">
              {FILTER_TABS.map((tab) => {
                const count = tab === "All"
                  ? alerts.filter((alert) => !dismissedIds.has(alert.id)).length
                  : alerts.filter((alert) => !dismissedIds.has(alert.id) && alert.type === tab).length;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className={`h-7 px-3 rounded-md text-xs font-medium transition-colors duration-200 flex items-center gap-1.5 ${
                      activeFilter === tab
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "All" ? "All" : tab.split(" ")[0]}
                    <span className={`text-[9px] font-bold px-1 rounded ${
                      activeFilter === tab ? "bg-primary-foreground/20 text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1" />

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={isMarkingRead}
                className="h-8 px-3 rounded-lg bg-card border border-border text-xs text-muted-foreground flex items-center gap-1.5 hover:text-foreground transition-colors duration-200 disabled:opacity-60"
              >
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {!currentUser?.id ? (
            <div className="bg-card border border-border rounded-xl p-10 flex flex-col items-center gap-3">
              <BellOff className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Sign in again to load notifications</p>
            </div>
          ) : isLoading ? (
            <div className="bg-card border border-border rounded-xl p-10 flex flex-col items-center gap-3">
              <Bell className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="bg-card border border-border rounded-xl p-10 flex flex-col items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Unable to load notifications</p>
              <button
                onClick={() => refetch()}
                className="h-8 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {visible.length === 0 && (
                <div className="bg-card border border-border rounded-xl p-10 flex flex-col items-center gap-3">
                  <BellOff className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No alerts in this category</p>
                </div>
              )}

              {visible.map((alert) => {
                const Icon = severityIcon[alert.severity];
                const iconCls = severityIconCls[alert.severity];
                const leftBorder = !alert.read ? severityLeftBorder[alert.severity] : "";

                return (
                  <div
                    key={alert.id}
                    className={`bg-card border border-border rounded-xl p-3.5 transition-colors duration-150 group ${leftBorder} ${
                      alert.read ? "opacity-75 hover:opacity-90" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        alert.severity === "critical" ? "bg-destructive/15"
                        : alert.severity === "warning" ? "bg-warning/15"
                        : alert.severity === "info" ? "bg-info/15"
                        : "bg-success/15"
                      }`}>
                        <Icon className={`w-4 h-4 ${iconCls}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-snug ${alert.read ? "font-medium text-foreground/80" : "font-semibold text-foreground"}`}>
                            {alert.title}
                          </p>
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            {!alert.read && (
                              <button
                                onClick={() => markRead(alert.id, alert.read)}
                                className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-secondary transition-colors duration-200"
                                title="Mark as read"
                              >
                                <Check className="w-3 h-3 text-muted-foreground" />
                              </button>
                            )}
                            <button
                              onClick={() => dismiss(alert.id)}
                              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-secondary transition-colors duration-200"
                              title="Dismiss"
                            >
                              <X className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                            alert.type === "Critical Cases"
                              ? "bg-destructive/10 border-destructive/20 text-destructive"
                              : alert.type === "Status Updates"
                                ? "bg-info/10 border-info/20 text-info"
                                : "bg-secondary border-border text-muted-foreground"
                          }`}>
                            {alert.type}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                          {!alert.read && <span className="w-1.5 h-1.5 rounded-full bg-info ml-auto" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Notifications;

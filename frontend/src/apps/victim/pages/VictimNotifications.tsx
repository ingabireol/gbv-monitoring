import { useMemo, useState } from "react";
import { AlertTriangle, Bell, Calendar, FileText, type LucideIcon } from "lucide-react";
import { VictimSidebar } from "@/apps/victim/components/VictimSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { getCurrentUser } from "@/lib/auth";
import { useGetNotificationsQuery, useMarkNotificationReadMutation } from "@/store/api";
import { toast } from "sonner";

/* ─── Types ──────────────────────────────────────────────── */
type Category = "Case Update" | "Appointment" | "Alert";
type FilterTab = "All" | Category;

interface BackendNotification {
  id: string;
  type?: string;
  message?: string;
  read: boolean;
  createdAt?: string;
}

interface NotificationItem {
  id: string;
  category: Category;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

/* ─── Sample data ────────────────────────────────────────── */
const INITIAL_NOTIFS: NotificationItem[] = [
  {
    id: "1",
    category: "Alert",
    title: "Action required: Confirm your contact details",
    body: "Your case officer needs to verify your current contact information before the next step. Please confirm at your earliest convenience.",
    time: "2h ago",
    read: false,
  },
  {
    id: "2",
    category: "Case Update",
    title: "Investigation stage has begun",
    body: "Your case GBV-2024-0142 has moved to active investigation. Sgt. Uwimana is now reviewing collected evidence and will update you within 5 business days.",
    time: "1d ago",
    read: false,
  },
  {
    id: "3",
    category: "Appointment",
    title: "Counseling session confirmed — Dec 10",
    body: "Your counseling appointment at Isange One Stop Centre is confirmed for December 10, 2024 at 10:00 AM. Please arrive 10 minutes early.",
    time: "2d ago",
    read: true,
  },
  {
    id: "4",
    category: "Case Update",
    title: "Officer assigned to your case",
    body: "Sgt. Uwimana has been assigned as your dedicated case officer. They will be your primary point of contact throughout the process.",
    time: "5d ago",
    read: true,
  },
];

/* ─── Helpers ────────────────────────────────────────────── */
const TABS: FilterTab[] = ["All", "Case Update", "Appointment", "Alert"];

const categoryConfig: Record<Category, {
  Icon: LucideIcon;
  borderClass: string;
  iconClass: string;
}> = {
  "Case Update": {
    Icon: FileText,
    borderClass: "border-l-primary",
    iconClass: "text-primary",
  },
  "Appointment": {
    Icon: Calendar,
    borderClass: "border-l-info",
    iconClass: "text-info",
  },
  "Alert": {
    Icon: AlertTriangle,
    borderClass: "border-l-destructive",
    iconClass: "text-destructive",
  },
};

function mapNotificationCategory(type?: string): Category {
  const normalizedType = type?.toUpperCase() ?? "";
  if (normalizedType.includes("APPOINTMENT")) {
    return "Appointment";
  }
  if (normalizedType.includes("ALERT") || normalizedType.includes("URGENT")) {
    return "Alert";
  }
  return "Case Update";
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildNotificationTitle(notification: BackendNotification, category: Category): string {
  if (notification.type) {
    return toTitleCase(notification.type);
  }
  return category;
}

function formatRelativeTime(createdAt?: string): string {
  if (!createdAt) {
    return "Unknown";
  }

  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) {
    return "Unknown";
  }

  const diffMs = Date.now() - created;
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Date(createdAt).toLocaleDateString();
}

/* ─── Component ──────────────────────────────────────────── */
const VictimNotifications = () => {
  const currentUser = getCurrentUser();
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [markNotificationRead, { isLoading: isMarkingRead }] = useMarkNotificationReadMutation();
  const { data, error, isLoading, refetch } = useGetNotificationsQuery(currentUser?.id ?? "", {
    skip: !currentUser?.id,
  });

  const notifications = useMemo<NotificationItem[]>(() => {
    const items = (data?.data ?? []) as BackendNotification[];

    return items.map((notification) => {
      const category = mapNotificationCategory(notification.type);
      return {
        id: notification.id,
        category,
        title: buildNotificationTitle(notification, category),
        body: notification.message?.trim() || "No additional message was provided.",
        time: formatRelativeTime(notification.createdAt),
        read: notification.read,
      };
    });
  }, [data]);

  const filtered = activeTab === "All"
    ? notifications
    : notifications.filter((notification) => notification.category === activeTab);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

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
    const unread = notifications.filter((notification) => !notification.read);
    if (!unread.length) {
      return;
    }

    try {
      await Promise.all(unread.map((notification) => markNotificationRead(notification.id).unwrap()));
      await refetch();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Unable to update all notifications");
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <VictimSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Page title */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
              Notifications
            </h2>
            <p className="text-sm text-muted-foreground">
              Case updates, support alerts, and appointment reminders.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={isMarkingRead}
              className="h-8 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 shrink-0 disabled:opacity-60"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary border border-border w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 ${
                activeTab === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
              {tab === "All" && unreadCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {!currentUser?.id ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <p className="text-sm font-medium text-foreground">No active user session</p>
            <p className="text-xs text-muted-foreground mt-1">
              Sign in again to view your notifications.
            </p>
          </div>
        ) : isLoading ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
            <p className="text-sm font-medium text-foreground">Unable to load notifications</p>
            <p className="text-xs text-muted-foreground">
              Please try again. Your notifications could not be loaded right now.
            </p>
            <button
              onClick={() => refetch()}
              className="h-8 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No notifications</p>
                <p className="text-xs text-muted-foreground">
                  {activeTab === "All"
                    ? "You do not have any notifications yet."
                    : `No ${activeTab.toLowerCase()} notifications were found.`}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((notification) => {
                  const { Icon, borderClass, iconClass } = categoryConfig[notification.category];
                  return (
                    <button
                      key={notification.id}
                      onClick={() => markRead(notification.id, notification.read)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-4 border-l-2 ${borderClass} transition-colors duration-200 hover:bg-secondary/50 ${
                        notification.read ? "bg-card" : "bg-secondary"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        notification.read ? "bg-secondary" : "bg-card"
                      }`}>
                        <Icon className={`w-3.5 h-3.5 ${iconClass}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-xs font-medium leading-snug text-foreground">
                            {!notification.read && (
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1.5 mb-0.5 align-middle" />
                            )}
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {notification.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {notification.body}
                        </p>
                        <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          notification.category === "Case Update"
                            ? "bg-primary/15 text-primary"
                            : notification.category === "Appointment"
                              ? "bg-info/15 text-info"
                              : "bg-destructive/15 text-destructive"
                        }`}>
                          {notification.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        </main>
      </div>
    </div>
  );
};

export default VictimNotifications;

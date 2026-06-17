import { useMemo, useState } from "react";
import { AlertTriangle, Bell, FileText, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { PartnerSidebar } from "@/apps/partner/components/PartnerSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { getCurrentUser } from "@/lib/auth";
import { useGetNotificationsQuery, useMarkNotificationReadMutation } from "@/store/api";

type Category = "Referral" | "Alert" | "General";
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

const TABS: FilterTab[] = ["All", "Referral", "Alert", "General"];

const categoryConfig: Record<Category, { Icon: LucideIcon; borderClass: string; iconClass: string }> = {
  Referral: { Icon: FileText,       borderClass: "border-l-primary",     iconClass: "text-primary" },
  Alert:    { Icon: AlertTriangle,  borderClass: "border-l-destructive",  iconClass: "text-destructive" },
  General:  { Icon: Bell,           borderClass: "border-l-info",         iconClass: "text-info" },
};

function mapCategory(type?: string): Category {
  const t = type?.toUpperCase() ?? "";
  if (t.includes("REFERRAL")) return "Referral";
  if (t.includes("ALERT") || t.includes("URGENT")) return "Alert";
  return "General";
}

function toTitleCase(v: string) {
  return v.toLowerCase().split(/[\s_-]+/).filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

function relativeTime(createdAt?: string): string {
  if (!createdAt) return "Unknown";
  const diff = Date.now() - new Date(createdAt).getTime();
  if (isNaN(diff)) return "Unknown";
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(createdAt).toLocaleDateString();
}

const PartnerNotifications = () => {
  const currentUser = getCurrentUser();
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [markNotificationRead, { isLoading: isMarkingRead }] = useMarkNotificationReadMutation();
  const { data, error, isLoading, refetch } = useGetNotificationsQuery(currentUser?.id ?? "", {
    skip: !currentUser?.id,
  });

  const notifications = useMemo<NotificationItem[]>(() => {
    const items = (data?.data ?? []) as BackendNotification[];
    return items.map((n) => {
      const category = mapCategory(n.type);
      return {
        id: n.id,
        category,
        title: n.type ? toTitleCase(n.type) : category,
        body: n.message?.trim() || "No additional details provided.",
        time: relativeTime(n.createdAt),
        read: n.read,
      };
    });
  }, [data]);

  const filtered = activeTab === "All" ? notifications : notifications.filter((n) => n.category === activeTab);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string, alreadyRead: boolean) => {
    if (alreadyRead) return;
    try {
      await markNotificationRead(id).unwrap();
      await refetch();
    } catch {
      toast.error("Unable to mark notification as read");
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (!unread.length) return;
    try {
      await Promise.all(unread.map((n) => markNotificationRead(n.id).unwrap()));
      await refetch();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Unable to update notifications");
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <PartnerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Referral Notifications</h2>
              <p className="text-sm text-muted-foreground">
                Stay up to date with new referrals, updates, and alerts sent to your institution.
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

          <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary border border-border w-fit">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 ${
                  activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
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
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No active session found.</div>
          ) : isLoading ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">Loading notifications...</div>
          ) : error ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center space-y-3">
              <p className="text-sm font-medium text-foreground">Unable to load notifications</p>
              <button onClick={() => refetch()} className="h-8 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground">Retry</button>
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
                    {activeTab === "All" ? "Your institution has no notifications yet." : `No ${activeTab.toLowerCase()} notifications found.`}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filtered.map((n) => {
                    const { Icon, borderClass, iconClass } = categoryConfig[n.category];
                    return (
                      <button
                        key={n.id}
                        onClick={() => markRead(n.id, n.read)}
                        className={`w-full text-left flex items-start gap-3 px-4 py-4 border-l-2 ${borderClass} transition-colors duration-200 hover:bg-secondary/50 ${n.read ? "bg-card" : "bg-secondary"}`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${n.read ? "bg-secondary" : "bg-card"}`}>
                          <Icon className={`w-3.5 h-3.5 ${iconClass}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-xs font-medium leading-snug text-foreground">
                              {!n.read && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1.5 mb-0.5 align-middle" />}
                              {n.title}
                            </p>
                            <span className="text-[10px] text-muted-foreground shrink-0">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{n.body}</p>
                          <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            n.category === "Referral" ? "bg-primary/15 text-primary" :
                            n.category === "Alert"   ? "bg-destructive/15 text-destructive" :
                            "bg-info/15 text-info"
                          }`}>{n.category}</span>
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

export default PartnerNotifications;

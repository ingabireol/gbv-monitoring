import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Search,
  Shield,
  User,
  X,
} from "lucide-react";
import { SocialWorkerSidebar } from "@/apps/socialworker/components/SocialWorkerSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useGetCasesQuery, useUpdateCaseStatusMutation } from "@/store/api";
import { toast } from "sonner";

type Priority = "Critical" | "High" | "Medium" | "Low";
type Status = "Accepted" | "Rejected" | "Active" | "Pending" | "Overdue" | "Resolved";
type QuickFilter = "All" | "Critical" | "Pending" | "Child Cases";

interface BackendCase {
  id: string;
  caseId: string;
  type: string;
  status: string;
  victim?: {
    name?: string;
    age?: number | null;
    address?: string;
  };
  assignedOfficer?: {
    username?: string;
    email?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

interface CaseRow {
  id: string;
  uuid: string;
  victimId: string;
  type: string;
  district: string;
  status: Status;
  priority: Priority;
  officer: string;
  daysOpen: number;
  lastUpdated: string;
  isChildCase: boolean;
}

const QUICK_FILTERS: QuickFilter[] = ["All", "Critical", "Pending", "Child Cases"];

const priorityCls: Record<Priority, string> = {
  Critical: "bg-destructive/15 text-destructive",
  High: "bg-warning/15 text-warning",
  Medium: "bg-info/15 text-info",
  Low: "bg-secondary text-muted-foreground",
};

const statusCls: Record<Status, string> = {
  Accepted: "bg-success/15 text-success",
  Rejected: "bg-destructive/15 text-destructive",
  Active: "bg-success/15 text-success",
  Pending: "bg-warning/15 text-warning",
  Overdue: "bg-destructive/15 text-destructive",
  Resolved: "bg-secondary text-muted-foreground",
};

function getDaysOpen(createdAt?: string): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return 0;
  return Math.max(0, Math.ceil((Date.now() - created) / (1000 * 60 * 60 * 24)));
}

function formatDate(value?: string): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-RW", { year: "numeric", month: "short", day: "numeric" });
}

function normalizeStatus(status?: string, daysOpen?: number): Status {
  const normalized = status?.toUpperCase() ?? "";
  if (normalized.includes("RESOLVED") || normalized.includes("CLOSED")) return "Resolved";
  if (normalized.includes("REJECTED")) return "Rejected";
  if (normalized.includes("ACCEPTED")) return "Accepted";
  if (normalized.includes("IN_PROGRESS") || normalized.includes("INVESTIGATION")) return "Active";
  if ((daysOpen ?? 0) > 14) return "Overdue";
  if (normalized.includes("PENDING")) return "Pending";
  return "Active";
}

function normalizePriority(status: Status, daysOpen: number): Priority {
  if (status === "Resolved" || status === "Rejected") return "Low";
  if (status === "Overdue" || daysOpen > 10) return "Critical";
  if (daysOpen > 6) return "High";
  if (daysOpen > 2) return "Medium";
  return "Low";
}

const SocialWorkerCases = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("All");
  const [typeFilter, setType] = useState("All");
  const [quickFilter, setQuick] = useState<QuickFilter>("All");
  const [slidePanel, setSlidePanel] = useState<CaseRow | null>(null);
  const [updateCaseStatus, { isLoading: isUpdatingStatus }] = useUpdateCaseStatusMutation();
  const { data, error, isLoading, refetch } = useGetCasesQuery({ page: 0, size: 100 });

  const cases = useMemo<CaseRow[]>(() => {
    const items = (data?.data?.content ?? []) as BackendCase[];

    return items.map((item) => {
      const daysOpen = getDaysOpen(item.createdAt);
      const status = normalizeStatus(item.status, daysOpen);
      const priority = normalizePriority(status, daysOpen);
      return {
        id: item.caseId || item.id,
        uuid: item.id,
        victimId: item.victim?.name || "Unknown victim",
        type: item.type || "Unknown type",
        district: item.victim?.address || "Unknown district",
        status,
        priority,
        officer: item.assignedOfficer?.username || item.assignedOfficer?.email || "Unassigned",
        daysOpen,
        lastUpdated: formatDate(item.updatedAt),
        isChildCase: Boolean(item.victim?.age !== null && item.victim?.age !== undefined && item.victim.age < 18),
      };
    });
  }, [data]);

  const typeOptions = useMemo(
    () => ["All", ...Array.from(new Set(cases.map((item) => item.type))).sort()],
    [cases],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cases.filter((item) => {
      const matchSearch = !query
        || item.id.toLowerCase().includes(query)
        || item.victimId.toLowerCase().includes(query)
        || item.type.toLowerCase().includes(query);
      const matchStatus = statusFilter === "All" || item.status === statusFilter;
      const matchType = typeFilter === "All" || item.type === typeFilter;
      const matchQuick =
        quickFilter === "All"
        || (quickFilter === "Critical" && item.priority === "Critical")
        || (quickFilter === "Pending" && item.status === "Pending")
        || (quickFilter === "Child Cases" && item.isChildCase);

      return matchSearch && matchStatus && matchType && matchQuick;
    });
  }, [cases, quickFilter, search, statusFilter, typeFilter]);

  const handleStatusChange = async (status: "IN_PROGRESS" | "RESOLVED") => {
    if (!slidePanel) return;

    try {
      await updateCaseStatus({ id: slidePanel.uuid, status }).unwrap();
      setSlidePanel((current) => current ? {
        ...current,
        status: status === "RESOLVED" ? "Resolved" : "Active",
        lastUpdated: formatDate(new Date().toISOString()),
      } : current);
      toast.success("Case status updated");
      await refetch();
    } catch {
      toast.error("Unable to update case status");
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <SocialWorkerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">My Cases</h2>
            <p className="text-sm text-muted-foreground">View and manage your current case records</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search Case ID, Victim, Type..."
                className="h-8 w-full pl-8 pr-3 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {[
              { value: statusFilter, setValue: setStatus, options: ["All", "Accepted", "Rejected", "Active", "Pending", "Overdue", "Resolved"] },
              { value: typeFilter, setValue: setType, options: typeOptions },
            ].map(({ value, setValue, options }, index) => (
              <div key={index} className="relative">
                <select
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  className="h-8 pl-3 pr-7 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                >
                  {options.map((option) => <option key={option}>{option}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {QUICK_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setQuick(filter)}
                className={`h-7 px-3 rounded-full text-xs font-medium transition-colors duration-200 ${
                  quickFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {isLoading ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">Loading cases...</div>
            ) : error ? (
              <div className="px-4 py-10 text-center space-y-3">
                <p className="text-sm font-medium text-foreground">Unable to load cases</p>
                <button
                  onClick={() => refetch()}
                  className="h-8 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["Case ID", "Victim", "Type", "District", "Status", "Priority", "Officer", "Days Open"].map((header) => (
                        <th key={header} className="label-text text-left px-4 py-2.5">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((item) => (
                      <tr
                        key={item.uuid}
                        className="hover:bg-secondary/40 transition-colors duration-150 cursor-pointer"
                        onClick={() => setSlidePanel(item)}
                      >
                        <td className="px-4 py-2.5 font-mono text-foreground">{item.id}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.victimId}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.type}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.district}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusCls[item.status]}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${priorityCls[item.priority]}`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.officer}</td>
                        <td className="px-4 py-2.5">
                          <span className={`font-medium ${
                            item.daysOpen > 14 ? "text-destructive" : item.daysOpen > 7 ? "text-warning" : "text-success"
                          }`}>
                            {item.daysOpen}d
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                          No cases match your current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {slidePanel && (
        <>
          <div className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm" onClick={() => setSlidePanel(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-40 w-[420px] bg-card border-l border-border flex flex-col shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <p className="font-mono text-base font-bold text-foreground">{slidePanel.id}</p>
                <p className="text-xs text-muted-foreground">{slidePanel.type} - {slidePanel.district}</p>
              </div>
              <button
                onClick={() => setSlidePanel(null)}
                className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-background transition-colors duration-200"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-background border border-border rounded-xl p-3 space-y-2.5">
                {[
                  { label: "Victim", value: slidePanel.victimId, Icon: User },
                  { label: "Type", value: slidePanel.type, Icon: Shield },
                  { label: "District", value: slidePanel.district, Icon: AlertTriangle },
                  { label: "Officer", value: slidePanel.officer, Icon: User },
                  { label: "Days Open", value: `${slidePanel.daysOpen} days`, Icon: Clock },
                  { label: "Last Updated", value: slidePanel.lastUpdated, Icon: Calendar },
                ].map(({ label, value, Icon }) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                    <span className="text-xs font-medium text-foreground text-right">{value}</span>
                  </div>
                ))}
              </div>

              {slidePanel.isChildCase && (
                <div className="bg-warning/10 border border-warning/20 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">
                    This case appears to involve a child based on the recorded age details.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border grid grid-cols-2 gap-2 shrink-0">
              <button
                disabled={isUpdatingStatus || slidePanel.status === "Active"}
                onClick={() => handleStatusChange("IN_PROGRESS")}
                className="h-8 rounded-lg bg-info/15 border border-info/30 text-xs text-info font-medium hover:bg-info/20 transition-colors duration-200 disabled:opacity-50"
              >
                {slidePanel.status === "Active" ? "Active" : "Mark Active"}
              </button>
              <button
                disabled={isUpdatingStatus || slidePanel.status === "Resolved"}
                onClick={() => handleStatusChange("RESOLVED")}
                className="h-8 rounded-lg bg-success/15 border border-success/30 text-xs text-success font-medium hover:bg-success/20 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {slidePanel.status === "Resolved" ? "Resolved" : "Resolve"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SocialWorkerCases;

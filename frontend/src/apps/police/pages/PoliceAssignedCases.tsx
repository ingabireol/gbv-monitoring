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
import { toast } from "sonner";
import { DashboardHeader } from "@/components/DashboardHeader";
import { PoliceSidebar } from "@/apps/police/components/PoliceSidebar";
import AnonymousChatPanel from "@/components/AnonymousChatPanel";
import {
  formatPoliceDate,
  PoliceCaseRecord,
  PoliceUiPriority,
  PoliceUiStatus,
  usePolicePortalData,
} from "@/apps/police/lib/usePolicePortalData";
import { useUpdateCaseStatusMutation } from "@/store/api";

type QuickFilter = "All" | "Overdue" | "Critical" | "Pending Review";

interface CaseRow extends PoliceCaseRecord {
  victimId: string;
  daysOpen: number;
  uiStatus: PoliceUiStatus;
  priority: PoliceUiPriority;
  lastUpdated: string;
  officer: string;
}

const QUICK_FILTERS: QuickFilter[] = ["All", "Overdue", "Critical", "Pending Review"];

const priorityClasses: Record<PoliceUiPriority, string> = {
  Critical: "bg-destructive/15 text-destructive",
  High: "bg-warning/15 text-warning",
  Medium: "bg-info/15 text-info",
  Low: "bg-secondary text-muted-foreground",
};

const statusClasses: Record<PoliceUiStatus, string> = {
  Accepted: "bg-success/15 text-success",
  Rejected: "bg-destructive/15 text-destructive",
  Active: "bg-success/15 text-success",
  "Pending Review": "bg-warning/15 text-warning",
  Overdue: "bg-destructive/15 text-destructive",
  Resolved: "bg-secondary text-muted-foreground",
};

const PoliceAssignedCases = () => {
  const { currentUser, assignedSummary, isLoading, refetchAll } = usePolicePortalData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("All");
  const [priorityFilter, setPriority] = useState("All");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("All");
  const [selectedCase, setSelectedCase] = useState<CaseRow | null>(null);
  const [updateCaseStatus, { isLoading: isUpdatingStatus }] = useUpdateCaseStatusMutation();

  const cases = useMemo<CaseRow[]>(
    () => assignedSummary.map((item) => ({
      ...item,
      victimId: item.victim?.name || "Unknown victim",
      lastUpdated: formatPoliceDate(item.updatedAt || item.createdAt),
      officer: item.assignedOfficer?.displayName || item.assignedOfficer?.username || item.assignedOfficer?.email || "Assigned officer",
    })),
    [assignedSummary],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cases.filter((item) => {
      const matchesSearch = !query
        || item.caseId.toLowerCase().includes(query)
        || item.victimId.toLowerCase().includes(query)
        || item.type.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || item.uiStatus === statusFilter;
      const matchesPriority = priorityFilter === "All" || item.priority === priorityFilter;
      const matchesQuick = quickFilter === "All"
        || (quickFilter === "Overdue" && item.uiStatus === "Overdue")
        || (quickFilter === "Critical" && item.priority === "Critical")
        || (quickFilter === "Pending Review" && item.uiStatus === "Pending Review");

      return matchesSearch && matchesStatus && matchesPriority && matchesQuick;
    });
  }, [cases, priorityFilter, quickFilter, search, statusFilter]);

  const handleStatusChange = async (status: "ACCEPTED" | "REJECTED" | "IN_PROGRESS" | "RESOLVED") => {
    if (!selectedCase) {
      return;
    }

    try {
      await updateCaseStatus({ id: selectedCase.id, status }).unwrap();
      toast.success("Case status updated");
      setSelectedCase(null);
      refetchAll();
    } catch {
      toast.error("Unable to update case status");
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <PoliceSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">My Cases</h2>
            <p className="text-sm text-muted-foreground">
              Assigned cases for {currentUser?.name || currentUser?.username || "the signed-in officer"}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by Case ID, victim, or type..."
                className="h-8 w-full pl-8 pr-3 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) => setStatus(event.target.value)}
                className="h-8 pl-3 pr-7 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
              >
                {["All", "Accepted", "Rejected", "Active", "Pending Review", "Overdue", "Resolved"].map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(event) => setPriority(event.target.value)}
                className="h-8 pl-3 pr-7 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
              >
                {["All", "Critical", "High", "Medium", "Low"].map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {QUICK_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setQuickFilter(filter)}
                className={`h-7 px-3 rounded-full text-xs font-medium transition-colors duration-200 ${
                  quickFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter}
                {filter === "All" && <span className="ml-1.5 opacity-60">{cases.length}</span>}
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {isLoading ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">Loading assigned cases...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["Case ID", "Victim", "Type", "Days Open", "Status", "Priority", "Last Updated"].map((header) => (
                        <th key={header} className="label-text text-left px-4 py-2.5">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedCase(item)}
                        className="hover:bg-secondary/40 transition-colors duration-150 cursor-pointer"
                      >
                        <td className="px-4 py-2.5 font-mono text-foreground">{item.caseId}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.victimId}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.type}</td>
                        <td className="px-4 py-2.5">
                          <span className={`font-medium ${
                            item.daysOpen > 14 ? "text-destructive" : item.daysOpen > 7 ? "text-warning" : "text-success"
                          }`}>
                            {item.daysOpen}d
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusClasses[item.uiStatus]}`}>
                            {item.uiStatus}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${priorityClasses[item.priority]}`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.lastUpdated}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                          No assigned cases match your current filters.
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

      <div
        className={`fixed right-0 top-0 h-full w-[360px] z-50 bg-card border-l border-border flex flex-col transition-transform duration-300 ${
          selectedCase ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedCase && (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <p className="font-heading text-sm font-semibold text-foreground">Assigned Case</p>
                <p className="text-[10px] text-muted-foreground">{selectedCase.caseId}</p>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-background transition-colors duration-200"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-background border border-border rounded-xl p-3 space-y-2.5">
                {[
                  { label: "Victim", value: selectedCase.victimId, Icon: User },
                  { label: "Type", value: selectedCase.type, Icon: Shield },
                  { label: "Days Open", value: `${selectedCase.daysOpen} days`, Icon: Clock },
                  { label: "Last Updated", value: selectedCase.lastUpdated, Icon: Calendar },
                  { label: "Officer", value: selectedCase.officer, Icon: User },
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

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background border border-border rounded-xl p-3">
                  <p className="label-text mb-2">STATUS</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusClasses[selectedCase.uiStatus]}`}>
                    {selectedCase.uiStatus}
                  </span>
                </div>
                <div className="bg-background border border-border rounded-xl p-3">
                  <p className="label-text mb-2">PRIORITY</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${priorityClasses[selectedCase.priority]}`}>
                    {selectedCase.priority}
                  </span>
                </div>
              </div>

              {selectedCase.uiStatus === "Overdue" && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    This case has been open for an extended period and should be reviewed urgently.
                  </p>
                </div>
              )}

              {(selectedCase.reportType === "Anonymous"
                || selectedCase.reporterName
                || selectedCase.reporterContact
                || selectedCase.witnessName
                || selectedCase.witnessContact
                || selectedCase.incidentLocation) && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 space-y-2.5">
                  <p className="label-text">ANONYMOUS FOLLOW-UP DETAILS</p>
                  {[
                    { label: "Reporter Name", value: selectedCase.reporterName || "Not shared" },
                    { label: "Reporter Contact", value: selectedCase.reporterContact || "Not shared" },
                    { label: "Incident Date", value: selectedCase.incidentAt ? formatPoliceDate(selectedCase.incidentAt, true) : "Not shared" },
                    { label: "Incident Location", value: selectedCase.incidentLocation || selectedCase.victim?.address || "Not shared" },
                    { label: "Witness Name", value: selectedCase.witnessName || "Not shared" },
                    { label: "Witness Contact/Location", value: selectedCase.witnessContact || selectedCase.witnessLocation || "Not shared" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-3">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className="text-xs font-medium text-foreground text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {(selectedCase.type?.toUpperCase() === "ANON" || selectedCase.reportType === "Anonymous") && (
                <AnonymousChatPanel caseUuid={selectedCase.id} />
              )}
            </div>

            <div className="p-4 border-t border-border grid grid-cols-2 gap-2 shrink-0">
              <button
                disabled={isUpdatingStatus || selectedCase.uiStatus === "Accepted"}
                onClick={() => void handleStatusChange("ACCEPTED")}
                className="h-8 rounded-lg bg-success/15 border border-success/30 text-xs text-success font-medium hover:bg-success/20 transition-colors duration-200 disabled:opacity-50"
              >
                {selectedCase.uiStatus === "Accepted" ? "Accepted" : "Accept"}
              </button>
              <button
                disabled={isUpdatingStatus || selectedCase.uiStatus === "Rejected"}
                onClick={() => void handleStatusChange("REJECTED")}
                className="h-8 rounded-lg bg-destructive/15 border border-destructive/30 text-xs text-destructive font-medium hover:bg-destructive/20 transition-colors duration-200 disabled:opacity-50"
              >
                {selectedCase.uiStatus === "Rejected" ? "Rejected" : "Reject"}
              </button>
              <button
                disabled={isUpdatingStatus || selectedCase.uiStatus === "Active"}
                onClick={() => void handleStatusChange("IN_PROGRESS")}
                className="h-8 rounded-lg bg-info/15 border border-info/30 text-xs text-info font-medium hover:bg-info/20 transition-colors duration-200 disabled:opacity-50"
              >
                {selectedCase.uiStatus === "Active" ? "Active" : "Mark Active"}
              </button>
              <button
                disabled={isUpdatingStatus || selectedCase.uiStatus === "Resolved"}
                onClick={() => void handleStatusChange("RESOLVED")}
                className="h-8 rounded-lg bg-success/15 border border-success/30 text-xs text-success font-medium hover:bg-success/20 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {selectedCase.uiStatus === "Resolved" ? "Resolved" : "Resolve"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PoliceAssignedCases;

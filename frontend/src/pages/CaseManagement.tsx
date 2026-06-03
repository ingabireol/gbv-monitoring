import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  MapPin,
  Search,
  User,
  X,
} from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ExportButton } from "@/components/ExportButton";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { getCurrentUser } from "@/lib/auth";
import { useGetCasesQuery, useGetCurrentProfileQuery, useUpdateCaseStatusMutation } from "@/store/api";
import { toast } from "sonner";

type UiStatus = "Critical" | "Accepted" | "Rejected" | "In Progress" | "Pending" | "Resolved";

interface BackendCase {
  id: string;
  caseId: string;
  type: string;
  status: string;
  victim?: {
    name?: string;
    address?: string;
  };
  assignedOfficer?: {
    id?: string;
    username?: string;
    email?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
  victimAccountId?: string | null;
  victimDistrict?: string | null;
  reportType?: string | null;
  incidentAt?: string | null;
  incidentLocation?: string | null;
  reporterName?: string | null;
  reporterContact?: string | null;
  witnessName?: string | null;
  witnessContact?: string | null;
  witnessLocation?: string | null;
}

interface CaseRow {
  id: string;
  uuid: string;
  victimAccountId?: string | null;
  victimDistrict?: string | null;
  victim: string;
  type: string;
  district: string;
  status: UiStatus;
  officer: string;
  createdAt: string;
  updatedAt: string;
  reportType?: string | null;
  incidentAt: string;
  incidentLocation?: string | null;
  reporterName?: string | null;
  reporterContact?: string | null;
  witnessName?: string | null;
  witnessContact?: string | null;
  witnessLocation?: string | null;
  daysOpen: number;
  priority: number;
  isAssigned: boolean;
}

const DISTRICTS = ["All"];
const STATUSES: Array<"All" | UiStatus> = ["All", "Critical", "Accepted", "Rejected", "In Progress", "Pending", "Resolved"];

const statusClasses: Record<UiStatus, string> = {
  Critical: "status-critical",
  Accepted: "bg-success/15 text-success",
  Rejected: "bg-destructive/15 text-destructive",
  Pending: "status-pending",
  "In Progress": "status-in-progress",
  Resolved: "status-resolved",
};

function getDaysOpen(createdAt?: string): number {
  if (!createdAt) {
    return 0;
  }

  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) {
    return 0;
  }

  return Math.max(0, Math.ceil((Date.now() - created) / (1000 * 60 * 60 * 24)));
}

function formatDate(value?: string): string {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-RW", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeStatus(status?: string, assignedOfficer?: BackendCase["assignedOfficer"], daysOpen?: number): UiStatus {
  const normalized = status?.toUpperCase() ?? "";
  if (normalized.includes("RESOLVED") || normalized.includes("CLOSED")) {
    return "Resolved";
  }
  if (normalized.includes("REJECTED")) {
    return "Rejected";
  }
  if (normalized.includes("ACCEPTED")) {
    return "Accepted";
  }
  if (normalized.includes("IN_PROGRESS") || normalized.includes("INVESTIGATION")) {
    return "In Progress";
  }
  if (normalized.includes("CRITICAL") || (daysOpen ?? 0) > 14) {
    return "Critical";
  }
  if (!assignedOfficer || normalized.includes("PENDING")) {
    return "Pending";
  }
  return "In Progress";
}

function getPriorityScore(status: UiStatus, daysOpen: number, isAssigned: boolean): number {
  if (status === "Resolved" || status === "Rejected") {
    return 20;
  }

  const base = status === "Critical"
    ? 90
    : status === "Pending"
      ? 60
      : 70;

  const ageBoost = Math.min(daysOpen * 2, 20);
  const assignmentBoost = isAssigned ? 0 : 10;
  return Math.min(100, base + ageBoost + assignmentBoost);
}

function getPriorityBarClass(score: number): string {
  if (score >= 80) return "bg-destructive";
  if (score >= 60) return "bg-warning";
  return "bg-info";
}

function getPriorityTextClass(score: number): string {
  if (score >= 80) return "text-destructive";
  if (score >= 60) return "text-warning";
  return "text-info";
}

function districtMatches(value: string | null | undefined, district: string): boolean {
  return Boolean(value?.trim()) && value!.trim().toLowerCase() === district.trim().toLowerCase();
}

const CaseManagement = () => {
  const currentUser = getCurrentUser();
  const [searchParams] = useSearchParams();
  const { data: profileData } = useGetCurrentProfileQuery(undefined, { skip: !currentUser });
  const currentProfile = profileData?.data;
  const isDistrictAdmin = (currentProfile?.role || currentUser?.role) === "DISTRICT_ADMIN" || currentUser?.role === "districtadmin";
  const districtName = currentProfile?.district || currentUser?.district || "your district";
  const [statusFilter, setStatusFilter] = useState<"All" | UiStatus>("All");
  const [districtFilter, setDistrictFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCase, setSelectedCase] = useState<CaseRow | null>(null);
  const [updateCaseStatus, { isLoading: isUpdatingStatus }] = useUpdateCaseStatusMutation();
  const { data, error, isLoading, refetch } = useGetCasesQuery({ page: 0, size: 100 });

  const cases = useMemo<CaseRow[]>(() => {
    const items = (data?.data?.content ?? []) as BackendCase[];

    return items.map((item) => {
      const daysOpen = getDaysOpen(item.createdAt);
      const status = normalizeStatus(item.status, item.assignedOfficer, daysOpen);
      const isAssigned = Boolean(item.assignedOfficer?.id || item.assignedOfficer?.username);

      return {
        id: item.caseId || item.id,
        uuid: item.id,
        victimAccountId: item.victimAccountId,
        victimDistrict: item.victimDistrict,
        victim: item.victim?.name || "Unknown victim",
        type: item.type || "Unknown type",
        district: item.victim?.address || item.victimDistrict || "Unknown district",
        status,
        officer: item.assignedOfficer?.username || item.assignedOfficer?.email || "Unassigned",
        createdAt: formatDate(item.createdAt),
        updatedAt: formatDate(item.updatedAt),
        reportType: item.reportType,
        incidentAt: formatDate(item.incidentAt ?? undefined),
        incidentLocation: item.incidentLocation,
        reporterName: item.reporterName,
        reporterContact: item.reporterContact,
        witnessName: item.witnessName,
        witnessContact: item.witnessContact,
        witnessLocation: item.witnessLocation,
        daysOpen,
        priority: getPriorityScore(status, daysOpen, isAssigned),
        isAssigned,
      };
    });
  }, [data]);

  const scopedCases = useMemo(() => {
    if (!isDistrictAdmin || !districtName || districtName === "your district") {
      return cases;
    }

    const normalizedDistrict = districtName.trim().toLowerCase();
    return cases.filter((item) =>
      districtMatches(item.district, normalizedDistrict) || districtMatches(item.victimDistrict, normalizedDistrict)
    );
  }, [cases, districtName, isDistrictAdmin]);

  useEffect(() => {
    const requestedCase = searchParams.get("case");
    if (!requestedCase || selectedCase) {
      return;
    }
    const match = scopedCases.find((item) => item.uuid === requestedCase || item.id === requestedCase);
    if (match) {
      setSelectedCase(match);
    }
  }, [scopedCases, searchParams, selectedCase]);

  const districts = useMemo(
    () => [
      "All",
      ...Array.from(new Set(scopedCases.flatMap((item) => [item.district, item.victimDistrict]).filter(Boolean) as string[])).sort(),
    ],
    [scopedCases],
  );

  const filteredCases = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return scopedCases.filter((item) => {
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesDistrict = districtFilter === "All"
        || item.district === districtFilter
        || item.victimDistrict === districtFilter;
      const matchesSearch = !query
        || item.id.toLowerCase().includes(query)
        || item.victim.toLowerCase().includes(query)
        || item.type.toLowerCase().includes(query);

      return matchesStatus && matchesDistrict && matchesSearch;
    });
  }, [scopedCases, districtFilter, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const activeCases = scopedCases.filter((item) => item.status !== "Resolved" && item.status !== "Rejected");
    const totalDays = activeCases.reduce((sum, item) => sum + item.daysOpen, 0);

    return {
      totalActive: activeCases.length,
      critical: scopedCases.filter((item) => item.status === "Critical").length,
      unassigned: scopedCases.filter((item) => !item.isAssigned && item.status !== "Resolved").length,
      avgDaysOpen: activeCases.length ? Math.round(totalDays / activeCases.length) : 0,
    };
  }, [scopedCases]);

  const handleExportPDF = () => {
    exportToPDF(
      "Active Cases Report",
      "GBV Monitor active case records",
      ["Case ID", "Victim", "Type", "District", "Status", "Officer", "Created"],
      filteredCases.map((item) => [
        item.id,
        item.victim,
        item.type,
        item.district,
        item.status,
        item.officer,
        item.createdAt,
      ]),
      "active-cases",
    );
    toast.success("Cases exported as PDF");
  };

  const handleExportCSV = () => {
    exportToCSV(
      filteredCases.map((item) => ({
        "Case ID": item.id,
        Victim: item.victim,
        Type: item.type,
        District: item.district,
        Status: item.status,
        Officer: item.officer,
        Created: item.createdAt,
      })),
      "active-cases",
    );
    toast.success("Cases exported as CSV");
  };

  const handleStatusChange = async (status: "ACCEPTED" | "REJECTED" | "IN_PROGRESS" | "RESOLVED") => {
    if (!selectedCase) {
      return;
    }

    try {
      await updateCaseStatus({ id: selectedCase.uuid, status }).unwrap();
      const nextStatus: UiStatus = status === "ACCEPTED"
        ? "Accepted"
        : status === "REJECTED"
          ? "Rejected"
          : status === "RESOLVED"
            ? "Resolved"
            : "In Progress";
      setSelectedCase((current) => current ? { ...current, status: nextStatus, updatedAt: formatDate(new Date().toISOString()) } : current);
      toast.success("Case status updated");
      await refetch();
    } catch {
      toast.error("Unable to update case status");
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
              {isDistrictAdmin ? "District Case Management" : "Active Cases"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isDistrictAdmin
                ? `Review and manage case records in ${districtName}.`
                : "Review and manage case records across the system."}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "TOTAL ACTIVE", value: stats.totalActive, color: "text-primary" },
              { label: "CRITICAL PRIORITY", value: stats.critical, color: "text-destructive" },
              { label: "UNASSIGNED CASES", value: stats.unassigned, color: "text-warning" },
              { label: "AVG DAYS OPEN", value: stats.avgDaysOpen, color: "text-info" },
            ].map((card) => (
              <div key={card.label} className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-2">{card.label}</p>
                <p className={`text-2xl font-bold font-heading ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-primary" />
                <h3 className="font-heading text-base font-semibold text-foreground">
                  {isDistrictAdmin ? "District Cases" : "All Cases"}
                </h3>
              </div>
              <div className="flex-1" />

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as "All" | UiStatus)}
                  className="h-8 pl-3 pr-7 rounded-lg bg-background border border-border text-xs text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status === "All" ? "All Statuses" : status}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={districtFilter}
                  onChange={(event) => setDistrictFilter(event.target.value)}
                  className="h-8 pl-3 pr-7 rounded-lg bg-background border border-border text-xs text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200"
                >
                  {(districts.length ? districts : DISTRICTS).map((district) => (
                    <option key={district} value={district}>
                      {district === "All" ? "All Districts" : district}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search cases..."
                  className="h-8 w-[180px] pl-8 pr-3 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <ExportButton
                onExportPDF={handleExportPDF}
                onExportCSV={handleExportCSV}
                previewTitle="Active Cases Preview"
                previewRows={filteredCases.map((item) => ({
                  Case_ID: item.id,
                  Victim: item.victim,
                  Type: item.type,
                  District: item.district,
                  Status: item.status,
                  Officer: item.officer,
                  Submitted: item.createdAt,
                }))}
              />
            </div>

            {isLoading ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                Loading cases...
              </div>
            ) : error ? (
              <div className="px-4 py-12 text-center space-y-3">
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
                      {["Case ID", "Victim", "Type", "District", "Status", "Officer", "Created", "Priority"].map((header) => (
                        <th key={header} className="text-left px-4 py-3">
                          <span className="label-text">{header}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map((row) => (
                      <tr
                        key={row.uuid}
                        onClick={() => setSelectedCase(row)}
                        className="border-b border-border/50 cursor-pointer transition-colors duration-150 hover:bg-secondary/30"
                      >
                        <td className="px-4 py-3 font-mono text-primary">{row.id}</td>
                        <td className="px-4 py-3 text-foreground">{row.victim}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.type}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.district}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusClasses[row.status]}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {row.isAssigned ? (
                            <span className="text-sm text-muted-foreground">{row.officer}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-warning">
                              <AlertTriangle className="w-3 h-3" />
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground">{row.createdAt}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getPriorityBarClass(row.priority)}`}
                                style={{ width: `${row.priority}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold tabular-nums ${getPriorityTextClass(row.priority)}`}>
                              {row.priority}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCases.length === 0 && (
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

      <div
        className={`fixed right-0 top-0 h-full w-[360px] z-50 bg-card border-l border-border flex flex-col transition-transform duration-300 ${
          selectedCase ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedCase && (
          <>
            <div className="flex items-start justify-between p-4 border-b border-border shrink-0">
              <div>
                <p className="font-mono text-xs text-primary mb-1">{selectedCase.id}</p>
                <h3 className="font-heading text-base font-semibold text-foreground">Case Details</h3>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-secondary transition-colors duration-200"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-background border border-border rounded-xl p-3 space-y-2.5">
                {[
                  { label: "Victim", value: selectedCase.victim, Icon: User },
                  { label: "Incident Type", value: selectedCase.type, Icon: Briefcase },
                  { label: "District", value: selectedCase.district, Icon: MapPin },
                  { label: "Created", value: selectedCase.createdAt, Icon: Calendar },
                  { label: "Updated", value: selectedCase.updatedAt, Icon: Clock },
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

              <div className="bg-background border border-border rounded-xl p-3">
                <p className="label-text mb-2">CURRENT STATUS</p>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusClasses[selectedCase.status]}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {selectedCase.status}
                </span>
              </div>

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
                    { label: "Incident Date", value: selectedCase.incidentAt },
                    { label: "Incident Location", value: selectedCase.incidentLocation || selectedCase.district },
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
            </div>

            <div className="p-4 border-t border-border grid grid-cols-2 gap-2 shrink-0">
              <button
                disabled={isUpdatingStatus || selectedCase.status === "Accepted"}
                onClick={() => handleStatusChange("ACCEPTED")}
                className="h-8 rounded-lg bg-success/15 border border-success/30 text-xs text-success font-medium hover:bg-success/20 transition-colors duration-200 disabled:opacity-50"
              >
                {selectedCase.status === "Accepted" ? "Accepted" : "Accept"}
              </button>
              <button
                disabled={isUpdatingStatus || selectedCase.status === "Rejected"}
                onClick={() => handleStatusChange("REJECTED")}
                className="h-8 rounded-lg bg-destructive/15 border border-destructive/30 text-xs text-destructive font-medium hover:bg-destructive/20 transition-colors duration-200 disabled:opacity-50"
              >
                {selectedCase.status === "Rejected" ? "Rejected" : "Reject"}
              </button>
              <button
                disabled={isUpdatingStatus || selectedCase.status === "In Progress"}
                onClick={() => handleStatusChange("IN_PROGRESS")}
                className="h-8 rounded-lg bg-info/15 border border-info/30 text-xs text-info font-medium hover:bg-info/20 transition-colors duration-200 disabled:opacity-50"
              >
                {selectedCase.status === "In Progress" ? "In Progress" : "Mark In Progress"}
              </button>
              <button
                disabled={isUpdatingStatus || selectedCase.status === "Resolved"}
                onClick={() => handleStatusChange("RESOLVED")}
                className="h-8 rounded-lg bg-success/15 border border-success/30 text-xs text-success font-medium hover:bg-success/20 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {selectedCase.status === "Resolved" ? "Resolved" : "Mark Resolved"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CaseManagement;

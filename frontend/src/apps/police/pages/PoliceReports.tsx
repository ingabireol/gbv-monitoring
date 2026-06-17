import { useMemo, useState } from "react";
import { Calendar, FileText, Filter, Search } from "lucide-react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/DashboardHeader";
import { PoliceSidebar } from "@/apps/police/components/PoliceSidebar";
import { ExportButton } from "@/components/ExportButton";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import {
  formatPoliceDate,
  usePolicePortalData,
} from "@/apps/police/lib/usePolicePortalData";

const STATUS_OPTIONS = ["All", "Accepted", "Active", "Pending Review", "Overdue", "Resolved", "Rejected"];
const PRIORITY_OPTIONS = ["All", "Critical", "High", "Medium", "Low"];

const statusClasses: Record<string, string> = {
  Overdue: "bg-destructive/15 text-destructive",
  Resolved: "bg-success/15 text-success",
  Active: "bg-info/15 text-info",
  Accepted: "bg-success/15 text-success",
  Rejected: "bg-destructive/15 text-destructive",
  "Pending Review": "bg-warning/15 text-warning",
};

const priorityClasses: Record<string, string> = {
  Critical: "bg-destructive/15 text-destructive",
  High: "bg-warning/15 text-warning",
  Medium: "bg-info/15 text-info",
  Low: "bg-secondary text-muted-foreground",
};

const PoliceReports = () => {
  const { currentUser, assignedSummary, isLoading } = usePolicePortalData();
  const [caseIdFilter, setCaseIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filtered = useMemo(() => {
    return assignedSummary.filter((item) => {
      const query = caseIdFilter.trim().toLowerCase();
      const matchesCaseId = !query || item.caseId.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || item.uiStatus === statusFilter;
      const matchesPriority = priorityFilter === "All" || item.priority === priorityFilter;
      const created = item.createdAt ? new Date(item.createdAt) : null;
      const matchesFrom = !fromDate || (created && created >= new Date(fromDate));
      const matchesTo = !toDate || (created && created <= new Date(toDate + "T23:59:59"));
      return matchesCaseId && matchesStatus && matchesPriority && matchesFrom && matchesTo;
    });
  }, [assignedSummary, caseIdFilter, statusFilter, priorityFilter, fromDate, toDate]);

  const exportRows = filtered.map((item) => ({
    Case_ID: item.caseId,
    Type: item.type,
    Status: item.uiStatus,
    Priority: item.priority,
    Days_Open: `${item.daysOpen}d`,
    Date_Created: formatPoliceDate(item.createdAt),
    Last_Updated: formatPoliceDate(item.updatedAt),
  }));

  const handleExportPDF = () => {
    exportToPDF(
      "Police Officer Case Report",
      `Officer: ${currentUser?.name || currentUser?.username || "Officer"} | ${currentUser?.district || "District"}`,
      ["Case ID", "Type", "Status", "Priority", "Days Open", "Created", "Updated"],
      filtered.map((item) => [
        item.caseId,
        item.type,
        item.uiStatus,
        item.priority,
        `${item.daysOpen}d`,
        formatPoliceDate(item.createdAt),
        formatPoliceDate(item.updatedAt),
      ]),
      "police-case-report",
    );
    toast.success("Report exported as PDF");
  };

  const handleExportCSV = () => {
    exportToCSV(exportRows, "police-case-report");
    toast.success("Report exported as CSV");
  };

  const hasFilters = caseIdFilter || statusFilter !== "All" || priorityFilter !== "All" || fromDate || toDate;

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <PoliceSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Reports & Export</h2>
              <p className="text-sm text-muted-foreground">
                Customise filters and export your assigned case data as PDF or CSV.
              </p>
            </div>
            <ExportButton
              onExportPDF={handleExportPDF}
              onExportCSV={handleExportCSV}
              label="Export Report"
              previewTitle="Police Case Report Preview"
              previewRows={exportRows}
              disabled={filtered.length === 0}
              disabledMessage="No cases match current filters."
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "TOTAL ASSIGNED",  value: assignedSummary.length,                                                 color: "text-foreground" },
              { label: "FILTERED ROWS",   value: filtered.length,                                                        color: "text-primary" },
              { label: "OVERDUE",         value: assignedSummary.filter((c) => c.uiStatus === "Overdue").length,         color: "text-destructive" },
              { label: "RESOLVED",        value: assignedSummary.filter((c) => c.uiStatus === "Resolved").length,        color: "text-success" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-2">{item.label}</p>
                <p className={`text-2xl font-bold font-heading ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-primary" />
              <p className="label-text">REPORT FILTERS</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="space-y-1 lg:col-span-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Search className="w-3 h-3" /> Case ID
                </label>
                <input
                  value={caseIdFilter}
                  onChange={(e) => setCaseIdFilter(e.target.value)}
                  placeholder="e.g. GBV-2024-001"
                  className="h-8 w-full px-3 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 w-full px-3 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="h-8 w-full px-3 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {PRIORITY_OPTIONS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8 w-full px-3 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 w-full px-3 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            {hasFilters && (
              <button
                onClick={() => { setCaseIdFilter(""); setStatusFilter("All"); setPriorityFilter("All"); setFromDate(""); setToDate(""); }}
                className="mt-3 h-7 px-3 rounded-lg bg-secondary border border-border text-[10px] text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <p className="label-text">REPORT RESULTS</p>
              </div>
              <span className="text-[10px] text-muted-foreground">{filtered.length} case(s)</span>
            </div>
            {isLoading ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">Loading case data...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["Case ID", "Type", "Status", "Priority", "Days Open", "Created", "Last Updated"].map((h) => (
                        <th key={h} className="label-text text-left px-4 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-secondary/40 transition-colors duration-150">
                        <td className="px-4 py-2.5 font-mono text-foreground">{item.caseId}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.type}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusClasses[item.uiStatus] ?? "bg-secondary text-muted-foreground"}`}>
                            {item.uiStatus}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${priorityClasses[item.priority] ?? "bg-secondary text-muted-foreground"}`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className={`px-4 py-2.5 font-medium ${item.daysOpen > 14 ? "text-destructive" : item.daysOpen > 7 ? "text-warning" : "text-success"}`}>
                          {item.daysOpen}d
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{formatPoliceDate(item.createdAt)}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{formatPoliceDate(item.updatedAt)}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
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
    </div>
  );
};

export default PoliceReports;

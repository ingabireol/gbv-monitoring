import { useMemo, useState } from "react";
import { Calendar, FileText, Filter } from "lucide-react";
import { toast } from "sonner";
import { PartnerSidebar } from "@/apps/partner/components/PartnerSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ExportButton } from "@/components/ExportButton";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { getCurrentUser } from "@/lib/auth";
import { getPartnerInstitutionName, filterPartnerReferrals } from "@/apps/partner/lib/partnerData";
import { useGetAllReferralsQuery } from "@/store/api";

interface BackendReferral {
  id: string;
  caseId?: string;
  referredTo?: string;
  reason?: string;
  status?: string;
  institutionType?: string;
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
}

const STATUS_OPTIONS = ["All", "PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "REJECTED"];

const statusClasses: Record<string, string> = {
  PENDING:     "bg-warning/15 text-warning",
  ACCEPTED:    "bg-success/15 text-success",
  IN_PROGRESS: "bg-info/15 text-info",
  COMPLETED:   "bg-success/15 text-success",
  REJECTED:    "bg-destructive/15 text-destructive",
};

function fmt(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB");
}

const PartnerReports = () => {
  const currentUser = getCurrentUser();
  const institution = getPartnerInstitutionName(currentUser);

  const [statusFilter, setStatusFilter] = useState("All");
  const [fromDate, setFromDate]         = useState("");
  const [toDate, setToDate]             = useState("");

  const { data, isLoading } = useGetAllReferralsQuery(
    { referredTo: institution, size: 200 },
    { skip: !institution },
  );

  const allReferrals = useMemo<BackendReferral[]>(() => {
    const raw = (data?.data ?? data?.content ?? []) as BackendReferral[];
    return filterPartnerReferrals(raw, currentUser);
  }, [data, currentUser]);

  const filtered = useMemo(() => {
    return allReferrals.filter((r) => {
      const matchStatus = statusFilter === "All" || (r.status ?? "").toUpperCase() === statusFilter;
      const created = r.createdAt ? new Date(r.createdAt) : null;
      const matchFrom = !fromDate || (created && created >= new Date(fromDate));
      const matchTo   = !toDate   || (created && created <= new Date(toDate + "T23:59:59"));
      return matchStatus && matchFrom && matchTo;
    });
  }, [allReferrals, statusFilter, fromDate, toDate]);

  const exportRows = filtered.map((r) => ({
    Referral_ID:  r.id,
    Case_ID:      r.caseId ?? "—",
    Referred_To:  r.referredTo ?? "—",
    Reason:       r.reason ?? "—",
    Status:       r.status ?? "—",
    Type:         r.institutionType ?? "—",
    Created:      fmt(r.createdAt),
    Updated:      fmt(r.updatedAt),
  }));

  const handleExportPDF = () => {
    exportToPDF(
      "Partner Referral Report",
      `Institution: ${institution}`,
      ["Referral ID", "Case ID", "Reason", "Status", "Type", "Created", "Updated"],
      filtered.map((r) => [
        r.id, r.caseId ?? "—", r.reason ?? "—", r.status ?? "—",
        r.institutionType ?? "—", fmt(r.createdAt), fmt(r.updatedAt),
      ]),
      "partner-referral-report",
    );
    toast.success("Report exported as PDF");
  };

  const handleExportCSV = () => {
    exportToCSV(exportRows, "partner-referral-report");
    toast.success("Report exported as CSV");
  };

  const hasFilters = statusFilter !== "All" || fromDate || toDate;

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <PartnerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Referral Reports & Export</h2>
              <p className="text-sm text-muted-foreground">
                Filter and export referrals assigned to <span className="text-foreground font-medium">{institution}</span>.
              </p>
            </div>
            <ExportButton
              onExportPDF={handleExportPDF}
              onExportCSV={handleExportCSV}
              label="Export Report"
              previewTitle="Partner Referral Report Preview"
              previewRows={exportRows}
              disabled={filtered.length === 0}
              disabledMessage="No referrals match current filters."
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "TOTAL REFERRALS",  value: allReferrals.length,                                                      color: "text-foreground" },
              { label: "FILTERED ROWS",    value: filtered.length,                                                          color: "text-primary" },
              { label: "PENDING",          value: allReferrals.filter((r) => (r.status ?? "").toUpperCase() === "PENDING").length,     color: "text-warning" },
              { label: "COMPLETED",        value: allReferrals.filter((r) => (r.status ?? "").toUpperCase() === "COMPLETED").length,   color: "text-success" },
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                onClick={() => { setStatusFilter("All"); setFromDate(""); setToDate(""); }}
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
                <p className="label-text">REFERRAL RESULTS</p>
              </div>
              <span className="text-[10px] text-muted-foreground">{filtered.length} referral(s)</span>
            </div>
            {isLoading ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">Loading referral data...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["Referral ID", "Case ID", "Reason", "Type", "Status", "Created", "Updated"].map((h) => (
                        <th key={h} className="label-text text-left px-4 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((r) => (
                      <tr key={r.id} className="hover:bg-secondary/40 transition-colors duration-150">
                        <td className="px-4 py-2.5 font-mono text-foreground text-[10px]">{r.id.slice(0, 12)}…</td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">{r.caseId ?? "—"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground max-w-[160px] truncate">{r.reason ?? "—"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{r.institutionType ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusClasses[(r.status ?? "").toUpperCase()] ?? "bg-secondary text-muted-foreground"}`}>
                            {r.status ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{fmt(r.createdAt)}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{fmt(r.updatedAt)}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                          No referrals match your current filters.
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

export default PartnerReports;

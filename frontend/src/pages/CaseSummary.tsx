import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ExportButton } from "@/components/ExportButton";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import {
  BackendCase,
  buildDistrictBreakdown,
  buildMonthlyCaseSeries,
  buildTypeBreakdown,
  mapCasesToAdminRows,
} from "@/lib/adminData";
import { BackendReferral, formatDbDate, formatReferralStatus } from "@/lib/referralDb";
import { useGetAllReferralsQuery, useGetCasesQuery } from "@/store/api";

const CaseSummary = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [officerFilter, setOfficerFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const casesQuery = useGetCasesQuery({ page: 0, size: 100 });
  const referralsQuery = useGetAllReferralsQuery({});

  const caseRows = useMemo(() => {
    const items = (casesQuery.data?.data?.content ?? []) as BackendCase[];
    return mapCasesToAdminRows(items);
  }, [casesQuery.data]);

  const referrals = (referralsQuery.data?.data?.content ?? []) as BackendReferral[];
  const todayDate = useMemo(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
  }, []);
  const dateValidationError = useMemo(() => {
    if (fromDate && fromDate > todayDate) return "From date cannot be in the future.";
    if (toDate && toDate > todayDate) return "To date cannot be in the future.";
    if (fromDate && toDate && fromDate > toDate) return "From date cannot be later than To date.";
    return "";
  }, [fromDate, todayDate, toDate]);
  const statusOptions = useMemo(() => Array.from(new Set(caseRows.map((item) => item.status))).sort(), [caseRows]);
  const officerOptions = useMemo(() => Array.from(new Set(caseRows.map((item) => item.officer || "Unassigned"))).sort(), [caseRows]);
  const filteredCaseRows = useMemo(() => {
    if (dateValidationError) return [];

    const fromTime = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toTime = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;

    return caseRows.filter((item) => {
      const officer = item.officer || "Unassigned";
      const submittedTime = item.createdAt ? new Date(item.createdAt).getTime() : NaN;

      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (officerFilter !== "all" && officer !== officerFilter) return false;
      if (fromTime !== null && (Number.isNaN(submittedTime) || submittedTime < fromTime)) return false;
      if (toTime !== null && (Number.isNaN(submittedTime) || submittedTime > toTime)) return false;

      return true;
    });
  }, [caseRows, dateValidationError, fromDate, officerFilter, statusFilter, toDate]);
  const monthlyData = useMemo(() => buildMonthlyCaseSeries(filteredCaseRows, 12), [filteredCaseRows]);
  const districtData = useMemo(() => buildDistrictBreakdown(filteredCaseRows), [filteredCaseRows]);
  const typeData = useMemo(() => buildTypeBreakdown(filteredCaseRows), [filteredCaseRows]);
  const statusReport = useMemo(
    () => Object.entries(filteredCaseRows.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {})).map(([status, total]) => ({ status, total })),
    [filteredCaseRows],
  );
  const officerReport = useMemo(
    () => Object.entries(filteredCaseRows.reduce<Record<string, number>>((acc, item) => {
      acc[item.officer || "Unassigned"] = (acc[item.officer || "Unassigned"] ?? 0) + 1;
      return acc;
    }, {})).map(([officer, total]) => ({ officer, total })).sort((left, right) => right.total - left.total),
    [filteredCaseRows],
  );
  const reportPreviewRows = useMemo(
    () => filteredCaseRows.map((item) => ({
      Case_ID: item.id,
      Victim: item.victimName,
      Type: item.type,
      District: item.district,
      Status: item.status,
      Officer: item.officer || "Unassigned",
      Submitted: item.reportedDate,
    })),
    [filteredCaseRows],
  );

  const thisMonth = monthlyData[monthlyData.length - 1]?.cases ?? 0;
  const lastMonth = monthlyData[monthlyData.length - 2]?.cases ?? 0;
  const monthDelta = thisMonth - lastMonth;
  const resolvedCount = filteredCaseRows.filter((item) => item.status === "Resolved").length;
  const closureRate = filteredCaseRows.length ? Math.round((resolvedCount / filteredCaseRows.length) * 100) : 0;

  const recentActivity = useMemo(() => {
    const caseEvents = filteredCaseRows.map((item) => ({
      id: `${item.uuid}-updated`,
      label: item.id,
      detail: `${item.victimName} - ${item.status}`,
      date: item.updatedAt || item.createdAt,
    }));

    const referralEvents = referrals.map((item) => ({
      id: item.id,
      label: item.caseId || item.caseUuid || "Referral",
      detail: `${item.referredTo || 'Institution pending'} - ${formatReferralStatus(item.status)}`,
      date: item.updatedAt || item.createdAt,
    }));

    return [...caseEvents, ...referralEvents]
      .sort((left, right) => new Date(right.date || 0).getTime() - new Date(left.date || 0).getTime())
      .slice(0, 8);
  }, [filteredCaseRows, referrals]);

  const handleExportPDF = () => {
    if (dateValidationError) {
      toast.error(dateValidationError);
      return;
    }

    exportToPDF(
      "Case Report",
      "System-wide cases filtered by status, time, and assigned officer",
      ["Case ID", "Victim", "Type", "District", "Status", "Officer", "Submitted"],
      filteredCaseRows.map((item) => [
        item.id,
        item.victimName,
        item.type,
        item.district,
        item.status,
        item.officer || "Unassigned",
        item.reportedDate,
      ]),
      "case-summary",
    );
    toast.success("Filtered case report exported as PDF");
  };

  const handleExportCSV = () => {
    if (dateValidationError) {
      toast.error(dateValidationError);
      return;
    }

    exportToCSV(
      reportPreviewRows,
      "case-summary",
    );
    toast.success("Filtered case report exported as CSV");
  };

  const isLoading = casesQuery.isLoading || referralsQuery.isLoading;
  const hasError = Boolean(casesQuery.error || referralsQuery.error);

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Case Summary</h2>
              <p className="text-sm text-muted-foreground">Review monthly movement, district coverage, and recent case activity.</p>
            </div>
            <ExportButton
              onExportPDF={handleExportPDF}
              onExportCSV={handleExportCSV}
              label="Export Summary"
              previewTitle="Case Summary Preview"
              previewRows={reportPreviewRows}
              disabled={Boolean(dateValidationError)}
              disabledMessage={dateValidationError}
            />
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
              <label className="space-y-1">
                <span className="label-text">STATUS</span>
                <select className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">All statuses</option>
                  {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="label-text">OFFICER</span>
                <select className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm" value={officerFilter} onChange={(event) => setOfficerFilter(event.target.value)}>
                  <option value="all">All officers</option>
                  {officerOptions.map((officer) => <option key={officer} value={officer}>{officer}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="label-text">FROM</span>
                <input
                  className={`w-full h-10 rounded-md border bg-background px-3 text-sm ${dateValidationError ? "border-destructive" : "border-border"}`}
                  type="date"
                  value={fromDate}
                  max={todayDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </label>
              <label className="space-y-1">
                <span className="label-text">TO</span>
                <input
                  className={`w-full h-10 rounded-md border bg-background px-3 text-sm ${dateValidationError ? "border-destructive" : "border-border"}`}
                  type="date"
                  value={toDate}
                  max={todayDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  className="w-full h-10 rounded-md border border-border bg-secondary px-3 text-sm font-medium text-foreground hover:bg-secondary/80"
                  onClick={() => {
                    setStatusFilter("all");
                    setOfficerFilter("all");
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  Reset Filters
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {dateValidationError || `Showing ${filteredCaseRows.length} of ${caseRows.length} cases for this report.`}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "THIS MONTH", value: thisMonth, color: "text-primary" },
              { label: "CHANGE VS LAST MONTH", value: `${monthDelta > 0 ? '+' : ''}${monthDelta}`, color: monthDelta > 0 ? "text-destructive" : "text-success" },
              { label: "OPEN CASES", value: filteredCaseRows.filter((item) => item.status !== "Resolved").length, color: "text-warning" },
              { label: "CLOSURE RATE", value: `${closureRate}%`, color: "text-info" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-2">{item.label}</p>
                <p className={`text-2xl font-heading font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">Loading case summary...</div>
          ) : hasError ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">Unable to load case summary.</div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-secondary border border-border">
                <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground">
                  The most reported case type right now is <span className="text-foreground font-medium">{typeData[0]?.name ?? 'not available yet'}</span>, and the district with the most tracked cases is <span className="text-foreground font-medium">{districtData[0]?.district ?? 'not available yet'}</span>.
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-base font-semibold text-foreground">12-Month Trend</h3>
                    <span className="label-text">MONTHLY CASES</span>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="caseSummaryArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(14, 74%, 52%)" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="hsl(14, 74%, 52%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(208, 30%, 18%)" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="cases" stroke="hsl(14, 74%, 52%)" strokeWidth={3} fill="url(#caseSummaryArea)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <h3 className="font-heading text-base font-semibold text-foreground">Latest Activity</h3>
                    <span className="label-text">RECENT UPDATES</span>
                  </div>
                  <div className="divide-y divide-border">
                    {recentActivity.map((item) => (
                      <div key={item.id} className="px-5 py-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-xs text-primary">{item.label}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{item.detail}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">{formatDbDate(item.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-border">
                    <p className="label-text">REPORT BY STATUS</p>
                  </div>
                  <div className="divide-y divide-border">
                    {statusReport.length === 0 ? (
                      <div className="px-5 py-8 text-center text-sm text-muted-foreground">No cases match this report filter.</div>
                    ) : (
                      statusReport.map((item) => (
                        <div key={item.status} className="flex items-center justify-between px-5 py-3">
                          <span className="text-xs text-muted-foreground">{item.status}</span>
                          <span className="text-sm font-semibold text-foreground">{item.total}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-border">
                    <p className="label-text">REPORT BY ASSIGNED OFFICER</p>
                  </div>
                  <div className="divide-y divide-border">
                    {officerReport.length === 0 ? (
                      <div className="px-5 py-8 text-center text-sm text-muted-foreground">No officer data matches this report filter.</div>
                    ) : (
                      officerReport.map((item) => (
                        <div key={item.officer} className="flex items-center justify-between px-5 py-3">
                          <span className="text-xs text-muted-foreground">{item.officer}</span>
                          <span className="text-sm font-semibold text-foreground">{item.total}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h3 className="font-heading text-base font-semibold text-foreground">District Breakdown</h3>
                  <span className="label-text">ALL DISTRICTS</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        {['District', 'Total', 'Resolved', 'Pending', 'Critical', 'Resolution Rate'].map((header) => (
                          <th key={header} className="px-5 py-3 text-left label-text">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {districtData.map((item) => (
                        <tr key={item.district} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
                          <td className="px-5 py-3 font-medium text-foreground">{item.district}</td>
                          <td className="px-5 py-3 text-foreground">{item.total}</td>
                          <td className="px-5 py-3 text-success">{item.resolved}</td>
                          <td className="px-5 py-3 text-warning">{item.pending}</td>
                          <td className="px-5 py-3 text-destructive">{item.critical}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                                <div className={`h-full rounded-full ${item.rate >= 75 ? 'bg-success' : item.rate >= 50 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${item.rate}%` }} />
                              </div>
                              <span className="text-[10px] font-medium text-foreground">{item.rate}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default CaseSummary;

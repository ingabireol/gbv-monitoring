import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowRightLeft,
  CheckCircle2,
  FilePlus,
  MapPinned,
  PieChart as PieChartIcon,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ExportButton } from "@/components/ExportButton";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import {
  BackendCase,
  getCurrentDistrict,
  getMonthLabel,
  mapBackendCasesToDistrictRows,
  scopeCasesToDistrict,
} from "@/apps/districtadmin/lib/districtAdminData";
import {
  BackendReferral,
  formatDbDate,
  formatReferralStatus,
} from "@/lib/referralDb";
import {
  useGetAllReferralsQuery,
  useGetCasesByDistrictAnalyticsQuery,
  useGetCasesQuery,
  useGetResolutionRateAnalyticsQuery,
} from "@/store/api";

const CHART_COLORS = [
  "hsl(168, 70%, 40%)",
  "hsl(213, 94%, 68%)",
  "hsl(142, 69%, 58%)",
  "hsl(43, 96%, 56%)",
  "hsl(0, 84%, 71%)",
  "hsl(14, 74%, 52%)",
];

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "hsl(212, 30%, 14%)",
    border: "1px solid hsl(208, 30%, 18%)",
    borderRadius: "8px",
    fontSize: 12,
  },
  labelStyle: { color: "hsl(210, 20%, 98%)" },
};

const DistrictAdminReports = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [officerFilter, setOfficerFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const currentDistrict = getCurrentDistrict();
  const { data: casesData, isLoading: isLoadingCases, error: casesError } = useGetCasesQuery({ page: 0, size: 100 });
  const { data: referralsData, isLoading: isLoadingReferrals, error: referralsError } = useGetAllReferralsQuery({});
  const districtAnalyticsQuery = useGetCasesByDistrictAnalyticsQuery();
  const resolutionAnalyticsQuery = useGetResolutionRateAnalyticsQuery();

  const districtCases = useMemo(() => {
    const items = (casesData?.data?.content ?? []) as BackendCase[];
    return scopeCasesToDistrict(mapBackendCasesToDistrictRows(items), currentDistrict);
  }, [casesData, currentDistrict]);

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
  const statusOptions = useMemo(() => Array.from(new Set(districtCases.map((item) => item.status))).sort(), [districtCases]);
  const officerOptions = useMemo(() => Array.from(new Set(districtCases.map((item) => item.assignedOfficer || "Unassigned"))).sort(), [districtCases]);
  const reportCases = useMemo(() => {
    if (dateValidationError) return [];

    const fromTime = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toTime = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;

    return districtCases.filter((item) => {
      const officer = item.assignedOfficer || "Unassigned";
      const submittedTime = item.createdAt ? new Date(item.createdAt).getTime() : NaN;

      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (officerFilter !== "all" && officer !== officerFilter) return false;
      if (fromTime !== null && (Number.isNaN(submittedTime) || submittedTime < fromTime)) return false;
      if (toTime !== null && (Number.isNaN(submittedTime) || submittedTime > toTime)) return false;

      return true;
    });
  }, [dateValidationError, districtCases, fromDate, officerFilter, statusFilter, toDate]);
  const districtCaseIds = useMemo(() => new Set(reportCases.map((item) => item.id)), [reportCases]);
  const districtCaseUuids = useMemo(() => new Set(reportCases.map((item) => item.uuid)), [reportCases]);
  const reportPreviewRows = useMemo(
    () => reportCases.map((item) => ({
      Case_ID: item.id,
      Victim: item.victimName,
      Type: item.type,
      District: item.district,
      Status: item.status,
      Officer: item.assignedOfficer || "Unassigned",
      Submitted: item.reportedDate,
    })),
    [reportCases],
  );

  const referrals = useMemo(() => {
    const items = (referralsData?.data?.content ?? []) as BackendReferral[];
    return items.filter((item) => districtCaseIds.has(item.caseId ?? "") || districtCaseUuids.has(item.caseUuid ?? ""));
  }, [districtCaseIds, districtCaseUuids, referralsData]);

  const monthlyData = useMemo(
    () => Array.from({ length: 6 }, (_, index) => {
      const offset = 5 - index;
      const monthDate = new Date(new Date().getFullYear(), new Date().getMonth() - offset, 1);
      const month = monthDate.getMonth();
      const year = monthDate.getFullYear();

      const registered = reportCases.filter((item) => {
        if (!item.createdAt) return false;
        const date = new Date(item.createdAt);
        return date.getMonth() === month && date.getFullYear() === year;
      }).length;

      const resolved = reportCases.filter((item) => {
        if (item.status !== "Resolved" || !item.updatedAt) return false;
        const date = new Date(item.updatedAt);
        return date.getMonth() === month && date.getFullYear() === year;
      }).length;

      return {
        month: getMonthLabel(offset),
        registered,
        resolved,
      };
    }),
    [reportCases],
  );

  const caseTypes = useMemo(
    () => Object.entries(
      reportCases.reduce<Record<string, number>>((acc, item) => {
        acc[item.type] = (acc[item.type] ?? 0) + 1;
        return acc;
      }, {}),
    )
      .map(([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6),
    [reportCases],
  );

  const statusReport = useMemo(
    () => Object.entries(reportCases.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {})).map(([status, total]) => ({ status, total })),
    [reportCases],
  );

  const officerReport = useMemo(
    () => Object.entries(reportCases.reduce<Record<string, number>>((acc, item) => {
      acc[item.assignedOfficer || "Unassigned"] = (acc[item.assignedOfficer || "Unassigned"] ?? 0) + 1;
      return acc;
    }, {})).map(([officer, total]) => ({ officer, total })).sort((left, right) => right.total - left.total),
    [reportCases],
  );

  const activity = useMemo(() => {
    const caseActivity = reportCases.flatMap((item) => {
      const entries = [
        item.createdAt ? {
          id: `${item.uuid}-created`,
          type: "Case Registered",
          caseId: item.id,
          outcome: `${item.type} case created for ${item.victimName}`,
          date: item.createdAt,
        } : null,
        item.updatedAt ? {
          id: `${item.uuid}-updated`,
          type: "Case Updated",
          caseId: item.id,
          outcome: `Status is currently ${item.status}`,
          date: item.updatedAt,
        } : null,
      ].filter(Boolean);

      return entries;
    });

    const referralActivity = referrals.map((item) => ({
      id: item.id,
      type: "Referral",
      caseId: item.caseId || "Unknown case",
      outcome: `${item.referredTo || "Unknown institution"} - ${formatReferralStatus(item.status)}`,
      date: item.updatedAt || item.createdAt,
    }));

    return [...caseActivity, ...referralActivity]
      .filter((item): item is { id: string; type: string; caseId: string; outcome: string; date?: string } => Boolean(item))
      .sort((left, right) => new Date(right.date ?? 0).getTime() - new Date(left.date ?? 0).getTime())
      .slice(0, 10);
  }, [reportCases, referrals]);

  const casesThisMonth = monthlyData[monthlyData.length - 1]?.registered ?? 0;
  const completedReferrals = referrals.filter((item) => (item.status ?? "").toUpperCase() === "COMPLETED").length;
  const localResolutionRate = reportCases.length > 0
    ? Math.round((reportCases.filter((item) => item.status === "Resolved").length / reportCases.length) * 100)
    : 0;
  const globalResolutionRate = Math.round(Number(resolutionAnalyticsQuery.data?.data?.data?.resolutionRate ?? 0) * 100);
  const districtCasesByAnalytics = Number(
    (districtAnalyticsQuery.data?.data?.data?.casesByDistrict as Record<string, unknown> | undefined)?.[currentDistrict ?? ""] ?? districtCases.length,
  );

  const isLoading = isLoadingCases || isLoadingReferrals || districtAnalyticsQuery.isLoading || resolutionAnalyticsQuery.isLoading;
  const hasError = Boolean(casesError || referralsError || districtAnalyticsQuery.error || resolutionAnalyticsQuery.error);

  const handleExportPDF = () => {
    if (dateValidationError) {
      toast.error(dateValidationError);
      return;
    }

    exportToPDF(
      `${currentDistrict || "District"} Report`,
      `Filtered case report for ${currentDistrict || "the selected district"}`,
      ["Case ID", "Victim", "Type", "District", "Status", "Officer", "Submitted"],
      reportCases.map((item) => [
        item.id,
        item.victimName,
        item.type,
        item.district,
        item.status,
        item.assignedOfficer || "Unassigned",
        item.reportedDate,
      ]),
      `${(currentDistrict || "district").toLowerCase().replace(/\s+/g, "-")}-report`,
    );
    toast.success("Report exported as PDF");
  };

  const handleExportCSV = () => {
    if (dateValidationError) {
      toast.error(dateValidationError);
      return;
    }

    exportToCSV(
      reportPreviewRows,
      `${(currentDistrict || "district").toLowerCase().replace(/\s+/g, "-")}-report`,
    );
    toast.success("Report exported as CSV");
  };

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Reports</h2>
              <p className="text-sm text-muted-foreground">
                Activity logs and monthly statistics for {currentDistrict || "this district"}
              </p>
            </div>
            <ExportButton
              onExportPDF={handleExportPDF}
              onExportCSV={handleExportCSV}
              label="Export Report"
              previewTitle={`${currentDistrict || "District"} Report Preview`}
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
              {dateValidationError || `Showing ${reportCases.length} of ${districtCases.length} cases for this district report.`}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "CASES THIS MONTH", value: casesThisMonth, sub: "Opened this month", color: "text-primary", Icon: FilePlus },
              { label: "DISTRICT RESOLUTION RATE", value: `${localResolutionRate}%`, sub: "Current district view", color: "text-primary", Icon: CheckCircle2 },
              { label: "REFERRALS TRACKED", value: referrals.length, sub: "Linked district referrals", color: "text-primary", Icon: ArrowRightLeft },
              { label: "REPORT CASES", value: reportCases.length, sub: `${districtCasesByAnalytics} total in ${currentDistrict || "district"}`, color: "text-primary", Icon: MapPinned },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="label-text">{item.label}</p>
                  <item.Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <p className={`text-2xl font-heading font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
              Loading report data...
            </div>
          ) : hasError ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <p className="text-sm font-medium text-foreground">Unable to load report data</p>
              <p className="text-xs text-muted-foreground mt-1">
                Please try again in a moment.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-base font-semibold text-foreground">
                      Cases Registered vs Resolved
                    </h3>
                    <span className="label-text">LAST 6 MONTHS</span>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthlyData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(208, 30%, 18%)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: 12, color: "hsl(213, 18%, 62%)" }} />
                      <Bar dataKey="registered" name="Registered" fill="hsl(168, 70%, 40%)" radius={[4, 4, 0, 0]} barSize={16} />
                      <Bar dataKey="resolved" name="Resolved" fill="hsl(142, 69%, 58%)" radius={[4, 4, 0, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-sm font-semibold text-foreground">
                      Case Types
                    </h3>
                    <PieChartIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={caseTypes}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                          paddingAngle={3}
                        >
                          {caseTypes.map((_, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip {...TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-[10px] text-muted-foreground">Top Type</p>
                      <p className="text-[11px] font-semibold text-foreground text-center leading-tight max-w-[90px]">
                        {caseTypes[0]?.name ?? "No data"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {caseTypes.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                        <span className="text-[10px] text-muted-foreground flex-1 truncate">{item.name}</span>
                        <span className="text-[10px] font-medium text-foreground">{item.value}</span>
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-primary" />
                    <h3 className="font-heading text-base font-semibold text-foreground">Summary</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-secondary border border-border rounded-xl p-4">
                      <p className="label-text mb-2">CURRENT DISTRICT RATE</p>
                      <p className="text-2xl font-heading font-bold text-info">{localResolutionRate}%</p>
                    </div>
                    <div className="bg-secondary border border-border rounded-xl p-4">
                      <p className="label-text mb-2">OVERALL RESOLUTION RATE</p>
                      <p className="text-2xl font-heading font-bold text-success">{globalResolutionRate}%</p>
                    </div>
                    <div className="bg-secondary border border-border rounded-xl p-4">
                      <p className="label-text mb-2">COMPLETED REFERRALS</p>
                      <p className="text-2xl font-heading font-bold text-warning">{completedReferrals}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden lg:col-span-2">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <p className="label-text">RECENT ACTIVITY</p>
                    <span className="text-[10px] text-muted-foreground">Latest case and referral changes</span>
                  </div>
                  <div className="divide-y divide-border">
                    {activity.length === 0 ? (
                      <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                        No recent activity was found for this view.
                      </div>
                    ) : (
                      activity.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 px-5 py-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-primary/15 text-primary">
                            <Activity className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                                {item.type}
                              </span>
                              <span className="font-mono text-[10px] text-foreground">{item.caseId}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{item.outcome}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">{formatDbDate(item.date)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default DistrictAdminReports;

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
  Calendar,
  CheckCircle2,
  Filter,
  FilePlus,
  MapPinned,
  PieChart as PieChartIcon,
} from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/auth";
import { SocialWorkerSidebar } from "@/apps/socialworker/components/SocialWorkerSidebar";
import {
  BackendCase,
  getScopedDistrictCases,
  mapBackendCasesToRows,
} from "@/apps/socialworker/lib/socialWorkerData";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ExportButton } from "@/components/ExportButton";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
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

function getMonthBucket(monthOffset: number): string {
  const now = new Date();
  const monthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
  return monthDate.toLocaleDateString("en-RW", { month: "short" });
}

const SocialWorkerReports = () => {
  const currentUser = getCurrentUser();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const { data: casesData, isLoading: isLoadingCases, error: casesError } = useGetCasesQuery({ page: 0, size: 100 });
  const { data: referralsData, isLoading: isLoadingReferrals, error: referralsError } = useGetAllReferralsQuery({});
  const districtAnalyticsQuery = useGetCasesByDistrictAnalyticsQuery();
  const resolutionAnalyticsQuery = useGetResolutionRateAnalyticsQuery();

  const allCases = useMemo(() => {
    const items = (casesData?.data?.content ?? []) as BackendCase[];
    return getScopedDistrictCases(mapBackendCasesToRows(items));
  }, [casesData]);

  const caseTypes = useMemo(
    () => ["All", ...Array.from(new Set(allCases.map((c) => c.type).filter(Boolean))).sort()],
    [allCases],
  );

  const cases = useMemo(() => {
    return allCases.filter((item) => {
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesType = typeFilter === "All" || item.type === typeFilter;
      const created = item.createdAt ? new Date(item.createdAt) : null;
      const matchesFrom = !fromDate || (created && created >= new Date(fromDate));
      const matchesTo = !toDate || (created && created <= new Date(toDate + "T23:59:59"));
      return matchesStatus && matchesType && matchesFrom && matchesTo;
    });
  }, [allCases, statusFilter, typeFilter, fromDate, toDate]);

  const caseIdSet = useMemo(() => new Set(cases.map((item) => item.id)), [cases]);
  const caseUuidSet = useMemo(() => new Set(cases.map((item) => item.uuid)), [cases]);

  const referrals = useMemo(() => {
    const items = (referralsData?.data?.content ?? []) as BackendReferral[];
    const byCase = items.filter((item) => caseUuidSet.has(item.caseUuid ?? "") || caseIdSet.has(item.caseId ?? ""));
    if (byCase.length > 0) {
      return byCase;
    }
    return items.filter((item) => item.referredBy === currentUser?.name || item.referredBy === currentUser?.username);
  }, [caseIdSet, caseUuidSet, currentUser?.name, currentUser?.username, referralsData]);

  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const offset = 5 - index;
      const monthDate = new Date(new Date().getFullYear(), new Date().getMonth() - offset, 1);
      const month = monthDate.getMonth();
      const year = monthDate.getFullYear();
      const registered = cases.filter((item) => {
        if (!item.createdAt) return false;
        const date = new Date(item.createdAt);
        return date.getMonth() === month && date.getFullYear() === year;
      }).length;
      const resolved = cases.filter((item) => {
        if (item.status !== "Resolved" || !item.updatedAt) return false;
        const date = new Date(item.updatedAt);
        return date.getMonth() === month && date.getFullYear() === year;
      }).length;
      return {
        month: getMonthBucket(offset),
        registered,
        resolved,
      };
    });
  }, [cases]);

  const typeData = useMemo(() => {
    const counts = new Map<string, number>();
    cases.forEach((item) => {
      counts.set(item.type, (counts.get(item.type) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6);
  }, [cases]);

  const activity = useMemo(() => {
    const caseActivity = cases.flatMap((item) => {
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
  }, [cases, referrals]);

  const casesThisMonth = monthlyData[monthlyData.length - 1]?.registered ?? 0;
  const completedReferrals = referrals.filter((item) => (item.status ?? "").toUpperCase() === "COMPLETED").length;
  const localResolutionRate = cases.length > 0 ? Math.round((cases.filter((item) => item.status === "Resolved").length / cases.length) * 100) : 0;
  const backendResolutionRate = Math.round(Number(resolutionAnalyticsQuery.data?.data?.data?.resolutionRate ?? 0) * 100);
  const districtCasesByAnalytics = Number(
    (districtAnalyticsQuery.data?.data?.data?.casesByDistrict as Record<string, unknown> | undefined)?.[currentUser?.district ?? ""] ?? cases.length,
  );

  const isLoading = isLoadingCases || isLoadingReferrals || districtAnalyticsQuery.isLoading || resolutionAnalyticsQuery.isLoading;
  const hasError = Boolean(casesError || referralsError || districtAnalyticsQuery.error || resolutionAnalyticsQuery.error);

  const handleExportPDF = () => {
    exportToPDF(
      "Social Worker Activity Report",
      `${currentUser?.name || currentUser?.username || "Social Worker"} - ${currentUser?.district || "Shared view"}`,
      ["Case ID", "Victim", "Type", "District", "Status", "Updated"],
      cases.map((item) => [
        item.id,
        item.victimName,
        item.type,
        item.district,
        item.status,
        item.lastUpdated,
      ]),
      "socialworker-report-live",
    );
    toast.success("Report exported as PDF");
  };

  const handleExportCSV = () => {
    exportToCSV(
      cases.map((item) => ({
        Case_ID: item.id,
        Victim: item.victimName,
        Type: item.type,
        District: item.district,
        Status: item.status,
        Last_Updated: item.lastUpdated,
      })),
      "socialworker-report-live",
    );
    toast.success("Report exported as CSV");
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <SocialWorkerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Reports</h2>
              <p className="text-sm text-muted-foreground">
                Reports and trends for your cases and referrals.
              </p>
            </div>
            <ExportButton
              onExportPDF={handleExportPDF}
              onExportCSV={handleExportCSV}
              label="Export Report"
              previewTitle="Social Worker Report Preview"
              previewRows={cases.map((item) => ({
                Case_ID: item.id,
                Victim: item.victimName,
                Type: item.type,
                District: item.district,
                Status: item.status,
                Last_Updated: item.lastUpdated,
              }))}
            />
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-primary" />
              <p className="label-text">REPORT FILTERS</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 w-full px-3 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {["All", "Pending", "In Progress", "Resolved", "Rejected"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Case Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-8 w-full px-3 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {caseTypes.map((t) => <option key={t}>{t}</option>)}
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
            {(statusFilter !== "All" || typeFilter !== "All" || fromDate || toDate) && (
              <button
                onClick={() => { setStatusFilter("All"); setTypeFilter("All"); setFromDate(""); setToDate(""); }}
                className="mt-3 h-7 px-3 rounded-lg bg-secondary border border-border text-[10px] text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "CASES THIS MONTH", value: casesThisMonth, sub: "Opened this month", color: "text-primary", Icon: FilePlus },
              { label: "RESOLUTION RATE", value: `${localResolutionRate}%`, sub: "Based on current results", color: "text-info", Icon: CheckCircle2 },
              { label: "REFERRALS TRACKED", value: referrals.length, sub: "Related referrals", color: "text-warning", Icon: ArrowRightLeft },
              { label: "DISTRICT CASES", value: districtCasesByAnalytics, sub: `${currentUser?.district || "Visible"} summary`, color: "text-success", Icon: MapPinned },
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
                We could not load the report right now. Please try again.
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
                          data={typeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                          paddingAngle={3}
                        >
                          {typeData.map((_, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip {...TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-[10px] text-muted-foreground">Top Type</p>
                      <p className="text-[11px] font-semibold text-foreground text-center leading-tight max-w-[90px]">
                        {typeData[0]?.name ?? "No data"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {typeData.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                        <span className="text-[10px] text-muted-foreground flex-1 truncate">{item.name}</span>
                        <span className="text-[10px] font-medium text-foreground">{item.value}</span>
                      </div>
                    ))}
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
                      <p className="label-text mb-2">CURRENT VIEW RATE</p>
                      <p className="text-2xl font-heading font-bold text-info">{localResolutionRate}%</p>
                    </div>
                    <div className="bg-secondary border border-border rounded-xl p-4">
                      <p className="label-text mb-2">OVERALL RESOLUTION RATE</p>
                      <p className="text-2xl font-heading font-bold text-success">{backendResolutionRate}%</p>
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

export default SocialWorkerReports;

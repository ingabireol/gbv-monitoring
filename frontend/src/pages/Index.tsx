import { useMemo } from "react";
import { Activity, ArrowRightLeft, Briefcase, MapPinned } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import {
  BackendCase,
  buildDistrictBreakdown,
  buildMonthlyCaseSeries,
  buildTypeBreakdown,
  CASE_STATUS_CLASSES,
  mapCasesToAdminRows,
} from "@/lib/adminData";
import { BackendReferral, formatDbDate, formatReferralStatus } from "@/lib/referralDb";
import {
  useGetAllReferralsQuery,
  useGetCasesQuery,
  useGetResolutionRateAnalyticsQuery,
  useGetUsersQuery,
} from "@/store/api";

const CHART_COLORS = [
  "hsl(14, 74%, 52%)",
  "hsl(213, 94%, 68%)",
  "hsl(168, 70%, 40%)",
  "hsl(43, 96%, 56%)",
  "hsl(142, 69%, 58%)",
  "hsl(0, 84%, 71%)",
];

const Index = () => {
  const casesQuery = useGetCasesQuery({ page: 0, size: 100 });
  const referralsQuery = useGetAllReferralsQuery({});
  const usersQuery = useGetUsersQuery();
  const resolutionQuery = useGetResolutionRateAnalyticsQuery();

  const caseRows = useMemo(() => {
    const items = (casesQuery.data?.data?.content ?? []) as BackendCase[];
    return mapCasesToAdminRows(items);
  }, [casesQuery.data]);

  const referrals = useMemo(
    () => (referralsQuery.data?.data?.content ?? []) as BackendReferral[],
    [referralsQuery.data],
  );
  const users = (usersQuery.data?.data ?? []) as Array<{ role?: string; enabled?: boolean }>;

  const monthlyData = useMemo(() => buildMonthlyCaseSeries(caseRows, 6), [caseRows]);
  const districtData = useMemo(
    () => buildDistrictBreakdown(caseRows).slice(0, 6).map((item) => ({ name: item.district, value: item.total })),
    [caseRows],
  );
  const typeData = useMemo(() => buildTypeBreakdown(caseRows).slice(0, 5), [caseRows]);

  const recentCases = useMemo(
    () => [...caseRows]
      .sort((left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime())
      .slice(0, 6),
    [caseRows],
  );

  const recentReferrals = useMemo(
    () => [...referrals]
      .sort((left, right) => new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime())
      .slice(0, 5),
    [referrals],
  );

  const stats = {
    totalCases: caseRows.length,
    openCases: caseRows.filter((item) => item.status !== "Resolved").length,
    referrals: referrals.length,
    activeStaff: users.filter((item) => item.enabled !== false && item.role && item.role !== "VICTIM").length,
  };

  const resolutionRate = Math.round(Number(resolutionQuery.data?.data?.data?.resolutionRate ?? 0) * 100);
  const isLoading = casesQuery.isLoading || referralsQuery.isLoading || usersQuery.isLoading || resolutionQuery.isLoading;
  const hasError = Boolean(casesQuery.error || referralsQuery.error || usersQuery.error || resolutionQuery.error);

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Monitor system-wide case activity, referrals, staffing, and resolution trends.
            </p>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "TOTAL CASES", value: stats.totalCases, icon: Briefcase, color: "text-primary" },
              { label: "OPEN CASES", value: stats.openCases, icon: Activity, color: "text-warning" },
              { label: "REFERRALS", value: stats.referrals, icon: ArrowRightLeft, color: "text-info" },
              { label: "ACTIVE STAFF", value: stats.activeStaff, icon: MapPinned, color: "text-success" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="label-text">{item.label}</p>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <p className={`text-2xl font-heading font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
              Loading dashboard data...
            </div>
          ) : hasError ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center space-y-2">
              <p className="text-sm font-medium text-foreground">Unable to load dashboard data</p>
              <p className="text-xs text-muted-foreground">Please try again in a moment.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <div className="xl:col-span-2 bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-base font-semibold text-foreground">Case Volume</h3>
                    <span className="label-text">LAST 6 MONTHS</span>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(208, 30%, 18%)" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="cases" fill="hsl(14, 74%, 52%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-base font-semibold text-foreground">Case Types</h3>
                    <span className="label-text">TOP 5</span>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={typeData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3}>
                        {typeData.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {typeData.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                        <span className="text-muted-foreground flex-1 truncate">{item.name}</span>
                        <span className="text-foreground font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-heading text-base font-semibold text-foreground mb-4">Coverage Summary</h3>
                  <div className="space-y-3">
                    <div className="bg-secondary border border-border rounded-xl p-4">
                      <p className="label-text mb-2">RESOLUTION RATE</p>
                      <p className="text-2xl font-heading font-bold text-success">{resolutionRate}%</p>
                    </div>
                    <div className="bg-secondary border border-border rounded-xl p-4">
                      <p className="label-text mb-2">DISTRICTS TRACKED</p>
                      <p className="text-2xl font-heading font-bold text-primary">{districtData.length}</p>
                    </div>
                    <div className="bg-secondary border border-border rounded-xl p-4">
                      <p className="label-text mb-2">LATEST REFERRALS</p>
                      <p className="text-2xl font-heading font-bold text-info">{recentReferrals.length}</p>
                    </div>
                  </div>
                </div>

                <div className="xl:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <h3 className="font-heading text-base font-semibold text-foreground">Recent Cases</h3>
                    <span className="label-text">LATEST ENTRIES</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          {['Case ID', 'Victim', 'Type', 'District', 'Status', 'Reported'].map((header) => (
                            <th key={header} className="px-5 py-3 text-left label-text">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {recentCases.map((item) => (
                          <tr key={item.uuid} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
                            <td className="px-5 py-3 font-mono text-primary">{item.id}</td>
                            <td className="px-5 py-3 text-foreground">{item.victimName}</td>
                            <td className="px-5 py-3 text-muted-foreground">{item.type}</td>
                            <td className="px-5 py-3 text-muted-foreground">{item.district}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${CASE_STATUS_CLASSES[item.status]}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {item.status}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">{item.reportedDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <h3 className="font-heading text-base font-semibold text-foreground">District Overview</h3>
                    <span className="label-text">TOP AREAS</span>
                  </div>
                  <div className="divide-y divide-border">
                    {buildDistrictBreakdown(caseRows).slice(0, 6).map((item) => (
                      <div key={item.district} className="px-5 py-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.district}</p>
                          <p className="text-xs text-muted-foreground">{item.resolved} resolved, {item.pending} pending</p>
                        </div>
                        <p className="text-sm font-semibold text-primary">{item.total}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <h3 className="font-heading text-base font-semibold text-foreground">Recent Referrals</h3>
                    <span className="label-text">LATEST HANDOFFS</span>
                  </div>
                  <div className="divide-y divide-border">
                    {recentReferrals.length === 0 ? (
                      <div className="px-5 py-10 text-center text-sm text-muted-foreground">No referrals available yet.</div>
                    ) : (
                      recentReferrals.map((item) => (
                        <div key={item.id} className="px-5 py-3 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.referredTo || 'Receiving institution pending'}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.caseId || item.caseUuid || 'Case pending'} - {formatReferralStatus(item.status)}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">{formatDbDate(item.updatedAt || item.createdAt)}</span>
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

export default Index;

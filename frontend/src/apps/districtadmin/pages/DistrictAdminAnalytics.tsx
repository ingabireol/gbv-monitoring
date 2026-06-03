import { useMemo } from "react";
import {
  Area,
  AreaChart,
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
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import {
  BackendCase,
  getCurrentDistrict,
  getDaysOpen,
  getMonthLabel,
  mapBackendCasesToDistrictRows,
  scopeCasesToDistrict,
} from "@/apps/districtadmin/lib/districtAdminData";
import { useGetCasesQuery } from "@/store/api";

const STATUS_COLORS = [
  "hsl(213, 94%, 68%)",
  "hsl(142, 69%, 58%)",
  "hsl(43, 96%, 56%)",
  "hsl(0, 84%, 71%)",
];

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "hsl(212, 30%, 14%)",
    border: "1px solid hsl(208, 30%, 18%)",
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: "hsl(210, 20%, 98%)" },
};

const DistrictAdminAnalytics = () => {
  const currentDistrict = getCurrentDistrict();
  const { data, isLoading, error, refetch } = useGetCasesQuery({ page: 0, size: 100 });

  const districtCases = useMemo(() => {
    const items = (data?.data?.content ?? []) as BackendCase[];
    return scopeCasesToDistrict(mapBackendCasesToDistrictRows(items), currentDistrict);
  }, [currentDistrict, data]);

  const casesByType = useMemo(
    () => Object.entries(
      districtCases.reduce<Record<string, number>>((acc, item) => {
        acc[item.type] = (acc[item.type] ?? 0) + 1;
        return acc;
      }, {}),
    )
      .map(([type, count]) => ({ type, count }))
      .sort((left, right) => right.count - left.count),
    [districtCases],
  );

  const statusDistribution = useMemo(() => {
    const counts = districtCases.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {});

    return ["Active", "Resolved", "Pending", "Critical"]
      .filter((name) => counts[name] !== undefined)
      .map((name) => ({ name, value: counts[name] ?? 0 }));
  }, [districtCases]);

  const monthlyTrend = useMemo(
    () => Array.from({ length: 6 }, (_, index) => {
      const offset = 5 - index;
      const monthDate = new Date(new Date().getFullYear(), new Date().getMonth() - offset, 1);
      const month = monthDate.getMonth();
      const year = monthDate.getFullYear();

      const casesForMonth = districtCases.filter((item) => {
        if (!item.createdAt) return false;
        const date = new Date(item.createdAt);
        return date.getMonth() === month && date.getFullYear() === year;
      });

      return {
        month: getMonthLabel(offset),
        gbv: casesForMonth.filter((item) => !item.isChildCase).length,
        child: casesForMonth.filter((item) => item.isChildCase).length,
      };
    }),
    [districtCases],
  );

  const resolutionRate = districtCases.length > 0
    ? Math.round((districtCases.filter((item) => item.status === "Resolved").length / districtCases.length) * 100)
    : 0;
  const childCases = districtCases.filter((item) => item.isChildCase).length;
  const averageDaysOpen = districtCases.length > 0
    ? Math.round(districtCases.reduce((sum, item) => sum + getDaysOpen(item.createdAt), 0) / districtCases.length)
    : 0;

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
              Analytics
            </h2>
            <p className="text-sm text-muted-foreground">
              {currentDistrict || "District"} case trends and outcomes
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "TOTAL CASES", value: districtCases.length, color: "text-foreground" },
              { label: "RESOLUTION RATE", value: `${resolutionRate}%`, color: "text-success" },
              { label: "CHILD CASES", value: childCases, color: "text-warning" },
              { label: "AVERAGE DAYS OPEN", value: averageDaysOpen, color: "text-info" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-2">{item.label}</p>
                <p className={`text-2xl font-bold font-heading ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
              Loading analytics...
            </div>
          ) : error ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center space-y-3">
              <p className="text-sm font-medium text-foreground">Unable to load analytics</p>
              <button
                onClick={() => void refetch()}
                className="h-8 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-base font-semibold text-foreground">
                      Cases by Type
                    </h3>
                    <span className="label-text">CURRENT DISTRICT VIEW</span>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={casesByType} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(208, 30%, 18%)" vertical={false} />
                      <XAxis dataKey="type" tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Bar dataKey="count" name="Cases" fill="hsl(280, 65%, 50%)" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-xl p-5">
                  <h3 className="font-heading text-sm font-semibold text-foreground mb-4">
                    Case Status Distribution
                  </h3>
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={72}
                          dataKey="value"
                          paddingAngle={3}
                        >
                          {statusDistribution.map((_, index) => (
                            <Cell key={index} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip {...TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-[10px] text-muted-foreground">Total</p>
                      <p className="text-base font-bold font-heading text-foreground">{districtCases.length}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {statusDistribution.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[index % STATUS_COLORS.length] }} />
                        <span className="text-[10px] text-muted-foreground flex-1">{item.name}</span>
                        <span className="text-[10px] font-medium text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    Monthly Case Trend
                  </h3>
                  <span className="label-text">LAST 6 MONTHS</span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={monthlyTrend}>
                    <defs>
                      <linearGradient id="districtGbvGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(213, 94%, 68%)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="hsl(213, 94%, 68%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="districtChildGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 69%, 58%)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="hsl(142, 69%, 58%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(208, 30%, 18%)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "hsl(213, 18%, 62%)" }} />
                    <Area type="monotone" dataKey="gbv" name="GBV Cases" stroke="hsl(213, 94%, 68%)" strokeWidth={2} fill="url(#districtGbvGrad)" />
                    <Area type="monotone" dataKey="child" name="Child Cases" stroke="hsl(142, 69%, 58%)" strokeWidth={2} fill="url(#districtChildGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default DistrictAdminAnalytics;

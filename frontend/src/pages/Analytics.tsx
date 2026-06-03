import { useMemo } from "react";
import { BarChart3, LineChart as LineChartIcon, MapPinned, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import {
  useGetCasesByDistrictAnalyticsQuery,
  useGetResolutionRateAnalyticsQuery,
  useGetTrendsAnalyticsQuery,
} from "@/store/api";

interface NamedValue {
  name: string;
  value: number;
}

function mapRecordToChartData(record: Record<string, unknown> | undefined): NamedValue[] {
  if (!record) {
    return [];
  }

  return Object.entries(record)
    .map(([name, value]) => ({
      name,
      value: Number(value) || 0,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }));
}

const Analytics = () => {
  const districtQuery = useGetCasesByDistrictAnalyticsQuery();
  const trendQuery = useGetTrendsAnalyticsQuery();
  const resolutionQuery = useGetResolutionRateAnalyticsQuery();

  const districtData = useMemo(
    () => mapRecordToChartData(districtQuery.data?.data?.data?.casesByDistrict as Record<string, unknown> | undefined),
    [districtQuery.data],
  );
  const trendData = useMemo(
    () => mapRecordToChartData(trendQuery.data?.data?.data?.trends as Record<string, unknown> | undefined),
    [trendQuery.data],
  );

  const resolutionRate = Number(resolutionQuery.data?.data?.data?.resolutionRate ?? 0);
  const totalCases = districtData.reduce((sum, item) => sum + item.value, 0);
  const busiestDistrict = districtData[0]
    ? [...districtData].sort((left, right) => right.value - left.value)[0]
    : null;

  const isLoading = districtQuery.isLoading || trendQuery.isLoading || resolutionQuery.isLoading;
  const hasError = districtQuery.error || trendQuery.error || resolutionQuery.error;

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
              Reports and Trends
            </h2>
            <p className="text-sm text-muted-foreground">
              Review case distribution, trends, and resolution progress.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "TOTAL CASES", value: totalCases, Icon: BarChart3, color: "text-primary" },
              { label: "DISTRICTS", value: districtData.length, Icon: MapPinned, color: "text-info" },
              { label: "RESOLUTION RATE", value: `${Math.round(resolutionRate * 100)}%`, Icon: TrendingUp, color: "text-success" },
              { label: "TREND POINTS", value: trendData.length, Icon: LineChartIcon, color: "text-warning" },
            ].map(({ label, value, Icon, color }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="label-text">{label}</p>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className={`text-2xl font-heading font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
              Loading analytics...
            </div>
          ) : hasError ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <p className="text-sm font-medium text-foreground">Unable to load analytics</p>
              <p className="text-xs text-muted-foreground mt-1">
                One or more analytics requests failed. Please try again in a moment.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="mb-4">
                    <h3 className="font-heading text-base font-semibold text-foreground">
                      Cases by District
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Aggregated from saved case records
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={districtData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(208, 30%, 18%)" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(14, 74%, 52%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="mb-4">
                    <h3 className="font-heading text-base font-semibold text-foreground">
                      Case Trend by Year
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Derived from case creation timestamps
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(208, 30%, 18%)" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="hsl(213, 94%, 68%)" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-heading text-base font-semibold text-foreground mb-3">
                  Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-secondary border border-border rounded-xl p-4">
                    <p className="label-text mb-2">RESOLUTION RATE</p>
                    <p className="text-2xl font-heading font-bold text-success">
                      {Math.round(resolutionRate * 100)}%
                    </p>
                  </div>
                  <div className="bg-secondary border border-border rounded-xl p-4">
                    <p className="label-text mb-2">TOP DISTRICT</p>
                    <p className="text-2xl font-heading font-bold text-primary">
                      {busiestDistrict?.name ?? "N/A"}
                    </p>
                  </div>
                  <div className="bg-secondary border border-border rounded-xl p-4">
                    <p className="label-text mb-2">CASES IN TOP DISTRICT</p>
                    <p className="text-2xl font-heading font-bold text-warning">
                      {busiestDistrict?.value ?? 0}
                    </p>
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

export default Analytics;

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
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Sparkles } from "lucide-react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { PoliceSidebar } from "@/apps/police/components/PoliceSidebar";
import { getPoliceOfficerMeta, usePolicePortalData } from "@/apps/police/lib/usePolicePortalData";

const CHART_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 69%, 58%)",
  "hsl(43, 96%, 56%)",
  "hsl(0, 84%, 71%)",
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

const PoliceAnalytics = () => {
  const {
    currentUser,
    districtCases,
    monthlyVolume,
    typeDistribution,
    resolutionTrend,
    officerPerformance,
    districtResolutionRate,
    averageDaysToResolve,
  } = usePolicePortalData();

  const mostCommonType = typeDistribution.reduce(
    (max, item) => (item.value > max.value ? item : max),
    { name: "No data", value: 0 },
  );

  return (
    <div className="flex min-h-screen w-full">
      <PoliceSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Analytics</h2>
            <p className="text-sm text-muted-foreground">{getPoliceOfficerMeta(currentUser)}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <p className="label-text mb-3">DISTRICT SUMMARY</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Cases", value: districtCases.length, color: "text-foreground" },
                { label: "Resolution Rate", value: `${districtResolutionRate}%`, color: "text-success" },
                { label: "Avg Days to Resolve", value: averageDaysToResolve || 0, color: "text-info" },
                { label: "Most Common", value: mostCommonType.name, color: "text-warning" },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold">{item.label}</p>
                  <p className={`text-lg font-bold font-heading ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary border border-border mb-4">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground flex-1">
                  This summary reflects current case activity for your district.
                </p>
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-base font-semibold text-foreground">Monthly Case Volume</h3>
                <span className="label-text">LAST 6 MONTHS</span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyVolume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(208, 30%, 18%)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "hsl(213, 18%, 62%)" }} />
                  <Bar dataKey="gbv" name="GBV Cases" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar dataKey="child" name="Child Abuse" fill="hsl(142, 69%, 58%)" radius={[4, 4, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-base font-semibold text-foreground">Case Type Distribution</h3>
              </div>
              <div className="relative">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {typeDistribution.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE.contentStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] text-muted-foreground">Most Common</p>
                  <p className="text-xs font-semibold text-foreground text-center leading-tight max-w-[90px]">{mostCommonType.name}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base font-semibold text-foreground">Resolution Rate Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={resolutionTrend}>
                <defs>
                  <linearGradient id="blueGradPolice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(208, 30%, 18%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE.contentStyle}
                  formatter={(value: number) => [`${value}%`, "Resolution Rate"]}
                />
                <ReferenceLine y={80} stroke="hsl(43, 96%, 56%)" strokeDasharray="6 3" strokeWidth={1.5} />
                <Area type="monotone" dataKey="rate" stroke="hsl(217, 91%, 60%)" strokeWidth={2} fill="url(#blueGradPolice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base font-semibold text-foreground">Officer Performance</h3>
              <span className="label-text">DISTRICT COMPARISON</span>
            </div>
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-12 lg:col-span-8">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={officerPerformance} barGap={6} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(208, 30%, 18%)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="label" type="category" width={120} tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "hsl(213, 18%, 62%)" }} />
                    <Bar dataKey="assigned" name="Cases Assigned" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} barSize={14} />
                    <Bar dataKey="resolved" name="Cases Resolved" fill="hsl(142, 69%, 58%)" radius={[0, 4, 4, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="col-span-12 lg:col-span-4 space-y-4">
                <div className="p-4 rounded-lg bg-secondary border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold mb-1">District</p>
                  <p className="text-2xl font-bold font-heading text-info">{currentUser?.district || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Officer-scoped analytics</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    The charts above are based on current cases in your district and assignments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PoliceAnalytics;

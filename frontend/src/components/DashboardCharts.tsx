import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Sparkles, Settings } from "lucide-react";

const monthlyData = [
  { month: "Jul", gbv: 65, child: 40 },
  { month: "Aug", gbv: 78, child: 52 },
  { month: "Sep", gbv: 90, child: 45 },
  { month: "Oct", gbv: 85, child: 58 },
  { month: "Nov", gbv: 110, child: 62 },
  { month: "Dec", gbv: 95, child: 48 },
  { month: "Jan", gbv: 102, child: 55 },
  { month: "Feb", gbv: 120, child: 68 },
  { month: "Mar", gbv: 135, child: 72 },
];

const statusData = [
  { status: "Critical", count: 66, color: "hsl(0, 84%, 71%)" },
  { status: "Pending", count: 124, color: "hsl(43, 96%, 56%)" },
  { status: "In Progress", count: 152, color: "hsl(213, 94%, 68%)" },
  { status: "Resolved", count: 876, color: "hsl(142, 69%, 58%)" },
];

export function CaseVolumeChart() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 col-span-8">
      <h3 className="font-heading text-base font-semibold text-foreground mb-4">Monthly Case Volume</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={monthlyData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(208, 30%, 18%)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(212, 30%, 14%)",
              border: "1px solid hsl(208, 30%, 18%)",
              borderRadius: "8px",
              fontSize: 12,
            }}
            labelStyle={{ color: "hsl(210, 20%, 98%)" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "hsl(213, 18%, 62%)" }}
          />
          <Bar dataKey="gbv" name="GBV Cases" fill="hsl(14, 74%, 52%)" radius={[4, 4, 0, 0]} barSize={16} />
          <Bar dataKey="child" name="Child Abuse" fill="hsl(213, 94%, 68%)" radius={[4, 4, 0, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusBreakdownChart() {
  const maxCount = Math.max(...statusData.map(d => d.count));

  return (
    <div className="bg-card border border-border rounded-xl p-5 col-span-4">
      <h3 className="font-heading text-base font-semibold text-foreground mb-3">Case Status Breakdown</h3>

      {/* AI Insight */}
      <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary border border-border-subtle mb-4">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground flex-1">
          Reported cases up 18% this quarter — peak in Kigali district.
        </p>
        <Settings className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      </div>

      {/* Bars */}
      <div className="space-y-3">
        {statusData.map((item) => (
          <div key={item.status}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{item.status}</span>
              <span className="text-xs font-semibold text-foreground">{item.count}</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  trend: number;
  trendLabel: string;
  sparkData: number[];
  colorClass: "primary" | "info" | "success" | "destructive";
}

const colorMap = {
  primary: "bg-primary",
  info: "bg-info",
  success: "bg-success",
  destructive: "bg-destructive",
};

const trendColorMap = {
  up: "text-success",
  down: "text-destructive",
};

export function MetricCard({ title, value, trend, trendLabel, sparkData, colorClass }: MetricCardProps) {
  const isPositive = trend >= 0;
  // For "Critical Cases", trending up is bad
  const trendColor = colorClass === "destructive"
    ? (isPositive ? trendColorMap.down : trendColorMap.up)
    : (isPositive ? trendColorMap.up : trendColorMap.down);

  return (
    <div className="bg-card border border-border rounded-xl p-4 transition-colors duration-200 hover:border-border-subtle">
      <p className="label-text mb-3">{title}</p>
      <div className="flex items-end justify-between mb-3">
        <span className="text-[26px] font-bold text-foreground font-heading">{value}</span>
        <div className="flex items-end gap-[2px] h-10">
          {sparkData.map((h, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-sm ${colorMap[colorClass]} transition-all duration-200`}
              style={{
                height: `${h}%`,
                opacity: i < 2 ? 0.4 : 1,
              }}
            />
          ))}
        </div>
      </div>
      <div className="border-t border-border pt-2.5 flex items-center gap-1.5">
        {isPositive ? (
          <TrendingUp className={`w-3 h-3 ${trendColor}`} />
        ) : (
          <TrendingDown className={`w-3 h-3 ${trendColor}`} />
        )}
        <span className={`text-xs font-medium ${trendColor}`}>
          {isPositive ? "+" : ""}{trend}%
        </span>
        <span className="text-xs text-muted-foreground">{trendLabel}</span>
      </div>
    </div>
  );
}

export function MetricsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <MetricCard
        title="Total Cases Reported"
        value="1,284"
        trend={12}
        trendLabel="from last month"
        sparkData={[45, 60, 35, 80, 95]}
        colorClass="primary"
      />
      <MetricCard
        title="Active Cases"
        value="342"
        trend={-5}
        trendLabel="from last month"
        sparkData={[70, 55, 80, 60, 45]}
        colorClass="info"
      />
      <MetricCard
        title="Resolved Cases"
        value="876"
        trend={18}
        trendLabel="from last month"
        sparkData={[30, 50, 65, 75, 90]}
        colorClass="success"
      />
      <MetricCard
        title="Critical / Urgent Cases"
        value="66"
        trend={8}
        trendLabel="from last month"
        sparkData={[50, 40, 70, 85, 95]}
        colorClass="destructive"
      />
    </div>
  );
}

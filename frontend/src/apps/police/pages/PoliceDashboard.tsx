import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardHeader } from "@/components/DashboardHeader";
import { PoliceSidebar } from "@/apps/police/components/PoliceSidebar";
import {
  formatPoliceDate,
  getPoliceOfficerMeta,
  getPoliceOfficerName,
  usePolicePortalData,
} from "@/apps/police/lib/usePolicePortalData";

const PoliceDashboard = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    assignedSummary,
    districtCases,
    casesByDistrict,
    recentActivity,
    isLoading,
  } = usePolicePortalData();

  const anonymousCases = useMemo(
    () => assignedSummary.filter((item) => item.reportType === "Anonymous" || (item.type ?? "").toUpperCase() === "ANON"),
    [assignedSummary],
  );

  const kpis = useMemo(() => ([
    {
      label: "MY ACTIVE CASES",
      value: assignedSummary.filter((item) => item.uiStatus !== "Resolved").length,
      sub: "Assigned to you",
      color: "text-info",
      bg: "bg-info/10 border-info/20",
    },
    {
      label: "OVERDUE CASES",
      value: assignedSummary.filter((item) => item.uiStatus === "Overdue").length,
      sub: "Past deadline",
      color: "text-destructive",
      bg: "bg-destructive/10 border-destructive/20",
    },
    {
      label: "UPDATED TODAY",
      value: recentActivity.filter((item) => {
        if (!item.eventAt) return false;
        return new Date(item.eventAt).toDateString() === new Date().toDateString();
      }).length,
      sub: "Assigned-case activity",
      color: "text-success",
      bg: "bg-success/10 border-success/20",
    },
    {
      label: "DISTRICT CASES",
      value: districtCases.length,
      sub: currentUser?.district || "Officer district",
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
  ]), [assignedSummary, currentUser?.district, districtCases.length, recentActivity]);

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <PoliceSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Officer Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              {getPoliceOfficerName(currentUser)} | {getPoliceOfficerMeta(currentUser)}
            </p>
          </div>

          {anonymousCases.length > 0 && (
            <div
              className="bg-primary/10 border border-primary/25 rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:bg-primary/15 transition-colors duration-200"
              onClick={() => navigate("/police/cases")}
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Anonymous Reporter Conversation{anonymousCases.length > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {anonymousCases.length} anonymous case{anonymousCases.length > 1 ? "s" : ""} in your queue —
                  {" "}{anonymousCases.map((c) => c.caseId).join(", ")}. Open a case to view the reporter chat.
                </p>
              </div>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
                {anonymousCases.length}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((item) => (
              <div key={item.label} className={`bg-card border rounded-xl p-4 ${item.bg}`}>
                <p className="label-text mb-2">{item.label}</p>
                <p className={`text-2xl font-bold font-heading ${item.color}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <p className="label-text">PRIORITY CASE QUEUE</p>
              <span className="text-[10px] text-muted-foreground">
                Assigned cases {currentUser?.district ? `| ${currentUser.district}` : ""}
              </span>
            </div>
            {isLoading ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">Loading assigned case queue...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["Case ID", "Victim", "Type", "Days Open", "Priority", "Status"].map((header) => (
                        <th key={header} className="label-text text-left px-4 py-2.5">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {assignedSummary.slice(0, 8).map((item) => (
                      <tr key={item.id} className="hover:bg-secondary/40 transition-colors duration-150">
                        <td className="px-4 py-2.5 font-mono text-foreground">{item.caseId}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.victim?.name || "Unknown victim"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.type}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.daysOpen}d</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-secondary text-foreground">
                            {item.priority}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/15 text-primary">
                            {item.uiStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {assignedSummary.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                          No assigned cases found for the signed-in officer.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-base font-semibold text-foreground">Cases by District</h3>
                <span className="label-text">CURRENT TOTALS</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={casesByDistrict}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(208, 30%, 18%)" vertical={false} />
                  <XAxis dataKey="district" tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(213, 18%, 62%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(212, 30%, 14%)", border: "1px solid hsl(208, 30%, 18%)", borderRadius: "8px", fontSize: 12 }}
                    labelStyle={{ color: "hsl(210, 20%, 98%)" }}
                  />
                  <Bar dataKey="cases" name="Cases" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="label-text">RECENT ACTIVITY</p>
              </div>
              <div className="divide-y divide-border">
                {recentActivity.length ? recentActivity.map((item, index) => {
                  const Icon = index % 3 === 0 ? RefreshCw : index % 3 === 1 ? ArrowRight : CheckCircle2;
                  return (
                    <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-3 h-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-foreground leading-snug">
                          {item.description || item.eventType || "Case event"}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{formatPoliceDate(item.eventAt, true)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="px-4 py-8 text-sm text-muted-foreground">No recent timeline events found.</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Officer summary</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This dashboard reflects your assigned cases, recent activity, and district case totals.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PoliceDashboard;

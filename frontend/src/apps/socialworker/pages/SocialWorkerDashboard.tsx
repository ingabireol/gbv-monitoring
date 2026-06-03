import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Briefcase,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/auth";
import { SocialWorkerSidebar } from "@/apps/socialworker/components/SocialWorkerSidebar";
import {
  BackendCase,
  SocialWorkerPriority,
  SocialWorkerStatus,
  getScopedDistrictCases,
  mapBackendCasesToRows,
} from "@/apps/socialworker/lib/socialWorkerData";
import { DashboardHeader } from "@/components/DashboardHeader";
import {
  useGetAllReferralsQuery,
  useGetCasesQuery,
  useUpdateCaseStatusMutation,
} from "@/store/api";
import {
  BackendReferral,
  formatDbDate,
  formatReferralStatus,
  getReferralStatusClass,
} from "@/lib/referralDb";

const priorityCls: Record<SocialWorkerPriority, string> = {
  Critical: "bg-destructive/15 text-destructive",
  High: "bg-warning/15 text-warning",
  Medium: "bg-info/15 text-info",
  Low: "bg-secondary text-muted-foreground",
};

const statusCls: Record<SocialWorkerStatus, string> = {
  Accepted: "bg-success/15 text-success",
  Rejected: "bg-destructive/15 text-destructive",
  Active: "bg-success/15 text-success",
  Pending: "bg-warning/15 text-warning",
  Overdue: "bg-destructive/15 text-destructive",
  Resolved: "bg-secondary text-muted-foreground",
};

function isSameDay(value?: string): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isCurrentMonth(value?: string): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

const SocialWorkerDashboard = () => {
  const currentUser = getCurrentUser();
  const { data: casesData, isLoading: isLoadingCases, error: casesError, refetch: refetchCases } = useGetCasesQuery({ page: 0, size: 100 });
  const { data: referralsData, isLoading: isLoadingReferrals, error: referralsError, refetch: refetchReferrals } = useGetAllReferralsQuery({});
  const [updateCaseStatus, { isLoading: isUpdatingStatus }] = useUpdateCaseStatusMutation();

  const cases = useMemo(() => {
    const items = (casesData?.data?.content ?? []) as BackendCase[];
    return getScopedDistrictCases(mapBackendCasesToRows(items));
  }, [casesData]);

  const referrals = useMemo(() => {
    const items = (referralsData?.data?.content ?? []) as BackendReferral[];
    const scoped = items.filter((item) => {
      if (currentUser?.name && item.referredBy === currentUser.name) return true;
      if (currentUser?.username && item.referredBy === currentUser.username) return true;
      return false;
    });
    return scoped.length > 0 ? scoped : items;
  }, [currentUser?.name, currentUser?.username, referralsData]);

  const urgentCases = useMemo(
    () => [...cases]
      .filter((item) => item.status !== "Resolved")
      .sort((left, right) => {
        const priorityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return priorityWeight[right.priority] - priorityWeight[left.priority] || right.daysOpen - left.daysOpen;
      })
      .slice(0, 5),
    [cases],
  );

  const recentReferrals = useMemo(
    () => [...referrals]
      .sort((left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime())
      .slice(0, 5),
    [referrals],
  );

  const activeCases = cases.filter((item) => item.status !== "Resolved").length;
  const newCasesToday = cases.filter((item) => isSameDay(item.createdAt)).length;
  const pendingReferrals = referrals.filter((item) => !["COMPLETED", "CANNOT_ASSIST"].includes((item.status ?? "").toUpperCase())).length;
  const resolvedThisMonth = cases.filter((item) => item.status === "Resolved" && isCurrentMonth(item.updatedAt)).length;

  const leadingType = useMemo(() => {
    const counts = new Map<string, number>();
    cases.forEach((item) => {
      counts.set(item.type, (counts.get(item.type) ?? 0) + 1);
    });
    return [...counts.entries()].sort((left, right) => right[1] - left[1])[0] ?? null;
  }, [cases]);

  const districtLabel = currentUser?.district || (cases[0]?.district !== "Unknown district" ? cases[0]?.district : "All districts");
  const hasError = Boolean(casesError || referralsError);
  const isLoading = isLoadingCases || isLoadingReferrals;

  const handleStatusChange = async (caseUuid: string, status: "IN_PROGRESS" | "RESOLVED") => {
    try {
      await updateCaseStatus({ id: caseUuid, status }).unwrap();
      toast.success(status === "RESOLVED" ? "Case resolved" : "Case marked active");
      await refetchCases();
    } catch {
      toast.error("Unable to update case status");
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <SocialWorkerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-0.5">
                Welcome, {currentUser?.name || currentUser?.username || "Social Worker"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Case overview for {districtLabel}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-muted-foreground">{currentUser?.username || "session-user"}</p>
              <p className="text-[10px] text-muted-foreground">{currentUser?.district || "District not set"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "ACTIVE CASES", value: activeCases, sub: "Open case records", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
              { label: "NEW TODAY", value: newCasesToday, sub: "Opened today", color: "text-info", bg: "bg-info/10 border-info/20" },
              { label: "PENDING REFERRALS", value: pendingReferrals, sub: "Awaiting response", color: "text-warning", bg: "bg-warning/10 border-warning/20" },
              { label: "RESOLVED THIS MONTH", value: resolvedThisMonth, sub: "Closed this month", color: "text-success", bg: "bg-success/10 border-success/20" },
            ].map((item) => (
              <div key={item.label} className={`bg-card border rounded-xl p-4 ${item.bg}`}>
                <p className="label-text mb-2">{item.label}</p>
                <p className={`text-2xl font-bold font-heading ${item.color}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary border border-border">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground flex-1">
              {leadingType
                ? `${leadingType[0]} is currently the most common case type, with ${leadingType[1]} case(s).`
                : "No case records are available yet for a trend insight."}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <p className="label-text">URGENT CASES</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Sorted by case age and status</span>
                <button
                  onClick={() => void refetchCases()}
                  className="h-7 px-2 rounded-lg bg-secondary border border-border text-[10px] text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>
            {isLoading ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">Loading dashboard data...</div>
            ) : hasError ? (
              <div className="px-4 py-10 text-center space-y-3">
                <p className="text-sm font-medium text-foreground">Unable to load dashboard data</p>
                <button
                  onClick={() => {
                    void refetchCases();
                    void refetchReferrals();
                  }}
                  className="h-8 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground"
                >
                  Retry
                </button>
              </div>
            ) : urgentCases.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">No cases require urgent attention right now.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["Case ID", "Victim", "Type", "Days Open", "Priority", "Status", "Actions"].map((header) => (
                        <th key={header} className="label-text text-left px-4 py-2.5">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {urgentCases.map((item) => (
                      <tr key={item.uuid} className="hover:bg-secondary/40 transition-colors duration-150">
                        <td className="px-4 py-2.5 font-mono text-foreground">{item.id}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.victimName}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.type}</td>
                        <td className="px-4 py-2.5">
                          <span className={`font-medium ${item.daysOpen > 14 ? "text-destructive" : item.daysOpen > 7 ? "text-warning" : "text-success"}`}>
                            {item.daysOpen}d
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${priorityCls[item.priority]}`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusCls[item.status]}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <button
                              disabled={isUpdatingStatus || item.status === "Active" || item.status === "Resolved"}
                              onClick={() => void handleStatusChange(item.uuid, "IN_PROGRESS")}
                              className="h-6 px-2 rounded bg-info/15 text-info text-[10px] font-medium hover:bg-info/25 disabled:opacity-40"
                            >
                              {item.status === "Active" ? "Active" : "Mark Active"}
                            </button>
                            <button
                              disabled={isUpdatingStatus || item.status === "Resolved"}
                              onClick={() => void handleStatusChange(item.uuid, "RESOLVED")}
                              className="h-6 px-2 rounded bg-success/15 text-success text-[10px] font-medium hover:bg-success/25 disabled:opacity-40"
                            >
                              {item.status === "Resolved" ? "Resolved" : "Resolve"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3">
              <p className="label-text">RECENT REFERRALS</p>
              <span className="text-[10px] text-muted-foreground">Most recent referrals</span>
            </div>
            {isLoading ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">Loading referrals...</div>
            ) : recentReferrals.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">No referrals found yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["Case ID", "Institution", "Date", "Status", "Urgency"].map((header) => (
                        <th key={header} className="label-text text-left px-4 py-2.5">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentReferrals.map((item) => (
                      <tr key={item.id} className="hover:bg-secondary/40 transition-colors duration-150">
                        <td className="px-4 py-2.5 font-mono text-foreground">{item.caseId || item.caseUuid || item.id}</td>
                        <td className="px-4 py-2.5 text-foreground">{item.referredTo || "Unknown institution"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{formatDbDate(item.createdAt)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getReferralStatusClass(item.status)}`}>
                            {formatReferralStatus(item.status)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${(item.urgency ?? "").toUpperCase() === "URGENT" ? "bg-destructive/15 text-destructive" : "bg-secondary text-muted-foreground"}`}>
                            {(item.urgency ?? "NORMAL").toLowerCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <p className="label-text">CASELOAD OVERVIEW</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {cases.length} case(s) are currently available in this dashboard view.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRightLeft className="w-4 h-4 text-warning" />
                <p className="label-text">REFERRAL PIPELINE</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {pendingReferrals} referral(s) are still waiting for partner progress or closure.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <p className="label-text">FOLLOW-UP SIGNAL</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {urgentCases.length} high-priority case(s) are currently at the top of the attention queue.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SocialWorkerDashboard;

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Search,
  User,
  Users,
  X,
} from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { getCurrentUser } from "@/lib/auth";
import { useAssignOfficerMutation, useGetCasesQuery, useGetCurrentProfileQuery, useGetUsersQuery } from "@/store/api";
import { toast } from "sonner";

interface BackendCase {
  id: string;
  caseId: string;
  type: string;
  status?: string;
  victim?: {
    name?: string;
    address?: string;
  };
  assignedOfficer?: {
    id?: string;
  } | null;
  createdAt?: string;
  victimDistrict?: string | null;
}

interface BackendUser {
  id: string;
  displayName?: string;
  username?: string;
  district?: string;
  enabled?: boolean;
}

interface UnassignedCaseRow {
  id: string;
  uuid: string;
  victim: string;
  type: string;
  district: string;
  submittedAt: string;
  daysOpen: number;
  recommendedOfficerId?: string;
}

interface OfficerRow {
  id: string;
  name: string;
  district: string;
  activeCases: number;
}

function getDaysOpen(createdAt?: string): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return 0;
  return Math.max(0, Math.ceil((Date.now() - created) / (1000 * 60 * 60 * 24)));
}

function formatSubmittedAt(value?: string): string {
  if (!value) return "Unknown submission time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-RW", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveCaseDistrict(item: BackendCase): string {
  return item.victim?.address || item.victimDistrict || "Unknown district";
}

function normalizeDistrict(value?: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function isActiveCase(item: BackendCase): boolean {
  const status = (item.status ?? "").trim().toUpperCase();
  return !["RESOLVED", "CLOSED", "REJECTED", "WITHDRAWN"].includes(status);
}

const CaseAssignments = () => {
  const currentUser = getCurrentUser();
  const { data: profileData } = useGetCurrentProfileQuery(undefined, { skip: !currentUser });
  const profile = profileData?.data;
  const isDistrictAdmin = currentUser?.role === "districtadmin" || profile?.role === "DISTRICT_ADMIN";
  const currentDistrict = profile?.district || currentUser?.district || "";
  const [search, setSearch] = useState("");
  const [assignTarget, setAssignTarget] = useState<UnassignedCaseRow | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const { data: casesData, isLoading: isLoadingCases, error: casesError, refetch: refetchCases } = useGetCasesQuery({ page: 0, size: 100 });
  const { data: usersData, isLoading: isLoadingUsers, error: usersError, refetch: refetchUsers } = useGetUsersQuery({ role: "POLICE", enabled: true });
  const [assignOfficer, { isLoading: isAssigning }] = useAssignOfficerMutation();

  const cases = (casesData?.data?.content ?? []) as BackendCase[];
  const officers = (usersData?.data ?? []) as BackendUser[];

  const scopedCases = useMemo(() => {
    if (!isDistrictAdmin || !currentDistrict) {
      return cases;
    }

    const normalizedDistrict = normalizeDistrict(currentDistrict);
    return cases.filter((item) => normalizeDistrict(resolveCaseDistrict(item)) === normalizedDistrict);
  }, [cases, currentDistrict, isDistrictAdmin]);

  const officerRoster = useMemo<OfficerRow[]>(() => {
    return officers
      .filter((officer) => officer.enabled === true)
      .filter((officer) => normalizeDistrict(officer.district))
      .filter((officer) => !isDistrictAdmin || normalizeDistrict(officer.district) === normalizeDistrict(currentDistrict))
      .map((officer) => {
        const activeCases = scopedCases.filter((item) => item.assignedOfficer?.id === officer.id && isActiveCase(item)).length;
        return {
          id: officer.id,
          name: officer.displayName || officer.username || "Officer",
          district: officer.district || "Unspecified district",
          activeCases,
        };
      });
  }, [scopedCases, currentDistrict, isDistrictAdmin, officers]);

  const getEligibleOfficers = (district: string) => {
    const normalizedDistrict = normalizeDistrict(district);
    return officerRoster
      .filter((officer) => normalizeDistrict(officer.district) === normalizedDistrict)
      .sort((left, right) => left.activeCases - right.activeCases || left.name.localeCompare(right.name));
  };

  const getRecommendedOfficer = (district: string) => getEligibleOfficers(district)[0];

  const unassignedCases = useMemo<UnassignedCaseRow[]>(() => {
    const query = search.trim().toLowerCase();
    return scopedCases
      .filter((item) => !item.assignedOfficer?.id)
      .map((item) => {
        const district = resolveCaseDistrict(item);
        return {
          id: item.caseId || item.id,
          uuid: item.id,
          victim: item.victim?.name || "Unknown victim",
          type: item.type || "Unknown type",
          district,
          submittedAt: formatSubmittedAt(item.createdAt),
          daysOpen: getDaysOpen(item.createdAt),
          recommendedOfficerId: getRecommendedOfficer(district)?.id,
        };
      })
      .filter((item) => !query
        || item.id.toLowerCase().includes(query)
        || item.type.toLowerCase().includes(query)
        || item.district.toLowerCase().includes(query)
        || item.victim.toLowerCase().includes(query));
  }, [scopedCases, officerRoster, search]);

  const stats = {
    unassigned: unassignedCases.length,
    totalOfficers: officerRoster.length,
    avgCases: officerRoster.length
      ? Math.round(officerRoster.reduce((sum, item) => sum + item.activeCases, 0) / officerRoster.length)
      : 0,
    overdue: unassignedCases.filter((item) => item.daysOpen >= 3).length,
  };

  const handleAssign = async (target: UnassignedCaseRow | null = assignTarget, officerId: string | undefined = selectedOfficer) => {
    if (!target || !officerId) return;

    try {
      await assignOfficer({ id: target.uuid, officerId }).unwrap();
      toast.success(`Assigned ${target.id} successfully. The officer has been notified.`);
      setAssignTarget(null);
      setSelectedOfficer("");
      await refetchCases();
      await refetchUsers();
    } catch {
      toast.error("Unable to assign officer");
    }
  };

  const isLoading = isLoadingCases || isLoadingUsers;
  const hasError = Boolean(casesError || usersError);

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Case Assignments</h2>
            <p className="text-sm text-muted-foreground">
              {isDistrictAdmin
                ? `Automatically assign ${currentDistrict || "district"} cases to active officers in the same district.`
                : "Automatically assign open cases to active officers in the same district."}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "UNASSIGNED CASES", value: stats.unassigned, color: "text-destructive", Icon: AlertTriangle },
              { label: "TOTAL OFFICERS", value: stats.totalOfficers, color: "text-primary", Icon: Users },
              { label: "AVG CASES/OFFICER", value: stats.avgCases, color: "text-info", Icon: BarChart2 },
              { label: "OVERDUE (3+ DAYS)", value: stats.overdue, color: "text-warning", Icon: Clock },
            ].map(({ label, value, color, Icon }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="label-text">{label}</p>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className={`text-2xl font-heading font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-5">
            <div className="flex-1 min-w-0 bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <h3 className="font-heading text-sm font-semibold text-foreground">Unassigned Cases</h3>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search cases..."
                    className="h-8 w-[180px] pl-8 pr-3 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Loading assignment queue...</div>
              ) : hasError ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-sm text-foreground">Unable to load assignment data.</p>
                  <button
                    onClick={() => {
                      void refetchCases();
                      void refetchUsers();
                    }}
                    className="h-8 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {unassignedCases.map((item) => (
                    <div key={item.uuid} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors duration-150">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-medium text-foreground font-heading">{item.id}</p>
                          {item.daysOpen >= 3 && (
                            <span className="text-[10px] text-warning flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {item.daysOpen}d open
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {item.victim} - {item.type} - {item.district}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Submitted: <span className="text-foreground">{item.submittedAt}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {getRecommendedOfficer(item.district)
                            ? `Recommended: ${getRecommendedOfficer(item.district)?.name} (${getRecommendedOfficer(item.district)?.activeCases ?? 0} active cases)`
                            : "No active officer available in this district"}
                        </p>
                      </div>
                      <button
                        disabled={!getRecommendedOfficer(item.district) || isAssigning}
                        onClick={() => {
                          setAssignTarget(item);
                          void handleAssign(item, getRecommendedOfficer(item.district)?.id);
                        }}
                        className="h-7 px-2.5 rounded-lg bg-success/15 border border-success/30 text-success text-xs font-medium hover:bg-success/20 disabled:opacity-50 transition-colors duration-200 shrink-0"
                      >
                        Auto Assign
                      </button>
                      <button
                        onClick={() => {
                          setAssignTarget(item);
                          setSelectedOfficer(getRecommendedOfficer(item.district)?.id || "");
                        }}
                        className="h-7 px-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors duration-200 shrink-0 flex items-center gap-1"
                      >
                        Assign <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {unassignedCases.length === 0 && (
                    <div className="p-8 text-center">
                      <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No unassigned cases match your filters.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="w-full lg:w-[320px] shrink-0 bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 p-4 border-b border-border">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="font-heading text-sm font-semibold text-foreground">Officer Roster</h3>
              </div>
              <div className="divide-y divide-border">
                {officerRoster.map((officer) => {
                  return (
                    <div key={officer.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">{officer.name}</p>
                            <p className="text-[10px] text-muted-foreground">{officer.district}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-foreground">{officer.activeCases}</span>
                          <p className="text-[10px] text-muted-foreground">active cases</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {officerRoster.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No police users are available yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setAssignTarget(null)} />
          <div className="relative z-10 bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base font-semibold text-foreground">Assign Case</h3>
              <button
                onClick={() => setAssignTarget(null)}
                className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-border transition-colors duration-200"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            <div className="bg-secondary rounded-lg p-3 mb-4">
              <p className="text-xs font-medium text-foreground">{assignTarget.id}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {assignTarget.victim} - {assignTarget.type} - {assignTarget.district}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Submitted: <span className="text-foreground">{assignTarget.submittedAt}</span>
              </p>
            </div>

            <label className="label-text mb-1.5 block">Select Active Officer In {assignTarget.district}</label>
            <select
              value={selectedOfficer}
              onChange={(event) => setSelectedOfficer(event.target.value)}
              className="h-10 w-full rounded-lg bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Choose an officer...</option>
              {getEligibleOfficers(assignTarget.district).map((officer) => (
                <option key={officer.id} value={officer.id}>
                  {officer.name} - {officer.district} ({officer.activeCases} active)
                </option>
              ))}
            </select>
            {getEligibleOfficers(assignTarget.district).length === 0 && (
              <p className="text-xs text-destructive mt-2">
                No active police officer is available in {assignTarget.district}. Add or activate a district officer first.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                onClick={() => setAssignTarget(null)}
                className="h-9 rounded-lg bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                disabled={!selectedOfficer || isAssigning}
                onClick={() => void handleAssign()}
                className="h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseAssignments;

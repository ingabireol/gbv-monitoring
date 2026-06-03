import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DistrictData, RwandaMap } from "@/components/RwandaMap";
import {
  BackendCase,
  BackendUser,
  formatDate,
  getCurrentDistrict,
  getDistrictCoordinates,
  mapBackendCasesToDistrictRows,
  scopeCasesToDistrict,
  scopeUsersToDistrict,
} from "@/apps/districtadmin/lib/districtAdminData";
import { BackendReferral } from "@/lib/referralDb";
import {
  useGetAllReferralsQuery,
  useGetCasesByDistrictAnalyticsQuery,
  useGetCasesQuery,
  useGetUsersQuery,
} from "@/store/api";

const statusBadge: Record<string, string> = {
  Critical: "bg-destructive/15 text-destructive",
  Accepted: "bg-success/15 text-success",
  Rejected: "bg-destructive/15 text-destructive",
  "In Progress": "bg-info/15 text-info",
  Active: "bg-info/15 text-info",
  Pending: "bg-warning/15 text-warning",
  Resolved: "bg-success/15 text-success",
};

const DistrictAdminDashboard = () => {
  const currentDistrict = getCurrentDistrict();
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(null);

  const { data: casesData, isLoading: isLoadingCases, error: casesError, refetch: refetchCases } = useGetCasesQuery({ page: 0, size: 100 });
  const { data: referralsData, isLoading: isLoadingReferrals, error: referralsError, refetch: refetchReferrals } = useGetAllReferralsQuery({});
  const { data: policeUsersData } = useGetUsersQuery({ role: "POLICE", enabled: true });
  const { data: socialWorkerUsersData } = useGetUsersQuery({ role: "SOCIAL_WORKER", enabled: true });
  const districtAnalyticsQuery = useGetCasesByDistrictAnalyticsQuery();

  const allCases = useMemo(() => {
    const items = (casesData?.data?.content ?? []) as BackendCase[];
    return mapBackendCasesToDistrictRows(items);
  }, [casesData]);

  const districtCases = useMemo(
    () => scopeCasesToDistrict(allCases, currentDistrict),
    [allCases, currentDistrict],
  );

  const districtCaseIds = useMemo(() => new Set(districtCases.map((item) => item.id)), [districtCases]);
  const districtCaseUuids = useMemo(() => new Set(districtCases.map((item) => item.uuid)), [districtCases]);

  const districtReferrals = useMemo(() => {
    const items = (referralsData?.data?.content ?? []) as BackendReferral[];
    return items.filter((item) => districtCaseIds.has(item.caseId ?? "") || districtCaseUuids.has(item.caseUuid ?? ""));
  }, [districtCaseIds, districtCaseUuids, referralsData]);

  const policeUsers = scopeUsersToDistrict(((policeUsersData?.data ?? []) as BackendUser[]), currentDistrict);
  const socialWorkerUsers = scopeUsersToDistrict(((socialWorkerUsersData?.data ?? []) as BackendUser[]), currentDistrict);
  const staffAccounts = [...policeUsers, ...socialWorkerUsers];

  const recentCases = useMemo(
    () => [...districtCases]
      .sort((left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime())
      .slice(0, 6),
    [districtCases],
  );

  const referralSummary = useMemo(
    () => Object.values(
      districtReferrals.reduce<Record<string, { institution: string; pending: number }>>((acc, item) => {
        const key = item.referredTo || "Unknown institution";
        if (!acc[key]) {
          acc[key] = { institution: key, pending: 0 };
        }
        if (!["COMPLETED", "CANNOT_ASSIST"].includes((item.status ?? "").toUpperCase())) {
          acc[key].pending += 1;
        }
        return acc;
      }, {}),
    ).sort((left, right) => right.pending - left.pending),
    [districtReferrals],
  );

  const districtMapData = useMemo(() => {
    const analyticsRecord = (districtAnalyticsQuery.data?.data?.data?.casesByDistrict as Record<string, unknown> | undefined) ?? {};
    const districtNames = new Set<string>([
      ...Object.keys(analyticsRecord),
      ...allCases.map((item) => item.district).filter(Boolean),
    ]);

    return [...districtNames]
      .map((name) => {
        const coords = getDistrictCoordinates(name);
        if (!coords) return null;
        const districtCasesForMap = allCases.filter((item) => item.district === name);
        return {
          name,
          cases: Number(analyticsRecord[name] ?? districtCasesForMap.length),
          resolved: districtCasesForMap.filter((item) => item.status === "Resolved").length,
          critical: districtCasesForMap.filter((item) => item.status === "Critical").length,
          lat: coords.lat,
          lng: coords.lng,
        } satisfies DistrictData;
      })
      .filter((item): item is DistrictData => Boolean(item))
      .sort((left, right) => (left.name === currentDistrict ? -1 : right.name === currentDistrict ? 1 : right.cases - left.cases));
  }, [allCases, currentDistrict, districtAnalyticsQuery.data]);

  const activeCases = districtCases.filter((item) => item.status !== "Resolved").length;
  const resolvedThisMonth = districtCases.filter((item) => {
    if (item.status !== "Resolved" || !item.updatedAt) return false;
    const date = new Date(item.updatedAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;
  const pendingReferrals = districtReferrals.filter((item) => !["COMPLETED", "CANNOT_ASSIST"].includes((item.status ?? "").toUpperCase())).length;
  const staffCount = staffAccounts.length;

  const leadingType = useMemo(() => {
    const counts = new Map<string, number>();
    districtCases.forEach((item) => {
      counts.set(item.type, (counts.get(item.type) ?? 0) + 1);
    });
    return [...counts.entries()].sort((left, right) => right[1] - left[1])[0] ?? null;
  }, [districtCases]);

  const isLoading = isLoadingCases || isLoadingReferrals || districtAnalyticsQuery.isLoading;
  const hasError = Boolean(casesError || referralsError || districtAnalyticsQuery.error);

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
              {currentDistrict || "District"} Dashboard
            </h2>
            <p className="text-sm text-muted-foreground">
              District case overview
            </p>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary border border-border">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground flex-1">
              {leadingType
                ? `${leadingType[0]} is currently the most common case type in ${currentDistrict || "this district"}, with ${leadingType[1]} case(s).`
                : `No case records are available yet for ${currentDistrict || "this district"}.`}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "ACTIVE CASES", value: activeCases, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
              { label: "RESOLVED THIS MONTH", value: resolvedThisMonth, color: "text-success", bg: "bg-success/10 border-success/20" },
              { label: "PENDING REFERRALS", value: pendingReferrals, color: "text-warning", bg: "bg-warning/10 border-warning/20" },
              { label: "STAFF ACCOUNTS", value: staffCount, color: "text-info", bg: "bg-info/10 border-info/20" },
            ].map((item) => (
              <div key={item.label} className={`bg-card border rounded-xl p-4 ${item.bg}`}>
                <p className="label-text mb-2">{item.label}</p>
                <p className={`text-2xl font-bold font-heading ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">{currentDistrict || "District"} and Nearby Case Map</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Case distribution across districts with recorded cases</p>
              </div>
              <div className="flex items-center gap-3">
                {[
                  { color: "#dc2626", label: "Critical (40+)" },
                  { color: "#d97706", label: "High (25-39)" },
                  { color: "#65a30d", label: "Medium (15-24)" },
                  { color: "#16a34a", label: "Normal (<15)" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4">
              {isLoading ? (
                <div className="h-[380px] rounded-xl bg-secondary border border-border flex items-center justify-center text-sm text-muted-foreground">
                  Loading district map...
                </div>
              ) : hasError ? (
                <div className="h-[380px] rounded-xl bg-secondary border border-border flex flex-col items-center justify-center gap-3 text-center px-4">
                  <p className="text-sm font-medium text-foreground">Unable to load district map</p>
                  <button
                    onClick={() => {
                      void refetchCases();
                      void refetchReferrals();
                      void districtAnalyticsQuery.refetch();
                    }}
                    className="h-8 px-3 rounded-lg bg-background border border-border text-xs text-muted-foreground hover:text-foreground"
                  >
                    Retry
                  </button>
                </div>
              ) : districtMapData.length === 0 ? (
                <div className="h-[380px] rounded-xl bg-secondary border border-border flex items-center justify-center text-sm text-muted-foreground">
                  No district map data is available yet.
                </div>
              ) : (
                <RwandaMap districts={districtMapData} height="380px" onDistrictClick={setSelectedDistrict} />
              )}
            </div>
            {selectedDistrict && (
              <div className="mx-4 mb-4 bg-secondary border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-heading text-sm font-semibold text-foreground">
                    {selectedDistrict.name} District Detail
                  </h4>
                  <button
                    onClick={() => setSelectedDistrict(null)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
                  {[
                    { label: "Total Cases", value: selectedDistrict.cases, color: "text-foreground" },
                    { label: "Resolved", value: selectedDistrict.resolved, color: "text-success" },
                    { label: "Critical", value: selectedDistrict.critical, color: "text-destructive" },
                    { label: "Resolution Rate", value: `${selectedDistrict.cases > 0 ? Math.round((selectedDistrict.resolved / selectedDistrict.cases) * 100) : 0}%`, color: "text-primary" },
                  ].map((item) => (
                    <div key={item.label} className="bg-card border border-border rounded-lg p-3 text-center">
                      <p className="label-text mb-1">{item.label}</p>
                      <p className={`text-2xl font-bold font-heading ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <p className="label-text">RECENT CASES</p>
                <span className="text-[10px] text-muted-foreground">Latest district cases</span>
              </div>
              {isLoading ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">Loading recent cases...</div>
              ) : hasError ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">Recent cases are unavailable right now.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        {["Case ID", "Type", "Victim", "Status", "Assigned To", "District", "Date"].map((header) => (
                          <th key={header} className="label-text text-left px-4 py-2.5">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentCases.map((item) => (
                        <tr key={item.id} className="hover:bg-secondary/40 transition-colors duration-150">
                          <td className="px-4 py-2.5 font-mono text-foreground">{item.id}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{item.type}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{item.victimName}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusBadge[item.status]}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-foreground">{item.assignedOfficer}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{item.district}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{formatDate(item.createdAt)}</td>
                        </tr>
                      ))}
                      {recentCases.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                            No recent cases found for this district.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-xl p-4">
              <p className="label-text mb-3">REFERRAL SUMMARY</p>
              <div className="space-y-3">
                {referralSummary.map((item) => (
                  <div key={item.institution} className="flex items-center justify-between gap-3">
                    <p className="text-xs text-foreground flex-1 min-w-0 truncate">{item.institution}</p>
                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      item.pending > 0 ? "bg-warning/15 text-warning" : "bg-secondary text-muted-foreground"
                    }`}>
                      {item.pending} pending
                    </span>
                  </div>
                ))}
                {referralSummary.length === 0 && (
                  <p className="text-xs text-muted-foreground">No referrals are linked to this district yet.</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DistrictAdminDashboard;

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import {
  BackendCase,
  getCurrentDistrict,
  mapBackendCasesToDistrictRows,
  scopeCasesToDistrict,
} from "@/apps/districtadmin/lib/districtAdminData";
import {
  BackendReferral,
  formatDbDate,
  formatReferralStatus,
  getReferralStatusClass,
  getReferralUrgencyClass,
} from "@/lib/referralDb";
import { useGetAllReferralsQuery, useGetCasesQuery } from "@/store/api";

const DistrictAdminReferrals = () => {
  const currentDistrict = getCurrentDistrict();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const { data: casesData } = useGetCasesQuery({ page: 0, size: 100 });
  const { data: referralsData, error, isLoading, refetch } = useGetAllReferralsQuery({});

  const districtCases = useMemo(() => {
    const items = (casesData?.data?.content ?? []) as BackendCase[];
    return scopeCasesToDistrict(mapBackendCasesToDistrictRows(items), currentDistrict);
  }, [casesData, currentDistrict]);

  const districtCaseIds = useMemo(() => new Set(districtCases.map((item) => item.id)), [districtCases]);
  const districtCaseUuids = useMemo(() => new Set(districtCases.map((item) => item.uuid)), [districtCases]);

  const referrals = useMemo(() => {
    const items = (referralsData?.data?.content ?? []) as BackendReferral[];
    return items.filter((item) => districtCaseIds.has(item.caseId ?? "") || districtCaseUuids.has(item.caseUuid ?? ""));
  }, [districtCaseIds, districtCaseUuids, referralsData]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return referrals.filter((item) => {
      const matchSearch = !query
        || (item.caseId ?? "").toLowerCase().includes(query)
        || (item.victimName ?? "").toLowerCase().includes(query)
        || (item.referredTo ?? "").toLowerCase().includes(query)
        || (item.referredBy ?? "").toLowerCase().includes(query);
      const matchStatus = statusFilter === "All" || formatReferralStatus(item.status) === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [referrals, search, statusFilter]);

  const pendingCount = referrals.filter((item) => !["COMPLETED", "CANNOT_ASSIST"].includes((item.status ?? "").toUpperCase())).length;
  const completedCount = referrals.filter((item) => (item.status ?? "").toUpperCase() === "COMPLETED").length;

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Referrals</h2>
            <p className="text-sm text-muted-foreground">
              Monitor referrals linked to cases in {currentDistrict || "your district"}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "TOTAL REFERRALS", value: referrals.length, color: "text-foreground" },
              { label: "PENDING RESPONSE", value: pendingCount, color: "text-warning" },
              { label: "COMPLETED", value: completedCount, color: "text-success" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-2">{item.label}</p>
                <p className={`text-2xl font-bold font-heading ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                autoComplete="off"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search case, victim, institution, or sender..."
                className="h-8 w-full pl-8 pr-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-8 pl-3 pr-7 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
              >
                {["All", "Pending", "Sent", "Acknowledged", "In Progress", "Completed", "Cannot Assist"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3">
              <p className="label-text">REFERRAL HISTORY</p>
              <span className="text-[10px] text-muted-foreground">{filtered.length} referral(s)</span>
            </div>

            {isLoading ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">Loading referrals...</div>
            ) : error ? (
              <div className="px-4 py-10 text-center space-y-3">
                <p className="text-sm font-medium text-foreground">Unable to load referrals</p>
                <button
                  onClick={() => void refetch()}
                  className="h-8 px-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["Case ID", "Victim", "Referred By", "Institution", "Date", "Urgency", "Status"].map((header) => (
                        <th key={header} className="label-text text-left px-4 py-2.5">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-secondary/40 transition-colors duration-150">
                        <td className="px-4 py-2.5 font-mono text-foreground">{item.caseId || item.caseUuid || item.id}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.victimName || "Unknown victim"}</td>
                        <td className="px-4 py-2.5 text-foreground">{item.referredBy || "Unknown sender"}</td>
                        <td className="px-4 py-2.5 text-foreground">{item.referredTo || "Unknown institution"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{formatDbDate(item.createdAt)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getReferralUrgencyClass(item.urgency)}`}>
                            {(item.urgency ?? "NORMAL").toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getReferralStatusClass(item.status)}`}>
                            {formatReferralStatus(item.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                          No referrals match your current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DistrictAdminReferrals;

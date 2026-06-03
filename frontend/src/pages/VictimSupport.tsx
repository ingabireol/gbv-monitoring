import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ExternalLink, HeartHandshake, Mail, MapPin, Search, Users } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackendCase, CASE_STATUS_CLASSES, mapCasesToAdminRows } from "@/lib/adminData";
import { getCurrentUser } from "@/lib/auth";
import { BackendReferral, formatReferralStatus } from "@/lib/referralDb";
import { useGetAllReferralsQuery, useGetCasesQuery, useGetCurrentProfileQuery, useGetUsersQuery } from "@/store/api";

interface PartnerCard {
  name: string;
  contact: string;
  staff: number;
  active: number;
  total: number;
}

interface VictimRow {
  id: string;
  name: string;
  district: string;
  email?: string;
  username?: string;
  cases: ReturnType<typeof mapCasesToAdminRows>;
  latestCase?: ReturnType<typeof mapCasesToAdminRows>[number];
}

const VictimSupport = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const { data: profileData } = useGetCurrentProfileQuery(undefined, { skip: !currentUser });
  const currentProfile = profileData?.data;
  const isDistrictAdmin = (currentProfile?.role || currentUser?.role) === "DISTRICT_ADMIN" || currentUser?.role === "districtadmin";
  const districtName = currentProfile?.district || currentUser?.district || "your district";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const casesQuery = useGetCasesQuery({ page: 0, size: 100 });
  const referralsQuery = useGetAllReferralsQuery({});
  const partnersQuery = useGetUsersQuery({ role: "PARTNER", enabled: true });

  const caseRows = useMemo(() => {
    const items = (casesQuery.data?.data?.content ?? []) as BackendCase[];
    return mapCasesToAdminRows(items);
  }, [casesQuery.data]);

  const referrals = (referralsQuery.data?.data?.content ?? []) as BackendReferral[];
  const partners = (partnersQuery.data?.data ?? []) as Array<{ institution?: string; email?: string; displayName?: string }>;
  const victimsQuery = useGetUsersQuery({ role: "VICTIM", enabled: true });
  const victims = (victimsQuery.data?.data ?? []) as Array<{ id: string; username?: string; displayName?: string; email?: string; district?: string; createdAt?: string }>;

  const supportRows = useMemo(() => {
    return caseRows.map((item) => {
      const linkedReferrals = referrals.filter((referral) => referral.caseUuid === item.uuid || referral.caseId === item.id);
      const completed = linkedReferrals.filter((referral) => (referral.status ?? "").toUpperCase() === "COMPLETED").length;
      const institutions = Array.from(new Set(linkedReferrals.map((referral) => referral.referredTo).filter(Boolean))) as string[];
      const progress = linkedReferrals.length ? Math.round((completed / linkedReferrals.length) * 100) : 0;

      return {
        ...item,
        referralCount: linkedReferrals.length,
        completedReferrals: completed,
        institutions,
        progress,
        latestReferral: linkedReferrals
          .slice()
          .sort((left, right) => new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime())[0],
      };
    });
  }, [caseRows, referrals]);

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return supportRows.filter((item) => {
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesSearch = !query
        || item.id.toLowerCase().includes(query)
        || item.victimName.toLowerCase().includes(query)
        || item.district.toLowerCase().includes(query)
        || item.type.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [searchTerm, statusFilter, supportRows]);

  const partnerCards = useMemo(() => {
    const grouped = new Map<string, PartnerCard>();

    partners.forEach((partner) => {
      const name = partner.institution || partner.displayName || partner.email || "Partner institution";
      const current = grouped.get(name) || {
        name,
        contact: partner.email || "No email on file",
        staff: 0,
        active: 0,
        total: 0,
      };
      current.staff += 1;
      grouped.set(name, current);
    });

    referrals.forEach((referral) => {
      if (!referral.referredTo) {
        return;
      }
      const current = grouped.get(referral.referredTo) || {
        name: referral.referredTo,
        contact: "No email on file",
        staff: 0,
        active: 0,
        total: 0,
      };
      current.total += 1;
      if ((referral.status ?? "").toUpperCase() !== "COMPLETED") {
        current.active += 1;
      }
      grouped.set(referral.referredTo, current);
    });

    return Array.from(grouped.values()).sort((left, right) => left.name.localeCompare(right.name));
  }, [partners, referrals]);

  const stats = {
    activeSupport: supportRows.filter((item) => item.referralCount > 0).length,
    completedPlans: supportRows.filter((item) => item.referralCount > 0 && item.progress === 100).length,
    awaitingAction: supportRows.filter((item) => item.status === "Pending" || item.referralCount === 0).length,
    partners: partnerCards.length,
  };

  const victimRows = useMemo<VictimRow[]>(() => {
    const normalizedDistrict = isDistrictAdmin ? districtName.trim().toLowerCase() : "";
    const isInDistrict = (district?: string) => {
      if (!normalizedDistrict || normalizedDistrict === "your district") {
        return true;
      }
      return (district || "").trim().toLowerCase() === normalizedDistrict;
    };

    const accountRows = victims
      .filter((victim) => isInDistrict(victim.district))
      .map((victim) => {
      const linkedCases = caseRows.filter((item) =>
        item.victimAccountId === victim.id ||
        (
          item.district.trim().toLowerCase() === (victim.district || "").trim().toLowerCase() &&
          item.victimName.trim().toLowerCase() === (victim.displayName || victim.username || "").trim().toLowerCase()
        )
      );
      const latestCase = linkedCases
        .slice()
        .sort((left, right) => new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime())[0];

      return {
        id: victim.id,
        name: victim.displayName || victim.username || victim.email || "Victim account",
        district: victim.district || "No district",
        email: victim.email,
        username: victim.username,
        cases: linkedCases,
        latestCase,
      };
    });

    const knownAccountIds = new Set(accountRows.map((item) => item.id));
    const caseProfileRows = caseRows
      .filter((item) => isInDistrict(item.district))
      .filter((item) => !item.victimAccountId || !knownAccountIds.has(item.victimAccountId))
      .reduce<VictimRow[]>((rows, item) => {
        const key = item.victimAccountId || `${item.victimName.trim().toLowerCase()}::${item.district.trim().toLowerCase()}`;
        const existing = rows.find((row) => row.id === key);
        if (existing) {
          existing.cases.push(item);
          existing.latestCase = existing.cases
            .slice()
            .sort((left, right) => new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime())[0];
          return rows;
        }

        rows.push({
          id: key,
          name: item.victimName,
          district: item.district,
          email: "Case profile",
          cases: [item],
          latestCase: item,
        });
        return rows;
      }, []);

    return [...accountRows, ...caseProfileRows].sort((left, right) =>
      right.cases.length - left.cases.length || left.name.localeCompare(right.name)
    );
  }, [caseRows, districtName, isDistrictAdmin, victims]);

  const isLoading = casesQuery.isLoading || referralsQuery.isLoading || partnersQuery.isLoading || victimsQuery.isLoading;
  const hasError = Boolean(casesQuery.error || referralsQuery.error || partnersQuery.error || victimsQuery.error);

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
              {isDistrictAdmin ? "District Victim Services" : "Victim Support"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isDistrictAdmin
                ? `Track case-linked support coordination and partner participation in ${districtName}.`
                : "Track case-linked support coordination and partner participation."}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "ACTIVE SUPPORT", value: stats.activeSupport, color: "text-primary" },
              { label: "COMPLETED PLANS", value: stats.completedPlans, color: "text-success" },
              { label: "AWAITING ACTION", value: stats.awaitingAction, color: "text-warning" },
              { label: "PARTNER INSTITUTIONS", value: stats.partners, color: "text-info" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-2">{item.label}</p>
                <p className={`text-2xl font-heading font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">Loading support tracking...</div>
          ) : hasError ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">Unable to load support tracking.</div>
          ) : (
            <>
              {isDistrictAdmin && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h3 className="font-heading text-base font-semibold text-foreground">Victims In {districtName}</h3>
                  </div>
                  <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            {["Victim", "District", "Email / Login", "Cases", "Latest Case", "Actions"].map((header) => (
                              <th key={header} className="label-text text-left px-4 py-2.5">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {victimRows.map((victim) => (
                            <tr key={victim.id} className="hover:bg-secondary/40 transition-colors">
                              <td className="px-4 py-3 font-medium text-foreground">{victim.name}</td>
                              <td className="px-4 py-3 text-muted-foreground">{victim.district}</td>
                              <td className="px-4 py-3 text-muted-foreground">{victim.email || victim.username || "-"}</td>
                              <td className="px-4 py-3 text-foreground">{victim.cases.length}</td>
                              <td className="px-4 py-3 font-mono text-primary">{victim.latestCase?.id || "No case yet"}</td>
                              <td className="px-4 py-3">
                                <button
                                  disabled={!victim.latestCase}
                                  onClick={() => navigate(`/districtadmin/case-management?case=${victim.latestCase?.uuid}`)}
                                  className="h-7 px-2.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 disabled:bg-secondary disabled:text-muted-foreground disabled:border disabled:border-border transition-colors inline-flex items-center gap-1.5"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Open case
                                </button>
                              </td>
                            </tr>
                          ))}
                          {victimRows.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                No victim profiles are currently registered in {districtName}.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-primary" />
                  <span className="font-heading text-sm font-semibold text-foreground">Support Cases</span>
                </div>
                <div className="flex-1" />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-8 rounded-lg bg-card border border-border px-3 text-xs text-foreground"
                >
                  {['All', 'Critical', 'In Progress', 'Pending', 'Resolved'].map((item) => (
                    <option key={item} value={item}>{item === 'All' ? 'All statuses' : item}</option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search cases..."
                    className="h-8 w-[180px] pl-8 pr-3 rounded-lg bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filtered.map((item) => (
                  <div key={item.uuid} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="flex items-start justify-between p-4 border-b border-border gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-mono text-xs text-primary">{item.id}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${CASE_STATUS_CLASSES[item.status]}`}>
                            <span className="w-1 h-1 rounded-full bg-current" />
                            {item.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground mt-1">{item.victimName}</p>
                        <p className="text-xs text-muted-foreground">{item.type} - {item.district}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="label-text mb-1">SUPPORT PROGRESS</p>
                        <p className="text-lg font-heading font-bold text-primary">{item.progress}%</p>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Referrals completed</span>
                          <span className="font-medium text-foreground">{item.completedReferrals}/{item.referralCount || 0}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className={`h-full rounded-full ${item.progress >= 100 ? 'bg-success' : item.progress >= 50 ? 'bg-info' : 'bg-warning'}`} style={{ width: `${item.progress}%` }} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-secondary border border-border rounded-xl p-3">
                          <p className="label-text mb-1">ASSIGNED OFFICER</p>
                          <p className="text-foreground">{item.officer}</p>
                        </div>
                        <div className="bg-secondary border border-border rounded-xl p-3">
                          <p className="label-text mb-1">LAST REFERRAL</p>
                          <p className="text-foreground">{item.latestReferral ? formatReferralStatus(item.latestReferral.status) : 'No referral yet'}</p>
                        </div>
                      </div>

                      <div>
                        <p className="label-text mb-2">PARTNER SUPPORT</p>
                        {item.institutions.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No partner handoff has been recorded for this case yet.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {item.institutions.slice(0, 4).map((institution) => (
                              <span key={institution} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                                {institution}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {item.latestReferral && (
                        <div className="text-xs text-muted-foreground border-t border-border pt-3">
                          Latest update: {formatReferralStatus(item.latestReferral.status)} with {item.latestReferral.referredTo || 'the receiving institution'}.
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {filtered.length === 0 && (
                  <div className="col-span-full bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
                    No support cases match the current filter.
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-primary" />
                  <h3 className="font-heading text-base font-semibold text-foreground">Partner Directory</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {partnerCards.map((partner) => (
                    <div key={partner.name} className="bg-card border border-border rounded-xl p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-snug">{partner.name}</p>
                          <p className="text-[10px] text-muted-foreground">{partner.staff} staff account(s)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{partner.contact}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                        <span className="text-muted-foreground">Active referrals</span>
                        <span className="font-semibold text-foreground">{partner.active}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Total tracked</span>
                        <span className="font-semibold text-foreground">{partner.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default VictimSupport;

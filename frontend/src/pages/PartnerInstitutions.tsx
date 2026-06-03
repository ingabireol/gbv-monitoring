import { useMemo, useState } from "react";
import { Building2, Mail, Search, Users } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackendReferral } from "@/lib/referralDb";
import { useGetAllReferralsQuery, useGetUsersQuery } from "@/store/api";

interface BackendUser {
  displayName?: string;
  email?: string;
  institution?: string;
}

const PartnerInstitutions = () => {
  const [search, setSearch] = useState("");
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery({ role: "PARTNER", enabled: true });
  const { data: referralsData, isLoading: isLoadingReferrals } = useGetAllReferralsQuery({});

  const users = (usersData?.data ?? []) as BackendUser[];
  const referrals = (referralsData?.data?.content ?? []) as BackendReferral[];

  const institutions = useMemo(() => {
    const grouped = new Map<string, { name: string; contacts: string[]; active: number; total: number; staff: number }>();

    users.forEach((user) => {
      const name = user.institution || user.displayName || user.email || "Partner institution";
      const current = grouped.get(name) || { name, contacts: [], active: 0, total: 0, staff: 0 };
      current.staff += 1;
      if (user.email) {
        current.contacts.push(user.email);
      }
      grouped.set(name, current);
    });

    referrals.forEach((referral) => {
      if (!referral.referredTo) return;
      const current = grouped.get(referral.referredTo) || { name: referral.referredTo, contacts: [], active: 0, total: 0, staff: 0 };
      current.total += 1;
      if ((referral.status ?? "").toUpperCase() !== "COMPLETED") {
        current.active += 1;
      }
      grouped.set(referral.referredTo, current);
    });

    return Array.from(grouped.values())
      .map((item) => ({
        ...item,
        contact: item.contacts[0] || "No contact email on file",
        responseRate: item.total ? Math.round(((item.total - item.active) / item.total) * 100) : 100,
      }))
      .filter((item) => item.name.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [referrals, search, users]);

  const isLoading = isLoadingUsers || isLoadingReferrals;

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Partner Institutions</h2>
            <p className="text-sm text-muted-foreground">Partner directory based on staff accounts and referral records.</p>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search institutions..."
              className="h-8 w-full pl-8 pr-3 rounded-lg bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {isLoading ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
              Loading partner institutions...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {institutions.map((item) => (
                <div key={item.name} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading text-sm font-semibold text-foreground leading-snug">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.staff} staff account(s)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">{item.contact}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <p className="label-text mb-1">ACTIVE REFERRALS</p>
                      <p className="text-lg font-bold text-foreground">{item.active}</p>
                    </div>
                    <div>
                      <p className="label-text mb-1">RESPONSE RATE</p>
                      <p className="text-lg font-bold text-foreground">{item.responseRate}%</p>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-1">
                        <div className="h-full rounded-full bg-success" style={{ width: `${item.responseRate}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-2 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    {item.total} referral record(s) tracked
                  </div>
                </div>
              ))}

              {institutions.length === 0 && (
                <div className="col-span-full bg-card border border-border rounded-xl p-10 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">No institutions found.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PartnerInstitutions;

import { useMemo } from "react";
import { HeartHandshake, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { PartnerSidebar } from "@/apps/partner/components/PartnerSidebar";
import { filterPartnerReferrals, getPartnerInstitutionName, mapPartnerReferralRows } from "@/apps/partner/lib/partnerData";
import { getCurrentUser } from "@/lib/auth";
import { BackendCase } from "@/lib/adminData";
import { BackendReferral } from "@/lib/referralDb";
import { useGetAllReferralsQuery, useGetCasesQuery } from "@/store/api";

const PartnerServices = () => {
  const currentUser = getCurrentUser();
  const institution = getPartnerInstitutionName(currentUser);

  const casesQuery = useGetCasesQuery({ page: 0, size: 100 });
  const referralsQuery = useGetAllReferralsQuery({});

  const caseItems = (casesQuery.data?.data?.content ?? []) as BackendCase[];
  const allReferrals = (referralsQuery.data?.data?.content ?? []) as BackendReferral[];
  const partnerReferrals = useMemo(() => filterPartnerReferrals(allReferrals, currentUser), [allReferrals, currentUser]);
  const referralRows = useMemo(() => mapPartnerReferralRows(partnerReferrals, caseItems), [partnerReferrals, caseItems]);

  const serviceCards = useMemo(() => {
    const grouped = new Map<string, { name: string; total: number; active: number; completed: number; urgent: number }>();

    referralRows.forEach((item) => {
      const current = grouped.get(item.serviceName) || { name: item.serviceName, total: 0, active: 0, completed: 0, urgent: 0 };
      current.total += 1;
      if (["ACKNOWLEDGED", "IN_PROGRESS", "PENDING", "SENT"].includes(item.status.toUpperCase())) {
        current.active += 1;
      }
      if (item.status.toUpperCase() === "COMPLETED") {
        current.completed += 1;
      }
      if (item.urgencyLabel === "urgent" && item.status.toUpperCase() !== "COMPLETED") {
        current.urgent += 1;
      }
      grouped.set(item.serviceName, current);
    });

    return Array.from(grouped.values()).sort((left, right) => right.total - left.total);
  }, [referralRows]);

  const stats = {
    services: serviceCards.length,
    activeBeneficiaries: referralRows.filter((item) => ["ACKNOWLEDGED", "IN_PROGRESS", "PENDING", "SENT"].includes(item.status.toUpperCase())).length,
    completedThisMonth: referralRows.filter((item) => item.status.toUpperCase() === "COMPLETED").length,
    urgentSupport: referralRows.filter((item) => item.urgencyLabel === "urgent" && item.status.toUpperCase() !== "COMPLETED").length,
  };

  const isLoading = casesQuery.isLoading || referralsQuery.isLoading;
  const hasError = Boolean(casesQuery.error || referralsQuery.error);

  return (
    <div className="flex min-h-screen w-full">
      <PartnerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">Services</h2>
            <p className="text-sm text-muted-foreground">Track current service demand and beneficiary progress for {institution}.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "SERVICE GROUPS", value: stats.services, color: "text-primary", Icon: HeartHandshake },
              { label: "ACTIVE BENEFICIARIES", value: stats.activeBeneficiaries, color: "text-primary", Icon: Users },
              { label: "COMPLETED", value: stats.completedThisMonth, color: "text-primary", Icon: ShieldCheck },
              { label: "URGENT SUPPORT", value: stats.urgentSupport, color: "text-primary", Icon: Stethoscope },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="label-text">{item.label}</p>
                  <item.Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <p className={`text-2xl font-bold font-heading ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">Loading services...</div>
          ) : hasError ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">Unable to load service tracking.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceCards.map((service) => {
                  const progress = service.total ? Math.round((service.completed / service.total) * 100) : 0;
                  return (
                    <div key={service.name} className="bg-card border border-border rounded-xl p-4 space-y-3">
                      <div>
                        <h3 className="font-heading text-sm font-semibold text-foreground">{service.name}</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{service.total} referral record(s) linked to this service group.</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="label-text mb-1">ACTIVE</p>
                          <p className="text-lg font-heading font-bold text-primary">{service.active}</p>
                        </div>
                        <div>
                          <p className="label-text mb-1">DONE</p>
                          <p className="text-lg font-heading font-bold text-primary">{service.completed}</p>
                        </div>
                        <div>
                          <p className="label-text mb-1">URGENT</p>
                          <p className="text-lg font-heading font-bold text-primary">{service.urgent}</p>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Completion</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {serviceCards.length === 0 && (
                  <div className="col-span-full bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">No service records have been received for this institution yet.</div>
                )}
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <p className="label-text">BENEFICIARY PROGRESS</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        {['Case ID', 'Beneficiary', 'Service', 'Received', 'Status', 'Progress', 'Referred By'].map((header) => (
                          <th key={header} className="label-text text-left px-4 py-2.5">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {referralRows.map((item) => (
                        <tr key={item.id} className="hover:bg-secondary/40 transition-colors duration-150">
                          <td className="px-4 py-2.5 font-mono text-foreground">{item.caseId}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{item.victimName}</td>
                          <td className="px-4 py-2.5 text-foreground">{item.serviceName}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{item.referredDate}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.statusClass}`}>{item.statusLabel}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                                <div className={`h-full rounded-full ${item.progress >= 100 ? 'bg-success' : item.progress >= 50 ? 'bg-info' : 'bg-warning'}`} style={{ width: `${item.progress}%` }} />
                              </div>
                              <span className="text-[10px] text-muted-foreground">{item.progress}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-foreground">{item.referredBy}</td>
                        </tr>
                      ))}
                      {referralRows.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No beneficiary service records are available yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default PartnerServices;

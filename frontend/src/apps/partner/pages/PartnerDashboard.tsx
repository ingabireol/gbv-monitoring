import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightLeft, Clock3, HeartHandshake, ShieldCheck } from "lucide-react";
import { PartnerSidebar } from "@/apps/partner/components/PartnerSidebar";
import { filterPartnerReferrals, getPartnerAccountLabel, getPartnerInstitutionName, getPartnerLocation, mapPartnerReferralRows } from "@/apps/partner/lib/partnerData";
import { getCurrentUser } from "@/lib/auth";
import { BackendCase } from "@/lib/adminData";
import { BackendReferral } from "@/lib/referralDb";
import { useGetAllReferralsQuery, useGetCasesQuery, useGetNotificationsQuery } from "@/store/api";

const PartnerDashboard = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const institution = getPartnerInstitutionName(currentUser);
  const locationLabel = getPartnerLocation(currentUser);
  const accountLabel = getPartnerAccountLabel(currentUser);

  const casesQuery = useGetCasesQuery({ page: 0, size: 100 });
  const referralsQuery = useGetAllReferralsQuery({});
  const notificationsQuery = useGetNotificationsQuery(currentUser?.id ?? "", { skip: !currentUser?.id });

  const caseItems = (casesQuery.data?.data?.content ?? []) as BackendCase[];
  const allReferrals = (referralsQuery.data?.data?.content ?? []) as BackendReferral[];
  const partnerReferrals = useMemo(() => filterPartnerReferrals(allReferrals, currentUser), [allReferrals, currentUser]);
  const referralRows = useMemo(() => mapPartnerReferralRows(partnerReferrals, caseItems), [partnerReferrals, caseItems]);

  const pendingRows = referralRows.filter((item) => ["PENDING", "SENT"].includes(item.status.toUpperCase()));
  const inProgressRows = referralRows.filter((item) => ["ACKNOWLEDGED", "IN_PROGRESS"].includes(item.status.toUpperCase()));
  const completedThisMonth = referralRows.filter((item) => item.status.toUpperCase() === "COMPLETED" && item.updatedDate !== "Unknown").length;
  const urgentRows = referralRows.filter((item) => item.urgencyLabel === "urgent" && item.status.toUpperCase() !== "COMPLETED");
  const unreadNotifications = ((notificationsQuery.data?.data ?? []) as Array<{ read?: boolean }>).filter((item) => !item.read).length;

  const activity = useMemo(
    () => referralRows
      .slice()
      .sort((left, right) => new Date(right.updatedDate).getTime() - new Date(left.updatedDate).getTime())
      .slice(0, 6),
    [referralRows],
  );

  const isLoading = casesQuery.isLoading || referralsQuery.isLoading || notificationsQuery.isLoading;
  const hasError = Boolean(casesQuery.error || referralsQuery.error || notificationsQuery.error);

  return (
    <div className="flex min-h-screen w-full">
      <PartnerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">{institution}</h2>
            <p className="text-sm text-muted-foreground">Review incoming referrals, service progress, and recent updates for your institution.</p>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-secondary border border-border">
            <div className="w-2 h-8 rounded-full bg-primary shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{institution}</p>
              <p className="text-[10px] text-muted-foreground">{accountLabel} - {locationLabel}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "PENDING REFERRALS", value: pendingRows.length, color: "text-warning" },
              { label: "CASES IN PROGRESS", value: inProgressRows.length, color: "text-info" },
              { label: "COMPLETED", value: completedThisMonth, color: "text-success" },
              { label: "UNREAD ALERTS", value: unreadNotifications, color: "text-primary" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                <p className="label-text mb-2">{item.label}</p>
                <p className={`text-2xl font-bold font-heading ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">Loading partner dashboard...</div>
          ) : hasError ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">Unable to load partner dashboard.</div>
          ) : (
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                  <p className="label-text">INCOMING REFERRALS</p>
                  <button
                    onClick={() => navigate("/partner/referrals")}
                    className="h-7 px-3 rounded-lg bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 flex items-center gap-1.5"
                  >
                    <ArrowRightLeft className="w-3 h-3" /> Open referrals
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        {['Case ID', 'Victim', 'Service', 'Received', 'Waiting', 'Urgency', 'Status'].map((header) => (
                          <th key={header} className="label-text text-left px-4 py-2.5">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pendingRows.slice(0, 8).map((item) => (
                        <tr key={item.id} className="hover:bg-secondary/40 transition-colors duration-150">
                          <td className="px-4 py-2.5 font-mono text-foreground">{item.caseId}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{item.victimName}</td>
                          <td className="px-4 py-2.5 text-foreground">{item.serviceName}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{item.referredDate}</td>
                          <td className="px-4 py-2.5 text-foreground">{item.daysWaiting} day(s)</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.urgencyClass}`}>{item.urgencyLabel}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.statusClass}`}>{item.statusLabel}</span>
                          </td>
                        </tr>
                      ))}
                      {pendingRows.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No incoming referrals are waiting right now.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-4 space-y-5">
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                    <Clock3 className="w-4 h-4 text-warning" />
                    <p className="label-text">URGENT FOLLOW-UP</p>
                  </div>
                  <div className="divide-y divide-border">
                    {urgentRows.length === 0 ? (
                      <div className="px-5 py-8 text-center text-sm text-muted-foreground">No urgent partner referrals are pending.</div>
                    ) : (
                      urgentRows.slice(0, 4).map((item) => (
                        <div key={item.id} className="px-5 py-3">
                          <p className="text-xs font-medium text-foreground">{item.caseId}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{item.victimName} - {item.daysWaiting} day(s) waiting</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-primary" />
                    <p className="label-text">RECENT ACTIVITY</p>
                  </div>
                  <div className="divide-y divide-border">
                    {activity.length === 0 ? (
                      <div className="px-5 py-8 text-center text-sm text-muted-foreground">No partner activity found yet.</div>
                    ) : (
                      activity.map((item) => (
                        <div key={item.id} className="px-5 py-3">
                          <p className="text-xs font-medium text-foreground">{item.caseId} - {item.statusLabel}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{item.serviceName} - updated {item.updatedDate}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-success" />
                    <p className="label-text">SERVICE COVERAGE</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Your institution currently has {referralRows.length} tracked referral record(s) and {inProgressRows.length} case(s) that are actively being supported.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PartnerDashboard;
